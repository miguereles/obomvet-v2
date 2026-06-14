import { ReactNode, ElementType, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Settings, 
  Moon, 
  Sun, 
  Trash2, 
  AlertTriangle, 
  ChevronLeft, 
  UserX, 
  Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ==========================================
// 1. Mock de Serviços e Componente de Configurações (Interno)
// ==========================================

const MockUserService = {
  deleteAccount: async (userId: string) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 2000);
    });
  },
  updateTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

interface ConfiguracoesUsuarioProps {
  onClose?: () => void;
}

function ConfiguracoesUsuario({ onClose }: ConfiguracoesUsuarioProps) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      MockUserService.updateTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    MockUserService.updateTheme(newTheme);
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "EXCLUIR") return;
    setLoading(true);
    try {
      await MockUserService.deleteAccount("user-123");
      setDeleteModalOpen(false);
      alert("Sua conta foi excluída com sucesso.");
      navigate("/login");
    } catch (error) {
      console.error("Erro ao excluir conta", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const containerClass = theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900';
  const cardClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textMuted = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen p-4 sm:p-8 transition-colors duration-300 ${containerClass}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                <Settings size={32} />
              </span>
              Configurações
            </h1>
            <p className={`mt-2 ${textMuted}`}>
              Gerencie suas preferências e segurança.
            </p>
          </div>
          
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5 font-medium ${
                theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' 
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
            }`}
          >
            <ChevronLeft size={20} /> Voltar
          </button>
        </div>

        <div className="space-y-8">
            {/* Seção Aparência */}
            <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Sun size={20} className={theme === 'dark' ? 'text-yellow-400' : 'text-orange-500'} /> 
                    Aparência
                </h2>
                <div className={`p-6 rounded-2xl shadow-sm border transition-colors ${cardClass}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="font-bold text-lg">Tema do Sistema</h3>
                            <p className={`text-sm ${textMuted} mt-1`}>
                                Escolha entre o modo claro ou escuro.
                            </p>
                        </div>
                        <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-200/50 dark:bg-gray-700/50 dark:border-gray-600">
                            <button onClick={() => handleThemeChange('light')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${theme === 'light' ? 'bg-white text-blue-600 shadow-sm transform scale-105' : 'text-gray-500 dark:text-gray-400'}`}><Sun size={18} /> Claro</button>
                            <button onClick={() => handleThemeChange('dark')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${theme === 'dark' ? 'bg-gray-600 text-white shadow-sm transform scale-105' : 'text-gray-500 dark:text-gray-400'}`}><Moon size={18} /> Escuro</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Seção Zona de Perigo */}
            <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-500">
                    <AlertTriangle size={20} /> Zona de Perigo
                </h2>
                <div className={`p-6 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden transition-colors ${theme === 'dark' ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50'}`}>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-5 text-red-600 pointer-events-none"><AlertTriangle size={140} /></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div>
                            <h3 className="font-bold text-lg text-red-600 dark:text-red-400">Excluir Conta</h3>
                            <p className={`text-sm mt-1 max-w-md ${theme === 'dark' ? 'text-red-200/70' : 'text-red-600/80'}`}>Esta ação é irreversível.</p>
                        </div>
                        <button onClick={() => { setConfirmText(""); setDeleteModalOpen(true); }} className="whitespace-nowrap flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm dark:bg-transparent dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-900/50">
                            <Trash2 size={20} /> Excluir Minha Conta
                        </button>
                    </div>
                </div>
            </section>
        </div>

        {/* Modal de Confirmação */}
        <AnimatePresence>
            {deleteModalOpen && (
                <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => !loading && setDeleteModalOpen(false)}>
                    <motion.div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl relative overflow-hidden ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`} onClick={(e) => e.stopPropagation()} initial={{scale:0.9}} animate={{scale:1}}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 animate-pulse"><UserX size={40} /></div>
                            <h2 className="text-2xl font-bold mb-2">Tem certeza?</h2>
                            <p className={`mb-6 text-sm ${textMuted}`}>Digite <span className="text-red-500 font-bold">EXCLUIR</span> para confirmar.</p>
                            <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} className="w-full font-bold tracking-widest p-3 rounded-lg border-2 outline-none text-center mb-6 bg-transparent border-gray-300" placeholder="EXCLUIR" />
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 rounded-xl font-semibold bg-gray-200 text-gray-700">Cancelar</button>
                                <button onClick={handleDeleteAccount} disabled={confirmText !== 'EXCLUIR' || loading} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 disabled:bg-gray-400">{loading ? <Loader2 className="animate-spin mx-auto"/> : "Excluir"}</button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// ==========================================
// 2. O Botão Inteligente
// ==========================================
interface SidebarItemProps extends React.HTMLAttributes<HTMLElement> {
  icon: ElementType;
  text: string;
  to?: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export function SidebarItem({ 
  icon: Icon, 
  text, 
  to, 
  onClick, 
  isActive: externalActive, 
  className, 
  ...rest 
}: SidebarItemProps) {
  const location = useLocation();
  
  const active = externalActive !== undefined 
    ? externalActive 
    : (to && (location.pathname === to || (to !== '/' && location.pathname.startsWith(to))));

  const commonClasses = `
    group flex items-center
    justify-center md:justify-start
    px-3 py-3 rounded-lg mb-1 transition-all duration-200 relative overflow-hidden cursor-pointer w-full text-left
    ${
      active
        ? "bg-blue-50 text-blue-600 font-semibold"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }
    ${className || ''}
  `;

  const content = (
    <>
      <Icon size={22} className={`shrink-0 transition-colors ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"}`} />
      <span className="hidden md:block ml-3 whitespace-nowrap overflow-hidden text-ellipsis">{text}</span>
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full md:hidden" />}
    </>
  );

  if (to) {
    return <Link to={to} title={text} className={commonClasses} {...rest}>{content}</Link>;
  }

  return <button onClick={onClick} type="button" title={text} className={commonClasses} {...rest}>{content}</button>;
}

// ==========================================
// 3. O Container da Sidebar (Export Default)
// ==========================================
interface DashboardSidebarProps {
  children: ReactNode;
}

export default function DashboardSidebar({ children }: DashboardSidebarProps) {
  // Estado para controlar se as configurações estão abertas
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <aside 
        className="
          h-full bg-white border-r border-gray-200 flex flex-col
          w-16 md:w-64 
          transition-all duration-300 shrink-0 z-10 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]
        "
      >
        <nav className="flex flex-col flex-1 p-2 md:p-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {children}
        </nav>

        <div className="p-2 md:p-4 border-t border-gray-100 mt-auto">
          {/* Botão que ativa o Overlay de Configurações */}
          <SidebarItem 
              icon={Settings} 
              text="Configurações" 
              onClick={() => setShowSettings(true)}
              isActive={showSettings}
          />
        </div>
      </aside>

      {/* Renderização Condicional (Overlay de Configurações) */}
      {showSettings && (
        <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto animate-in fade-in duration-200">
           <ConfiguracoesUsuario onClose={() => setShowSettings(false)} />
        </div>
      )}
    </>
  );
}