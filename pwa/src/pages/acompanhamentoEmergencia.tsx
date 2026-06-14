import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  Loader2,
  AlertTriangle,
  MapPin,
  Phone,
  RefreshCw,
  Clock,
  CheckCircle,
  Navigation,
  Info,
  ShieldCheck,
  Stethoscope,
  Home,
  Activity,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Emergencia, Clinica } from "../services/types";
import EmergenciaService from "../services/EmergenciaService";
import ClinicaService from "../services/ClinicaService";
import { useGeolocation } from "../hooks/useGeolocation";
// ✅ Importa o mapa inteligente criado anteriormente
import EmergencyTrackingMap from "../components/emergency/EmergencyTrackingMap";
import { getToken, getUser } from "../utils/auth";
import { echo } from "../services/echo";

// --- TIPOS ---
type StatusStep = {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  completed: boolean;
  current: boolean;
};

// --- HELPERS ---
const parseLocation = (locStr: string | undefined | null) => {
  if (!locStr) return null;
  try {
    const clean = locStr.toString().replace(/L:/gi, "").replace(/G:/gi, "").replace(/\s/g, "");
    const [lat, lng] = clean.split(",");
    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);
    if (isFinite(nLat) && isFinite(nLng) && nLat !== 0 && nLng !== 0) {
      return { lat: nLat, lng: nLng };
    }
  } catch (e) {
    console.warn("[GPS] Erro parse:", locStr, e);
  }
  return null;
};

const getAnonymousPublicUuid = (id: string | undefined) =>
  id ? localStorage.getItem(`emerg_public_uuid_${id}`) : null;

