import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, AlertTriangle, Activity, User } from "lucide-react"; // Adicionado User
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./layout/DashboardLayout";
import { getToken } from "../../utils/auth";
import MeuPerfilVet from "./meuPerfilVet"; // NOVO: Importe o componente

// Define os tipos de seções possíveis
type VetSection = "home" | "emergencias" | "atendimentos" | "meu_perfil";

export default function VeterinarioDashboard({ user, onLogout }: any) {
  const [emergencias, setEmergencias] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<VetSection>("home");
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

  // Efeito para carregar emergências (mantido)
  useEffect(() => {
    // ... (lógica de fetch de emergências)
  }, [API_URL]);

  const sidebar = (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setActiveSection("home")}
        className={`sidebar-button ${activeSection === "home" ? "sidebar-button-active" : "sidebar-button-inactive"}`}
      >
        <Home size={18} /> Início
      </button>

      <button
        onClick={() => setActiveSection("emergencias")}
        className={`sidebar-button ${activeSection === "emergencias" ? "sidebar-button-active" : "sidebar-button-inactive"}`}
      >
        <AlertTriangle size={18} /> Emergências Recebidas
      </button>

      <button
        onClick={() => setActiveSection("atendimentos")}
        className={`sidebar-button ${activeSection === "atendimentos" ? "sidebar-button-active" : "sidebar-button-inactive"}`}
      >
        <Activity size={18} /> Em andamento
      </button>

      {/* NOVO: Meu Perfil */}
      <button
        onClick={() => setActiveSection("meu_perfil")}
        className={`sidebar-button ${activeSection === "meu_perfil" ? "sidebar-button-active" : "sidebar-button-inactive"}`}
      >
        <User size={18} /> Meu Perfil
      </button>
      
      {/* Estilos Sidebar Buttons (copiados do clinicaDashboard) */}
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
    transition: { duration: 0.3 }
  };


  return (
    <DashboardLayout sidebar={sidebar}>
      <div className="max-w-4xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
            {activeSection === "home" && (
                <motion.div key="home-section" {...motionProps}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Emergências Recentes 🚑</h2>
                    {emergencias.length === 0 ? (
                        <p className="text-gray-500">Nenhuma emergência ativa no momento.</p>
                    ) : (
                        <div className="space-y-3">
                            {/* ... (renderização de emergências) ... */}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Placeholder para Emergências Recebidas */}
            {activeSection === "emergencias" && (
                <motion.div key="emergencias-section" {...motionProps}>
                    {/* Componente que lista as emergências (provavelmente EmergenciasVet, mas a rota é diferente) */}
                    <h2 className="text-2xl font-bold text-gray-800">Emergências Recebidas</h2>
                    <p className="text-gray-500">Liste e aceite as emergências.</p>
                </motion.div>
            )}
            
            {/* Placeholder para Em Andamento */}
            {activeSection === "atendimentos" && (
                <motion.div key="atendimentos-section" {...motionProps}>
                    <h2 className="text-2xl font-bold text-gray-800">Atendimentos em Andamento</h2>
                    <p className="text-gray-500">Gerencie seus atendimentos ativos.</p>
                </motion.div>
            )}
            
            {/* NOVO: Seção Meu Perfil */}
            {activeSection === "meu_perfil" && (
                <motion.div key="meu-perfil-section" {...motionProps}>
                    <MeuPerfilVet />
                </motion.div>
            )}
        </AnimatePresence>

        <button onClick={onLogout} className="mt-6 text-sm text-red-500 underline">
          Sair
        </button>
      </div>
    </DashboardLayout>
  );
}