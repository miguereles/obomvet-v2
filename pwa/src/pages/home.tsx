import { Link, useNavigate } from "react-router-dom"; // ✅ Importado useNavigate
import { motion, AnimatePresence } from "framer-motion"; // ✅ Importado AnimatePresence
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
  Siren, // ✅ Adicionado
  ArrowRight, // ✅ Adicionado
  X, // ✅ Adicionado
} from "lucide-react";
import { useState, useEffect, ReactNode } from "react";
import { getUser } from "../utils/auth";
// ✅ Importado o tipo Emergencia e o Service
import { Usuario, Emergencia } from "../services/types";
import EmergenciaService from "../services/EmergenciaService";
// ✅ 1. Importado da pasta 'accessibility'
import { useDarkMode } from "../accessibility/DarkModeContext";

export default function Home() {
  // ✅ 2. O 'darkMode' agora vem do Contexto Global (corrigido)
  const { darkMode } = useDarkMode();
  const [user, setUser] = useState<Pick<
    Usuario,
    "id" | "name" | "email" | "tipo"
  > | null>(getUser());
  const navigate = useNavigate(); // ✅ Hook de navegação

  // ✅ --- Novo Estado para o Pop-up ---
  const [activeEmergency, setActiveEmergency] = useState<Emergencia | null>(
    null
  );
  const [isCheckingEmergency, setIsCheckingEmergency] = useState(true);
  // --- Fim do Novo Estado ---

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getUser());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // ✅ --- useEffect para buscar emergências ativas (CORRIGIDO) ---
  useEffect(() => {
    // Só executa se o utilizador for um tutor logado
    if (user && user.tipo === "tutor") {
      setIsCheckingEmergency(true);

      (async () => {
        try {
          // 1. Busca todas as emergências do tutor
          const minhasEmergencias =
            await EmergenciaService.getMinhasEmergencias();

          // 2. Define quais status são considerados "ativos" (com "pendente")
          const activeStatus: Emergencia["status"][] = [
            "aberta",
            "assigned",
            "accepted",
            "em_atendimento",
            "pendente", // ✅ Correção para o pop-up
          ];

          // 3. Encontra a primeira emergência que esteja ativa
          const firstActive = minhasEmergencias.find((em) =>
            activeStatus.includes(em.status)
          );

          // 4. Se encontrou uma emergência ativa...
          if (firstActive) {
            // Tenta carregar os dados do pet (pois o 'meus' pode não vir com eles)
            if (firstActive.pet_id && !firstActive.pet) {
              // Esta é uma chamada "best-effort", não bloqueia o pop-up
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
      // ✅ --- Lógica para utilizador anónimo ---
    } else if (!user) {
      // Se o utilizador está deslogado, verifica o localStorage
      setIsCheckingEmergency(true);
      (async () => {
        try {
          const anonEmergencyId = localStorage.getItem("anonymousEmergencyId");
          if (anonEmergencyId) {
            // Encontrou um ID anónimo, busca os dados da emergência
            // A rota 'show' (getById) é pública
            const emgData = await EmergenciaService.getById(anonEmergencyId);

            const activeStatus: Emergencia["status"][] = [
              "aberta",
              "assigned",
              "accepted",
              "em_atendimento",
              "pendente", // ✅ Correção para o pop-up
            ];

            if (activeStatus.includes(emgData.status)) {
              // A emergência ainda está ativa, mostra o pop-up
              const petName = localStorage.getItem("anonymousEmergencyPetName");
              // Simula a estrutura do objeto 'pet' que o pop-up espera
              emgData.pet = { nome: petName || "seu pet" };
              setActiveEmergency(emgData);
            } else {
              // A emergência foi concluída ou cancelada, limpa o localStorage
              localStorage.removeItem("anonymousEmergencyId");
              localStorage.removeItem("anonymousEmergencyPetName");
            }
          }
        } catch (error) {
          console.error("Erro ao verificar emergência anónima:", error);
          // Limpa se o ID for inválido (ex: emergência apagada)
          localStorage.removeItem("anonymousEmergencyId");
          localStorage.removeItem("anonymousEmergencyPetName");
        } finally {
          setIsCheckingEmergency(false);
        }
      })();
      // ✅ --- FIM DA ADIÇÃO ---
    } else {
      setIsCheckingEmergency(false); // Não é tutor, não verifica
    }
  }, [user]);
  // --- Fim do novo useEffect ---

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

  // Função para renderizar o conteúdo do HERO (Inalterada)
  const renderHomeContent = (): ReactNode => {
    const userType = user?.tipo;
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
              <Building size={40} /> Bem-vinda, Clínica {user.name}!
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
              <Stethoscope size={40} /> Olá, Dr(a). {user.name}!
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

  // Função para renderizar os BOTÕES do HERO (Inalterada)
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
        {/* === SEÇÃO 1: HERO (Layout Atualizado) === */}
        <section
          className={`flex flex-col lg:flex-row items-center justify-center pt-32 lg:pt-40 pb-16 lg:pb-24 px-6 gap-12 lg:gap-16
          ${
            darkMode
              ? "bg-gray-900"
              : "bg-gradient-to-br from-[#004E64] to-[#25A18E]"
          }`}
        >
          {/* Card principal (Sem alterações, mas o container mudou) */}
          <motion.div
            className="flex justify-center items-start w-full lg:w-1/2 xl:w-5/12" // Ajustado para xl:w-5/12
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
                    : "bg-white border-[#25A18E] before:bg-[#25A18E]" // ✅ Correção do erro de digitação
                }`}
            >
              {renderHomeContent()}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-6">
                {renderHomeButtons()}
              </div>
            </div>
          </motion.div>

          {/* Imagem (Estilo e Tamanho Melhorados) */}
          <motion.div
            className="w-full lg:w-1/2 xl:w-5/12 flex items-center justify-center" // Ajustado para xl:w-5/12
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <img
              src="/img-home.jpg" // ✅ 3. Caminho da pasta 'public' (corrigido)
              alt="Veterinário atendendo pet"
              loading="lazy"
              className="w-full h-auto max-h-[500px] rounded-2xl shadow-2xl object-cover transition-all duration-500 hover:scale-105"
            />
          </motion.div>
        </section>

        {/* === SEÇÃO 2: COMO FUNCIONA (NOVO) === */}
        <section className="py-16 sm:py-24 bg-white text-center">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.h2
              className="text-3xl sm:text-4xl font-extrabold text-center text-[#004E64] mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              Como o oBomVet Funciona?
            </motion.h2>
            <motion.p
              className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Em 3 passos simples, conectamos você ao atendimento veterinário.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full border-4 border-white shadow-md mb-4">
                  <AlertTriangle
                    className="w-10 h-10 text-red-600"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#004E64] mb-2">
                  1. Relate a Emergência
                </h3>
                <p className="text-gray-600">
                  Descreva os sintomas do seu pet. Use áudio, texto ou nossos
                  botões de pânico para um relato rápido e detalhado.
                </p>
              </motion.div>
              {/* Step 2 */}
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full border-4 border-white shadow-md mb-4">
                  <MapPin
                    className="w-10 h-10 text-blue-600"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#004E64] mb-2">
                  2. Encontre Ajuda
                </h3>
                <p className="text-gray-600">
                  Nossa plataforma usa sua localização para encontrar e notificar
                  a clínica 24h ou veterinário autônomo mais próximo.
                </p>
              </motion.div>
              {/* Step 3 */}
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-center justify-center w-20 h-20 bg-teal-100 rounded-full border-4 border-white shadow-md mb-4">
                  <HeartPulse
                    className="w-10 h-10 text-[#208B7C]"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#004E64] mb-2">
                  3. Seja Atendido
                </h3>
                <p className="text-gray-600">
                  A clínica recebe seu relatório e se prepara para sua chegada,
                  economizando tempo vital no atendimento.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* === SEÇÃO 3: FUNCIONALIDADES (NOVO) === */}
        <section className="py-16 sm:py-24 bg-gray-50">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.h2
              className="text-3xl sm:text-4xl font-extrabold text-center text-[#004E64] mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5 }}
            >
              Uma plataforma completa
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <motion.div
                className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <PawPrint
                  className="w-10 h-10 text-[#25A18E] mb-3"
                  aria-hidden="true"
                />
                <h3 className="text-lg font-bold text-[#004E64] mb-1">
                  Gestão de Pets
                </h3>
                <p className="text-gray-600 text-sm">
                  Mantenha o histórico e os dados dos seus animais em um só
                  lugar.
                </p>
              </motion.div>
              {/* Feature 2 */}
              <motion.div
                className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Bell
                  className="w-10 h-10 text-[#25A18E] mb-3"
                  aria-hidden="true"
                />
                <h3 className="text-lg font-bold text-[#004E64] mb-1">
                  Alertas Instantâneos
                </h3>
                <p className="text-gray-600 text-sm">
                  Notifique clínicas e veterinários sobre sua emergência em tempo
                  real.
                </p>
              </motion.div>
              {/* Feature 3 */}
              <motion.div
                className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Building
                  className="w-10 h-10 text-[#25A18E] mb-3"
                  aria-hidden="true"
                />
                <h3 className="text-lg font-bold text-[#004E64] mb-1">
                  Catálogo de Clínicas
                </h3>
                <p className="text-gray-600 text-sm">
                  Encontre clínicas e veterinários autônomos perto de você no
                  mapa.
                </p>
              </motion.div>
              {/* Feature 4 */}
              <motion.div
                className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Shield
                  className="w-10 h-10 text-[#25A18E] mb-3"
                  aria-hidden="true"
                />
                <h3 className="text-lg font-bold text-[#004E64] mb-1">
                  Seguro e Privado
                </h3>
                <p className="text-gray-600 text-sm">
                  Seus dados só são compartilhados com a clínica que aceitar o
                  caso.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      {/* Fim do <main> */}

      {/* Lógica de exibição dos botões de emergência (correta) */}
      {(!user || user.tipo === "tutor") && (
        <>
          {/* Botão de EMERGÊNCIA flutuante — versão desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, type: "spring" }}
            className="hidden sm:flex fixed z-50 bottom-8 right-8"
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
                <AlertTriangle
                  className="w-7 h-7"
                  aria-hidden="true"
                />
                EMERGÊNCIA
              </motion.button>
            </Link>
          </motion.div>

          {/* Botão estilo “fitinha” — versão mobile */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="sm:hidden fixed top-1/3 right-0 z-50 rotate-[-90deg] origin-bottom-right"
          >
            <Link to="/reportInput" aria-label="Relatar uma nova emergência">
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
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                <span>EMERGÊNCIA</span>
              </motion.div>
            </Link>
          </motion.div>
        </>
      )}

      {/* Botões "Clínicas Próximas" (Visível para todos) */}

      {/* FAB para abrir o mapa de clínicas — versão mobile */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3 }}
        className="sm:hidden fixed top-1/2 right-0 z-60 rotate-[-90deg] origin-bottom-right"
      >
        <Link to="/clinicPage" aria-label="Ver clínicas próximas no mapa">
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
            <MapPin className="w-5 h-5" aria-hidden="true" />
            <span>Clínicas Próximas</span>
          </motion.div>
        </Link>
      </motion.div>

      {/* Botão Clínicas Desktop */}
      <motion.div className="hidden sm:flex fixed z-60 bottom-32 right-8">
        <Link to="/clinicPage" aria-label="Ver clínicas próximas no mapa">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-4 rounded-full text-white font-bold text-lg
                bg-gradient-to-r from-blue-600 to-teal-500 shadow-lg hover:shadow-xl
                transition-all duration-300"
          >
            <MapPin className="w-6 h-6" aria-hidden="true" />
            Clínicas Próximas
          </motion.button>
        </Link>
      </motion.div>

      {/* Card de instalação PWA */}
      <InstallPwaCard />

      {/* ✅ --- POP-UP DE EMERGÊNCIA ATIVA --- */}
      <AnimatePresence>
        {!isCheckingEmergency && activeEmergency && (
          <motion.div
            role="dialog" // Informa que é uma caixa de diálogo
            aria-modal="true" // Informa que o conteúdo atrás está "preso"
            aria-labelledby="popup-title" // Associa o título (ver h3)
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] w-full max-w-sm sm:max-w-md p-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="bg-white rounded-xl shadow-2xl border-2 border-red-500 p-4 sm:p-5 flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Siren
                  className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 animate-pulse"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id="popup-title"
                  className="font-bold text-base sm:text-lg text-gray-800 truncate"
                >
                  Emergência Ativa!
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  Atendimento para {activeEmergency.pet?.nome || "o seu pet"}{" "}
                  está em progresso.
                </p>
              </div>
              <button
                onClick={() => navigate(`/emergencia/${activeEmergency.id}`)}
                className="flex-shrink-0 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                title="Acompanhar" // Title é bom para rato
                aria-label="Acompanhar emergência ativa" // aria-label é lido
              >
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => setActiveEmergency(null)} // Fecha o pop-up
                className="absolute -top-2 -right-2 w-7 h-7 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center border-2 border-white hover:bg-gray-300"
                title="Fechar"
                aria-label="Fechar pop-up de emergência ativa"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- Fim do Pop-up --- */}

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