import { useState, useEffect } from "react";
import { Home, Dog, AlertTriangle, History, User } from "lucide-react"; // ✅ Adicionado ícone User
import { Usuario } from "../../services/types";
import { motion, AnimatePresence } from "framer-motion";
import PetDashboard from "./petDashboard";
import DashboardLayout from "./layout/DashboardLayout";
import HistoricoDashboard from "./historicoDashboard";
import EmergencyDashboardPage from "./emergenciaDashboard";
// ✅ Nova importação do Perfil
import MeuPerfilTutor from "./meuPerfilTutor";

// ✅ Importamos o componente SidebarItem atualizado
import { SidebarItem } from "./layout/DashboardSidebar";

interface TutorDashboardProps {
  user: Usuario | null;
  onLogout: () => void;
  initialSection?: "home" | "pets" | "emergencias" | "historico" | "perfil";
}

export default function TutorDashboard({ user, onLogout, initialSection = "home" }: TutorDashboardProps) {
  const [activeSection, setActiveSection] = useState<"home" | "pets" | "emergencias" | "historico" | "perfil">(initialSection);
  
  // Estado do Tooltip
  const [tooltip, setTooltip] = useState<{ text: string; visible: boolean; y: number }>({
    text: "",
    visible: false,
    y: 0,
  });

  const handleTooltip = (text: string, visible: boolean, y = 0) => {
    setTooltip({ text, visible, y });
  };

  useEffect(() => {
    if (initialSection && initialSection !== activeSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection, activeSection]);

  // Sidebar construída com SidebarItem
  const sidebar = (
    <div className="flex flex-col gap-1 w-full">
      <SidebarItem
        icon={Home}
        text="Início"
        onClick={() => setActiveSection("home")}
        isActive={activeSection === "home"}
        // Repassando eventos para o tooltip funcionar
        onMouseEnter={(e) => handleTooltip("Página inicial do seu dashboard", true, e.currentTarget.offsetTop)}
        onMouseLeave={() => handleTooltip("", false)}
      />

      {/* ✅ Item Perfil Adicionado */}
      <SidebarItem
        icon={User}
        text="Meu Perfil"
        onClick={() => setActiveSection("perfil")}
        isActive={activeSection === "perfil"}
        onMouseEnter={(e) => handleTooltip("Edite seus dados pessoais", true, e.currentTarget.offsetTop)}
        onMouseLeave={() => handleTooltip("", false)}
      />

      <SidebarItem
        icon={Dog}
        text="Meus Pets"
        onClick={() => setActiveSection("pets")}
        isActive={activeSection === "pets"}
        onMouseEnter={(e) => handleTooltip("Gerencie seus pets: cadastrar, editar e excluir", true, e.currentTarget.offsetTop)}
        onMouseLeave={() => handleTooltip("", false)}
      />

      <SidebarItem
        icon={AlertTriangle}
        text="Emergências"
        onClick={() => setActiveSection("emergencias")}
        isActive={activeSection === "emergencias"}
        onMouseEnter={(e) => handleTooltip("Gerenciar emergências dos seus pets", true, e.currentTarget.offsetTop)}
        onMouseLeave={() => handleTooltip("", false)}
      />

      <SidebarItem
        icon={History}
        text="Histórico"
        onClick={() => setActiveSection("historico")}
        isActive={activeSection === "historico"}
        onMouseEnter={(e) => handleTooltip("Acompanhe o histórico de atendimentos", true, e.currentTarget.offsetTop)}
        onMouseLeave={() => handleTooltip("", false)}
      />
    </div>
  );

  // Animação suave para troca de conteúdo
  const motionProps = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3 }
  };

  return (
    <DashboardLayout sidebar={sidebar} user={user} onLogout={onLogout}>
      {/* Tooltip Flutuante (Renderização Condicional) */}
      <AnimatePresence>
        {tooltip.visible && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            // Ajuste de posição: left: 80px para não ficar em cima da sidebar colapsada no mobile
            style={{ top: tooltip.y, left: 80, zIndex: 50 }}
            className="fixed bg-gray-800 text-white text-sm rounded-md px-3 py-2 shadow-lg max-w-xs pointer-events-none hidden md:block"
          >
            {tooltip.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conteúdo Principal */}
      <div className="max-w-5xl mx-auto space-y-6 h-full flex flex-col">
        <AnimatePresence mode="wait">
            {/* Home */}
            {activeSection === "home" && (
            <motion.div key="home" {...motionProps} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">Bem-vindo, {user?.name} 🐾</h2>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-blue-800">
                    <p className="text-lg">
                        Use a barra lateral à esquerda para navegar entre seus pets, registrar emergências e acessar o histórico de atendimentos.
                    </p>
                </div>
            </motion.div>
            )}

            {/* ✅ Renderização do Perfil */}
            {activeSection === "perfil" && (
            <motion.div key="perfil-dashboard" {...motionProps} className="h-full">
                <MeuPerfilTutor />
            </motion.div>
            )}

            {/* Pets */}
            {activeSection === "pets" && (
            <motion.div key="pet-dashboard" {...motionProps} className="h-full">
            <PetDashboard currentUser={user as any} />
            </motion.div>
            )}

            {/* Emergências */}
            {activeSection === "emergencias" && (
            <motion.div key="emergency-dashboard" {...motionProps}>
                <EmergencyDashboardPage />
            </motion.div>
            )}

            {/* Histórico */}
            {activeSection === "historico" && (
            <motion.div key="historico-dashboard" {...motionProps}>
                <HistoricoDashboard />
            </motion.div>
            )}
        </AnimatePresence>

        
      </div>
    </DashboardLayout>
  );
}