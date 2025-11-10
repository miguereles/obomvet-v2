import { useState, useEffect, useMemo } from "react";
import { Loader2, MapPin, Building2, XCircle, User, Star } from "lucide-react";

// ✅ 1. Importe os services e o tipo Provider central
import ClinicaService from "../../services/ClinicaService";
import VeterinarioService from "../../services/VeterinarioService";
import { Provider } from "../../services/types"; //

interface ClinicSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (provider: Provider) => void; // Tipo atualizado
  visitaTipo: string;
  userLocation: { lat: number; lng: number } | null;
}

// ❌ 2. Interface Provider local removida (usamos a importada)

// ✅ 3. Adicionada função para calcular distância (em KM)
function calcularDistancia(
  loc1: { lat: number; lng: number }, 
  loc2: { lat: number; lng: number }
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLng = toRad(loc2.lng - loc1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Retorna distância em KM
}

export default function ClinicSelectModal({
  isOpen,
  onClose,
  onSelect,
  visitaTipo,
  userLocation,
}: ClinicSelectModalProps) {
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'todos' | 'clinicas' | 'veterinarios'>('todos');
  const [sortBy, setSortBy] = useState<'distancia' | 'avaliacao'>('distancia');

  // Atualiza a lista filtrada (Lógica de ordenação mantida, agora com 'distancia' em KM)
  useEffect(() => {
    let filtered = [...allProviders];

    if (selectedType !== 'todos') {
      filtered = filtered.filter(p => p.tipo === (selectedType === 'clinicas' ? 'clinica' : 'veterinario'));
    }

    filtered.sort((a, b) => {
      // Distância agora é sempre KM
      const aDist = a.distancia ?? Number.POSITIVE_INFINITY;
      const bDist = b.distancia ?? Number.POSITIVE_INFINITY;
      const aEval = a.avaliacao ?? 0;
      const bEval = b.avaliacao ?? 0;

      if (sortBy === 'distancia') return aDist - bDist;
      return bEval - aEval;
    });

    setFilteredProviders(filtered);
  }, [allProviders, selectedType, sortBy]);

  // ✅ 4. Lógica de fetch refatorada para usar Services e calcular distância
  useEffect(() => {
    if (!isOpen) return;
    if (!userLocation) {
      setAllProviders([]);
      setFilteredProviders([]);
      setError("Localização não disponível. Ative o GPS para ver opções próximas.");
      return;
    }

    const fetchProviders = async () => {
      setLoading(true);
      setError(null);

      try {
        // Busca os dados usando os Services
        const [clinicsData, vetsData] = await Promise.all([
          ClinicaService.getPublicMapList(), //
          VeterinarioService.getAutonomos(userLocation.lat, userLocation.lng) //
        ]);

        // Processa Clínicas: Elas não vêm com distância, precisamos calcular
        const clinics: Provider[] = clinicsData
          .map(c => {
            if (!c.localizacao) return { ...c, distancia: Infinity };
            const [latStr, lngStr] = c.localizacao.split(",");
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            if (isNaN(lat) || isNaN(lng)) return { ...c, distancia: Infinity };
            
            // Calcula a distância (em KM)
            const dist = calcularDistancia(userLocation, { lat, lng });
            return { ...c, distancia: dist };
          });

        // Processa Vets: Eles vêm com distância em Metros, convertemos para KM
        const vets: Provider[] = vetsData.map(v => ({
            ...v,
            distancia: v.distancia ? v.distancia / 1000 : Infinity // Converte M para KM
        }));

        setAllProviders([...clinics, ...vets]);
        if ([...clinics, ...vets].length === 0) setError('Nenhum prestador encontrado próximo.');

      } catch (err: any) {
        console.error('Erro ao buscar prestadores:', err);
        setError(err.response?.data?.error || err.message || 'Erro ao carregar prestadores próximos.');
        setAllProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [isOpen, userLocation]);

  if (!isOpen) return null;

  // ✅ 5. JSX Refatorado (Nomes e Distância Corrigidos)
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 right-0 w-28 h-28 bg-[#25A18E]/10 rounded-bl-full -z-10" />
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#004E64] flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#25A18E]" />
              Escolher Prestador
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <XCircle size={24} />
            </button>
          </div>

          <div className="flex gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="flex-1 p-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#25A18E]"
            >
              <option value="todos">Todos</option>
              <option value="clinicas">Apenas Clínicas</option>
              <option value="veterinarios">Apenas Veterinários</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 p-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-[#25A18E]"
            >
              <option value="distancia">Por Distância</option>
              <option value="avaliacao">Por Avaliação</option>
            </select>
          </div>
        </div>

        {/* Lista de Prestadores */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-[#25A18E]" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-10 text-red-600">{error}</div>
          )}

          {!loading && !error && filteredProviders.length === 0 && (
            <p className="text-center py-10 text-gray-500">Nenhum prestador encontrado próximo.</p>
          )}

          {!loading && !error && filteredProviders.map((provider) => (
            <button
              key={`${provider.tipo}-${provider.id}`}
              onClick={() => {
                onSelect(provider);
                onClose();
              }}
              className="w-full flex justify-between items-start border border-gray-200 hover:border-[#25A18E] hover:bg-[#EAF9F5] transition-all duration-200 rounded-lg p-4 text-left shadow-sm hover:shadow-md"
            >
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  {provider.tipo === 'clinica' ? (
                    <Building2 className="w-4 h-4 text-[#25A18E] flex-shrink-0" />
                  ) : (
                    <User className="w-4 h-4 text-[#25A18E] flex-shrink-0" />
                  )}
                  {/* ✅ CORREÇÃO DO NOME */}
                  <h3 className="font-semibold text-base text-gray-900 leading-tight">
                    {provider.nome_fantasia || provider.nome_completo}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 flex items-start gap-1.5 mt-1">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span>{provider.endereco || 'Endereço não informado'}</span>
                </p>
              </div>

              {/* ✅ CORREÇÃO DA DISTÂNCIA (agora em KM) */}
              <div className="text-right flex-shrink-0 w-20">
                {provider.distancia !== Infinity && provider.distancia != null ? (
                  <span className="text-sm text-[#004E64] font-bold block">
                    {provider.distancia < 1 ? 
                      `${Math.round(provider.distancia * 1000)} m` : // Mostra em metros
                      `${provider.distancia.toFixed(1)} km` // Mostra em KM
                    }
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 block">—</span>
                )}
                
                {(provider.avaliacao ?? 0) > 0 && (
                  <span className="text-xs text-gray-500 block mt-1 flex items-center justify-end gap-1">
                    <Star size={12} className="text-yellow-500 fill-current" /> 
                    {(provider.avaliacao ?? 0).toFixed(1)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}