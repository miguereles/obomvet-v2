import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ClipboardList, 
  PawPrint, 
  User2, 
  Clock, 
  Search, 
  Calendar, 
  Stethoscope, 
  ChevronLeft, 
  Eye, 
  X, 
  AlertTriangle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Importações de Serviços e Utilitários
import HistoricoService from "../../services/HistoricoService";
import { HistoricoAtendimento } from "../../services/types";
import { getToken } from "../../utils/auth";

// Interface local para tipagem
interface Historico extends HistoricoAtendimento {}

export default function HistoricoDashboardPage() {
  const navigate = useNavigate();

  // Estados
  const [historicos, setHistoricos] = useState<Historico[]>([]);
  const [filteredHistoricos, setFilteredHistoricos] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado do Modal de Detalhes
  const [selectedHistorico, setSelectedHistorico] = useState<Historico | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Effects ---

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    async function fetchHistoricos() {
      setLoading(true);
      setError("");
      try {
        const data = await HistoricoService.getMeusHistoricos();
        const lista = Array.isArray(data) ? data : (data as any).data || [];
        
        // Ordenar por data (mais recente primeiro)
        lista.sort((a: Historico, b: Historico) => 
            new Date(b.data_acao).getTime() - new Date(a.data_acao).getTime()
        );

        setHistoricos(lista);
        setFilteredHistoricos(lista);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || err.message || "Erro ao carregar histórico.");
      } finally {
        setLoading(false);
      }
    }

    fetchHistoricos();
  }, [navigate]);

  // Filtragem em tempo real
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHistoricos(historicos);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = historicos.filter(h => 
        h.emergencia?.pet?.nome.toLowerCase().includes(lowerTerm) ||
        h.veterinario?.nome_completo.toLowerCase().includes(lowerTerm) ||
        h.acao_realizada.toLowerCase().includes(lowerTerm)
      );
      setFilteredHistoricos(filtered);
    }
  }, [searchTerm, historicos]);

  // --- Handlers ---

  function openModal(historico: Historico) {
    setSelectedHistorico(historico);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setTimeout(() => setSelectedHistorico(null), 300); // Limpa após a animação
  }

  // Formatadores
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { 
      day: '2-digit', month: 'long', year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  // --- Renderização ---

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 text-blue-600">
        <Loader2 className="animate-spin w-10 h-10 mb-3" /> 
        <p className="font-medium text-gray-600">Carregando histórico...</p>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50/50">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
              <span className="bg-blue-100 p-2 rounded-full text-blue-600">
                <ClipboardList size={32} />
              </span>
              Histórico de Atendimentos
            </h1>
            <p className="text-gray-500 mt-1 ml-1">Acompanhe os procedimentos e consultas dos seus pets.</p>
          </div>
          
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-blue-600 px-4 py-2.5 rounded-xl shadow-sm transition font-medium"
          >
            <ChevronLeft size={20} /> Voltar ao Painel
          </button>
        </div>

        {/* Barra de Busca e Erro */}
        <div className="mb-8 space-y-4">
          {error && (
             <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded flex items-center gap-2">
                <AlertTriangle size={20} /> {error}
             </div>
          )}

          <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
             <input 
               type="text"
               placeholder="Buscar por pet, veterinário ou procedimento..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
             />
          </div>
        </div>

        {/* Lista de Histórico (Grid) */}
        {filteredHistoricos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <ClipboardList size={40} />
            </div>
            <h3 className="text-xl font-semibold text-gray-600">Nenhum registro encontrado</h3>
            <p className="text-gray-400 mt-2">
                {searchTerm ? "Tente buscar com outros termos." : "O histórico de atendimentos está vazio."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistoricos.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                    {/* Data e Hora */}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-50">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <Calendar size={16} className="text-blue-500" />
                            {formatDate(item.data_acao)}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                            <Clock size={12} />
                            {formatTime(item.data_acao)}
                        </div>
                    </div>

                    {/* Informações Principais */}
                    <div className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <PawPrint size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Paciente</p>
                                <h3 className="font-bold text-gray-800 text-lg leading-tight">{item.emergencia?.pet?.nome || "Pet não identificado"}</h3>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 mt-4">
                             <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                <Stethoscope size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Procedimento</p>
                                <p className="text-gray-700 font-medium line-clamp-2" title={item.acao_realizada}>
                                    {item.acao_realizada}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer do Card */}
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User2 size={16} className="text-gray-400" />
                        <span className="truncate max-w-[120px]" title={item.veterinario?.nome_completo}>
                            {item.veterinario?.nome_completo?.split(' ')[0] || "Vet. Plantonista"}
                        </span>
                    </div>
                    
                    <button 
                        onClick={() => openModal(item)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1 hover:underline decoration-2 underline-offset-2"
                    >
                        <Eye size={16} /> Detalhes
                    </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* === MODAL DE DETALHES === */}
      <AnimatePresence>
        {isModalOpen && selectedHistorico && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho do Modal */}
                <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ClipboardList className="text-blue-600" /> Detalhes do Atendimento
                    </h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Info Pet e Data */}
                    <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl">
                         <div className="flex items-center gap-3">
                             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm">
                                 <PawPrint size={24} />
                             </div>
                             <div>
                                 <p className="text-sm text-blue-600 font-bold uppercase">Paciente</p>
                                 <p className="text-lg font-bold text-gray-800">{selectedHistorico.emergencia?.pet?.nome}</p>
                             </div>
                         </div>
                         <div className="text-right">
                             <p className="text-sm text-gray-500">{formatDate(selectedHistorico.data_acao)}</p>
                             <p className="text-xs font-bold text-gray-400">{formatTime(selectedHistorico.data_acao)}</p>
                         </div>
                    </div>

                    {/* Detalhe da Ação */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Stethoscope size={16} /> Ação Realizada
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 leading-relaxed max-h-60 overflow-y-auto">
                            {selectedHistorico.acao_realizada}
                        </div>
                    </div>

                    {/* Veterinário */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <User2 size={16} /> Veterinário Responsável
                        </h4>
                        <p className="text-gray-800 font-medium border-b pb-2">
                            {selectedHistorico.veterinario?.nome_completo || "Não informado"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">CRMV não disponível</p>
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
                    <button 
                        onClick={closeModal}
                        className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-6 rounded-lg transition shadow-lg transform hover:-translate-y-0.5"
                    >
                        Fechar
                    </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}