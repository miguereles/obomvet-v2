import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, AlertTriangle, User, History } from "lucide-react"; // 🎯 Importado 'History' e removido 'Activity'
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./layout/DashboardLayout";
import EmergenciasVet from "./emergenciasVet";
import MeuPerfilVet from "./meuPerfilVet";
// Importa o tipo 'Usuario'
import { Usuario } from "../../services/types";

// 🎯 Tipo VetSection atualizado para refletir o novo menu
type VetSection = "home" | "historico" | "meu_perfil";

// ✅ Props 'user', 'onLogout', e 'initialSection' agora são recebidas
interface VetDashboardProps {
  user: Usuario | null;
  onLogout: () => void;
  initialSection: VetSection;
}

export default function VeterinarioDashboard({
  user,
  onLogout,
  initialSection,
}: VetDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] =
    useState<VetSection>(initialSection);

  // Efeito para atualizar a seção se o state de navegação mudar
  useEffect(() => {
    if (location.state?.activeSection) {
      setActiveSection(location.state.activeSection);
      // Limpa o state para não ficar "preso"
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);


  const sidebar = (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setActiveSection("home")}
        className={`sidebar-button ${
          activeSection === "home" ? "sidebar-button-active" : "sidebar-button-inactive"
        }`}
      >
        <Home size={18} /> Início
      </button>

      {/* 🎯 CORREÇÃO: Nova seção para Histórico de Atendimentos Finalizados */}
      <button
        onClick={() => setActiveSection("historico")}
        className={`sidebar-button ${
          activeSection === "historico"
            ? "sidebar-button-active"
            : "sidebar-button-inactive"
        }`}
      >
        <History size={18} /> Histórico Finalizado
      </button>

      {/* 🎯 REMOVIDO: Botão "Em andamento" */}

      <button
        onClick={() => setActiveSection("meu_perfil")}
        className={`sidebar-button ${
          activeSection === "meu_perfil"
            ? "sidebar-button-active"
            : "sidebar-button-inactive"
        }`}
      >
        <User size={18} /> Meu Perfil
      </button>

      {/* Estilos Sidebar Buttons (copiados) */}
      <style>{`
        .sidebar-button { display: flex; align-items: center; gap: 0.75rem; width: 100%; text-align: left; border-radius: 0.375rem; padding: 0.625rem 0.75rem; font-size: 0.875rem; font-weight: 500; transition: background-color 0.15s ease-in-out, color 0.15s ease-in-out; }
        .sidebar-button-active { background-color: #EAF9F5; color: #208B7C; font-weight: 600; }
        .sidebar-button-inactive { color: #4B5563; }
        .sidebar-button-inactive:hover:not(:disabled) { background-color: #F3F4F6; color: #1F2937; }
        .sidebar-button:disabled { color: #9CA3AF; }
      `}</style>
    </div>
  );

  const motionProps = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
    transition: { duration: 0.3 },
  };

  return (
    // ✅ Props 'user' e 'onLogout' passadas para o Layout
    <DashboardLayout sidebar={sidebar} user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {activeSection === "home" && (
            <motion.div key="home-section" {...motionProps}>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Painel do Veterinário 🩺
              </h2>
              <p className="text-gray-500">
                Bem-vindo(a), {user?.name}. Utilize o menu para visualizar seu histórico de atendimentos finalizados e gerenciar seu perfil.
              </p>
            </motion.div>
          )}

          {/* 🎯 NOVO: Histórico de Emergências Finalizadas */}
          {activeSection === "historico" && (
            <motion.div key="historico-section" {...motionProps}>
              <h2 className="text-2xl font-bold text-gray-800">
                Histórico de Atendimentos Finalizados
              </h2>
              <p className="text-gray-500 mb-4">
                Lista de todas as emergências que você marcou como "Finalizadas".
              </p>
              {/*                 NOTE: É necessário que o componente EmergenciasVet seja modificado 
                para buscar/filtrar apenas emergências com status 'concluida' 
                e que tenham o 'veterinario_id' igual ao do usuário logado.
                O componente abaixo é o ponto de montagem.
              */}
              <EmergenciasVet 
                initialFilter={{ status: 'concluida', veterinarioId: user?.id }} 
              />
            </motion.div>
          )}

          {/* 🎯 REMOVIDO: Seções "emergencias" e "atendimentos" originais */}
          
          {activeSection === "meu_perfil" && (
            <motion.div key="meu-perfil-section" {...motionProps}>
              <MeuPerfilVet />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}