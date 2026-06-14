import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Siren, ArrowRight, X, Activity, Radio } from "lucide-react";
import { getUser } from "../utils/auth";
import { Usuario, Emergencia } from "../services/types";
import EmergenciaService from "../services/EmergenciaService";

export default function GlobalEmergencyPopup() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState<Pick<Usuario, "id" | "name" | "email" | "tipo"> | null>(getUser());
  const [activeEmergency, setActiveEmergency] = useState<Emergencia | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // Monitora mudanças no login (localStorage e eventos)
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getUser());
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleStorageChange);
    };
  }, []);

  // Lógica principal de verificação (Polling e lógica robusta)
  useEffect(() => {
    // Reinicia o estado de fechado se o utilizador mudar
    setIsDismissed(false); 

    const checkEmergencies = async () => {
      setIsChecking(true);
      try {
        // Cenário 1: Tutor Logado
        if (user && user.tipo === "tutor") {
          try {
            const minhasEmergencias = await EmergenciaService.getMinhasEmergencias();
            // Status que consideramos "Ativos"
            const activeStatus: Emergencia["status"][] = ["aberta", "assigned", "accepted", "em_atendimento", "pendente"];
            const firstActive = minhasEmergencias.find((em) => activeStatus.includes(em.status));

            if (firstActive) {
              // Tenta carregar o nome do pet se não vier populado
              if (firstActive.pet_id && !firstActive.pet) {
                try {
                  const token = localStorage.getItem('token');
                  const headers: any = { 'Accept': 'application/json' };
                  if (token) headers['Authorization'] = `Bearer ${token}`;
                  const petRes = await fetch(`${import.meta.env.VITE_API_URL}/api/pets/${firstActive.pet_id}`, { headers });
                  if (petRes.ok) firstActive.pet = await petRes.json();
                } catch (e) { console.warn(e); }
              }
              setActiveEmergency(firstActive);
            } else {
              setActiveEmergency(null);
            }
          } catch (err) {
            // Proteção contra erro 500 se a sessão estiver inválida no backend
            console.warn("Falha ao buscar emergências do usuário logado (possível sessão inválida).");
            setActiveEmergency(null);
          }
        } 
        // Cenário 2: Anónimo (LocalStorage)
        else if (!user) {
          const anonEmergencyId = localStorage.getItem("anonymousEmergencyId");
          
          if (anonEmergencyId) {
            const publicUuid = localStorage.getItem(`emerg_public_uuid_${anonEmergencyId}`);
            
            // ✅ CORREÇÃO: Recuperamos o token anônimo salvo
            const anonToken = localStorage.getItem(`emerg_tutor_token_${anonEmergencyId}`) || localStorage.getItem('anonymousTutorToken');

            if (!publicUuid) {
              localStorage.removeItem("anonymousEmergencyId");
              setActiveEmergency(null);
              return;
            }

            // ✅ CORREÇÃO: Passamos o token para o serviço para autenticar a requisição
            const { emergencia: emgData } = await EmergenciaService.getPublicByUuid(publicUuid, anonToken);
            
            const activeStatus: Emergencia["status"][] = ["aberta", "assigned", "accepted", "em_atendimento", "pendente"];

            if (activeStatus.includes(emgData.status)) {
              const petName = localStorage.getItem("anonymousEmergencyPetName");
              emgData.pet = { nome: petName || "seu pet" } as any;
              setActiveEmergency(emgData);
            } else {
              // Limpeza se já não estiver ativa
              localStorage.removeItem("anonymousEmergencyId");
              setActiveEmergency(null);
            }
          } else {
            setActiveEmergency(null);
          }
        } else {
            setActiveEmergency(null);
        }
      } catch (error) {
        // console.error("Erro global ao verificar emergências:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkEmergencies();
    // Polling a cada 30 segundos para manter o status atualizado
    const interval = setInterval(checkEmergencies, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Condições para NÃO mostrar o popup
  if (!activeEmergency || isChecking || isDismissed) return null;
  // Não mostrar se já estiver na página de detalhes dessa emergência
  if (location.pathname.includes(`/emergencia/${activeEmergency.id}`)) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="false"
        // Posicionamento: 
        // Mobile: Fixo em baixo (bottom-4), margens laterais (px-4), z-index alto.
        // Desktop: Fixo à direita (md:right-6), bottom-6.
        className="fixed bottom-4 left-0 right-0 md:left-auto md:right-6 md:bottom-6 z-[100] flex justify-center md:justify-end pointer-events-none px-4 md:px-0"
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* O Card em si (pointer-events-auto para permitir cliques) */}
        <div className="pointer-events-auto w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-red-900/20 border border-red-100 dark:border-gray-700 overflow-hidden flex flex-col ring-1 ring-black/5">
           
           {/* === Header de Status (Vermelho Vibrante) === */}
           <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-3 flex justify-between items-center relative overflow-hidden">
              {/* Efeito de brilho de fundo */}
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]"></div>

              <div className="flex items-center gap-3 z-10">
                 {/* Indicador "Ao Vivo" */}
                 <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                 </span>
                 <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1 text-red-50">
                    Emergência em Curso
                 </span>
              </div>
              
              <button 
                onClick={() => setIsDismissed(true)} 
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition z-10"
                title="Minimizar alerta"
              >
                 <X size={18} />
              </button>
           </div>

           {/* === Corpo do Card === */}
           <div className="p-5 flex items-center gap-5 bg-white dark:bg-gray-800 relative">
              {/* Ícone de Sirene Pulsante */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping opacity-50"></div>
                <div className="flex items-center justify-center w-14 h-14 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full border-2 border-red-100 dark:border-red-800 relative z-10 shadow-inner">
                   <Siren className="w-7 h-7 animate-[pulse_2s_infinite]" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                 <h4 className="text-gray-900 dark:text-white font-bold text-lg leading-tight truncate mb-1">
                    {activeEmergency.pet?.nome || activeEmergency.pet_nome || "Seu Pet"}
                 </h4>
                 <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                    <Radio size={14} className="text-blue-500 animate-pulse" />
                    <span className="truncate font-medium">Acompanhamento ativo</span>
                 </div>
                 <p className="text-xs text-gray-400 mt-1 truncate">
                    ID: #{activeEmergency.id} • Clique para detalhes
                 </p>
              </div>
           </div>

           {/* === Rodapé com Ação === */}
           <div className="bg-gray-50 dark:bg-gray-900/50 px-5 py-3 flex justify-end items-center border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => navigate(`/emergencia/${activeEmergency.id}`)}
                className="group w-full sm:w-auto bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-red-600 dark:hover:bg-red-500 text-white text-sm font-bold py-2.5 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              >
                <span>Ver Detalhes</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}