import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, PawPrint, User, LogOut, HeartPulse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getToken, clearTokenFallback, getUser } from "../utils/auth";
import AuthService from "../services/AuthService";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const navigate = useNavigate();

  // Efeito para verificar o estado de login
  useEffect(() => {
    const checkUser = () => {
      const loggedInUser = getUser();
      if (loggedInUser) {
        setUser({ name: loggedInUser.name });
      } else {
        setUser(null);
      }
    };
    
    checkUser(); // Verifica ao carregar
    
    // Opcional: Ouve por mudanças no storage (login/logout em outra aba)
    window.addEventListener('storage', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
    };
  }, []);


  const handleLogout = () => {
    AuthService.logout(); // Usa o serviço para limpar o token
    setUser(null); // Atualiza o estado local
    setMenuOpen(false);
    navigate("/login"); // redireciona para login
  };

  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: 0.05 * i, duration: 0.3 },
    }),
  };

  // Links atualizados para incluir a nova página
  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Clínicas", path: "/registeredClinicPage" },
    { label: "Funcionalidades", path: "/features" },
    { label: "Sobre Nós", path: "/about" },
  ];

  return (
    <nav className="fixed w-full top-0 left-0 z-30 bg-white/95 backdrop-blur-md shadow-md px-8 md:px-12 py-4 flex items-center justify-between">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3">
        <PawPrint className="text-[#004E64] w-9 h-9" />
        <span className="text-3xl font-extrabold text-[#004E64]">oBomVet</span>
      </Link>

      {/* Menu Desktop */}
      <div className="hidden md:flex items-center gap-4 text-lg">
        {navLinks.map(({ label, path }) => (
          <Link
            key={path}
            to={path}
            className="text-[#004E64] font-semibold hover:text-[#25A18E] transition-colors duration-200 text-base"
          >
            {label}
          </Link>
        ))}

        {user ? (
          <div className="flex items-center gap-4">
            {/* ✅ Logado: Botão Dashboard com cor de projeto */}
            <Link
              to="/dashboard"
              className="flex items-center px-4 py-2 bg-[#25A18E] text-white rounded-lg font-semibold hover:bg-[#208B7C] transition-colors duration-200 text-base"
              title="Ir para o Dashboard"
            >
              Dashboard
            </Link>
            {/* ✅ Logado: Botão de Sair (ícone) */}
            <button
              onClick={handleLogout}
              className="bg-[#25A18E] w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-[#208B7C] transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          /* ✅ Deslogado: Botão Entrar com cor de projeto */
          <Link
            to="/login"
            className="flex items-center px-4 py-2 bg-[#25A18E] text-white rounded-lg font-semibold hover:bg-[#208B7C] transition-colors duration-200 text-base"
            title="Entrar"
          >
            Entrar
          </Link>
        )}
      </div>

      {/* Botão Menu Mobile */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden text-[#004E64] focus:outline-none"
      >
        {menuOpen ? <X size={32} /> : <Menu size={32} />}
      </button>

      {/* Menu Mobile Animado */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="absolute top-full left-0 w-full bg-[#004E64] flex flex-col items-center py-6 gap-6 md:hidden text-white text-lg"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {navLinks.map(({ label, path }, i) => (
              <motion.div
                key={path}
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <Link
                  to={path}
                  onClick={() => setMenuOpen(false)}
                  className="font-semibold hover:text-[#25A18E] transition-colors"
                >
                  {label}
                </Link>
              </motion.div>
            ))}

            {user ? (
              <motion.div
                className="flex flex-col items-center gap-4 mt-4"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                custom={navLinks.length}
              >
                 {/* ✅ Menu Mobile - Dashboard (link de texto) */}
                 <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="font-semibold hover:text-[#25A18E] transition-colors text-xl p-2"
                  title="Ir para o Dashboard"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-[#25A18E] w-12 h-12 rounded-full flex items-center justify-center text-white hover:bg-[#208B7C] transition-colors"
                  title="Sair"
                >
                  <LogOut size={24} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                custom={navLinks.length}
              >
                 {/* ✅ Menu Mobile - Entrar (link de texto) */}
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="font-semibold hover:text-[#25A18E] transition-colors text-xl p-2"
                  title="Entrar"
                >
                  Entrar
                </Link>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}