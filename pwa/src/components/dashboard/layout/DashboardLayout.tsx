import { ReactNode } from "react";
import DashboardTopbar from "./DashboardTopbar";
import DashboardSidebar from "./DashboardSidebar";
import { Usuario } from "../../../services/types";

interface DashboardLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  user: Usuario | null;
  onLogout: () => void;
}

export default function DashboardLayout({
  sidebar,
  children,
  user,
  onLogout,
}: DashboardLayoutProps) {
  return (
    // 'h-screen' garante que a página não role (apenas o conteúdo interno rola)
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      
      {/* Topbar: 'flex-none' impede que ela encolha ou estique */}
      <div className="flex-none z-20 shadow-sm relative bg-white">
        <DashboardTopbar user={user} onLogout={onLogout} />
      </div>

      {/* Container Inferior: Sidebar + Main */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar: Já tem h-full internamente para ocupar este espaço */}
        <DashboardSidebar>{sidebar}</DashboardSidebar>
        
        {/* Main: Onde o conteúdo da página rola */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto scroll-smooth">
          {children}
        </main>

      </div>
    </div>
  );
}