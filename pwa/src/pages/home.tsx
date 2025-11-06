import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import InstallPwaCard from "../components/InstallPwaCard";
// ✅ Adicionado LogIn, UserPlus e HeartPulse para os botões do corpo principal
import { AlertTriangle, MapPin, LogIn, UserPlus, HeartPulse } from "lucide-react"; 
import { useState } from "react";
import homeImg from "../assets/img-home.jpg?w=800&format=webp&as=src";
// ✅ Importa a função para checar o token
import { getToken } from "../utils/auth"; 

export default function Home() {
  const [darkMode, setDarkMode] = useState(false); // você pode sincronizar com Navbar se quiser
  // ✅ Verifica o estado de login
  const token = getToken();

  const buttonClass = (isPrimary: boolean) =>
    `block w-full sm:w-auto text-center px-8 py-3 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition 
     ${isPrimary 
        ? darkMode ? "bg-teal-600 hover:bg-teal-500" : "bg-[#25A18E] hover:bg-[#208B7C]" 
        : darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-[#004E64] hover:bg-[#003b50]"
     }`;


  const renderHomeButtons = () => {
    if (token) {
      // ✅ Usuário logado: Botão IR PARA DASHBOARD
      return (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto"
        >
          <Link
            to="/dashboard"
            className={buttonClass(true) + " flex items-center justify-center gap-2"}
          >
            <HeartPulse size={20} /> Ir para o Dashboard
          </Link>
        </motion.div>
      );
    } else {
      // ✅ Usuário deslogado: Entrar e Cadastrar-se
      const buttons = [
        { label: "Entrar", to: "/login", isPrimary: true, icon: <LogIn size={20} /> },
        { label: "Cadastrar-se", to: "/register", isPrimary: false, icon: <UserPlus size={20} /> },
      ];
      return buttons.map((btn, idx) => (
        <motion.div
          key={btn.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + idx * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto"
        >
          <Link
            to={btn.to}
            className={buttonClass(btn.isPrimary) + " flex items-center justify-center gap-2"}
          >
            {btn.icon} {btn.label}
          </Link>
        </motion.div>
      ));
    }
  };


  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-300
       ${
         darkMode
           ? "bg-gray-900 text-white"
           : "bg-gradient-to-br from-[#004E64] to-[#25A18E] text-[#004E64]"
       }`}
    >
      <Navbar />

      <main className="flex-1 flex flex-col md:flex-row items-center justify-center pt-24 md:pt-32 pb-12 md:pb-16 px-4 sm:px-8 gap-8 md:gap-12">
        {/* Card principal */}
        <motion.div
          // Removido mt-10, o gap do <main> agora controla o espaço
          className="flex justify-center items-start px-4 w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            // Padding responsivo: p-6 em telas pequenas, sm:p-10 em maiores
            className={`relative rounded-2xl border p-6 sm:p-10 max-w-3xl w-full
              shadow-[0_10px_40px_rgba(0,0,0,0.08)]
              before:absolute before:-z-10 before:inset-0 before:translate-x-2 before:translate-y-2
              before:rounded-2xl before:opacity-40 before:blur-sm
              hover:before:translate-x-3 hover:before:translate-y-3 transition-all duration-300
              ${
                darkMode
                  ? "bg-gray-800 border-gray-700 before:bg-gray-700"
                  : "bg-white border-[#25A18E] before:bg-[#25A18E]"
              }`}
          >
            <motion.h1
              // Fonte responsiva: text-4xl (mobile) e md:text-5xl (desktop)
              className={`text-4xl md:text-5xl font-extrabold mb-4 leading-tight drop-shadow-sm ${
                darkMode ? "text-white" : "text-[#004E64]"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Plataforma de Emergências Veterinárias
            </motion.h1>

            <motion.p
              // Fonte responsiva: text-xl (mobile) e md:text-2xl (desktop)
              className={`mb-4 text-xl md:text-2xl font-semibold ${
                darkMode ? "text-gray-200" : "text-[#004E64]"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Conectando tutores e clínicas com rapidez e segurança.
            </motion.p>

            <motion.p
              // Fonte responsiva: text-base (mobile) e sm:text-lg (telas maiores)
              className={`mb-8 text-base sm:text-lg max-w-xl ${
                darkMode ? "text-gray-300" : "text-slate-700"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              O <strong>oBomVet</strong> ajuda a reduzir o tempo de resposta em
              situações de emergência animal, conectando automaticamente tutores
              a clínicas veterinárias próximas via geolocalização.
            </motion.p>

            {/* Botões padrão - Renderiza condicionalmente Dashboard ou Entrar/Cadastrar-se */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-6">
                {renderHomeButtons()}
            </div>
          </div>
        </motion.div>

        {/* Ilustração (Lógica mantida: hidden md:block) */}
        <motion.div
          className="flex-1 flex items-center justify-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <img
            src={homeImg} // Aqui usamos a importação TSX
            alt="Veterinário atendendo pet"
            loading="lazy"
            className="w-96 h-96 object-contain hidden md:block drop-shadow-xl"
          />
        </motion.div>
      </main>

      {/* Botão de EMERGÊNCIA flutuante — versão desktop (Lógica mantida) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        className="hidden sm:flex fixed z-50 bottom-8 right-8"
      >
        <Link to="/reportInput">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 0 rgba(239,68,68,0.5)",
                "0 0 30px rgba(239,68,68,0.8)",
                "0 0 0 rgba(239,68,68,0.5)",
                "0 0 0 rgba(239,68,68,0.5)",
              ],
            }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="
              flex items-center justify-center gap-3
              px-8 py-5 rounded-full text-white font-bold text-lg
              bg-gradient-to-r from-red-600 to-red-500
              shadow-[0_0_25px_rgba(239,68,68,0.8)]
              hover:shadow-[0_0_35px_rgba(239,68,68,1)]
              transition-all duration-300
            "
          >
            <AlertTriangle className="w-7 h-7" />
            EMERGÊNCIA
          </motion.button>
        </Link>
      </motion.div>

      {/* Botão estilo “fitinha” — versão mobile (Lógica mantida) */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="sm:hidden fixed top-1/3 right-0 z-50 rotate-[-90deg] origin-bottom-right"
      >
        <Link to="/reportInput">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="
              flex items-center gap-2
              bg-gradient-to-r from-red-600 to-red-500
              text-white font-bold px-4 py-2 rounded-t-lg
              shadow-[0_0_15px_rgba(239,68,68,0.7)]
              hover:shadow-[0_0_25px_rgba(239,68,68,1)]
              transition-all duration-300
            "
          >
            <AlertTriangle className="w-5 h-5" />
            <span>EMERGÊNCIA</span>
          </motion.div>
        </Link>
      </motion.div>

      {/* FAB para abrir o mapa de clínicas — versão mobile (Lógica mantida) */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3 }}
        className="sm:hidden fixed top-1/2 right-0 z-60 rotate-[-90deg] origin-bottom-right"
      >
        <Link to="/clinicPage">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="
              flex items-center gap-2
              bg-gradient-to-r from-blue-600 to-teal-500
              text-white font-bold px-4 py-2 rounded-t-lg
              shadow-[0_0_15px_rgba(0,128,255,0.7)]
              hover:shadow-[0_0_25px_rgba(0,128,255,1)]
              transition-all duration-300
            "
          >
            <MapPin className="w-5 h-5" />
            <span>Clínicas Próximas</span>
          </motion.div>
        </Link>
      </motion.div>

      {/* Botão Clínicas Desktop (Lógica mantida) */}
      <motion.div className="hidden sm:flex fixed z-60 bottom-32 right-8">
        <Link to="/clinicPage">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-4 rounded-full text-white font-bold text-lg
                bg-gradient-to-r from-blue-600 to-teal-500 shadow-lg hover:shadow-xl
                transition-all duration-300"
          >
            <MapPin className="w-6 h-6" />
            Clínicas Próximas
          </motion.button>
        </Link>
      </motion.div>

      {/* Card de instalação PWA */}
      <InstallPwaCard />

      <footer
        className={`w-full text-center py-4 text-xs shadow-inner transition-colors duration-300 ${
          darkMode
            ? "bg-gray-900 text-gray-200"
            : "bg-[#004E64] text-gray-100"
        }`}
      >
        &copy; {new Date().getFullYear()} oBomVet — Plataforma de Emergências
        Veterinárias
      </footer>
    </div>
  );
}