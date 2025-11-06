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

// 2. REMOVA A INTERFACE LOCAL (usamos a de types.ts)
// interface Emergencia { ... }

export default function EmergenciasClinica() {
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const getStatusColor = (status: Emergencia["status"]) => {
    // Status do backend: 'aberta', 'em_atendimento', 'concluida', 'cancelada'
    // Status do frontend antigo: 'pendente', 'em_andamento', 'finalizada'
    switch (status) {
      case "aberta":
      case "pendente": 
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "em_atendimento":
      case "em_andamento": 
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "concluida":
      case "finalizada": 
        return "bg-green-100 text-green-700 border-green-300";
      case "cancelada": 
        return "bg-red-100 text-red-700 border-red-300";
      default: 
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // ... (Cole o resto das suas funções useEffect e render aqui)
  
  // =========================
  // EFEITO DE INICIALIZAÇÃO
  // =========================
  useEffect(() => {
    fetchEmergencias();

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
                    {statusLabelMap[emg.status] || emg.status}
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
                {emg.status === "aberta" && ( // Usa o status do backend
                  <button
                    onClick={() => atualizarStatus(emg.id, "em_atendimento")}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <CheckCircle size={14} /> Aceitar Atendimento
                  </button>
                )}

                {emg.status === "em_atendimento" && emg.visita_tipo === "domicilio" && (
                  <button
                    onClick={() => abrirRota((emg as any).latitude, (emg as any).longitude)} // Ajuste de tipo
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    <MapPin size={14} /> Ver Rota
                  </button>
                )}

                {emg.status === "em_atendimento" && (
                  <button
                    onClick={() => atualizarStatus(emg.id, "concluida")} // Usa o status do backend
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    <XCircle size={14} /> Finalizar
                  </button>
                )}

                {emg.status === "concluida" && (
                  <span className="text-sm text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle size={14} /> Atendimento Finalizado
                  </span>
                )}

                {emg.status === "cancelada" && (
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
    </div>
  );
}