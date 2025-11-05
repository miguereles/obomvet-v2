import { useState, useEffect } from "react";
import { Loader2, MapPin, Building2, XCircle } from "lucide-react";

interface ClinicSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (clinic: any) => void;
  visitaTipo: string;
  userLocation: { lat: number; lng: number } | null;
}

export default function ClinicSelectModal({
  isOpen,
  onClose,
  onSelect,
  visitaTipo,
  userLocation,
}: ClinicSelectModalProps) {
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (!userLocation) {
      setClinics([]);
      setError("Localização não disponível. Ative o GPS para ver clínicas próximas.");
      return;
    }

    const fetchClinics = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `${import.meta.env.VITE_API_URL}/api/clinicas-publicas?lat=${userLocation.lat}&lng=${userLocation.lng}`;
        console.log("📡 Buscando clínicas em:", url);

        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          redirect: "follow", // deixa o Laravel responder sem erro
        });

        const text = await response.text();

        // Se o backend retornou HTML em vez de JSON
        if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
          console.error("❌ O backend retornou HTML em vez de JSON:", text.slice(0, 120));
          setError("O servidor retornou uma resposta inválida (HTML em vez de JSON).");
          setClinics([]);
          return;
        }

        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("❌ Erro ao converter resposta em JSON:", text.slice(0, 120));
          setError("Resposta inválida do servidor.");
          setClinics([]);
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          setClinics(data);
        } else {
          setClinics([]);
          setError("Nenhuma clínica encontrada próxima.");
        }
      } catch (err) {
        console.error("⚠️ Erro ao buscar clínicas:", err);
        setError("Erro ao carregar clínicas próximas.");
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, [isOpen, userLocation, visitaTipo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-[#25A18E]/10 rounded-bl-full -z-10" />
        <div className="p-6">
          {/* Cabeçalho */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-[#004E64] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#25A18E]" />
              Escolher Clínica
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
              <XCircle size={22} />
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-[#25A18E]" />
            </div>
          )}

          {/* Erro */}
          {error && !loading && (
            <div className="text-center py-6 text-red-600 text-sm">{error}</div>
          )}

          {/* Lista de Clínicas */}
          {!loading && !error && clinics.length > 0 && (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {clinics.map((clinic) => (
                <button
                  key={clinic.id}
                  onClick={() => {
                    onSelect(clinic);
                    onClose();
                  }}
                  className="w-full flex justify-between items-center border border-gray-200 hover:border-[#25A18E] hover:bg-[#EAF9F5] transition rounded-lg p-3"
                >
                  <div className="text-left">
                    <h3 className="font-medium text-gray-800">{clinic.nome_fantasia}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={12} />
                      {clinic.endereco || "Endereço não informado"}
                    </p>
                  </div>
                  <span className="text-xs text-[#25A18E] font-semibold">
                    {clinic.distancia ? `${Math.round(clinic.distancia)} m` : "—"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Nenhuma clínica */}
          {!loading && !error && clinics.length === 0 && (
            <p className="text-center py-6 text-gray-500 text-sm">
              Nenhuma clínica encontrada próxima.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
