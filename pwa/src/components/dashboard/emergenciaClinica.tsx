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
import { Emergencia } from "../../services/types"; // Use o tipo central
import { echo } from "../../services/echo";
import { getUser } from "../../utils/auth";
import { useToast } from "../../components/ui/ToastProvider";

// 2. REMOVA A INTERFACE LOCAL (usamos a de types.ts)
// interface Emergencia { ... }

export default function EmergenciasClinica() {
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmergenciaId, setSelectedEmergenciaId] = useState<number | null>(null);
  const [selectedEmergencia, setSelectedEmergencia] = useState<Emergencia | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { showToast } = useToast();

  const statusValidos = ["pendente", "em_andamento", "finalizada", "cancelada"] as const;

  const statusLabelMap: Record<string, string> = {
    pendente: "Pendente",
    em_andamento: "Aceita", // O seu backend usa 'em_atendimento'
    em_atendimento: "Aceita", // Adicione esta linha
    finalizada: "Finalizada", // O seu backend usa 'concluida'
    concluida: "Finalizada", // Adicione esta linha
    cancelada: "Cancelada",
  };

  // =========================
  // FUNÇÃO DE CARREGAMENTO (REFATORADA)
  // =========================
  async function fetchEmergencias() {
    setLoading(true);
    setError(null);

    try {
      // 3. USE O EMERGENCIASERVICE
      // O token é tratado automaticamente pelo api.ts
      const data = await EmergenciaService.getEmergenciasDaClinica();
      
      if (!Array.isArray(data)) throw new Error("Resposta inesperada da API.");

      setEmergencias(data);
    } catch (err: any) {
      console.error("Erro ao carregar emergências:", err);
      // O erro 500 (Route not found) deve desaparecer
      setError(err.message || "Erro ao carregar emergências.");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // ATUALIZA STATUS (REFATORADO)
  // =========================
  async function atualizarStatus(id: number, novoStatus: string) {
    try {
      const statusFormatado = novoStatus.trim().toLowerCase();
      
      // 4. USE O EMERGENCIASERVICE
      const data = await EmergenciaService.update(id, { status: statusFormatado as any });

      // Atualiza o item alterado
      setEmergencias((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: data.status } : e))
      );
    } catch (err: any) {
      console.error(err);
      alert("Erro ao atualizar emergência: " + err.message);
    }
  }

  // =========================
  // Detalhes da emergência (Modal)
  // =========================
  async function openDetails(id: number) {
    setSelectedEmergenciaId(id);
    setLoadingDetails(true);
    setSelectedEmergencia(null);
    try {
      const data = await EmergenciaService.getById(String(id));
      setSelectedEmergencia(data);
    } catch (err: any) {
      console.error('Erro ao carregar detalhes da emergência:', err);
      alert('Não foi possível carregar os detalhes da emergência.');
      setSelectedEmergencia(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeDetails() {
    setSelectedEmergenciaId(null);
    setSelectedEmergencia(null);
    setLoadingDetails(false);
  }
  
  // ... (O resto do seu componente 'abrirRota', 'useEffect', cores e JSX pode permanecer igual)
  // ... (apenas certifique-se de que a função de cor 'getStatusColor' lida com os status do backend)

  // =========================
  // FUNÇÕES DE COR (AJUSTADAS)
  // =========================
  const getUrgencyColor = (nivel: Emergencia["nivel_urgencia"]) => {
    // ... (a sua função está correta)
    switch (nivel) {
      case "baixa": return "bg-green-100 text-green-700 border-green-300";
      case "media": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "alta": return "bg-orange-100 text-orange-800 border-orange-300";
      case "critica": return "bg-red-100 text-red-700 border-red-300 font-semibold";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // Normaliza status possíveis (backend atual e valores legados do frontend)
  const normalizeStatus = (status?: string) => {
    if (!status) return status;
    const s = status.trim().toLowerCase();
    switch (s) {
      case "pendente": return "aberta"; // antigo -> atual
      case "em_andamento": return "em_atendimento";
      case "finalizada": return "concluida";
      default: return s;
    }
  };

  const getStatusColor = (status?: string) => {
    const s = normalizeStatus(status) as string;
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

  const getStatusLabel = (status?: string) => {
    if (!status) return '';
    const direct = statusLabelMap[status as string];
    if (direct) return direct;
    const n = normalizeStatus(status);
    return statusLabelMap[n as string] || status;
  };

  // ... (Cole o resto das suas funções useEffect e render aqui)
  
  // =========================
  // EFEITO DE INICIALIZAÇÃO
  // =========================
  useEffect(() => {
    fetchEmergencias();

    // Configurar subscription em tempo real via Echo
    let subscribedChannels: string[] = [];
    try {
      const user = getUser();
      const clinicaId = (typeof localStorage !== 'undefined' && localStorage.getItem('clinica_id')) || null;

      // Subscribe apenas se tivermos token/identificador
      if (echo && (clinicaId || (user && user.tipo === 'clinica'))) {
        const channelNames: string[] = [];

        if (clinicaId) {
          channelNames.push(`clinicas.${clinicaId}`);
          channelNames.push(`emergencias.clinica.${clinicaId}`);
        }

        // também assina o canal global caso exista permissões
        channelNames.push('clinicas');
        channelNames.push('emergencias');

        channelNames.forEach((ch) => {
          try {
            // Para canais privados use .private, para públicos .channel
            const isPrivate = ch === 'clinicas' || ch.startsWith('clinicas.');
            const subscriber = isPrivate ? echo.private(ch) : echo.channel(ch);

            // Nova emergência
            subscriber.listen('NovaEmergencia', (payload: any) => {
              // Prepend novo item (alguns eventos trazem partials)
              setEmergencias(prev => [{
                id: payload.id,
                descricao_sintomas: payload.descricao_sintomas,
                status: payload.status,
                clinica_id: payload.clinica_id,
                veterinario_id: payload.veterinario_id,
                created_at: payload.criado_em || new Date().toISOString(),
              } as any, ...prev]);
              showToast('Nova emergência recebida', { type: 'info', native: true });
            });

            // Atualização de emergência
            subscriber.listen('EmergenciaAtualizada', (payload: any) => {
              // payload pode ser parcial ou com nested 'emergencia'
              const incoming = payload.emergencia || payload;
              setEmergencias(prev => prev.map(e => e.id === incoming.id ? { ...e, ...incoming } : e));
              showToast('Emergência atualizada', { type: 'success', native: false });
            });

            subscribedChannels.push(ch);
          } catch (e) {
            console.warn('Erro ao inscrever em canal Echo', ch, e);
          }
        });
      }
    } catch (e) {
      console.warn('Falha ao configurar Echo:', e);
    }

    return () => {
      // Cleanup: leave canales inscritos
      try {
        subscribedChannels.forEach((ch) => {
          const isPrivate = ch === 'clinicas' || ch.startsWith('clinicas.');
          const method = isPrivate ? 'leave' : 'leaveChannel';
          // @ts-ignore - echo exposes leave / leaveChannel
          if (typeof (echo as any)[method] === 'function') {
            try { (echo as any)[method](ch); } catch (e) { /* ignore */ }
          } else {
            try { echo.leave(ch); } catch (e) { /* ignore */ }
          }
        });
      } catch (e) {
        // Silenciar erros de cleanup
      }
    };
    // Atualização automática (se desejar)
    // const interval = setInterval(fetchEmergencias, 20000);
    // return () => clearInterval(interval);
  }, []);

  // =========================
  // ABRIR ROTA NO GOOGLE MAPS
  // =========================
  function abrirRota(lat?: number, lng?: number) {
    if (!lat || !lng) return alert("Localização do cliente não disponível.");
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
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
          onClick={fetchEmergencias}
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
                    {emg.pet?.nome || "Pet não informado"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tutor: {emg.tutor?.nome_completo || "Desconhecido"}
                  </p>
                </div>

                <div className="flex flex-col gap-1 items-end">
                  <span className={`text-xs px-2 py-1 border rounded-lg ${getUrgencyColor(emg.nivel_urgencia)}`}>
                    {emg.nivel_urgencia.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 border rounded-lg ${getStatusColor(emg.status)}`}>
                    {getStatusLabel(emg.status)}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                {emg.descricao_sintomas}
              </p>

              <div className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                <Clock size={14} />
                {emg.created_at ? new Date(emg.created_at).toLocaleString("pt-BR") : "Data não informada"}
              </div>

              <div className="flex flex-wrap gap-2">
                {normalizeStatus(emg.status) === "aberta" && ( // Usa status normalizado
                  <button
                    onClick={() => atualizarStatus(emg.id, "em_atendimento")}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <CheckCircle size={14} /> Aceitar Atendimento
                  </button>
                )}

                {/* Botão para ver todos os detalhes */}
                <button
                  onClick={() => openDetails(emg.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
                >
                  <RefreshCw size={14} /> Ver Detalhes
                </button>

                {normalizeStatus(emg.status) === "em_atendimento" && emg.visita_tipo === "domicilio" && (
                  <button
                    onClick={() => abrirRota((emg as any).latitude, (emg as any).longitude)} // Ajuste de tipo
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    <MapPin size={14} /> Ver Rota
                  </button>
                )}

                {normalizeStatus(emg.status) === "em_atendimento" && (
                  <button
                    onClick={() => atualizarStatus(emg.id, "concluida")} // Usa o status do backend
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
      {selectedEmergenciaId && (
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
                    <p><strong>Data Abertura:</strong> {selectedEmergencia.created_at || selectedEmergencia.data_abertura}</p>
                    {selectedEmergencia.data_conclusao && <p><strong>Data Conclusão:</strong> {selectedEmergencia.data_conclusao}</p>}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Localização</h4>
                    <p>{selectedEmergencia.localizacao || 'Não informada'}</p>
                    {selectedEmergencia.localizacao && (
                      <button onClick={() => {
                        const [lat, lng] = (selectedEmergencia.localizacao || '').split(',').map(s => s.trim());
                        if (lat && lng) abrirRota(Number(lat), Number(lng));
                      }} className="mt-2 px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg">Abrir no Maps</button>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="font-semibold">Descrição dos Sintomas</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedEmergencia.descricao_sintomas}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold">Tutor</h4>
                    <p>{selectedEmergencia.tutor?.nome_completo || 'Não informado'}</p>
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
                  {Array.isArray((selectedEmergencia as any).anexos) && (
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
                      <button onClick={() => atualizarStatus(selectedEmergencia.id, 'concluida')} className="px-3 py-2 bg-green-600 text-white rounded">Finalizar</button>
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
      {/* Notificação simples */}
    </>
  );
}