import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  PawPrint,
  LogOut,
  User,
  Building,
  Stethoscope,
  ChevronDown,
} from "lucide-react";
// Importa o tipo 'Usuario' que já inclui as relações 'clinica' e 'veterinario'
import { Usuario } from "../../../services/types";

// Helper para resolver o URL da imagem
function resolveImageUrl(fotoUrl: string | undefined): string | null {
  if (!fotoUrl) {
    return null;
  }
  if (fotoUrl.startsWith("http")) {
    return fotoUrl;
  }
  const API_BASE = (import.meta as any).env.VITE_API_URL || "http://localhost:8000/api";
  const base = API_BASE.replace(/\/api$/, "").replace(/\/$/, "");
  return `${base}${fotoUrl.startsWith("/") ? "" : "/"}${fotoUrl}`;
}

// Helper para gerar as iniciais do nome para o avatar de fallback
function getInitials(name: string): string {
  if (!name) return "U";
  const names = name.split(" ");
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
}

interface TopbarProps {
  user: Usuario | null;
  onLogout: () => void;
}

export default function DashboardTopbar({ user, onLogout }: TopbarProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ✅ LÓGICA CORRIGIDA:
  // 1. Procura a foto de perfil nos sub-objetos 'clinica' ou 'veterinario'
  const fotoUrl = user?.clinica?.foto_url || user?.veterinario?.foto_url;
  const resolvedPhoto = resolveImageUrl(fotoUrl);

  // 2. Procura o NOME REAL (Nome Fantasia, Nome Completo) antes de usar o nome de login
  const userName =
    user?.clinica?.nome_fantasia ||    // Nome da Clínica
    user?.veterinario?.nome_completo || // Nome do Veterinário
    user?.tutor?.nome_completo ||      // Nome do Tutor
    user?.name ||                      // Fallback para o nome de login
    "Utilizador";

  // 3. Procura o EMAIL DE CONTATO antes de usar o email de login
  const userEmail =
    user?.clinica?.email_contato ||    // Email de Contato da Clínica
    user?.email ||                     // Fallback para o email de login
    "email@dominio.com";
  
  // 4. Define as iniciais com base no NOME REAL encontrado
  const initials = getInitials(userName);

  // 6. Identificadores específicos (clinica_id / veterinario_id / tutor_id)
  // Preferimos os IDs vindos do próprio objeto 'user' (perfil carregado). Como fallback, usamos localStorage.
  const clinicaId = user?.clinica?.id ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('clinica_id') : null);
  const veterinarioId = user?.veterinario?.id ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('veterinario_id') : null);
  const tutorId = user?.tutor?.id ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('tutor_id') : null);

  // 5. Lógica para fechar o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  // 6. Ícone do perfil (baseado no tipo de utilizador)
  const ProfileIcon =
    user?.tipo === "clinica"
      ? Building
      : user?.tipo === "veterinario"
      ? Stethoscope
      : User;

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white shadow-md z-20 relative">
      {/* Botão Voltar */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition rounded-lg p-2 -ml-2"
        aria-label="Voltar"
      >
        <ArrowLeft size={18} />
        <span>Voltar</span>
      </button>

      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2"
        aria-label="Página Inicial oBomVet"
      >
        <PawPrint className="w-8 h-8 text-[#004E64]" />
        <span className="text-2xl font-extrabold text-[#004E64] hidden sm:block">
          oBomVet
        </span>
      </Link>

      {/* Menu do Utilizador (Novo) */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 rounded-full p-1 pr-2 text-left text-gray-700 hover:bg-gray-100 transition"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          {/* O Avatar (Foto ou Iniciais) */}
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#25A18E] bg-gray-200 flex-shrink-0">
            {resolvedPhoto ? (
              <img
                src={resolvedPhoto}
                alt={`Foto de ${userName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#EAF9F5] text-sm font-bold text-[#208B7C]">
                {initials}
              </div>
            )}
          </div>
          {/* ✅ Mostra o NOME REAL */}
          <span className="hidden lg:block text-sm font-semibold max-w-[150px] truncate">
            {userName}
            {/* Mostra tipo e id curto ao lado do nome */}
            <span className="text-xs font-normal text-gray-400 ml-2">{user?.tipo}{' '}
              {clinicaId ? `#${clinicaId}` : veterinarioId ? `#${veterinarioId}` : tutorId ? `#${tutorId}` : ''}
            </span>
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              menuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* O Dropdown Menu */}
        {menuOpen && (
          <div
            className="absolute top-12 right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
            role="menu"
            aria-orientation="vertical"
          >
            {/* Cabeçalho do Menu */}
            <div className="p-4 border-b border-gray-200">
              {/* ✅ Mostra o NOME REAL */}
              <p className="font-bold text-gray-800 truncate" title={userName}>
                {userName}
              </p>
              {/* ✅ Mostra o EMAIL REAL */}
              <p className="text-sm text-gray-500 truncate" title={userEmail}>
                {userEmail}
              </p>
              {/* Mostra tipo e IDs relevantes */}
              <p className="text-xs text-gray-400 mt-1">
                {user?.tipo && <span className="capitalize">{user.tipo}</span>}
                {clinicaId && <span className="ml-2">Clínica: #{clinicaId}</span>}
                {!clinicaId && veterinarioId && <span className="ml-2">Vet: #{veterinarioId}</span>}
                {!clinicaId && !veterinarioId && tutorId && <span className="ml-2">Tutor: #{tutorId}</span>}
              </p>
            </div>
            
            {/* Link para o Perfil (baseado no tipo) */}
            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition"
              role="menuitem"
            >
              <ProfileIcon size={16} className="text-gray-500" />
              <span>Meu Painel</span>
            </Link>
            
            {/* Botão de Logout */}
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
              role="menuitem"
            >
              <LogOut size={16} />
              <span>Terminar Sessão</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}