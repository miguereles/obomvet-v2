import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Adicionado useLocation
import { getToken, clearTokenFallback, getUser } from "../utils/auth";
import TutorDashboard from "../components/dashboard/tutorDashboard";
import VeterinarioDashboard from "../components/dashboard/veterinarioDashboard";
import ClinicaDashboard from "../components/dashboard/clinicaDashboard";
import { echo } from "../services/echo";
import { useRegisterPush } from "../hooks"; 

import UsuarioService from "../services/UsuarioService"; 
import ProfileCompletionPrompt from "../components/dashboard/profileCompletionPrompt"; // NOVO: Importe o Prompt

interface User {
  id: number;
  name: string;
  email: string;
  tipo: "tutor" | "veterinario" | "clinica";
  // Adicione os relacionamentos que o backend pode enviar (agora com foto/descricao)
  tutor?: any;
  veterinario?: {
      id: number;
      descricao?: string | null;
      foto_url?: string | null;
      crmv: string;
      // ... outras propriedades
  };
  clinica?: {
      id: number;
      descricao?: string | null;
      foto_url?: string | null;
      cnpj?: string;
      // ... outras propriedades
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para ler o state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProfilePrompt, setShowProfilePrompt] = useState(false); // NOVO: Estado do Prompt
  const [missingFields, setMissingFields] = useState<string[]>([]); // NOVO: Campos pendentes

  // Hook de Notificação Push (correto)
  useRegisterPush();

  // === Carregar usuário autenticado (Refatorado) ===
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

    // 3. Use o Serviço de Usuário (que usa o proxy axios)
    (async () => {
      try {
        setLoading(true);
        // O getById foi ajustado no backend para carregar os relacionamentos (clinica/veterinario)
        const data = await UsuarioService.getById(currentUser.id);
        setUser(data);
      } catch (err: any) {
        // O interceptor do axios (api.ts) já trata o 401
        setError(err.message || "Erro ao buscar dados do usuário.");
        // Se falhar (ex: 500), deslogue para segurança
        clearTokenFallback();
        navigate("/");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // === NOVO: Lógica de Checagem de Perfil ===
  useEffect(() => {
    if (!user || user.tipo === 'tutor' || loading) {
        setShowProfilePrompt(false);
        return;
    }

    const checkProfileCompletion = (user: User) => {
        const fields: string[] = [];
        let profile: any = null;

        if (user.tipo === 'clinica' && user.clinica) {
            profile = user.clinica;
            if (!profile.descricao) fields.push('Descrição');
            if (!profile.foto_url) fields.push('Foto de Perfil');
            if (!profile.horario_funcionamento || profile.horario_funcionamento.includes('08:00-18:00')) fields.push('Horário de Funcionamento');
        } else if (user.tipo === 'veterinario' && user.veterinario) {
            profile = user.veterinario;
            if (!profile.descricao) fields.push('Descrição');
            if (!profile.foto_url) fields.push('Foto de Perfil');
            if (!profile.especialidade) fields.push('Especialidade');
            if (!profile.endereco) fields.push('Endereço/Localização');
        }

        setMissingFields(fields);
        // Exibe o prompt se estiverem faltando campos críticos e o usuário for da clínica/vet
        if (fields.length > 0 && (user.tipo === 'clinica' || user.tipo === 'veterinario')) {
            // Atrasamos a exibição para não atrapalhar a navegação
            setTimeout(() => {
                setShowProfilePrompt(true);
            }, 3000); // Exibe após 3 segundos
        } else {
            setShowProfilePrompt(false);
        }
    };

    checkProfileCompletion(user);
  }, [user, loading]); // Roda quando o usuário é carregado

  // === Echo / Pusher / Notificações (mantido) ===
  useEffect(() => {
    if (!user) return;

    let channel: any;
    // ... (lógica de notificações) ...

    // Cleanup (correto)
    return () => {
      if (channel) {
        // ... (cleanup) ...
      }
    };

  }, [user]); // Depende do 'user'


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

  // ---------- RENDER POR TIPO ----------
  // NOVO: Passa o estado de navegação para o Dashboard específico
  const initialActiveSection = location.state?.activeSection || 'home';

  return (
    <>
      <ProfileCompletionPrompt
        isOpen={showProfilePrompt}
        onClose={() => setShowProfilePrompt(false)}
        tipo={user.tipo as 'clinica' | 'veterinario'}
        missingFields={missingFields}
      />
      {(() => {
          switch (user.tipo) {
              case "tutor":
                  return <TutorDashboard user={user} onLogout={handleLogout} />;
              case "veterinario":
                  return <VeterinarioDashboard user={user} onLogout={handleLogout} initialSection={initialActiveSection} />;
              case "clinica":
                  return <ClinicaDashboard user={user} onLogout={handleLogout} initialSection={initialActiveSection} />;
              default:
                  return <p>Tipo de usuário inválido.</p>;
          }
      })()}
    </>
  );
}