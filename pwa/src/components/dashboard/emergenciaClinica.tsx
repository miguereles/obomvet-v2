import { useEffect, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  PawPrint,
  Clock,
  CheckCircle,
  MapPin,
  XCircle,
  Navigation, 
  X,
  User,
  Stethoscope
} from "lucide-react";
import EmergenciaService from "../../services/EmergenciaService";
import { Emergencia, Veterinario } from "../../services/types";
import { echo } from "../../services/echo";
import { getUser } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastProvider";
import ClinicaService from "../../services/ClinicaService";
import HistoricoService from "../../services/HistoricoService";
import EmergencyTrackingMap from "../emergency/EmergencyTrackingMap"; 

// Helper robusto para parsear localização (incluindo accuracy)
const parseLocation = (locStr: string | undefined | null) => {
  if (!locStr) return null;
  try {
    // Remove prefixos L:, G: e espaços
    const clean = locStr.replace(/L:/gi, "").replace(/G:/gi, "").replace(/\s/g, "");
    const parts = clean.split(",");
    
    // Tentativa robusta de extrair lat, lng e accuracy (se existir)
    const nLat = parseFloat(parts[0]);
    const nLng = parseFloat(parts[1]);
    const nAccuracy = parts.length > 2 ? parseFloat(parts[2]) : undefined; // Assume que o 3º é precisão
    
    if (isFinite(nLat) && isFinite(nLng) && nLat !== 0 && nLng !== 0) {
        return { lat: nLat, lng: nLng, accuracy: nAccuracy };
    }
  } catch (e) { 
      console.warn("[GPS] Erro parse:", locStr, e); 
  }
  return null;
};

// Interface para garantir a tipagem correta da localização com precisão
interface GpsLocation {
    lat: number;
    lng: number;
    accuracy?: number;
}

// Mapeamento de status para nomes amigáveis (usado no filtro)
const STATUS_MAP_RAW: Record<string, string> = {
    aberta: "Pendente",
    assigned: "Pendente",
    pendente: "Pendente",
    em_atendimento: "Aceita",
    concluida: "Finalizada",
    cancelada: "Cancelada",
    rejected: "Cancelada", // Rejeitada é tratada como Cancelada para fins de visualização
};

// Define os valores únicos de status para a filtragem
type FilterStatus = 'todos' | 'pendente' | 'aceita' | 'finalizada' | 'cancelada';


