import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Loader2, AlertTriangle, MapPin, Phone, RefreshCw, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Emergencia, Clinica } from "../services/types";
import EmergenciaService from "../services/EmergenciaService";
// ✅ 1. ClinicaService AGORA É NECESSÁRIO E IMPORTADO
import ClinicaService from "../services/ClinicaService"; 
import { useGeolocation } from "../hooks/useGeolocation";
import ClinicMap from "../components/ClinicMap";
import { getToken, getUser } from "../utils/auth";
import { echo } from "../services/echo";

type StatusInfo = {
  texto: string;
  cor: string;
  icone: React.ReactNode;
};

// [CHAVE PARA O FLUXO ANÓNIMO]
const getAnonymousPublicUuid = (id: string | undefined) => id ? localStorage.getItem(`emerg_public_uuid_${id}`) : null;
const getAnonymousTutorToken = (id: string | undefined) => id ? localStorage.getItem(`emerg_tutor_token_${id}`) : null;


export default function AcompanhamentoEmergencia() {
  const { id } = useParams<{ id: string }>(); // Este é o ID numérico (ex: 123)
  const navigate = useNavigate();
  const { location: userLocation, locationError } = useGeolocation();
  
  const [emergencia, setEmergencia] = useState<Emergencia | null>(null);
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [allClinics, setAllClinics] = useState<Clinica[]>([]); // ✅ 2. State para todas as clínicas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  type Toast = { id: string; message: string; createdAt: number };
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Verifica se o utilizador está logado
  const token = getToken();
  const user = getUser();
  
  // Verifica se temos um UUID público para este ID (fluxo anónimo)
  const [publicUuid, setPublicUuid] = useState(() => getAnonymousPublicUuid(id));
  

  const getStatusInfo = (status: string): StatusInfo => {
    // ... (função getStatusInfo não modificada)
    switch (status) {
      case "aberta":
      case "pendente":
      case "assigned":
        return {
          texto: "Clínica Notificada. Aguardando aceite...",
          cor: "bg-yellow-100 text-yellow-800",
          icone: <Clock className="w-6 h-6 text-yellow-600" />,
        };
      case "em_atendimento":
      case "accepted":
        return {
          texto: "Emergência Aceita! A clínica está aguardando sua chegada.",
          cor: "bg-green-100 text-green-800",
          icone: <CheckCircle className="w-6 h-6 text-green-600" />,
        };
      case "concluida":
        return {
          texto: "Atendimento Concluído.",
          cor: "bg-blue-100 text-blue-800",
          icone: <CheckCircle className="w-6 h-6 text-blue-600" />,
        };
      case "cancelada":
      case "rejected":
        return {
          texto: "Emergência Cancelada ou Rejeitada.",
          cor: "bg-red-100 text-red-800",
          icone: <AlertTriangle className="w-6 h-6 text-red-600" />,
        };
      default:
        return {
          texto: "Status desconhecido.",
          cor: "bg-gray-100 text-gray-800",
          icone: <Clock className="w-6 h-6 text-gray-600" />,
        };
    }
  };

  // [FUNÇÃO ATUALIZADA]
  // Agora busca a emergência, a clínica E todas as clínicas
  const fetchEmergencia = async (showLoading = true) => {
    if (!id) {
      setError("ID da emergência não encontrado.");
      return;
    }
    if (showLoading) setLoading(true);
    
    try {
      // ✅ 3. LÓGICA DE BUSCA DE CLÍNICAS (para o mapa)
      // É executada para ambos os fluxos (logado e anónimo)
      try {
        const clinicas = await ClinicaService.getPublicClinics();
        setAllClinics(clinicas);
      } catch (clinicaError) {
        console.warn("Falha ao buscar lista de clínicas públicas:", clinicaError);
        // Continua mesmo assim, mas o mapa pode ficar incompleto
      }

      if (token) {
        // --- FLUXO LOGADO ---
        const emgData = await EmergenciaService.getById(id);
        setEmergencia(emgData);
        
        // A rota getById (protegida) já deve carregar a clínica
        if (emgData.clinica) {
          setClinica(emgData.clinica);
        } else if (emgData.clinica_id) {
          // Fallback: se a clínica não veio carregada, busca na lista (se já tivermos)
          const found = allClinics.find(c => c.id === emgData.clinica_id);
          if (found) {
            setClinica(found);
          } else {
            // Se não encontrou, pode ser necessário buscar 
            // (mas a getPublicClinics já devia ter trazido)
            setError("Não foi possível carregar dados da clínica associada.");
          }
        } else {
          setError("Emergência não associada a nenhuma clínica.");
        }

      } else if (publicUuid) {
        // --- FLUXO ANÓNIMO ---
        const data = await EmergenciaService.getPublicByUuid(publicUuid);
        setEmergencia(data.emergencia);
        setClinica(data.clinica); // A rota pública já traz a clínica
      } else {
        // --- ANÓNIMO SEM UUID ---
        setError("Não foi possível encontrar o identificador desta emergência. Por favor, tente criar a emergência novamente.");
  }

    } catch (err: any) {
      console.error("Erro ao buscar emergência:", err);
      // ... (lógica de erro não modificada)
      if (err.response?.status === 404 && !token) {
         setError("Este link de acompanhamento é inválido ou expirou.");
         setPublicUuid(null); // Limpa o UUID inválido
         localStorage.removeItem(`emerg_public_uuid_${id}`);
      } else {
         setError(err.response?.data?.message || "Não foi possível carregar os dados da emergência.");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencia(true);
  }, [id, token]); // Remove publicUuid daqui para evitar re-fetch desnecessário


  const showToast = (message: string) => {
    // ... (função showToast não modificada)
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const t = { id, message, createdAt: Date.now() };
    setToasts((prev) => [t, ...prev]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 6000);
  };

  // [USEEFFECT ATUALIZADO]
  // (Lógica de subscrição do Echo não modificada)
  useEffect(() => {
    if (!id) return; // Sem ID, não faz nada
    
    // Atualiza o publicUuid do state caso o localStorage tenha mudado
    const currentUuid = getAnonymousPublicUuid(id);
    if (currentUuid && currentUuid !== publicUuid) {
      setPublicUuid(currentUuid);
    }
    
    const subs: string[] = [];

    const handleUpdate = (event: any, isNew = false) => {
      console.log("Evento Recebido:", event, { isNew });
      const incoming = event?.emergencia || event;
      if (incoming && id && incoming.id?.toString() === id.toString()) {
        setEmergencia((prev) => ({ ...prev, ...incoming }));
      }
      if (isNew) {
        showToast("Nova emergência atribuída à sua clínica.");
      } else {
        const status = incoming?.status ? `Status: ${incoming.status}` : "Houve uma atualização na emergência.";
        showToast(`Atualização: ${status}`);
      }
    };

    try {
      if (token && user) {
        // --- FLUXO LOGADO ---
        // (Mantém a sua lógica original para utilizadores logados)
        if (user.tutor_id) {
          const channelName = `emergencias.tutor.${user.tutor_id}`;
          subs.push(channelName);
          echo.private(channelName).listen('.EmergenciaAtualizada', (e: any) => handleUpdate(e, false));
        }
        if (user.clinica_id) {
          const channelName = `emergencias.clinica.${user.clinica_id}`;
          subs.push(channelName);
          echo.private(channelName).listen('.NovaEmergencia', (e: any) => handleUpdate(e, true));
          echo.private(channelName).listen('.EmergenciaAtualizada', (e: any) => handleUpdate(e, false));
        }
      } else if (currentUuid) { // Usa a versão mais atualizada do UUID
        // --- FLUXO ANÓNIMO ---
        // Subscreve o canal PÚBLICO usando o UUID
        const channelName = `emergencia.publica.${currentUuid}`;
        subs.push(channelName);
        echo.channel(channelName) // Usa .channel() (público) em vez de .private()
           .listen('.EmergenciaAtualizada', (e: any) => handleUpdate(e, false));
        console.log(`Inscrito no canal público: ${channelName}`);
      }
      
    } catch (e) {
      console.error("Falha ao (re)inscrever em canais do Echo:", e);
    }

    // Limpa a subscrição ao sair
    return () => {
      try {
        subs.forEach((ch) => echo.leave(ch));
      } catch (e) {
        console.warn("Erro ao limpar inscrições do Echo:", e);
      }
    };

  }, [token, user, id, publicUuid]); // Agora depende do publicUuid


  const abrirRota = () => {
    // ... (função abrirRota não modificada)
    if (!clinica?.localizacao) {
       showToast("Clínica sem localização cadastrada.");
       return;
    }
    if (!userLocation) {
        showToast("Localização do usuário não disponível para traçar rota.");
        return;
    }
    
    // O seu controller (EmergenciaController) guarda a localização 
    // como "lat,lon" ou "L:lat,G:lon". O ClinicMap espera "lat,lon".
    // Vamos normalizar.
    const cleanLocation = clinica.localizacao.replace("L:", "").replace("G:", "");
    const [lat, lng] = cleanLocation.split(",");
    
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${lat},${lng}`;
    const url = `https://maps.google.com/?daddr=${destination}&saddr=${origin}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const ligarParaClinica = () => {
    // ... (função ligarParaClinica não modificada)
    if (!clinica?.telefone_principal) {
        showToast("Clínica sem telefone cadastrado.");
        return;
    }
    window.open(`tel:${clinica.telefone_principal}`);
  };

  if (loading) {
    // ... (bloco loading não modificado)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#25A18E]" />
        <p className="text-lg text-gray-600 mt-4">Carregando acompanhamento...</p>
      </div>
    );
  }

  if (error || !emergencia || !clinica) {
    // ... (bloco de erro não modificado)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Navbar />
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ocorreu um Erro</h1>
          <p className="text-gray-600 mb-6">{error || "Não foi possível carregar os dados."}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-[#004E64] text-white rounded-lg font-semibold hover:bg-[#003b50] transition"
          >
            Voltar para a Home
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(emergencia.status);
  // Normaliza a localização da clínica (pode ser "L:lat,G:lon" ou "lat,lon")
  const cleanLocation = clinica.localizacao?.replace("L:", "").replace("G:", "");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      {/* Toasts de notificação (fixo, canto superior direito) */}
      <div className="fixed top-20 sm:top-4 right-4 z-50 flex flex-col items-end gap-3 w-full max-w-xs">
      {/* ... (bloco de toasts não modificado) ... */}
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="w-full bg-white shadow-lg rounded-lg px-4 py-2 border-l-4 border-[#25A18E]"
          >
            <p className="text-sm text-gray-800 font-medium">{t.message}</p>
          </motion.div>
        ))}
      </div>
      
      <main className="flex-1 container mx-auto p-4 mt-20 sm:mt-24 max-w-4xl">
        
        <motion.div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-6">
          {/* ... (cabeçalho não modificado) ... */}
            <h1 className="text-3xl font-extrabold text-[#004E64] mb-2">
              Acompanhamento da Emergência
            </h1>
            <p className="text-lg text-gray-600">
              Clínica notificada: <span className="font-semibold">{clinica.nome_fantasia}</span>
            </p>
          </div>

          <div className={`p-6 border-y ${statusInfo.cor} flex items-center gap-4`}>
          {/* ... (bloco de status não modificado) ... */}
            {statusInfo.icone}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide">Status Atual</h2>
              <p className="text-xl font-bold">{statusInfo.texto}</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            <div className="space-y-4">
            {/* ... (bloco de info da clínica não modificado) ... */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Clínica de Destino</h3>
                <p className="text-gray-600">{clinica.endereco}</p>
                <p className="text-gray-600 font-medium mt-1">Telefone: {clinica.telefone_principal}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
            {/* ... (botões não modificados) ... */}
                <button
                  onClick={abrirRota}
                  disabled={!userLocation}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  <MapPin size={18} /> Abrir Rota
                </button>
                <button
                  onClick={ligarParaClinica}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  <Phone size={18} /> Ligar para Clínica
                </button>
              </div>
              {locationError && (
                <p className="text-xs text-red-600 text-center">{locationError}</p>
              )}
            </div>
            
            <div className="h-64 md:h-80 w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              {/* ✅ 4. CHAMADA AO CLINICMAP CORRIGIDA */}
              {/* Verifica se a localização da clínica e a lista de clínicas estão prontas */}
              {(clinica && cleanLocation && allClinics.length > 0) ? (
                <ClinicMap
                  userLocation={
                    userLocation
                      ? { lat: userLocation.latitude, lng: userLocation.longitude }
                      : null
                  }
                  clinicLocation={cleanLocation} // Envia a string "lat,lon"
                  allClinics={allClinics} // Envia a lista de todas as clínicas
                  selectedClinicId={clinica.id} // Envia o ID da clínica selecionada
                />
              ) : (
                // Estado de fallback enquanto as props não estão prontas
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
     <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-center">
          {/* ... (rodapé não modificado) ... */}
           {(!token && !publicUuid) && ( // Mostra se for anónimo E não tiver UUID
              <button
                onClick={() => fetchEmergencia(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100"
              >
                <RefreshCw size={14} /> Atualizar Status
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}