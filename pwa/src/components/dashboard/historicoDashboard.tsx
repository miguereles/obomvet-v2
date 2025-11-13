import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PawPrint, Clock, AlertTriangle, User2, ClipboardList, Loader2 } from "lucide-react";
// ✅ 1. Importar o serviço de Histórico
import HistoricoService from "../../services/HistoricoService";
// ✅ 2. Importar o tipo de Histórico (assumindo que está em types.ts)
import { HistoricoAtendimento } from "../../services/types"; // Usar o tipo central
// ✅ 3. Importar o getToken para verificar a sessão
import { getToken } from "../../utils/auth";

// ✅ 4. Renomear a interface para corresponder ao tipo importado
interface Historico extends HistoricoAtendimento {}

export default function HistoricoDashboardPage() {
  const navigate = useNavigate();
  // ❌ 5. API_URL removido, pois o service já sabe o endereço
  // const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

  const [historicos, setHistoricos] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // ✅ 6. Usar getToken() para uma verificação mais robusta
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    async function fetchHistoricos() {
      setLoading(true);
      setError("");
      try {
        // ✅ 7. Substituir o fetch manual pelo Service
        // O service já lida com o token e a URL da API
        const data = await HistoricoService.getMeusHistoricos();
        
        setHistoricos(Array.isArray(data) ? data : (data as any).data || []);
      } catch (err: any) {
        console.error(err);
        // O interceptor do Axios (api.ts) já deve tratar 401 (token expirado)
        setError(err.response?.data?.message || err.message || "Erro inesperado");
      } finally {
        setLoading(false);
      }
    }

    fetchHistoricos();
  }, [navigate]); // ✅ 8. Remover dependências desnecessárias

  if (loading) return (
    <div className="flex items-center justify-center p-6 text-center">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> Carregando histórico...
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
            <ClipboardList size={28} /> Histórico de Atendimentos
          </h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
          >
            <PawPrint size={18} /> Voltar
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Pet</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ação Realizada</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Veterinário</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Data</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historicos.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 flex items-center gap-2">
                    <PawPrint size={16} className="text-gray-500" />
                    {/* ✅ 9. O backend já envia o pet dentro da emergencia */}
                    {h.emergencia?.pet?.nome ?? "—"}
                  </td>
                  <td className="px-6 py-4">{h.acao_realizada}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <User2 size={16} className="text-gray-500" />
                    {/* ✅ 10. O backend já envia o nome do veterinário */}
                    {h.veterinario?.nome_completo ?? "—"}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" />
                    {new Date(h.data_acao).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
              {historicos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Nenhum histórico de atendimento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}