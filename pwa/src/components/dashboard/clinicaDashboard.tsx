import React, { useState, useEffect } from "react";
import { Home, Activity, Users, Building } from "lucide-react"; // Adicionado Building
import { Usuario } from "../../services/types";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "./layout/DashboardLayout";
import EmergenciasClinica from "./emergenciaClinica";
import GerenciarVeterinarios from "./gerenciarVeterinarios";
import MinhaClinica from "./minhaClinica"; // NOVO: Importe o componente

// Define os tipos de seções possíveis no dashboard da clínica
type ClinicaSection = "home" | "emergencias" | "veterinarios" | "minha_clinica"; // Alterado de 'configuracoes'

interface ClinicaDashboardProps {
  user: Usuario | null;
  onLogout: () => void;
  initialSection?: ClinicaSection;
}

export default function ClinicaDashboard({ user, onLogout, initialSection = "home" }: ClinicaDashboardProps) {
  const [activeSection, setActiveSection] = useState<ClinicaSection>(initialSection);

  useEffect(() => {
    if (initialSection && initialSection !== activeSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection, activeSection]);

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
        <Activity size={18} /> Emergências
      </button>

      <button
        onClick={() => setActiveSection("veterinarios")}
        className={`sidebar-button ${activeSection === "veterinarios" ? "sidebar-button-active" : "sidebar-button-inactive"}`}
      >
        <Users size={18} /> Veterinários
      </button>

      {/* NOVO: Minha Clínica */}
      <button
        onClick={() => setActiveSection("minha_clinica")}
        className={`sidebar-button ${activeSection === "minha_clinica" ? "sidebar-button-active" : "sidebar-button-inactive"}`}
      >
        <Building size={18} /> Minha Clínica
      </button>

      {/* Estilos Sidebar Buttons (mantidos) */}
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
    <DashboardLayout sidebar={sidebar} user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {activeSection === "home" && (
            <motion.div key="home-section" {...motionProps}>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo(a), {user?.name || 'Clínica'} 🏥</h2>
              <p className="text-gray-500">
                Utilize o menu lateral para gerir as emergências recebidas e outras funcionalidades.
              </p>
            </motion.div>
          )}

          {activeSection === "emergencias" && (
            <motion.div key="emergencias-section" {...motionProps}>
              <EmergenciasClinica />
            </motion.div>
          )}

          {activeSection === "veterinarios" && (
            <motion.div key="vet-section" {...motionProps}>
              <GerenciarVeterinarios />
            </motion.div>
          )}

          {activeSection === "minha_clinica" && (
            <motion.div key="minha-clinica-section" {...motionProps}>
              <MinhaClinica />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}