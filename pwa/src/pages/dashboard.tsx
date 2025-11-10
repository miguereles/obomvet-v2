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
// Importa o tipo 'Usuario'
import { Usuario } from "../services/types";

// Importa os services de perfil específico
import ClinicaService from "../services/ClinicaService";
import VeterinarioService from "../services/VeterinarioService";
import TutorService from "../services/TutorService";

// Define a interface completa do utilizador
interface User extends Usuario {}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Hook de Notificação Push
  useRegisterPush();

  // === Carregar utilizador autenticado (LÓGICA DE FETCH CORRIGIDA) ===
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/");
      return;
    }

    const currentUser = getUser(); // Apenas para o ID
    if (!currentUser || !currentUser.id) {
      navigate("/");
      return;
    }

    (async () => {
      try {
        setLoading(true);

        // 1. Busca os dados BASE do utilizador (id, nome, email, tipo)
        const baseUser = await UsuarioService.getById(currentUser.id);

        // 2. Busca os dados ESPECÍFICOS do perfil (que contêm a foto_url)
        // Usamos o 'baseUser.tipo' (da API) como fonte da verdade
        if (baseUser.tipo === "clinica") {
          const clinicaProfile = await ClinicaService.getMinhaClinica();
          baseUser.clinica = clinicaProfile; // 3. Funde (merge) os dados
        } else if (baseUser.tipo === "veterinario") {
          const vetProfile = await VeterinarioService.getMeuPerfil();
          baseUser.veterinario = vetProfile; // 3. Funde (merge) os dados
        } else if (baseUser.tipo === "tutor") {
          const tutorProfile = await TutorService.getMeuTutor();
          baseUser.tutor = tutorProfile; // 3. Funde (merge) os dados
        }

        // 4. Define o estado com o objeto 'user' completo e "gordo"
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

  // === Lógica de Checagem de Perfil (Restante do ficheiro igual) ===
  useEffect(() => {
    if (!user || user.tipo === "tutor" || loading) {
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

  // === Echo / Pusher (mantido) ===
  useEffect(() => {
    if (!user) return;

    let channel: any;
    // ... (lógica de notificações) ...

    return () => {
      if (channel) {
        // ... (cleanup) ...
      }
    };
  }, [user]);

  // === Logout ===
  function handleLogout() {
    clearTokenFallback();
    setUser(null);
    navigate("/");
  }

  // === Render ===
  if (loading) return <p className="p-6 text-center">Carregando...</p>;
  if (error) return <p className="p-6 text-center text-red-500">{error}</p>;
  if (!user) return null;

  // Define a seção ativa com base no state de navegação (para o prompt de perfil)
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
                initialSection={initialActiveSection as any} // Cast 'as any' para aceitar string
              />
            );
          case "clinica":
            return (
              <ClinicaDashboard
                user={user}
                onLogout={handleLogout}
                initialSection={initialActiveSection as any} // Cast 'as any' para aceitar string
              />
            );
          default:
            return <p>Tipo de usuário inválido.</p>;
        }
      })()}
    </>
  );
}