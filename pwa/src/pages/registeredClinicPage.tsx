import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, Map, Loader2, AlertTriangle, Users, Stethoscope, X, Building, MapPin } from "lucide-react";
import Navbar from "../components/Navbar";
import ClinicMap from "../components/ClinicMap";
import { useGeolocation } from "../hooks/useGeolocation";
import ClinicaService from "../services/ClinicaService";
import VeterinarioService from "../services/VeterinarioService";
import { Provider, Veterinario } from "../services/types";
import { Location } from "../types/emergency.types"; // Usar o tipo de localização real

// --- Variáveis auxiliares para URL de imagem ---
const PLACEHOLDER_CLINICA_URL = "https://via.placeholder.com/400x128/25A18E/FFFFFF?text=CLINICA";
const PLACEHOLDER_VET_URL = "https://via.placeholder.com/400x128/004E64/FFFFFF?text=VET+AUTONOMO";
const PLACEHOLDER_MODAL_CLINICA = "https://via.placeholder.com/100x100/25A18E/FFFFFF?text=CLINICA";
const PLACEHOLDER_MODAL_VET = "https://via.placeholder.com/100x100/004E64/FFFFFF?text=VET";

/**
 * Função auxiliar para resolver a URL absoluta da imagem
 * Se o backend retornar '/storage/...' ou o caminho do arquivo, ela anexa o host da API.
 */
function resolveImageUrl(provider: Provider, isModal = false): string {
    const defaultUrl = isModal 
        ? (provider.tipo === 'clinica' ? PLACEHOLDER_MODAL_CLINICA : PLACEHOLDER_MODAL_VET)
        : (provider.tipo === 'clinica' ? PLACEHOLDER_CLINICA_URL : PLACEHOLDER_VET_URL);

    if (!provider.foto_url) {
        return defaultUrl;
    }
    
    // Se a URL já for absoluta (contém http), retorna
    if (provider.foto_url.startsWith('http')) {
        return provider.foto_url;
    }
    
    // Converte caminho relativo (/storage/...) para URL absoluta usando VITE_API_URL
    const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';
    
    // Constrói a URL: http://localhost:8000 + /storage/...
    const base = API_BASE.replace(/\/api$/, '').replace(/\/$/, '');
    
    // Garante que não há barras duplas (ex: http://localhost:8000/storage/...)
    return `${base}${provider.foto_url.startsWith('/') ? '' : '/'}${provider.foto_url}`;
}
// --- Fim da Função auxiliar ---


// O tipo Location do useGeolocation é {latitude: number, longitude: number}

