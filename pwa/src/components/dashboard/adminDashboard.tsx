import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Usuario } from '../../services/types';
// ✅ Importa o Stethoscope
import { Building, Users, HeartPulse, LayoutGrid, SlidersHorizontal, Stethoscope } from 'lucide-react';
import DashboardLayout from './layout/DashboardLayout';

// Importa os novos componentes funcionais
import AdminManageClinics from './admin/adminClinica';
import AdminManageUsers from './admin/adminUsuario';
import AdminAllEmergencies from './admin/adminEmergencia';
// ✅ Importa o novo painel de Vets
import AdminManageVets from './admin/adminVeterinario';


// ---
// Componente LinkItem (Definido localmente para ser auto-contido)
// ---
interface LinkItemProps {
  href: string;
  icon: React.ElementType;
  children: React.ReactNode;
}
const LinkItem = ({ href, icon: Icon, children }: LinkItemProps) => {
  const location = useLocation();
  const currentView = new URLSearchParams(location.search).get('view');
  const linkView = href.includes('view=') ? href.split('view=')[1] : 'overview';
  const isActive = (currentView || 'overview') === linkView;

  return (
    <Link
      to={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
        isActive ? "bg-gray-100 text-gray-900" : ""
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
};
// --- Fim do LinkItem ---


// --- Componentes de "View" (Placeholders restantes) ---
const AdminOverview = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
      <LayoutGrid size={20} />
      Visão Geral do Administrador
    </h2>
    <p>Seja bem-vindo ao painel de controle. Aqui você pode gerir todos os aspetos da plataforma.</p>
  </div>
);

const AdminConfig = () => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
      <SlidersHorizontal size={20} />
      Configurações
    </h2>
    <p>Em breve: Configurações globais da plataforma.</p>
  </div>
);
// --- Fim das Views ---


export default function AdminDashboard({ user, onLogout }: { user: Usuario, onLogout: () => void, initialSection?: string }) {
  const location = useLocation();
  
  const view = useMemo(() => {
    return new URLSearchParams(location.search).get('view') || 'overview';
  }, [location.search]);

  // Define o conteúdo da view principal
  const renderView = () => {
    switch (view) {
      case 'clinicas':
        return <AdminManageClinics />;
      case 'usuarios':
        return <AdminManageUsers />;
      case 'emergencias':
        return <AdminAllEmergencies />;
      // ✅ Adiciona o novo case
      case 'veterinarios':
        return <AdminManageVets />;
      
      case 'config':
        return <AdminConfig />;
      case 'overview':
      default:
        return <AdminOverview />;
    }
  };

  // Define os links que serão passados para a prop 'sidebar'
  const adminLinks = (
    <>
      <LinkItem href="/dashboard" icon={LayoutGrid}>
        Visão Geral
      </LinkItem>
      <LinkItem href="/dashboard?view=clinicas" icon={Building}>
        Gerir Clínicas
      </LinkItem>
      {/* ✅ Adiciona o novo link */}
      <LinkItem href="/dashboard?view=veterinarios" icon={Stethoscope}>
        Gerir Veterinários
      </LinkItem>
      <LinkItem href="/dashboard?view=usuarios" icon={Users}>
        Gerir Utilizadores
      </LinkItem>
      <LinkItem href="/dashboard?view=emergencias" icon={HeartPulse}>
        Todas Emergências
      </LinkItem>
      <LinkItem href="/dashboard?view=config" icon={SlidersHorizontal}>
        Configurações
      </LinkItem>
    </>
  );

  return (
    // Usa o seu DashboardLayout e passa os links para a prop 'sidebar'
    <DashboardLayout user={user} onLogout={onLogout} sidebar={adminLinks}>
      {/* O conteúdo principal é passado como 'children' */}
      {renderView()}
    </DashboardLayout>
  );
}