export default function AcompanhamentoEmergencia() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // GPS do dispositivo do Tutor
  const { location: userLocation, locationError } = useGeolocation();
  
  const [emergencia, setEmergencia] = useState<Emergencia | null>(null);
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Toasts locais para feedback rápido
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' | 'info' } | null>(null);

  const token = getToken();
  const user = getUser();
  const [publicUuid, setPublicUuid] = useState(() => getAnonymousPublicUuid(id));

  // --- LÓGICA DE STEPS (BARRA DE PROGRESSO) ---
  const getSteps = (status: string): StatusStep[] => {
    const s = status?.toLowerCase() || "";
    const isCancelled = ["cancelada", "rejected"].includes(s);
    
    const steps = [
      { id: "aberta", label: "Solicitado", icon: <AlertTriangle size={16}/>, activeColor: "bg-red-500" },
      { id: "pendente", label: "Aguardando", icon: <Clock size={16}/>, activeColor: "bg-yellow-500" },
      { id: "em_atendimento", label: "Em Atendimento", icon: <Activity size={16}/>, activeColor: "bg-blue-500" },
      { id: "concluida", label: "Finalizado", icon: <CheckCircle size={16}/>, activeColor: "bg-green-500" }
    ];

    // Mapeia status atual para índice
    let currentIndex = 0;
    if (["pendente", "assigned"].includes(s)) currentIndex = 1;
    if (["em_atendimento", "accepted"].includes(s)) currentIndex = 2;
    if (["concluida"].includes(s)) currentIndex = 3;
    
    return steps.map((step, idx) => ({
      ...step,
      completed: idx < currentIndex,
      current: idx === currentIndex,
      activeColor: isCancelled ? "bg-gray-400" : step.activeColor
    }));
  };

  // --- FETCH DE DADOS ---
  const fetchEmergencia = async (showLoading = true) => {
    if (!id) return setError("ID inválido.");
    if (showLoading) setLoading(true);
    
    try {
      let emgData: Emergencia | null = null;
      let clinicaData: Clinica | null = null;

      if (token) {
        // Logado
        emgData = await EmergenciaService.getById(id);
      } else if (publicUuid) {
        // Anônimo
        const res = await EmergenciaService.getPublicByUuid(publicUuid);
        emgData = res.emergencia;
        clinicaData = res.clinica;
      } else {
        throw new Error("Credenciais não encontradas.");
      }

      setEmergencia(emgData);

      // Resolve a clínica
      if (clinicaData) {
        setClinica(clinicaData);
      } else if (emgData?.clinica) {
        setClinica(emgData.clinica);
      } else if (emgData?.clinica_id) {
        // Tenta buscar se tiver ID mas não o objeto
        try {
            const c = await ClinicaService.getById(String(emgData.clinica_id));
            setClinica(c);
        } catch (e) { console.warn("Clinica fetch fail", e); }
      }

    } catch (err: any) {
      console.error(err);
      setError("Não foi possível carregar os dados da emergência. Tente recarregar.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { fetchEmergencia(true); }, [id, token]);

  // --- WEBSOCKETS ---
  useEffect(() => {
    if (!id) return;
    
    // Atualiza UUID se mudar (ex: novo storage)
    const currentUuid = getAnonymousPublicUuid(id);
    if (currentUuid && currentUuid !== publicUuid) setPublicUuid(currentUuid);

    const handleUpdate = (event: any) => {
      const incoming = event?.emergencia || event;
      if (incoming && id && incoming.id?.toString() === id.toString()) {
        setEmergencia(prev => ({ ...prev!, ...incoming }));
        
        // Feedback visual de atualização
        if (incoming.status === 'em_atendimento') {
            setToast({ msg: "A clínica aceitou o atendimento!", type: "success" });
            fetchEmergencia(false); // Recarrega para pegar dados da clínica
        } else if (incoming.status === 'concluida') {
            setToast({ msg: "Atendimento finalizado.", type: "success" });
        }
      }
    };

    const subs: string[] = [];
    try {
      // Se for user logado, ouve canais privados
      if (token && user?.tutor_id) {
          const ch = `emergencias.tutor.${user.tutor_id}`;
          subs.push(ch);
          echo.private(ch).listen('.EmergenciaAtualizada', handleUpdate);
      } 
      // Se for anônimo, ouve canal público
      else if (currentUuid) {
        const ch = `emergencia.publica.${currentUuid}`;
        subs.push(ch);
        echo.channel(ch).listen('.EmergenciaAtualizada', handleUpdate);
      }
    } catch (e) { console.error("Echo error:", e); }

    return () => { subs.forEach(s => echo.leave(s)); };
  }, [id, token, user, publicUuid]);


  // --- AÇÕES ---
  const abrirRota = () => {
    if (!clinica?.localizacao || !userLocation) {
        setToast({ msg: "Aguardando GPS...", type: "info" });
        return;
    }
    const loc = parseLocation(clinica.localizacao);
    if (loc) {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${loc.lat},${loc.lng}&travelmode=driving`;
        window.open(url, "_blank");
    }
  };

  // --- DADOS PARA RENDERIZAÇÃO ---
  const steps = emergencia ? getSteps(emergencia.status) : [];
  const currentStep = steps.find(s => s.current) || steps[steps.length - 1];
  
  // Coordenadas
  const clinicCoords = parseLocation(clinica?.localizacao);
  // Se tivermos userLocation (GPS), usamos. Se não, null.
  const tutorCoords = userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null;

  const isClinicVisit = emergencia?.visita_tipo === "clinica";

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#25A18E] mb-4" />
        <p className="text-gray-600 animate-pulse">Sincronizando com a clínica...</p>
      </div>
    );
  }

  if (error || !emergencia) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-red-100">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Atenção</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button onClick={() => navigate("/")} className="w-full py-3 bg-[#004E64] text-white rounded-xl font-bold hover:bg-[#003b50] transition">
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans pb-20 md:pb-0">
      <Navbar />

      {/* NOTIFICAÇÃO FLUTUANTE */}
      <AnimatePresence>
        {toast && (
            <motion.div 
                initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl text-white font-medium flex items-center gap-2
                ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}
            >
                {toast.type === 'success' ? <CheckCircle size={18} /> : <Info size={18} />}
                {toast.msg}
                <button onClick={() => setToast(null)} className="ml-2 opacity-80 hover:opacity-100"><span className="sr-only">Fechar</span>✕</button>
            </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 container mx-auto px-4 py-6 mt-16 max-w-7xl">
        
        {/* --- CABEÇALHO --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    <ShieldCheck size={16} className="text-[#25A18E]" />
                    Protocolo #{emergencia.id}
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#004E64]">
                    Acompanhamento <span className="text-[#25A18E]">Ao Vivo</span>
                </h1>
            </div>
            
            {/* Botão de Refresh Manual (útil se WebSocket falhar) */}
            <button 
                onClick={() => fetchEmergencia(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm font-semibold hover:bg-gray-50 shadow-sm transition"
            >
                <RefreshCw size={16} /> Atualizar Status
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* --- COLUNA 1: STATUS E PROGRESSO --- */}
            <div className="space-y-6">
                
                {/* CARD DE STATUS PRINCIPAL */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 relative overflow-hidden"
                >
                    {/* Fundo decorativo */}
                    <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 ${currentStep.activeColor}`}></div>
                    
                    <div className="relative z-10">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${currentStep.activeColor.replace('bg-', 'bg-opacity-10 text-')}`}>
                            Status Atual
                        </span>
                        <div className="flex items-center gap-4 mb-2">
                            <div className={`p-3 rounded-2xl text-white shadow-lg ${currentStep.activeColor}`}>
                                {currentStep.icon}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 leading-tight">{currentStep.label}</h2>
                                <p className="text-sm text-gray-500">Última atualização: {new Date(emergencia.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                    </div>

                    {/* BARRA DE PROGRESSO (STEPPER) */}
                    <div className="mt-8 relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 -z-0"></div>
                        <div className="space-y-6 relative z-10">
                            {steps.map((step, idx) => (
                                <div key={step.id} className={`flex items-center gap-4 ${step.completed || step.current ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all
                                        ${step.completed || step.current ? `bg-white border-${step.activeColor.replace('bg-', '')} text-gray-800` : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                        {step.completed ? <CheckCircle size={14} className={`text-${step.activeColor.replace('bg-', '')}`} /> : idx + 1}
                                    </div>
                                    <span className={`text-sm font-medium ${step.current ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{step.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* CARD DA CLÍNICA */}
                {clinica && (
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Stethoscope size={20} className="text-[#25A18E]" />
                                Clínica
                            </h3>
                            {isClinicVisit ? 
                                <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">Destino</span> :
                                <span className="text-xs font-bold px-2 py-1 bg-orange-50 text-orange-700 rounded-lg">Origem do Vet</span>
                            }
                        </div>
                        
                        <div className="mb-6">
                            <h4 className="text-xl font-bold text-[#004E64] mb-1">{clinica.nome_fantasia}</h4>
                            <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                                <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                                <p>{clinica.endereco}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={16} className="text-gray-400 shrink-0" />
                                <p>{clinica.telefone_principal}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={abrirRota}
                                disabled={!clinica.localizacao}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-[#004E64] text-white rounded-xl font-semibold text-sm hover:bg-[#003b50] transition shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Navigation size={16} />
                                {isClinicVisit ? "Ir Agora" : "Ver Rota"}
                            </button>
                            <a 
                                href={`tel:${clinica.telefone_principal}`}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition border border-gray-200"
                            >
                                <Phone size={16} /> Ligar
                            </a>
                        </div>
                        
                        {locationError && (
                             <div className="mt-4 p-3 bg-orange-50 border border-orange-100 text-orange-800 text-xs rounded-xl flex items-start gap-2">
                                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                <p>Ative o GPS do seu dispositivo para ver a rota em tempo real no mapa.</p>
                             </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* --- COLUNA 2 E 3: MAPA GRANDE --- */}
            <div className="lg:col-span-2 h-[500px] lg:h-auto min-h-[500px] flex flex-col gap-4">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="flex-1 bg-gray-200 rounded-3xl shadow-2xl overflow-hidden border-4 border-white relative ring-1 ring-gray-200"
                >
                    {/* Badge flutuante de status do GPS */}
                    <div className="absolute top-4 right-4 z-[500] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-gray-200 flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${tutorCoords ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                            {tutorCoords ? "Sinal GPS Ativo" : "GPS Indisponível"}
                        </span>
                    </div>

                    {/* COMPONENTE DE MAPA INTELIGENTE */}
                    <EmergencyTrackingMap 
                        emergencia={emergencia}
                        tutorLocation={tutorCoords}
                        clinicLocation={clinicCoords}
                        viewer="tutor" // Garante que o mapa saiba que é o tutor vendo
                    />
                </motion.div>
                
                {/* Informação de Ajuda */}
                <div className="bg-blue-50 text-blue-800 p-4 rounded-2xl text-sm flex items-center gap-3 border border-blue-100">
                    <Info className="shrink-0" />
                    <p>
                        {isClinicVisit 
                            ? "Mantenha esta página aberta para acompanhar o trajeto até a clínica." 
                            : "Mantenha esta página aberta. A equipe veterinária pode usar sua localização para chegar mais rápido."}
                    </p>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
}