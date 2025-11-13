import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getToken, clearTokenFallback, getUser } from "../utils/auth";
import TutorDashboard from "../components/dashboard/tutorDashboard";
import VeterinarioDashboard from "../components/dashboard/veterinarioDashboard";
import ClinicaDashboard from "../components/dashboard/clinicaDashboard";
import { echo } from "../services/echo";
import { useRegisterPush } from "../hooks";
import UsuarioService from "../services/UsuarioService";
import ProfileCompletionPrompt from "../components/dashboard/profileCompletionPrompt";
import { Usuario } from "../services/types";
import ClinicaService from "../services/ClinicaService";
import VeterinarioService from "../services/VeterinarioService";
import TutorService from "../services/TutorService";
import AdminDashboard from "../components/dashboard/adminDashboard";

interface User extends Usuario {}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useRegisterPush();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/");
      return;
    }

    const currentUser = getUser();
    if (!currentUser || !currentUser.id) {
      navigate("/");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const baseUser = await UsuarioService.getById(currentUser.id);

        if (baseUser.tipo === "clinica") {
          const clinicaProfile = await ClinicaService.getMinhaClinica();
          baseUser.clinica = clinicaProfile;
        } else if (baseUser.tipo === "veterinario") {
          const vetProfile = await VeterinarioService.getMeuPerfil();
          baseUser.veterinario = vetProfile;
        } else if (baseUser.tipo === "tutor") {
          const tutorProfile = await TutorService.getMeuTutor();
          baseUser.tutor = tutorProfile;
        }
        else if (baseUser.tipo === "admin") {
        }
        setUser(baseUser);
      } catch (err: any) {
        console.error("Erro ao carregar dados do dashboard:", err);
        setError(err.message || "Erro ao buscar dados do usuário.");
        clearTokenFallback();
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    if (!user || user.tipo === "tutor" || user.tipo === "admin" || loading) {
      setShowProfilePrompt(false);
      return;
    }

    const checkProfileCompletion = (user: User) => {
      const fields: string[] = [];
      let profile: any = null;

      if (user.tipo === "clinica" && user.clinica) {
        profile = user.clinica;
        if (!profile.descricao) fields.push("Descrição");
        if (!profile.foto_url) fields.push("Foto de Perfil");
        if (
          !profile.horario_funcionamento ||
          profile.horario_funcionamento.includes("08:00-18:00")
        )
          fields.push("Horário de Funcionamento");
      } else if (user.tipo === "veterinario" && user.veterinario) {
        profile = user.veterinario;
        if (!profile.descricao) fields.push("Descrição");
        if (!profile.foto_url) fields.push("Foto de Perfil");
        if (!profile.especialidade) fields.push("Especialidade");
        if (!profile.endereco) fields.push("Endereço/Localização");
      }

      setMissingFields(fields);
      if (
        fields.length > 0 &&
        (user.tipo === "clinica" || user.tipo === "veterinario")
      ) {
        setTimeout(() => {
          setShowProfilePrompt(true);
        }, 3000);
      } else {
        setShowProfilePrompt(false);
      }
    };
    checkProfileCompletion(user);
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    let channel: any;
    return () => {
      if (channel) {
      }
    };
  }, [user]);

  function handleLogout() {
    clearTokenFallback();
    setUser(null);
    navigate("/");
  }

  if (loading) return <p className="p-6 text-center">Carregando...</p>;
  if (error) return <p className="p-6 text-center text-red-500">{error}</p>;
  if (!user) return null;

  const initialActiveSection = location.state?.activeSection || "home";

  return (
    <>
      <ProfileCompletionPrompt
        isOpen={showProfilePrompt}
        onClose={() => setShowProfilePrompt(false)}
        tipo={user.tipo as "clinica" | "veterinario"}
        missingFields={missingFields}
      />
      {(() => {
        switch (user.tipo) {
          case "tutor":
            return <TutorDashboard user={user} onLogout={handleLogout} />;
          case "veterinario":
            return (
              <VeterinarioDashboard
                user={user}
                onLogout={handleLogout}
                initialSection={initialActiveSection as any}
              />
            );
          case "clinica":
            return (
              <ClinicaDashboard
                user={user}
                onLogout={handleLogout}
                initialSection={initialActiveSection as any}
              />
            );
          case "admin":
            return (
              <AdminDashboard
                user={user}
                onLogout={handleLogout}
                initialSection={initialActiveSection as any} 
              />
            );
          default:
            return <p>Tipo de usuário inválido.</p>;
        }
      })()}
    </>
  );
}