export default function EmergenciasClinica() {
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmergenciaId, setSelectedEmergenciaId] = useState<number | null>(null);
  const [selectedEmergencia, setSelectedEmergencia] = useState<Emergencia | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { showToast } = useToast();
  
  // ✅ NOVO ESTADO DE FILTRO: Começa mostrando pendentes
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pendente'); 
  
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGPSModal, setShowGPSModal] = useState(false);
  // Usamos o tipo GpsLocation aqui
  const [gpsTutorLocation, setGpsTutorLocation] = useState<GpsLocation | null>(null);
  const [gpsClinicLocation, setGpsClinicLocation] = useState<GpsLocation | null>(null);

  const [reportText, setReportText] = useState("");
  const [reportVeterinarioId, setReportVeterinarioId] = useState<number | null>(null);
  const [clinicVeterinarios, setClinicVeterinarios] = useState<Veterinario[]>([]);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const statusLabelMap: Record<string, string> = STATUS_MAP_RAW;

  async function fetchEmergencias() {
    setLoading(true);
    setError(null);
    try {
      const data = await EmergenciaService.getEmergenciasDaClinica();
      if (!Array.isArray(data)) throw new Error("Resposta inesperada da API.");
      setEmergencias(data);
    } catch (err: any) {
      console.error("Erro ao carregar emergências:", err);
      setError(err.message || "Erro ao carregar emergências.");
    } finally {
      setLoading(false);
    }
  }

  async function atualizarStatus(id: number, novoStatus: string) {
    try {
      const data = await EmergenciaService.update(id, { status: novoStatus });
      setEmergencias((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: data.status } : e))
      );
      if (selectedEmergencia && selectedEmergencia.id === id) {
        setSelectedEmergencia(prev => ({ ...prev!, status: data.status }));
      }
      showToast('Status atualizado com sucesso!', { type: 'success' });
      // Se aceitou, muda o filtro para 'Aceita' (em_atendimento)
      if (novoStatus === 'em_atendimento') setFilterStatus('aceita');
    } catch (err: any) {
      console.error(err);
      showToast("Erro ao atualizar emergência: " + err.message, { type: 'error' });
    }
  }

  async function openDetails(id: number) {
    setSelectedEmergenciaId(id);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    setSelectedEmergencia(null);
    try {
      const data = await EmergenciaService.getById(String(id));
      setSelectedEmergencia(data);
    } catch (err: any) {
      console.error('Erro ao carregar detalhes:', err);
      showToast('Não foi possível carregar os detalhes.', { type: 'error' });
    } finally {
      setLoadingDetails(false);
    }
  }

  // ✅ FUNÇÃO ROBUSTA PARA ABRIR GPS (Usa parseLocation, que agora retorna accuracy)
  async function openGPS(emergencia: Emergencia) {
    setSelectedEmergencia(emergencia);
    setShowGPSModal(true);
    setGpsTutorLocation(null);
    setGpsClinicLocation(null);

    console.log("[GPS] Iniciando rastreamento para emergência:", emergencia.id);

    // 1. LOCAL DO TUTOR
    const tutorLoc = parseLocation(emergencia.localizacao);
    if (tutorLoc) {
        console.log("[GPS] Tutor encontrado:", tutorLoc);
        setGpsTutorLocation(tutorLoc);
    } else {
        console.warn("[GPS] Localização do tutor ausente/inválida no objeto emergência.");
        showToast("Aguardando sinal GPS do tutor...", { type: 'info' });
    }

    // 2. LOCAL DA CLÍNICA
    let clinicLoc = parseLocation(emergencia.clinica?.localizacao);
    
    if (!clinicLoc) {
        try {
            console.log("[GPS] Buscando perfil da clínica para coordenadas...");
            const user = getUser();
            if (user?.tipo === 'clinica') {
                 const minhaClinica = await ClinicaService.getMinhaClinica();
                 clinicLoc = parseLocation(minhaClinica.localizacao);
            }
        } catch(e) { console.warn("[GPS] Erro ao buscar perfil clínica", e); }
    }

    // 3. FALLBACK: GPS DO DISPOSITIVO (adicionando accuracy)
    if (!clinicLoc) {
        console.log("[GPS] Clínica sem local no DB. Tentando navegador...");
        if ('geolocation' in navigator) {
             navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log("[GPS] Localização atual obtida:", pos.coords);
                    // Adicionando accuracy aqui
                    setGpsClinicLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
                },
                (err) => {
                    console.error("[GPS] Erro ao obter geolocalização:", err.message);
                    if (err.code === 1 && window.location.protocol !== 'https:') {
                        showToast("GPS bloqueado. Use HTTPS ou localhost.", { type: 'error' });
                    } else {
                        showToast("Não foi possível obter sua localização.", { type: 'error' });
                    }
                },
                { enableHighAccuracy: true, timeout: 10000 }
             );
        } else {
             showToast("Navegador sem suporte a GPS.", { type: 'error' });
        }
    } else {
        console.log("[GPS] Clínica encontrada no DB:", clinicLoc);
        setGpsClinicLocation(clinicLoc);
    }
  }

  async function openReportModal(id: number) {
    setSelectedEmergenciaId(id); 
    setSelectedEmergencia(null);
    setReportText("");
    setReportVeterinarioId(null);
    setClinicVeterinarios([]);
    setShowReportModal(true);
    
    try {
      const data = await EmergenciaService.getById(String(id));
      setSelectedEmergencia(data);
      const clinicaId = data.clinica_id;
      if (clinicaId) {
        const vets = await ClinicaService.getVeterinarios(String(clinicaId));
        setClinicVeterinarios(vets || []);
        if (data.veterinario_id) setReportVeterinarioId(data.veterinario_id);
      }
    } catch (err: any) {
      console.error('Erro ao abrir modal de relatório:', err);
      showToast('Erro ao abrir formulário de relatório.', { type: 'error' });
      setShowReportModal(false);
    }
  }

  function closeReportModal() {
    setShowReportModal(false);
    setReportText("");
    setReportVeterinarioId(null);
  }

  async function submitReport() {
    if (!selectedEmergenciaId) return showToast('Nenhuma emergência selecionada.', { type: 'error' });
    if (!reportVeterinarioId) return showToast('Selecione um veterinário responsável.', { type: 'error' });
    if (!reportText || reportText.trim().length < 10) return showToast('Descreva o atendimento (mínimo 10 caracteres).', { type: 'error' });

    setReportSubmitting(true);
    try {
      const payload = {
        veterinario_id: reportVeterinarioId,
        acao_realizada: reportText,
        data_acao: new Date().toISOString(),
      };
      await HistoricoService.createForEmergencia(selectedEmergenciaId, payload as any);
      const updated = await EmergenciaService.update(selectedEmergenciaId, { status: 'concluida', data_conclusao: new Date().toISOString() } as any);

      setEmergencias(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e));
      if (selectedEmergencia && selectedEmergencia.id === updated.id) {
        setSelectedEmergencia(prev => prev ? { ...prev, ...updated } : null);
      }

      showToast('Relatório salvo e emergência finalizada.', { type: 'success' });
      setShowReportModal(false);
    } catch (err: any) {
      console.error('Erro ao enviar relatório:', err);
      showToast('Erro ao salvar relatório: ' + (err.message || ''), { type: 'error' });
    } finally {
      setReportSubmitting(false);
    }
  }

  function closeDetails() {
    setShowDetailsModal(false);
    setSelectedEmergenciaId(null);
    setSelectedEmergencia(null);
    setLoadingDetails(false);
  }
  
  const getUrgencyColor = (nivel: Emergencia["nivel_urgencia"]) => {
    switch (nivel) {
      case "baixa": return "bg-green-100 text-green-700 border-green-300";
      case "media": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "alta": return "bg-orange-100 text-orange-800 border-orange-300";
      case "critica": return "bg-red-100 text-red-700 border-red-300 font-semibold";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const normalizeStatus = (status?: string): string => {
    if (!status) return 'aberta';
    const s = status.trim().toLowerCase();
    switch (s) {
      case "pendente":
      case "assigned":
        return "aberta";
      case "em_andamento":
        return "em_atendimento";
      case "finalizada":
        return "concluida";
      case "rejected":
        return "cancelada";
      default:
        return s;
    }
  };

  const getStatusColor = (status?: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case "aberta": return "bg-gray-100 text-gray-700 border-gray-300";
      case "em_atendimento": return "bg-blue-100 text-blue-700 border-blue-300";
      case "concluida": return "bg-green-100 text-green-700 border-green-300";
      case "cancelada": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusLabel = (status?: string): string => {
    if (!status) return 'Pendente';
    const normalized = normalizeStatus(status);
    return STATUS_MAP_RAW[normalized] || 'Desconhecido';
  };
  
  // ✅ LÓGICA DE FILTRAGEM
  const filteredEmergencias = emergencias
     .map(emg => ({ ...emg, normalizedStatus: getStatusLabel(emg.status).toLowerCase() })) // Adiciona status normalizado
     .filter(emg => {
        if (filterStatus === 'todos') return true;
        
        // Pendente abrange os status de banco 'aberta' e 'assigned/pendente'
        if (filterStatus === 'pendente') {
            return emg.normalizedStatus === 'pendente';
        }
        // Aceita abrange 'em_atendimento'
        if (filterStatus === 'aceita') {
            return emg.normalizedStatus === 'aceita';
        }
        // Finalizada abrange 'concluida'
        if (filterStatus === 'finalizada') {
            return emg.normalizedStatus === 'finalizada';
        }
        // Cancelada abrange 'cancelada' e 'rejected'
        if (filterStatus === 'cancelada') {
            return emg.normalizedStatus === 'cancelada';
        }
        return false; 
    });

  useEffect(() => {
    fetchEmergencias();
    let clinicaId: number | null = null;
    try {
      const user = getUser(); 
      if (user && user.tipo === 'clinica' && user.clinica_id) {
        clinicaId = parseInt(user.clinica_id, 10);
      }
    } catch (e) { console.error(e); }

    if (!clinicaId) return;

    const canaisParaOuvir = [`clinicas.${clinicaId}`, `emergencias.clinica.${clinicaId}`];

    try {
      canaisParaOuvir.forEach((canal) => {
        const sub = echo.private(canal);
        
        sub.listen('.NovaEmergencia', (payload: any) => {
            const novaEmergencia = { ...payload } as Emergencia; 
            
            // 🎯 CORREÇÃO: Lógica de desduplicação
            setEmergencias(prev => {
                // Se a emergência já existe, não a adicione novamente
                if (prev.some(e => e.id === novaEmergencia.id)) {
                    console.log(`[Echo] Emergência ${novaEmergencia.id} já existe. Ignorando duplicação.`);
                    return prev;
                }
                
                // Se for realmente nova, adicione ao topo da lista
                showToast('Nova emergência recebida!', { type: 'info', native: true });
                return [novaEmergencia, ...prev];
            });
            // Fim da correção
        });

        sub.listen('.EmergenciaAtualizada', (payload: any) => {
            const emergenciaAtualizada = payload.emergencia || payload;
            if (!emergenciaAtualizada || !emergenciaAtualizada.id) return;
            
            setEmergencias(prev => prev.map(e => e.id === emergenciaAtualizada.id ? { ...e, ...emergenciaAtualizada } : e));

            if (showGPSModal && selectedEmergencia?.id === emergenciaAtualizada.id && emergenciaAtualizada.localizacao) {
                const loc = parseLocation(emergenciaAtualizada.localizacao);
                if (loc) {
                    setGpsTutorLocation(loc);
                    console.log("[GPS] Atualização em tempo real recebida:", loc);
                }
            }
        });
      });
    } catch (e) { console.error(e); }

    return () => {
      canaisParaOuvir.forEach((canal) => echo.leave(canal));
    };
  }, [showToast, showGPSModal, selectedEmergencia]); 

  function abrirRota(localizacao?: string | null) {
    const loc = parseLocation(localizacao);
    if (!loc) return showToast("Localização inválida.", { type: 'error' });
    const url = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
    window.open(url, "_blank");
  }
  
  // Lista de botões de filtro
  const filterButtons: { label: string; status: FilterStatus; icon: React.FC<any> | null; color: string }[] = [
    { label: "Todas", status: 'todos', icon: null, color: 'text-gray-800' },
    { label: "Pendentes", status: 'pendente', icon: AlertTriangle, color: 'text-orange-500' },
    { label: "Aceitas", status: 'aceita', icon: Navigation, color: 'text-blue-500' }, // Usando Navigation para Aceita/Em Atendimento
    { label: "Finalizadas", status: 'finalizada', icon: CheckCircle, color: 'text-green-600' },
    { label: "Canceladas", status: 'cancelada', icon: XCircle, color: 'text-red-600' },
  ];

  // Função auxiliar para obter a contagem de status
  const getStatusCount = (status: FilterStatus): number => {
      if (status === 'todos') return emergencias.length;
      
      return emergencias.filter(emg => {
          const emgLabel = getStatusLabel(emg.status).toLowerCase();
          
          if (status === 'pendente') return emgLabel === 'pendente';
          if (status === 'aceita') return emgLabel === 'aceita';
          if (status === 'finalizada') return emgLabel === 'finalizada';
          // Trata 'Cancelada' e 'Rejeitada'
          if (status === 'cancelada') return emgLabel === 'cancelada'; 
          return false;
      }).length;
  };


  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="text-[#25A18E]" /> Gerenciamento de Emergências
          </h2>
          <button
            onClick={() => fetchEmergencias()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-[#25A18E] text-white rounded-lg hover:bg-[#208B7C] transition disabled:opacity-60 text-sm font-medium shadow-md"
          >
            <RefreshCw size={16} className={`transition ${loading ? "animate-spin" : ""}`} />
            {loading ? "Atualizando..." : "Recarregar Lista"}
          </button>
        </div>

        {/* ✅ FILTRO DE STATUS (ABAS) */}
        <div className="flex flex-wrap gap-2 p-3 bg-white border border-gray-200 rounded-xl shadow-inner">
            {filterButtons.map(({ label, status, icon: Icon, color }) => (
                <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`
                        flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition duration-200 shadow-sm
                        ${filterStatus === status 
                            ? `bg-[#004E64] text-white` 
                            : `bg-gray-100 text-gray-700 hover:bg-gray-200`}
                    `}
                >
                    {Icon && <Icon size={16} className={`${filterStatus !== status ? color : 'text-white'}`} />}
                    {label}
                    <span className={`ml-1 text-xs font-bold rounded-full ${filterStatus === status ? 'bg-white/20 px-2 py-0.5' : 'bg-gray-300 px-2 py-0.5'}`}>
                        {getStatusCount(status)}
                    </span>
                </button>
            ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {loading && !emergencias.length && (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Carregando emergências...
          </div>
        )}

        {!loading && filteredEmergencias.length > 0 ? (
          <div className="grid gap-4">
            {filteredEmergencias.map((emg) => (
              <div
                key={emg.id}
                className="border border-gray-200 rounded-xl p-4 bg-white shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 duration-150"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <PawPrint className="text-[#25A18E]" size={18} />
                      {emg.pet?.nome || emg.pet_nome || "Pet não informado"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                        <User size={14} className="text-gray-500" />
                      Tutor: {emg.tutor?.nome_completo || emg.tutor_nome || "Desconhecido"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                       <MapPin size={12} /> Local: {emg.visita_tipo === 'clinica' ? 'Clínica' : 'Domicílio'}
                    </p>
                    {emg.veterinario_id && (
                        <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                           <Stethoscope size={12} /> {`Vet ID: ${emg.veterinario_id}`}
                        </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                        {/* Status de Urgência Aprimorado */}
                    <span className={`text-xs px-2 py-1 border rounded-lg flex items-center gap-1 font-semibold ${getUrgencyColor(emg.nivel_urgencia)}`}>
                      {emg.nivel_urgencia === 'critica' && <AlertTriangle size={12} />}
                      {emg.nivel_urgencia ? emg.nivel_urgencia.toUpperCase() : 'NÃO INFORMADO'}
                    </span>
                        {/* Status de Atendimento Aprimorado */}
                    <span className={`text-xs px-2 py-1 border rounded-lg flex items-center gap-1 ${getStatusColor(emg.status)}`}>
                      {normalizeStatus(emg.status) === 'em_atendimento' && <CheckCircle size={12} />}
                      {normalizeStatus(emg.status) === 'concluida' && <CheckCircle size={12} />}
                      {normalizeStatus(emg.status) === 'cancelada' && <XCircle size={12} />}
                      {getStatusLabel(emg.status)}
                    </span>
                  </div>
                </div>

                {/* Sintomas em Bloco de Destaque */}
                <p className="text-gray-700 text-sm mb-3 leading-relaxed border-l-4 border-[#25A18E] pl-3 py-1 bg-gray-50 rounded-r-lg">
                  <strong className="text-gray-600">Sintomas:</strong> {emg.descricao_sintomas}
                </p>

                <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                  <Clock size={14} />
                  {emg.created_at ? new Date(emg.created_at).toLocaleString("pt-BR") : "Data não informada"}
                </div>

                <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                  {normalizeStatus(emg.status) === "aberta" && (
                    <button
                      onClick={() => atualizarStatus(emg.id, "em_atendimento")}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
                    >
                      <CheckCircle size={16} /> Aceitar Atendimento
                    </button>
                  )}
                  
                  <button
                    onClick={() => openDetails(emg.id)}
                    className="flex items-center gap-1 px-4 py-2 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    <RefreshCw size={16} /> Ver Detalhes
                  </button>

                  {normalizeStatus(emg.status) === "em_atendimento" && (
                    <button
                      onClick={() => openGPS(emg)}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md animate-pulse hover:animate-none"
                    >
                      <Navigation size={16} /> Rastrear GPS
                    </button>
                  )}
                  
                  {normalizeStatus(emg.status) === "em_atendimento" && emg.visita_tipo === "domicilio" && (
                    <button
                      onClick={() => abrirRota(emg.localizacao)}
                      className="flex items-center gap-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-md"
                    >
                      <MapPin size={16} /> Ver Rota
                    </button>
                  )}

                  {normalizeStatus(emg.status) === "em_atendimento" && (
                    <button
                      onClick={() => openReportModal(emg.id)} 
                      className="flex items-center gap-1 px-4 py-2 text-sm font-semibold bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition shadow-md"
                    >
                      <XCircle size={16} /> Finalizar
                    </button>
                  )}

                  {normalizeStatus(emg.status) === "concluida" && (
                    <span className="text-sm text-green-700 font-medium flex items-center gap-1">
                      <CheckCircle size={14} /> Atendimento Finalizado
                    </span>
                  )}

                  {normalizeStatus(emg.status) === "cancelada" && (
                    <span className="text-sm text-red-700 font-medium flex items-center gap-1">
                      <XCircle size={14} /> Atendimento Cancelado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading &&
          !error && (
            <p className="text-gray-500 text-sm py-8 text-center">
              Nenhuma emergência {filterStatus !== 'todos' ? filterButtons.find(b => b.status === filterStatus)?.label.toLowerCase() : ''} registrada ainda.
            </p>
          )
        )}
        
        {showGPSModal && selectedEmergencia && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="bg-red-600 p-2.5 rounded-full animate-[pulse_2s_infinite]">
                            <Navigation size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl tracking-tight">Rastreamento em Tempo Real</h3>
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                {selectedEmergencia.visita_tipo === 'clinica' 
                                    ? 'O tutor está a deslocar-se para a clínica' 
                                    : 'A sua equipa deve deslocar-se ao local'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowGPSModal(false)} 
                        className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
                    >
                        <X size={28} />
                    </button>
                </div>
                
                <div className="flex-1 relative bg-gray-100">
                     <EmergencyTrackingMap 
                        emergencia={selectedEmergencia}
                        tutorLocation={gpsTutorLocation}
                        clinicLocation={gpsClinicLocation}
                     />
                </div>
            </div>
          </div>
        )}

        {showReportModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Z-index 59 para o backdrop, garantindo que ele cubra o modal de Detalhes (z-50) e esteja atrás do modal Report (z-60) */}
            <div className="absolute inset-0 bg-black opacity-40 z-[59]" onClick={closeReportModal} /> 
            <div className="relative z-[60] max-w-3xl w-full bg-white rounded-xl shadow-2xl overflow-auto max-h-[90vh] border">
              <div className="p-4 border-b flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Finalizar Emergência #{selectedEmergenciaId}</h3>
                  <p className="text-sm text-gray-500">Registre o relatório do atendimento para salvar no histórico do tutor.</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600" onClick={closeReportModal}><X size={20} /></button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Veterinário responsável</label>
                  <select value={reportVeterinarioId ?? ''} onChange={(e) => setReportVeterinarioId(e.target.value ? parseInt(e.target.value, 10) : null)} className="mt-1 block w-full rounded border-gray-300 shadow-sm">
                    <option value="">Selecione um veterinário</option>
                    {clinicVeterinarios.map((v) => (
                      <option key={v.id} value={v.id}>{v.nome_completo || v.email || `Vet ${v.id}`}</option>
                       ))}
                     </select>
                  </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700">Relatório do atendimento</label>
                       <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm h-36 p-2" />
                     </div>

                     <div className="flex justify-end gap-2">
                       <button onClick={closeReportModal} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
                       <button onClick={submitReport} disabled={reportSubmitting} className="px-4 py-2 bg-green-600 text-white rounded">
                         {reportSubmitting ? 'Enviando...' : 'Salvar e Finalizar'}
                       </button>
                     </div>
                  </div>
                 </div>
               </div>
             )}

             {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black opacity-40" onClick={closeDetails} />
            <div className="relative max-w-3xl w-full bg-white rounded-xl shadow-2xl overflow-auto max-h-[90vh] border">
              <div className="p-4 border-b flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Detalhes da Emergência #{selectedEmergenciaId}</h3>
                  <p className="text-sm text-gray-500">{selectedEmergencia?.pet?.nome || selectedEmergencia?.pet_nome || 'Pet não informado'}</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600" onClick={closeDetails}><X size={20} /></button>
              </div>

              <div className="p-6 space-y-6">
                {loadingDetails && <div className="flex items-center gap-2 text-gray-600"><Loader2 className="animate-spin" /> Carregando detalhes...</div>}

                {!loadingDetails && selectedEmergencia && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">Informações Básicas</h4>
                      <p className="text-sm"><strong>ID:</strong> {selectedEmergencia.id}</p>
                      <p className="text-sm"><strong>Status:</strong> <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedEmergencia.status)}`}>{getStatusLabel(selectedEmergencia.status)}</span></p>
                      <p className="text-sm"><strong>Nível:</strong> <span className={`px-2 py-0.5 rounded text-xs font-medium ${getUrgencyColor(selectedEmergencia.nivel_urgencia)}`}>{selectedEmergencia.nivel_urgencia?.toUpperCase() || '—'}</span></p>
                      <p className="text-sm"><strong>Tipo Visita:</strong> {selectedEmergencia.visita_tipo || '—'}</p>
                      <p className="text-sm"><strong>Data Abertura:</strong> {new Date(selectedEmergencia.created_at || selectedEmergencia.data_abertura).toLocaleString("pt-BR")}</p>
                      {selectedEmergencia.data_conclusao && <p className="text-sm"><strong>Data Conclusão:</strong> {new Date(selectedEmergencia.data_conclusao).toLocaleString("pt-BR")}</p>}
                    </div>

                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">Localização e Contato</h4>
                      <p className="text-sm"><strong>Coordenadas:</strong> {selectedEmergencia.localizacao || 'Não informada'}</p>
                      <p className="text-sm"><strong>Tutor:</strong> {selectedEmergencia.tutor?.nome_completo || selectedEmergencia.tutor_nome || 'Não informado'}</p>
                      <p className="text-sm"><strong>Pet:</strong> {selectedEmergencia.pet?.nome || selectedEmergencia.pet_nome || 'Não informado'}</p>
                      
                      {selectedEmergencia.localizacao && (
                        <button onClick={() => abrirRota(selectedEmergencia.localizacao)} className="mt-2 px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-1">
                            <MapPin size={14} /> Abrir no Maps
                        </button>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">Descrição dos Sintomas</h4>
                      <p className="text-gray-700 whitespace-pre-wrap p-3 bg-gray-50 rounded-lg">{selectedEmergencia.descricao_sintomas}</p>
                    </div>

                    {Array.isArray((selectedEmergencia as any).anexos) && (selectedEmergencia as any).anexos.length > 0 && (
                      <div className="md:col-span-2">
                        <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">Anexos (Exames, Fotos)</h4>
                        <div className="flex flex-wrap gap-3">
                          {((selectedEmergencia as any).anexos as any[]).map((a, i) => (
                            <a key={i} href={a.url || a.path || '#'} target="_blank" rel="noreferrer" className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition">{a.filename || a.name || `Anexo ${i + 1}`}</a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2 flex items-center gap-3 pt-4 border-t">
                      {normalizeStatus(selectedEmergencia.status) === 'aberta' && (
                        <button onClick={() => atualizarStatus(selectedEmergencia.id, 'em_atendimento')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
                            <CheckCircle size={16} /> Aceitar Atendimento
                        </button>
                      )}
                      {normalizeStatus(selectedEmergencia.status) === 'em_atendimento' && (
                         <button onClick={() => { closeDetails(); openGPS(selectedEmergencia); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2">
                            <Navigation size={16}/> Rastrear GPS
                        </button>
                      )}
                      {normalizeStatus(selectedEmergencia.status) === 'em_atendimento' && (
                        <button onClick={() => openReportModal(selectedEmergencia.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2">
                            <XCircle size={16} /> Finalizar
                        </button>
                      )}
                      <button onClick={closeDetails} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium">Fechar</button>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="font-semibold">Dados brutos (JSON)</h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded max-h-48 overflow-auto">{JSON.stringify(selectedEmergencia, null, 2)}</pre>
                    </div>
                    
                  </div>
                    )}
                  </div>
                </div>
           </div>
             )}
           </div>
        </>
       );
    }