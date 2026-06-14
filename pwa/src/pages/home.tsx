import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
// ✅ CORREÇÃO: Revertendo para caminhos relativos COM extensão
import Navbar from "../components/Navbar";
import InstallPwaCard from "../components/InstallPwaCard";
import {
  AlertTriangle,
  MapPin,
  LogIn,
  UserPlus,
  HeartPulse,
  Building,
  Stethoscope,
  Bell,
  Shield,
  PawPrint,
  CheckCircle,
  Siren,
  ArrowRight,
  X,
} from "lucide-react";
import { useState, useEffect, ReactNode } from "react";
// ✅ CORREÇÃO: Revertendo para caminhos relativos COM extensão
import { getUser } from "../utils/auth";
import { Usuario, Emergencia } from "../services/types";
import EmergenciaService from "../services/EmergenciaService";
import { isEmergencyActive } from "../utils/emergencyStatus";
import { useDarkMode } from "../accessibility/DarkModeContext";

export default function Home() {
  const { darkMode } = useDarkMode();
  const [user, setUser] = useState(getUser());
  const navigate = useNavigate();

  const [activeEmergency, setActiveEmergency] = useState<Emergencia | null>(
    null
  );
  const [isCheckingEmergency, setIsCheckingEmergency] = useState(true);

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getUser());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    // Só executa se o utilizador for um tutor logado
    if (user && user.tipo === "tutor") {
      setIsCheckingEmergency(true);

      (async () => {
        try {
          // 1. Busca todas as emergências do tutor
          const minhasEmergencias =
            await EmergenciaService.getMinhasEmergencias();

          // 2. Encontra a primeira emergência ativa usando a regra compartilhada
          const firstActive = minhasEmergencias.find((em) =>
            isEmergencyActive(em.status)
          );

          // 4. Se encontrou uma emergência ativa...
          if (firstActive) {
            // Tenta carregar os dados do pet (pois o 'meus' pode não vir com eles)
            if (firstActive.pet_id && !firstActive.pet) {
              try {
                // A rota 'show' de pets é pública
                const petRes = await fetch(
                  `${import.meta.env.VITE_API_URL}/api/pets/${
                    firstActive.pet_id
                  }`
                );
                if (petRes.ok) {
                  firstActive.pet = await petRes.json();
                }
              } catch (e) {
                console.warn(
                  "Não foi possível carregar dados do pet para o pop-up",
                  e
                );
              }
            }
            setActiveEmergency(firstActive);
          }
        } catch (error) {
          console.error("Erro ao verificar emergências ativas:", error);
        } finally {
          setIsCheckingEmergency(false);
        }
      })();
    } else if (!user) {
      // Se o utilizador está deslogado, verifica o localStorage
      setIsCheckingEmergency(true);
      (async () => {
        try {
          const anonEmergencyId = localStorage.getItem("anonymousEmergencyId");
          
          if (anonEmergencyId) {
            const publicUuid = localStorage.getItem(`emerg_public_uuid_${anonEmergencyId}`);

            if (!publicUuid) {
              localStorage.removeItem("anonymousEmergencyId");
              localStorage.removeItem("anonymousEmergencyPetName");
              setIsCheckingEmergency(false);
              return;
            }

            const { emergencia: emgData } = await EmergenciaService.getPublicByUuid(publicUuid);

            if (isEmergencyActive(emgData.status)) {
              const petName = localStorage.getItem("anonymousEmergencyPetName");
              emgData.pet = { nome: petName || "seu pet" };
              setActiveEmergency(emgData);
            } else {
              localStorage.removeItem("anonymousEmergencyId");
              localStorage.removeItem("anonymousEmergencyPetName");
              localStorage.removeItem(`emerg_public_uuid_${anonEmergencyId}`);
              localStorage.removeItem(`emerg_tutor_token_${anonEmergencyId}`);
            }
          }
        } catch (error) {
          console.error("Erro ao verificar emergência anónima:", error);
          const anonEmergencyId = localStorage.getItem("anonymousEmergencyId");
          if (anonEmergencyId) {
            localStorage.removeItem("anonymousEmergencyId");
            localStorage.removeItem("anonymousEmergencyPetName");
            localStorage.removeItem(`emerg_public_uuid_${anonEmergencyId}`);
            localStorage.removeItem(`emerg_tutor_token_${anonEmergencyId}`);
          }
        } finally {
          setIsCheckingEmergency(false);
        }
      })();
    } else {
      setIsCheckingEmergency(false); // Não é tutor, não verifica
    }
  }, [user]);

  const buttonClass = (isPrimary: boolean) =>
    `block w-full sm:w-auto text-center px-8 py-3 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition 
    ${
      isPrimary
        ? darkMode
          ? "bg-teal-600 hover:bg-teal-500"
          : "bg-[#25A18E] hover:bg-[#208B7C]"
        : darkMode
        ? "bg-gray-700 hover:bg-gray-600"
        : "bg-[#004E64] hover:bg-[#003b50]"
    }`;

  const renderHomeContent = (): ReactNode => {
    const userType = user?.tipo;
    const userName = user?.name ?? "";
    const titleProps = {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.2 },
    };
    const p1Props = {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.3 },
    };
    const p2Props = {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.4 },
    };
    const titleClass = `text-4xl md:text-5xl font-extrabold mb-4 leading-tight drop-shadow-sm ${
      darkMode ? "text-white" : "text-[#004E64]"
    }`;
    const pClass = `mb-8 text-base sm:text-lg max-w-xl ${
      darkMode ? "text-gray-300" : "text-slate-700"
    }`;
    const subtitleClass = `mb-4 text-xl md:text-2xl font-semibold ${
      darkMode ? "text-gray-200" : "text-[#004E64]"
    }`;

    switch (userType) {
      case "clinica":
        return (
          <>
            <motion.h1
              className={titleClass + " flex items-center gap-3"}
              {...titleProps}
            >
              <Building size={40} /> Bem-vinda, Clínica {userName}!
            </motion.h1>
            <motion.p className={subtitleClass} {...p1Props}>
              Prontos para gerenciar seus atendimentos?
            </motion.p>
            <motion.p className={pClass} {...p2Props}>
              Acesse seu <strong>Dashboard</strong> para visualizar novas
              emergências, gerenciar seus veterinários cadastrados e atualizar o
              perfil público da sua clínica.
            </motion.p>
          </>
        );
      case "veterinario":
        return (
          <>
            <motion.h1
              className={titleClass + " flex items-center gap-3"}
              {...titleProps}
            >
              <Stethoscope size={40} /> Olá, Dr(a). {userName}!
            </motion.h1>
            <motion.p className={subtitleClass} {...p1Props}>
              Pronto(a) para o seu plantão?
            </motion.p>
            <motion.p className={pClass} {...p2Props}>
              Acesse seu <strong>Dashboard</strong> para ver chamados de
              emergência, gerenciar seu histórico de atendimentos e atualizar
              seu perfil profissional.
            </motion.p>
          </>
        );
      case "tutor":
      default:
        return (
          <>
            <motion.h1 className={titleClass} {...titleProps}>
              Plataforma de Emergências Veterinárias
            </motion.h1>
            <motion.p className={subtitleClass} {...p1Props}>
              Conectando tutores e clínicas com rapidez e segurança.
            </motion.p>
            <motion.p className={pClass} {...p2Props}>
              O <strong>oBomVet</strong> ajuda a reduzir o tempo de resposta em
              situações de emergência animal, conectando automaticamente tutores
              a clínicas veterinárias próximas via geolocalização.
            </motion.p>
          </>
        );
    }
  };

  const renderHomeButtons = () => {
    if (user) {
      // Usuário logado: Botão IR PARA DASHBOARD
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
      // Usuário deslogado: Entrar e Cadastrar-se
      const buttons = [
        {
          label: "Entrar",
          to: "/login",
          isPrimary: true,
          icon: <LogIn size={20} />,
        },
        {
          label: "Cadastrar-se",
          to: "/register",
          isPrimary: false,
          icon: <UserPlus size={20} />,
        },
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
            className={
              buttonClass(btn.isPrimary) +
              " flex items-center justify-center gap-2"
            }
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
      ${darkMode ? "bg-gray-900 text-white" : "bg-white text-[#004E64]"}`}
    >
      <Navbar />

      <main className="flex-1">
        {/* === SEÇÃO 1: HERO === */}
        <section
          className={`flex flex-col lg:flex-row items-center justify-center pt-32 lg:pt-40 pb-16 lg:pb-24 px-6 gap-12 lg:gap-16
          ${
            darkMode
              ? "bg-gray-900"
              : "bg-gradient-to-br from-[#004E64] to-[#25A18E]"
          }`}
        >
          <motion.div
            className="flex justify-center items-start w-full lg:w-1/2 xl:w-5/12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className={`relative rounded-2xl border p-6 sm:p-10 w-full max-w-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)]
                before:absolute before:-z-10 before:inset-0 before:translate-x-2 before:translate-y-2
                before:rounded-2xl before:opacity-40 before:blur-sm
                hover:before:translate-x-3 hover:before:translate-y-3 transition-all duration-300
                ${
                  darkMode
                    ? "bg-gray-800 border-gray-700 before:bg-gray-700"
                    : "bg-white border-[#25A18E] before:bg-[#25A18E]"
                }`}
            >
              {renderHomeContent()}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-6">
                {renderHomeButtons()}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="w-full lg:w-1/2 xl:w-5/12 flex items-center justify-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <img
              src="/img-home.jpg"
              alt="Veterinário atendendo pet"
              loading="lazy"
              className="w-full h-auto max-h-[500px] rounded-2xl shadow-2xl object-cover transition-all duration-500 hover:scale-105"
            />
          </motion.div>
        </section>

        {/* # ===============================================
        #  ✅ INÍCIO DA ATUALIZAÇÃO "BEM BONITO"
        # ===============================================
        */}
        
        {/* === SEÇÃO 2: COMO FUNCIONA (Estilo A) === */}
        <section className={`py-16 sm:py-24 text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.h2
              className={`text-3xl sm:text-4xl font-extrabold text-center mb-4 ${darkMode ? 'text-white' : 'text-[#004E64]'}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              Como o oBomVet Funciona?
            </motion.h2>
            <motion.p
              className={`text-lg mb-12 max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Em 3 passos simples, conectamos você ao atendimento veterinário.
            </motion.p>

            {/* Grid com 5 colunas no desktop: 3 cards e 2 setas conectoras */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
              
              {/* Step 1 */}
              <motion.div
                className={`flex flex-col items-center p-6 rounded-xl shadow-lg border h-full
                            ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full border-4 border-white shadow-md mb-4 flex-shrink-0">
                  <AlertTriangle
                    className="w-10 h-10 text-red-600"
                    aria-hidden="true"
                  />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-[#004E64]'}`}>
                  1. Relate a Emergência
                </h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Descreva os sintomas do seu pet. Use áudio, texto ou nossos
                  botões de pânico para um relato rápido.
                </p>
              </motion.div>

              {/* Seta Conectora 1 (Desktop) */}
              <motion.div
                className={`hidden md:flex items-center justify-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <ArrowRight size={40} strokeWidth={1} />
              </motion.div>

              {/* Step 2 */}
              <motion.div
                className={`flex flex-col items-center p-6 rounded-xl shadow-lg border h-full
                            ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full border-4 border-white shadow-md mb-4 flex-shrink-0">
                  <MapPin
                    className="w-10 h-10 text-blue-600"
                    aria-hidden="true"
                  />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-[#004E64]'}`}>
                  2. Encontre Ajuda
                </h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Nossa plataforma usa sua localização para encontrar e notificar
                  a clínica 24h mais próxima.
                </p>
              </motion.div>

              {/* Seta Conectora 2 (Desktop) */}
              <motion.div
                className={`hidden md:flex items-center justify-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                 <ArrowRight size={40} strokeWidth={1} />
              </motion.div>

              {/* Step 3 */}
              <motion.div
                className={`flex flex-col items-center p-6 rounded-xl shadow-lg border h-full
                            ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full border-4 border-white shadow-md mb-4 flex-shrink-0">
                  <HeartPulse
                    className="w-10 h-10 text-[#208B7C]"
                    aria-hidden="true"
                  />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-[#004E64]'}`}>
                  3. Seja Atendido
                </h3>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  A clínica recebe seu relatório e se prepara para sua chegada,
                  economizando tempo vital no atendimento.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* === SEÇÃO 3: FUNCIONALIDADES (Estilo B) === */}
        <section className={`py-16 sm:py-24 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.h2
              className={`text-3xl sm:text-4xl font-extrabold text-center mb-12 ${darkMode ? 'text-white' : 'text-[#004E64]'}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              Uma plataforma completa
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Feature 1 (Estilo atualizado) */}
              <motion.div
                className={`p-6 rounded-xl border hover:shadow-lg transition-shadow duration-300
                            ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <PawPrint
                  className="w-10 h-10 text-[#25A18E] mb-3"
                  aria-hidden="true"
                />
                <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#004E64]'}`}>
                  Gestão de Pets
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Mantenha o histórico e os dados dos seus animais em um só
                  lugar.
                </p>
              </motion.div>
              
              {/* Feature 2 (Estilo atualizado) */}
              <motion.div
                 className={`p-6 rounded-xl border hover:shadow-lg transition-shadow duration-300
                            ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Bell
                  className="w-10 h-10 text-[#25A18E] mb-3"
                  aria-hidden="true"
                />
                <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#004E64]'}`}>
                  Alertas Instantâneos
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Notifique clínicas e veterinários sobre sua emergência em tempo
                  real.
                </p>
              </motion.div>
              
              {/* Feature 3 (Estilo atualizado) */}
              <motion.div
                 className={`p-6 rounded-xl border hover:shadow-lg transition-shadow duration-300
                            ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Building
                  className="w-10 h-10 text-[#25A18E] mb-3"
                  aria-hidden="true"
                />
                <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#004E64]'}`}>
                  Catálogo de Clínicas
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Encontre clínicas e veterinários autônomos perto de você no
                  mapa.
                </p>
              </motion.div>
              
              {/* Feature 4 (Estilo atualizado) */}
              <motion.div
                 className={`p-6 rounded-xl border hover:shadow-lg transition-shadow duration-300
                            ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Shield
                  className="w-10 h-10 text-[#25A18E] mb-3"
                  aria-hidden="true"
                />
                <h3 className={`text-lg font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#004E64]'}`}>
                  Seguro e Privado
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Seus dados só são compartilhados com a clínica que aceitar o
                  caso.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* # ===============================================
        #  ✅ FIM DA ATUALIZAÇÃO "BEM BONITO"
        # ===============================================
        */}
      </main>
      {/* Fim do <main> */}

      {/* Container unificado para os botões flutuantes (Sem alterações) */}
      <div className="fixed z-50 bottom-6 right-6 sm:bottom-8 sm:right-8 flex flex-col items-end gap-4">
        
        {/* Botão Clínicas Próximas (Visível para todos) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, type: "spring", stiffness: 100 }}
        >
          <Link to="/clinicPage" aria-label="Ver clínicas próximas no mapa">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="
                flex items-center justify-center 
                bg-gradient-to-r from-blue-600 to-teal-500 
                text-white font-bold 
                shadow-lg hover:shadow-xl transition-all duration-300
                h-14 w-14 rounded-full   /* Estilo Mobile: Ícone */
                sm:h-auto sm:w-auto sm:py-4 sm:px-6 /* Estilo Desktop: Expandido */
              "
            >
              <MapPin className="w-6 h-6" aria-hidden="true" />
              <span className="hidden sm:inline ml-2">Clínicas Próximas</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Botão de EMERGÊNCIA (Apenas para tutores / deslogados) */}
        {(!user || user.tipo === "tutor") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 100 }}
          >
            <Link to="/reportInput" aria-label="Relatar uma nova emergência">
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
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="
                  flex items-center justify-center 
                  bg-gradient-to-r from-red-600 to-red-500 
                  text-white font-bold 
                  shadow-[0_0_25px_rgba(239,68,68,0.8)] hover:shadow-[0_0_35px_rgba(239,68,68,1)]
                  transition-all duration-300
                  h-16 w-16 rounded-full /* Estilo Mobile: Ícone (maior) */
                  sm:h-auto sm:w-auto sm:py-5 sm:px-8 sm:text-lg /* Estilo Desktop: Expandido */
                "
              >
                <Siren className="w-7 h-7" aria-hidden="true" /> 
                <span className="hidden sm:inline ml-3">EMERGÊNCIA</span>
              </motion.button>
            </Link>
          </motion.div>
        )}

      </div>

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
