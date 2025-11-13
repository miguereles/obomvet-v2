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
} from "lucide-react";
// 1. IMPORTE OS SERVIÇOS
import EmergenciaService from "../../services/EmergenciaService";
// ✅ CORREÇÃO: Importe o tipo Veterinario
import { Emergencia, Veterinario } from "../../services/types"; // Use o tipo central
import { echo } from "../../services/echo";
import { getUser } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastProvider";
import ClinicaService from "../../services/ClinicaService";
import HistoricoService from "../../services/HistoricoService";

export default function EmergenciasClinica() {
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmergenciaId, setSelectedEmergenciaId] = useState<number | null>(null);
  const [selectedEmergencia, setSelectedEmergencia] = useState<Emergencia | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { showToast } = useToast();
  
  // ✅ CORREÇÃO: Novo estado para controlar o modal de detalhes
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportVeterinarioId, setReportVeterinarioId] = useState<number | null>(null);
  const [clinicVeterinarios, setClinicVeterinarios] = useState<Veterinario[]>([]);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Mapeamento de status (Backend -> Frontend)
  const statusLabelMap: Record<string, string> = {
    aberta: "Pendente",
    assigned: "Pendente",
    pendente: "Pendente",
    em_atendimento: "Aceita",
    concluida: "Finalizada",
    cancelada: "Cancelada",
    rejected: "Rejeitada",
  };

  // =========================
  // FUNÇÃO DE CARREGAMENTO
  // =========================
  async function fetchEmergencias() {
    setLoading(true);
    setError(null);

    try {
      // 3. USE O EMERGENCIASERVICE
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

  // =========================
  // ATUALIZA STATUS
  // =========================
  async function atualizarStatus(id: number, novoStatus: string) {
    try {
      // 4. USE O EMERGENCIASERVICE
      // Usamos o status do backend (ex: 'em_atendimento')
      const data = await EmergenciaService.update(id, { status: novoStatus });

      // Atualiza o item alterado
      setEmergencias((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: data.status } : e))
      );
      // Atualiza o modal se estiver aberto
      if (selectedEmergencia && selectedEmergencia.id === id) {
        setSelectedEmergencia(prev => ({ ...prev!, status: data.status }));
      }
      showToast('Status atualizado com sucesso!', { type: 'success' });
    } catch (err: any) {
      console.error(err);
      showToast("Erro ao atualizar emergência: " + err.message, { type: 'error' });
    }
  }

  // =========================
  // Detalhes da emergência (Modal)
  // =========================
  async function openDetails(id: number) {
    setSelectedEmergenciaId(id);
    setShowDetailsModal(true); // ✅ CORREÇÃO: Usa o novo estado
    setLoadingDetails(true);
    setSelectedEmergencia(null);
    try {
      // Re-busca os detalhes completos, caso a lista esteja simplificada
      const data = await EmergenciaService.getById(String(id));
      setSelectedEmergencia(data);
    } catch (err: any) {
      console.error('Erro ao carregar detalhes da emergência:', err);
      showToast('Não foi possível carregar os detalhes da emergência.', { type: 'error' });
      setSelectedEmergencia(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  // Abre modal de relatório (Finalizar com criação de histórico)
  async function openReportModal(id: number) {
    setSelectedEmergenciaId(id); // Ainda necessário para buscar dados
    setSelectedEmergencia(null);
    setReportText("");
    setReportVeterinarioId(null);
    setClinicVeterinarios([]);
    setShowReportModal(true); // Controla o modal de relatório
    // ✅ CORREÇÃO: Não mexe em showDetailsModal
    
    try {
      // Carrega os detalhes e lista de veterinários da clínica
      const data = await EmergenciaService.getById(String(id));
      setSelectedEmergencia(data);
      const clinicaId = data.clinica_id;
      if (clinicaId) {
        const vets = await ClinicaService.getVeterinarios(String(clinicaId));
        setClinicVeterinarios(vets || []);
        // Preseleciona o veterinário da emergência, se informado
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

  // Submissão do relatório: cria histórico e marca emergência como concluída
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

      // 1) Cria o histórico atrelado à emergência
      const historico = await HistoricoService.createForEmergencia(selectedEmergenciaId, payload as any);

      // 2) Marca emergência como concluída
      const updated = await EmergenciaService.update(selectedEmergenciaId, { status: 'concluida', data_conclusao: new Date().toISOString() } as any);

      // Atualiza lista e modal
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
    setShowDetailsModal(false); // ✅ CORREÇÃO: Usa o novo estado
    setSelectedEmergenciaId(null);
    setSelectedEmergencia(null);
    setLoadingDetails(false);
  }
  
  // =========================
  // FUNÇÕES DE COR E TEXTO (AJUSTADAS)
  // =========================
  const getUrgencyColor = (nivel: Emergencia["nivel_urgencia"]) => {
    switch (nivel) {
      case "baixa": return "bg-green-100 text-green-700 border-green-300";
      case "media": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "alta": return "bg-orange-100 text-orange-800 border-orange-300";
      case "critica": return "bg-red-100 text-red-700 border-red-300 font-semibold";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // Normaliza status para exibição
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
        return s; // 'aberta', 'em_atendimento', 'concluida', 'cancelada'
    }
  };

  const getStatusColor = (status?: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case "aberta":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "em_atendimento":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "concluida":
        return "bg-green-100 text-green-700 border-green-300";
      case "cancelada":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusLabel = (status?: string): string => {
    if (!status) return 'Pendente';
    const normalized = normalizeStatus(status);
    return statusLabelMap[normalized] || 'Desconhecido';
  };
  
  // =========================
  // EFEITO DE INICIALIZAÇÃO E ECHO
  // =========================
  useEffect(() => {
    fetchEmergencias();

    // ✅ LÓGICA DE INSCRIÇÃO CORRIGIDA
    let clinicaId: number | null = null;
    try {
      const user = getUser(); // Pega o usuário do auth
      console.log('[Echo] User object:', user);
      
      // Pega o ID da clínica diretamente do objeto do usuário logado
      if (user && user.tipo === 'clinica' && user.clinica_id) {
        clinicaId = parseInt(user.clinica_id, 10);
        console.log('[Echo] Clinica ID found:', clinicaId);
      } else {
        console.warn('[Echo] User is not a clinic or clinica_id not found', {
          userType: user?.tipo,
          clinicaIdRaw: user?.clinica_id,
          fullUser: user
        });
      }
    } catch (e) {
      console.error("[Echo] Erro ao extrair ID da clínica:", e);
      setError("Erro ao identificar sua clínica. Tente relogar.");
      return;
    }

    if (!clinicaId) {
      console.warn("[Echo] Nenhum ID de clínica encontrado para inscrição. Usuário pode não ser uma clínica.");
      // Não retorna, pois o usuário pode não ser uma clínica
      return;
    }

    // Canais que esta clínica precisa ouvir
    // Conforme definido em app/Events/
    const canaisParaOuvir = [
      `clinicas.${clinicaId}`,             // Para NovaEmergencia
      `emergencias.clinica.${clinicaId}`  // Para EmergenciaAtualizada
    ];

    console.log(`[Echo] Inscrevendo-se nos canais:`, canaisParaOuvir);

    // const subscriptions: Echo[] = []; // Removido, 'sub' não é um array

    try {
      canaisParaOuvir.forEach((canal) => {
        // Todos os canais de clínica são privados e exigem o 401
        const sub = echo.private(canal); // <<-- É AQUI QUE O ERRO 401 ACONTECE (linha 195)
        
        sub.listen('.NovaEmergencia', (payload: any) => { //
            try {
              console.log("[Echo] Recebeu NovaEmergencia:", payload);
              // A lógica de mapeamento manual está correta pois corresponde
              // ao broadcastWith do evento NovaEmergencia.php
              const novaEmergencia = {
                id: payload.id,
                pet_id: payload.pet_id,
                tutor_id: payload.tutor_id,
                veterinario_id: payload.veterinario_id,
                descricao_sintomas: payload.descricao_sintomas || '',
                nivel_urgencia: payload.nivel_urgencia || 'media', // Fallback a 'media' se não informado
                status: payload.status || 'aberta',
                data_abertura: payload.created_at || new Date().toISOString(),
                data_conclusao: payload.data_conclusao || null,
                diagnostico: payload.diagnostico || null,
                prescricao_medica: payload.prescricao_medica || null,
                custo_estimado: payload.custo_estimado || null,
                created_at: payload.created_at || new Date().toISOString(),
                updated_at: payload.updated_at || new Date().toISOString(),
                localizacao: payload.localizacao || null,
                visita_tipo: payload.visita_tipo || null,
                clinica_id: payload.clinica_id,
                pet: payload.pet || null,
                tutor: payload.tutor || null,
                clinica: payload.clinica || null,
              } as Emergencia;
              
              setEmergencias(prev => [novaEmergencia, ...prev]);
              showToast('Nova emergência recebida!', { type: 'info', native: true });
            } catch (err) {
              console.error('[Echo] Erro ao processar NovaEmergencia:', err, payload);
              showToast('Erro ao receber nova emergência', { type: 'error' });
            }
          });

        sub.listen('.EmergenciaAtualizada', (payload: any) => { //
            try {
              console.log("[Echo] Recebeu EmergenciaAtualizada:", payload);
              // O evento já vem formatado
              const emergenciaAtualizada = payload.emergencia || payload;
              
              if (!emergenciaAtualizada || !emergenciaAtualizada.id) {
                console.warn('[Echo] EmergenciaAtualizada inválida:', payload);
                return;
              }
              
              setEmergencias(prev => prev.map(e => 
                e.id === emergenciaAtualizada.id ? { ...e, ...emergenciaAtualizada } : e
              ));

              // Atualiza o modal se estiver aberto
              if (selectedEmergenciaId === emergenciaAtualizada.id && selectedEmergencia) {
                setSelectedEmergencia(prev => prev ? { ...prev, ...emergenciaAtualizada } : null);
              }
              
              showToast(`Emergência #${emergenciaAtualizada.id} atualizada.`, { type: 'success' });
            } catch (err) {
              console.error('[Echo] Erro ao processar EmergenciaAtualizada:', err, payload);
              showToast('Erro ao atualizar emergência', { type: 'error' });
            }
          });
        
        // subscriptions.push(sub); // Removido, 'sub' não é um array
      });
    
    } catch (e) {
      console.error('Falha ao configurar inscrições do Echo:', e);
      setError("Erro ao conectar ao sistema de tempo real.");
    }

    // Cleanup na desmontagem do componente
    return () => {
      console.log("[Echo] Saindo dos canais:", canaisParaOuvir);
      canaisParaOuvir.forEach((canal) => {
        try {
          echo.leave(canal);
        } catch (e) {
          console.warn(`Erro ao sair do canal ${canal}`, e);
        }
      });
    };
  }, [showToast, selectedEmergenciaId]); // Dependências

  // =========================
  // ABRIR ROTA NO GOOGLE MAPS
  // =========================
  function abrirRota(localizacao?: string | null) {
    if (!localizacao) return showToast("Localização do cliente não disponível.", { type: 'error' });
    
    // O backend salva como 'lat,lng'
    const [lat, lng] = localizacao.split(',');
    
    if (!lat || !lng) return showToast("Formato de localização inválido.", { type: 'error' });
    
    // ✅ CORREÇÃO: URL do Google Maps corrigida para um formato funcional.
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank");
  }


  // =========================
  // RENDER
  // =========================
  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="text-[#25A18E]" /> Emergências Recebidas
          </h2>
          <button
            onClick={() => fetchEmergencias()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-[#25A18E] text-white rounded-lg hover:bg-[#208B7C] transition disabled:opacity-60 text-sm"
          >
            <RefreshCw size={16} className={`transition ${loading ? "animate-spin" : ""}`} />
            {loading ? "Atualizando..." : "Recarregar"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {/* Modal de relatório / finalização */}
        {showReportModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black opacity-40" onClick={closeReportModal} />
            <div className="relative max-w-3xl w-full bg-white rounded-lg shadow-xl overflow-auto max-h-[90vh] border">
              <div className="p-4 border-b flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Finalizar Emergência #{selectedEmergenciaId}</h3>
                  <p className="text-sm text-gray-500">Registre o relatório do atendimento para salvar no histórico do tutor.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-gray-600" onClick={closeReportModal}>Fechar</button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Veterinário responsável</label>
                  <select value={reportVeterinarioId ?? ''} onChange={(e) => setReportVeterinarioId(e.target.value ? parseInt(e.target.value, 10) : null)} className="mt-1 block w-full rounded border-gray-300 shadow-sm">
                    <option value="">Selecione um veterinário</option>
                    {clinicVeterinarios.map((v) => (
                      // ✅ CORREÇÃO: Usa 'v.nome_completo' e 'v.email' (tipagem forte)
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

        {loading && !emergencias.length && (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Carregando emergências...
          </div>
        )}

        {!loading && emergencias.length > 0 ? (
          <div className="grid gap-4">
            {emergencias.map((emg) => (
              <div
                key={emg.id}
                className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <PawPrint className="text-[#25A18E]" size={18} />
                      {emg.pet?.nome || emg.pet_nome || "Pet não informado"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Tutor: {emg.tutor?.nome_completo || emg.tutor_nome || "Desconhecido"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <span className={`text-xs px-2 py-1 border rounded-lg ${getUrgencyColor(emg.nivel_urgencia)}`}>
                      {emg.nivel_urgencia ? emg.nivel_urgencia.toUpperCase() : 'NÃO INFORMADO'}
                    </span>
                    <span className={`text-xs px-2 py-1 border rounded-lg ${getStatusColor(emg.status)}`}>
                      {getStatusLabel(emg.status)}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-3 leading-relaxed truncate">
                  {emg.descricao_sintomas}
                </p>

                <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                  <Clock size={14} />
                  {emg.created_at ? new Date(emg.created_at).toLocaleString("pt-BR") : "Data não informada"}
                </div>

                <div className="flex flex-wrap gap-2">
                  {normalizeStatus(emg.status) === "aberta" && (
                    <button
                      onClick={() => atualizarStatus(emg.id, "em_atendimento")}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <CheckCircle size={14} /> Aceitar Atendimento
                    </button>
                  )}
                  
                  <button
                    onClick={() => openDetails(emg.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
                  >
                    <RefreshCw size={14} /> Ver Detalhes
                  </button>

                  {normalizeStatus(emg.status) === "em_atendimento" && emg.visita_tipo === "domicilio" && (
                    <button
                      onClick={() => abrirRota(emg.localizacao)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                      <MapPin size={14} /> Ver Rota
                    </button>
                  )}

                  {normalizeStatus(emg.status) === "em_atendimento" && (
                    <button
                      onClick={() => openReportModal(emg.id)} // Abre modal de relatório para finalizar
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                      <XCircle size={14} /> Finalizar
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
              Nenhuma emergência registrada ainda.
            </p>
          )
        )}
        
        {/* Modal de detalhes da emergência */}
        {/* ✅ CORREÇÃO: Condição de renderização alterada para 'showDetailsModal' */}
        {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black opacity-40" onClick={closeDetails} />
            <div className="relative max-w-3xl w-full bg-white rounded-lg shadow-xl overflow-auto max-h-[90vh] border">
              <div className="p-4 border-b flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">Detalhes da Emergência #{selectedEmergenciaId}</h3>
                  <p className="text-sm text-gray-500">{selectedEmergencia?.pet?.nome || selectedEmergencia?.pet_nome || 'Pet não informado'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-gray-600" onClick={closeDetails}>Fechar</button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {loadingDetails && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="animate-spin" /> Carregando detalhes...
                  </div>
                )}

                {!loadingDetails && selectedEmergencia && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Informações Básicas</h4>
                      <p><strong>ID:</strong> {selectedEmergencia.id}</p>
                      <p><strong>Status:</strong> {getStatusLabel(selectedEmergencia.status)}</p>
                      <p><strong>Nível de Urgência:</strong> {selectedEmergencia.nivel_urgencia}</p>
                      <p><strong>Tipo de Visita:</strong> {selectedEmergencia.visita_tipo || '—'}</p>
                      <p><strong>Data Abertura:</strong> {new Date(selectedEmergencia.created_at || selectedEmergencia.data_abertura).toLocaleString("pt-BR")}</p>
                      {selectedEmergencia.data_conclusao && <p><strong>Data Conclusão:</strong> {new Date(selectedEmergencia.data_conclusao).toLocaleString("pt-BR")}</p>}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Localização</h4>
                      <p>{selectedEmergencia.localizacao || 'Não informada'}</p>
                      {selectedEmergencia.localizacao && (
                        <button onClick={() => abrirRota(selectedEmergencia.localizacao)} className="mt-2 px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg">Abrir no Maps</button>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <h4 className="font-semibold">Descrição dos Sintomas</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedEmergencia.descricao_sintomas}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold">Tutor</h4>
                      <p>{selectedEmergencia.tutor?.nome_completo || selectedEmergencia.tutor_nome || 'Não informado'}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold">Pet</h4>
                      <p>{selectedEmergencia.pet?.nome || selectedEmergencia.pet_nome || 'Não informado'}</p>
                    </div>

                    <div className="md:col-span-2">
                      <h4 className="font-semibold">Clínica / Veterinário</h4>
                      <p>{selectedEmergencia.clinica?.nome_fantasia || '—'}</p>
                      {selectedEmergencia.veterinario_id && <p>Veterinário ID: {selectedEmergencia.veterinario_id}</p>}
                    </div>

                    {/* Anexos se existirem */}
                    {Array.isArray((selectedEmergencia as any).anexos) && (selectedEmergencia as any).anexos.length > 0 && (
                      <div className="md:col-span-2">
                        <h4 className="font-semibold">Anexos</h4>
                        <div className="flex flex-wrap gap-2">
                          {((selectedEmergencia as any).anexos as any[]).map((a, i) => (
                            <a key={i} href={a.url || a.path || '#'} target="_blank" rel="noreferrer" className="px-3 py-1 bg-gray-100 rounded">{a.filename || a.name || 'Anexo'}</a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ações rápidas dentro do modal */}
                    <div className="md:col-span-2 flex items-center gap-2 pt-2">
                      {normalizeStatus(selectedEmergencia.status) === 'aberta' && (
                        <button onClick={() => atualizarStatus(selectedEmergencia.id, 'em_atendimento')} className="px-3 py-2 bg-blue-600 text-white rounded">Aceitar Atendimento</button>
                      )}
                      {normalizeStatus(selectedEmergencia.status) === 'em_atendimento' && (
                        <button onClick={() => openReportModal(selectedEmergencia.id)} className="px-3 py-2 bg-green-600 text-white rounded">Finalizar</button>
                      )}
                      <button onClick={closeDetails} className="px-3 py-2 bg-gray-100 rounded">Fechar</button>
                    </div>

                    {/* Fallback: JSON cru para debug */}
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