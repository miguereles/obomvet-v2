import { ReactNode } from "react";
import DashboardTopbar from "./DashboardTopbar";
import DashboardSidebar from "./DashboardSidebar";
// Importa o tipo 'Usuario' que agora é necessário
import { Usuario } from "../../../services/types";

interface DashboardLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  user: Usuario | null; // ✅ Prop 'user' adicionada
  onLogout: () => void; // ✅ Prop 'onLogout' adicionada
}

export default function DashboardLayout({
  sidebar,
  children,
  user,
  onLogout,
}: DashboardLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ✅ Props passadas para a Topbar */}
      <DashboardTopbar user={user} onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden"> {/* Adicionado overflow-hidden */}
        <DashboardSidebar>{sidebar}</DashboardSidebar>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}