import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getToken, clearTokenFallback, getUser } from "../utils/auth";
import TutorDashboard from "../components/dashboard/tutorDashboard";
import VeterinarioDashboard from "../components/dashboard/veterinarioDashboard";
import ClinicaDashboard from "../components/dashboard/clinicaDashboard";
import { useRegisterPush } from "../hooks";
import UsuarioService from "../services/UsuarioService";
import ProfileCompletionPrompt from "../components/dashboard/profileCompletionPrompt";
import { Usuario } from "../services/types";
import ClinicaService from "../services/ClinicaService";
import VeterinarioService from "../services/VeterinarioService";
import TutorService from "../services/TutorService";
import AdminDashboard from "../components/dashboard/adminDashboard";

type DashboardSection = "home" | "emergencias" | "pets" | "perfil" | "historico" | "minha_clinica";
type TutorSection = "home" | "emergencias" | "pets" | "perfil" | "historico";
type VetSection = "home" | "historico" | "meu_perfil";
type ClinicaSection = "home" | "emergencias" | "veterinarios" | "minha_clinica";

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
        } else if (baseUser.tipo === "admin") {
          // Admin não tem perfil adicional a carregar no dashboard.
        }
        setUser(baseUser);
      } catch (err: unknown) {
        console.error("Erro ao carregar dados do dashboard:", err);
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Erro ao buscar dados do usuário.");
        clearTokenFallback();
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    if (!user || loading) {
      setShowProfilePrompt(false);
      return;
    }

    const checkProfileCompletion = (user: User) => {
      const fields: string[] = [];

      if (user.tipo === "clinica" && user.clinica) {
        if (!user.clinica.descricao) fields.push("Descrição");
        if (!user.clinica.foto_url) fields.push("Foto de Perfil");
        if (!user.clinica.nome_fantasia) fields.push("Nome Fantasia");
        if (!user.clinica.email_contato) fields.push("E-mail de Contato");
        if (!user.clinica.telefone_emergencia) fields.push("Telefone de Emergência");
        if (
          !user.clinica.horario_funcionamento ||
          user.clinica.horario_funcionamento.includes("08:00-18:00")
        ) {
          fields.push("Horário de Funcionamento");
        }
      } else if (user.tipo === "veterinario" && user.veterinario) {
        if (!user.veterinario.descricao) fields.push("Descrição");
        if (!user.veterinario.foto_url) fields.push("Foto de Perfil");
        if (!user.veterinario.especialidade) fields.push("Especialidade");
        if (!user.veterinario.endereco) fields.push("Endereço/Localização");
        if (!user.veterinario.telefone_emergencia) fields.push("Telefone de Emergência");
      } else if (user.tipo === "tutor" && user.tutor) {
        if (!user.tutor.nome_completo) fields.push("Nome Completo");
        if (!user.tutor.foto_url) fields.push("Foto de Perfil");
        if (!user.tutor.telefone_principal) fields.push("Telefone Principal");
        if (!user.tutor.email_contato) fields.push("E-mail de Contato");
      }

      setMissingFields(fields);
      if (fields.length > 0 && ["clinica", "veterinario", "tutor"].includes(user.tipo)) {
        setTimeout(() => {
          setShowProfilePrompt(true);
        }, 3000);
      } else {
        setShowProfilePrompt(false);
      }
    };
    checkProfileCompletion(user);
  }, [user, loading]);

  function handleLogout() {
    clearTokenFallback();
    setUser(null);
    navigate("/");
  }

  if (loading) return <p className="p-6 text-center">Carregando...</p>;
  if (error) return <p className="p-6 text-center text-red-500">{error}</p>;
  if (!user) return null;

  const initialActiveSection = (location.state?.activeSection || "home") as DashboardSection;

  return (
    <>
      <ProfileCompletionPrompt
        isOpen={showProfilePrompt}
        onClose={() => setShowProfilePrompt(false)}
        tipo={user.tipo as "clinica" | "veterinario" | "tutor"}
        missingFields={missingFields}
      />
      {(() => {
        switch (user.tipo) {
          case "tutor":
            return (
              <TutorDashboard
                user={user}
                onLogout={handleLogout}
                initialSection={initialActiveSection as TutorSection}
              />
            );
          case "veterinario":
            return (
              <VeterinarioDashboard
                user={user}
                onLogout={handleLogout}
                initialSection={initialActiveSection as VetSection}
              />
            );
          case "clinica":
            return (
              <ClinicaDashboard
                user={user}
                onLogout={handleLogout}
                initialSection={initialActiveSection as ClinicaSection}
              />
            );
          case "admin":
            return (
              <AdminDashboard
                user={user}
                onLogout={handleLogout}
              />
            );
          default:
            return <p>Tipo de usuário inválido.</p>;
        }
      })()}
    </>
  );
}