import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, AlertTriangle, Activity, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./layout/DashboardLayout";
import EmergenciasVet from "./emergenciasVet";
import MeuPerfilVet from "./meuPerfilVet";
// Importa o tipo 'Usuario'
import { Usuario } from "../../services/types";

type VetSection = "home" | "emergencias" | "atendimentos" | "meu_perfil";

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

      <button
        onClick={() => setActiveSection("emergencias")}
        className={`sidebar-button ${
          activeSection === "emergencias"
            ? "sidebar-button-active"
            : "sidebar-button-inactive"
        }`}
      >
        <AlertTriangle size={18} /> Emergências Recebidas
      </button>

      <button
        onClick={() => setActiveSection("atendimentos")}
        className={`sidebar-button ${
          activeSection === "atendimentos"
            ? "sidebar-button-active"
            : "sidebar-button-inactive"
        }`}
      >
        <Activity size={18} /> Em andamento
      </button>

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
                Painel do Veterinário 🚑
              </h2>
              <p className="text-gray-500">
                Bem-vindo(a), {user?.name}. Utilize o menu para aceitar chamados e
                gerenciar seu perfil.
              </p>
              {/* Pode adicionar estatísticas aqui */}
            </motion.div>
          )}

          {activeSection === "emergencias" && (
            <motion.div key="emergencias-section" {...motionProps}>
              <EmergenciasVet />
            </motion.div>
          )}

          {activeSection === "atendimentos" && (
            <motion.div key="atendimentos-section" {...motionProps}>
              <h2 className="text-2xl font-bold text-gray-800">
                Atendimentos em Andamento
              </h2>
              <p className="text-gray-500">
                Aqui ficará a lista de emergências que você aceitou e estão
                ativas.
              </p>
            </motion.div>
          )}

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