export default function RegisteredClinicPage() {
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  // userLocation é do tipo Location | null
  const { location: userLocation, locationError } = useGeolocation();
  
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [clinicVeterinarios, setClinicVeterinarios] = useState<Veterinario[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingVets, setLoadingVets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- Funções de Lógica (CORRIGIDA) ---
  const calcularDistancia = (loc1: Location, loc2: {latitude: number, longitude: number}) => {
    // A desestruturação (const [lat1, lng1] = loc1) foi removida, 
    // agora usamos acesso direto (loc1.latitude)
    const lat1 = loc1.latitude;
    const lng1 = loc1.longitude;
    const lat2 = loc2.latitude;
    const lng2 = loc2.longitude;
    
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    setLoadingProviders(true);
    const fetchProviders = async () => {
      try {
        const clinicsPromise = ClinicaService.getPublicMapList();
        const vetsPromise = VeterinarioService.getAutonomos(); 
        const [clinicsData, vetsData] = await Promise.all([clinicsPromise, vetsPromise]);
        setAllProviders([...clinicsData, ...vetsData]);
        setError(null);
      } catch (err: any) {
        console.error("Erro ao buscar clínicas ou veterinários:", err);
        setError(err.response?.data?.message || "Erro ao carregar lista.");
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, []);

  const processedProviders = useMemo(() => {
    // userLocation é do tipo Location | null
    if (!userLocation) return allProviders;

    const dataProcessada = allProviders
      .map((provider) => {
        if (!provider.localizacao) return { ...provider, distancia: Infinity };
        const [latStr, lngStr] = provider.localizacao.split(",");
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (isNaN(lat) || isNaN(lng)) return { ...provider, distancia: Infinity };
        
        // Passa o objeto userLocation e cria um objeto para o provedor
        const providerLocation = { latitude: lat, longitude: lng };

        return { 
          ...provider, 
          distancia: calcularDistancia(userLocation, providerLocation) 
        };
      })
      .filter(Boolean) as Provider[];
    dataProcessada.sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity));
    return dataProcessada;
  }, [allProviders, userLocation]);

  const abrirRota = (clinic: Provider) => {
    if (!userLocation) {
      alert("Ative sua localização para calcular a rota.");
      return;
    }
    const destino = clinic.localizacao;
    // Acessa as propriedades do objeto
    const origem = `${userLocation.latitude},${userLocation.longitude}`; 
    const url = `https://maps.google.com/?daddr=${destino}&saddr=${origem}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const ligarParaClinica = (telefone: string) => {
    window.open(`tel:${telefone}`);
  };

  const handleSelectProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setClinicVeterinarios([]);
    if (provider.tipo === 'clinica') {
      setLoadingVets(true);
      ClinicaService.getVeterinarios(provider.id.toString())
        .then(data => setClinicVeterinarios(data))
        .catch(err => console.error("Erro ao buscar veterinários:", err))
        .finally(() => setLoadingVets(false));
    }
  };

  // --- JSX (Layout de Catálogo) ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      
      {/* Header da Página */}
      <header className="bg-gradient-to-r from-[#004E64] to-[#25A18E] pt-24 pb-12 shadow-md">
        <div className="container mx-auto px-6 text-white">
          <button
            className="flex items-center gap-2 font-semibold hover:text-gray-200 transition mb-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} /> Voltar
          </button>
          <h1 className="text-4xl md:text-5xl font-bold">
            Catálogo de Parceiros
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mt-2">
            Encontre clínicas e veterinários autônomos perto de você.
          </p>
        </div>
      </header>

      {/* Conteúdo Principal (Grelha de Cards) */}
      <main className="flex-1 container mx-auto py-10 px-6">
        
        {/* Estados de Loading / Erro */}
        {loadingProviders && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-5xl text-[#25A18E]" />
            <p className="mt-4 text-lg font-semibold text-gray-600">
              Buscando parceiros...
            </p>
          </div>
        )}

        {(error || locationError) && !loadingProviders && (
          <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-2xl shadow-lg border border-red-200">
            <AlertTriangle className="text-5xl text-red-500" />
            <p className="mt-4 text-lg font-semibold text-red-700 text-center">{error || locationError}</p>
          </div>
        )}

        {!loadingProviders && !error && processedProviders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-lg border">
            <AlertTriangle className="text-5xl text-gray-500" />
            <p className="mt-4 text-lg font-semibold text-gray-700 text-center">
              Nenhum parceiro encontrado.
            </p>
          </div>
        )}

        {/* Grelha de Catálogo */}
        {!loadingProviders && processedProviders.length > 0 && (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {processedProviders.map((provider) => (
                <motion.div
                  key={`${provider.tipo}-${provider.id}`}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl"
                >
                  {/* NOVO: Imagem de Perfil */}
                  <div className="w-full h-32 bg-gray-200 overflow-hidden relative">
                    <img 
                      // ✅ CORRIGIDO: Usando resolveImageUrl
                      src={resolveImageUrl(provider)}
                      alt={`Foto de ${provider.nome_fantasia || provider.nome_completo}`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  </div>

                  {/* Header do Card */}
                  <div className="p-5 border-b bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      {provider.tipo === 'clinica' ? (
                        <span className="p-2 bg-blue-100 text-blue-600 rounded-full"><Building size={20} /></span>
                      ) : (
                        <span className="p-2 bg-teal-100 text-teal-600 rounded-full"><Users size={20} /></span>
                      )}
                      <h2 className="text-xl font-bold text-[#004E64] leading-tight">
                        {provider.nome_fantasia || provider.nome_completo}
                      </h2>
                    </div>
                    {provider.disponivel_24h && (
                      <span className="text-xs font-bold text-green-800 bg-green-200 px-2 py-0.5 rounded-full mr-2">
                        ABERTO 24H
                      </span>
                    )}
                    {provider.tipo === 'veterinario' && (provider as any).especialidade && (
                       <span className="text-xs font-bold text-purple-800 bg-purple-200 px-2 py-0.5 rounded-full">
                         {(provider as any).especialidade}
                       </span>
                    )}
                  </div>
                  
                  {/* Conteúdo do Card */}
                  <div className="p-5 flex-1 space-y-3">
                    {/* NOVO: Descrição */}
                    {provider.descricao && (
                        <p className="text-sm text-gray-700 italic border-l-2 border-[#25A18E] pl-3">
                            "{provider.descricao.substring(0, 80)}..."
                        </p>
                    )}
                    
                    <p className="text-sm text-gray-600 flex items-start gap-2">
                      <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{provider.endereco || "Endereço não informado"}</span>
                    </p>
                    {provider.distancia && provider.distancia !== Infinity && (
                      <p className="text-sm font-semibold text-blue-600">
                        Distância: {provider.distancia.toFixed(1)} km
                      </p>
                    )}
                  </div>
                  
                  {/* Footer do Card */}
                  <div className="p-5 bg-gray-50 border-t">
                    <button
                      onClick={() => handleSelectProvider(provider)}
                      className="w-full bg-[#25A18E] text-white p-3 font-bold hover:bg-[#208B7C] transition flex items-center justify-center gap-2 rounded-lg"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Modal de Detalhes (com Mapa) */}
      <AnimatePresence>
        {selectedProvider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={() => setSelectedProvider(null)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do Modal */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-[#004E64]">
                  {selectedProvider.nome_fantasia || selectedProvider.nome_completo}
                </h2>
                <button 
                  onClick={() => setSelectedProvider(null)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Conteúdo do Modal */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Informações */}
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    {/* Imagem de Perfil no Modal */}
                    <img 
                      // ✅ CORRIGIDO: Usando resolveImageUrl (versão modal)
                      src={resolveImageUrl(selectedProvider, true)}
                      alt="Foto de perfil"
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    <div>
                        {selectedProvider.descricao && (
                            <p className="text-gray-700 italic mb-3">
                                "{selectedProvider.descricao}"
                            </p>
                        )}
                        <p className="text-gray-600 mb-1">{selectedProvider.endereco}</p>
                        {selectedProvider.disponivel_24h ? (
                            <p className="font-semibold text-green-600 text-sm mb-2">✅ Aberto 24h</p>
                        ) : (
                            <p className="font-semibold text-gray-600 text-sm mb-2">Horário: {(selectedProvider as any).horario_funcionamento || "Não informado"}</p>
                        )}
                    </div>
                </div>

                {/* --- MAPA MOVIDO PARA CÁ --- */}
                {selectedProvider.localizacao && (
                  <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <ClinicMap
                      clinics={[selectedProvider]} // Envia apenas o provider selecionado
                      // userLocation é passado como objeto, e ClinicMap deve lidar com a conversão se necessário
                      userLocation={userLocation ? [userLocation.latitude, userLocation.longitude] as [number, number] : null}
                      selectedClinic={selectedProvider}
                      hoveredClinic={null}
                    />
                  </div>
                )}
                {/* --- FIM DO MAPA --- */}

                {/* Botões de Ação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    className="bg-red-600 text-white p-3 font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 rounded-lg disabled:opacity-50"
                    onClick={() => ligarParaClinica(selectedProvider.telefone_emergencia)}
                    disabled={!selectedProvider.telefone_emergencia}
                  >
                    <Phone size={18} /> Ligar Agora
                  </button>
                  <button
                    className="bg-blue-600 text-white p-3 font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 rounded-lg disabled:opacity-50"
                    onClick={() => abrirRota(selectedProvider)}
                    disabled={!selectedProvider.localizacao || !userLocation}
                  >
                    <Map size={18} /> Ver Rota
                  </button>
                </div>

                {/* Lista de Veterinários (Condicional) */}
                {selectedProvider.tipo === 'clinica' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Users size={20} /> Veterinários da Clínica
                    </h3>
                    {loadingVets && (
                      <div className="flex justify-center items-center py-4">
                        <Loader2 className="animate-spin text-2xl text-[#25A18E]" />
                      </div>
                    )}
                    {!loadingVets && clinicVeterinarios.length === 0 && (
                      <p className="text-gray-500 text-sm">
                        Nenhum veterinário encontrado para esta clínica.
                      </p>
                    )}
                    {!loadingVets && clinicVeterinarios.length > 0 && (
                      <div className="space-y-3">
                        {clinicVeterinarios.map(vet => (
                          <div key={vet.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="font-semibold text-gray-800">{vet.nome_completo}</p>
                            {vet.especialidade && (
                              <p className="text-sm text-[#25A18E] font-medium flex items-center gap-1.5">
                                <Stethoscope size={14} />
                                {vet.especialidade}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="w-full text-center py-4 text-xs text-gray-600 bg-gray-100 border-t mt-10">
        © {new Date().getFullYear()} oBomVet — Plataforma de Emergências Veterinárias
      </footer>
    </div>
  );
}