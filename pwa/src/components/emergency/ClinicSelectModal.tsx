import { useState, useEffect } from "react";
import { Loader2, MapPin, Building2, XCircle, User } from "lucide-react";

interface ClinicSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (provider: any) => void;
  visitaTipo: string;
  userLocation: { lat: number; lng: number } | null;
}

interface Provider {
  id: number;
  nome?: string;
  nome_completo?: string;
  endereco?: string;
  distancia?: number;
  disponivel_24h?: boolean;
  avaliacao?: number;
  tipo: 'clinica' | 'veterinario';
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

  // Atualiza a lista filtrada quando mudam os dados, tipo ou ordenação
  useEffect(() => {
    let filtered = [...allProviders];

    if (selectedType !== 'todos') {
      filtered = filtered.filter(p => p.tipo === (selectedType === 'clinicas' ? 'clinica' : 'veterinario'));
    }

    filtered.sort((a, b) => {
      const aDist = a.distancia ?? Number.POSITIVE_INFINITY;
      const bDist = b.distancia ?? Number.POSITIVE_INFINITY;
      const aEval = a.avaliacao ?? 0;
      const bEval = b.avaliacao ?? 0;

      if (sortBy === 'distancia') return aDist - bDist;
      return bEval - aEval;
    });

    setFilteredProviders(filtered);
  }, [allProviders, selectedType, sortBy]);

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
  const API_URL = (import.meta as any).env?.VITE_API_URL || (import.meta as any).VITE_API_URL || '';
        const [clinicsResponse, vetsResponse] = await Promise.all([
          fetch(`${API_URL}/api/clinicas-publicas?lat=${userLocation.lat}&lng=${userLocation.lng}`),
          fetch(`${API_URL}/api/veterinarios-autonomos?lat=${userLocation.lat}&lng=${userLocation.lng}`)
        ]);

        const [clinicsJson, vetsJson] = await Promise.all([
          clinicsResponse.json(),
          vetsResponse.json()
        ]);

        if (clinicsJson.error || vetsJson.error) {
          console.error('Erro na resposta:', { clinics: clinicsJson, vets: vetsJson });
          setError(clinicsJson.error || vetsJson.error || 'Erro ao carregar prestadores.');
          setAllProviders([]);
          return;
        }

        const clinics: Provider[] = Array.isArray(clinicsJson) ? clinicsJson.map((c: any) => ({ ...c, tipo: 'clinica' })) : [];
        const vets: Provider[] = Array.isArray(vetsJson) ? vetsJson.map((v: any) => ({ ...v, tipo: 'veterinario' })) : [];

        setAllProviders([...clinics, ...vets]);
        if ([...clinics, ...vets].length === 0) setError('Nenhum prestador encontrado próximo.');
      } catch (err) {
        console.error('Erro ao buscar prestadores:', err);
        setError('Erro ao carregar prestadores próximos.');
        setAllProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [isOpen, userLocation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-[#25A18E]/10 rounded-bl-full -z-10" />
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#004E64] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#25A18E]" />
              Escolher Prestador
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <XCircle size={22} />
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="flex-1 p-2 rounded border border-gray-200 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="clinicas">Apenas Clínicas</option>
              <option value="veterinarios">Apenas Veterinários</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 p-2 rounded border border-gray-200 text-sm"
            >
              <option value="distancia">Por Distância</option>
              <option value="avaliacao">Por Avaliação</option>
            </select>
          </div>

          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-[#25A18E]" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-6 text-red-600 text-sm">{error}</div>
          )}

          {!loading && !error && filteredProviders.length > 0 && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {filteredProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => {
                    onSelect(provider);
                    onClose();
                  }}
                  className="w-full flex justify-between items-center border border-gray-200 hover:border-[#25A18E] hover:bg-[#EAF9F5] transition rounded-lg p-3"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      {provider.tipo === 'clinica' ? (
                        <Building2 className="w-4 h-4 text-[#25A18E]" />
                      ) : (
                        <User className="w-4 h-4 text-[#25A18E]" />
                      )}
                      <h3 className="font-medium text-gray-800">
                        {provider.tipo === 'clinica' ? provider.nome : provider.nome_completo}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={12} />
                      {provider.endereco || 'Endereço não informado'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#25A18E] font-semibold block">
                      {provider.distancia ? `${Math.round(provider.distancia)} m` : '—'}
                    </span>
                    {(provider.avaliacao ?? 0) > 0 && (
                      <span className="text-xs text-gray-500 block mt-1">⭐ {(provider.avaliacao ?? 0).toFixed(1)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && !error && filteredProviders.length === 0 && (
            <p className="text-center py-6 text-gray-500 text-sm">Nenhum prestador encontrado próximo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
