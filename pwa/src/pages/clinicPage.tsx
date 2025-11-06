import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ClinicMap from "../components/ClinicMap";
import { ArrowLeft, Phone, Map, Loader2, AlertTriangle, Moon, Sun } from "lucide-react";
// ✅ 1. Importe o Service e o Tipo
import ClinicaService from "../services/ClinicaService";
import { Provider } from "../services/types";

// ❌ Interface Clinic removida (usamos a Provider)
type UserLocation = [number, number]; // [lat, lng]

function FilterToggle({ enabled, setEnabled }: { enabled: boolean; setEnabled: (val: boolean) => void }) {
  return (
    <div className="flex items-center gap-2 mb-4 p-3 bg-white/10 rounded-lg">
      <span className="font-semibold text-white">Filtro:</span>
      <div
        className={`flex items-center w-20 h-10 p-1 rounded-full cursor-pointer transition-colors ${enabled ? "bg-blue-500" : "bg-gray-700"}`}
        onClick={() => setEnabled(!enabled)}
      >
        <motion.div
          className="w-8 h-8 bg-white rounded-full shadow-md"
          layout
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
        >
          {enabled ? <Moon className="p-2 text-blue-500" /> : <Sun className="p-2 text-yellow-500" />}
        </motion.div>
      </div>
      <span className="font-medium text-white">Abertas 24h</span>
    </div>
  );
}

export default function ClinicPage() {
  const [allClinics, setAllClinics] = useState<Provider[]>([]); // ✅ 2. Tipo alterado para Provider
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const [selectedClinic, setSelectedClinic] = useState<Provider | null>(null); // ✅ 2. Tipo alterado
  const [hoveredClinic, setHoveredClinic] = useState<Provider | null>(null); // ✅ 2. Tipo alterado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter24h, setFilter24h] = useState(false);

  const navigate = useNavigate();

  // ---------- 1. CALCULAR DISTÂNCIA ----------
  const calcularDistancia = (loc1: UserLocation, loc2: UserLocation) => {
    const [lat1, lng1] = loc1;
    const [lat2, lng2] = loc2;
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

  // ---------- 2. LOCALIZAÇÃO DO USUÁRIO ----------
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          console.error("Erro ao obter localização:", err);
          setError("Por favor, ative sua localização para vermos as clínicas próximas.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocalização não é suportada neste navegador.");
      setLoading(false);
    }
  }, []);

  // ---------- 3. FETCH DAS CLÍNICAS (REFATORADO) ----------
  useEffect(() => {
    setLoading(true);
    // ✅ 3. Use o Service!
    ClinicaService.getPublicMapList()
      .then((data: Provider[]) => {
        let dataProcessada = data;

        if (userLocation) {
          dataProcessada = data
            .map((clinic) => {
              if (!clinic.localizacao) return null; // ignora clínicas sem localização
              
              // O service já limpa "L:" e "G:", apenas converte
              const [latStr, lngStr] = clinic.localizacao.split(",");
              const lat = parseFloat(latStr);
              const lng = parseFloat(lngStr);

              if (isNaN(lat) || isNaN(lng)) return null; // ignora NaN
              
              return { 
                ...clinic, 
                distancia: calcularDistancia(userLocation, [lat, lng]) 
              };
            })
            .filter(Boolean) as Provider[]; // Filtra nulos
            
          dataProcessada.sort((a, b) => (a.distancia! - b.distancia!));
        }

        setAllClinics(dataProcessada);
        setError(null);
      })
      .catch((err) => {
        console.error("Erro ao buscar clínicas:", err);
        setError(err.response?.data?.message || "Erro ao carregar clínicas.");
      })
      .finally(() => setLoading(false));
  }, [userLocation]); // Roda quando a localização é obtida

  // ---------- 4. FILTRO 24h ----------
  const filteredClinics = useMemo(() => allClinics.filter(c => !filter24h || c.disponivel_24h), [allClinics, filter24h]);

  // ---------- 5. AÇÕES ----------
  const abrirRota = (clinic: Provider) => {
    const destino = clinic.localizacao;
    const origem = userLocation ? `${userLocation[0]},${userLocation[1]}` : "";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origem}&destination=${destino}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const ligarParaClinica = (telefone: string) => {
    window.open(`tel:${telefone}`);
  };

  // ---------- 6. RENDER ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004E64] to-[#25A18E] flex flex-col">
      <header className="pt-6 px-6 md:px-16 flex justify-between items-center">
        <button
          className="flex items-center gap-2 text-white font-semibold hover:text-gray-200 transition"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-white text-right">
          Clínicas de Emergência
        </h1>
      </header>
      <p className="text-center text-gray-200 text-sm md:text-base mt-1 mb-4">
        Encontre a ajuda mais próxima para o seu pet.
      </p>

      <main className="flex-1 flex flex-col md:flex-row items-start justify-center pt-2 px-6 md:px-16 gap-6">
        <div className="w-full md:w-3/5 h-[400px] md:h-[calc(100vh-200px)] rounded-2xl overflow-hidden shadow-2xl sticky top-4">
          <ClinicMap
            clinics={filteredClinics} // ✅ 4. Tipo alterado
            userLocation={userLocation}
            selectedClinic={selectedClinic}
            hoveredClinic={hoveredClinic}
          />
        </div>

        <div className="w-full md:w-2/5 flex flex-col gap-4">
          <FilterToggle enabled={filter24h} setEnabled={setFilter24h} />

          <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-2 space-y-4">
            {loading && (
              <div className="flex flex-col items-center justify-center bg-white/90 rounded-2xl p-10 shadow-lg">
                <Loader2 className="animate-spin text-4xl text-[#25A18E]" />
                <p className="mt-4 font-semibold text-[#004E64]">
                  {userLocation ? "Buscando clínicas..." : "Aguardando sua localização..."}
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center bg-red-50 rounded-2xl p-10 shadow-lg border border-red-200">
                <AlertTriangle className="text-4xl text-red-500" />
                <p className="mt-4 font-semibold text-red-700 text-center">{error}</p>
              </div>
            )}

            {!loading && !error && filteredClinics.length === 0 && (
              <div className="flex flex-col items-center justify-center bg-white/90 rounded-2xl p-10 shadow-lg">
                <AlertTriangle className="text-4xl text-gray-500" />
                <p className="mt-4 font-semibold text-[#004E64] text-center">
                  Nenhuma clínica encontrada.
                  {filter24h && " Tente desativar o filtro 24h."}
                </p>
              </div>
            )}

            <AnimatePresence>
              {filteredClinics.map((clinic, index) => {
                const isNearest = index === 0 && !!userLocation && !filter24h;
                return (
                  <motion.div
                    key={clinic.id}
                    className={`bg-white rounded-xl shadow-lg transition-all duration-300 cursor-pointer overflow-hidden
                     ${selectedClinic?.id === clinic.id ? "ring-4 ring-blue-500 ring-offset-2" : "hover:shadow-xl hover:scale-[1.02]"}
                    `}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => setSelectedClinic(clinic)}
                    onMouseEnter={() => setHoveredClinic(clinic)}
                    onMouseLeave={() => setHoveredClinic(null)}
                  >
                    <div className={`p-5 ${isNearest ? "bg-teal-50 border-l-4 border-teal-500" : ""}`}>
                      <div className="flex justify-between items-start">
                        {/* ✅ 5. Nome do provider */}
                        <h2 className="font-bold text-xl text-[#004E64] mb-1 pr-2">{clinic.nome_fantasia || clinic.nome_completo}</h2>
                        {isNearest && (
                          <span className="block text-xs font-bold text-teal-800 bg-teal-200 px-2 py-1 rounded-full whitespace-nowrap">
                            Mais Próxima
                          </span>
                        )}
                      </div>

                      {clinic.disponivel_24h ? (
                        <p className="font-semibold text-green-600 text-sm mb-2">✅ Aberto 24h</p>
                      ) : (
                        <p className="font-semibold text-gray-600 text-sm mb-2">Horário: {(clinic as any).horario_funcionamento || "Não informado"}</p>
                      )}

                      <p className="text-sm text-gray-500 mb-3">{clinic.endereco}</p>
                      {clinic.distancia && (
                        <p className="text-base font-semibold text-blue-600 mb-4">
                          Distância: {clinic.distancia.toFixed(1)} km
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-gray-200">
                      <button
                        className="bg-white text-red-600 p-4 font-bold hover:bg-red-50 transition flex items-center justify-center gap-2"
                        onClick={(e) => { e.stopPropagation(); ligarParaClinica(clinic.telefone_emergencia); }}
                      >
                        <Phone size={18} /> Ligar Agora
                      </button>
                      <button
                        className="bg-white text-blue-600 p-4 font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"
                        onClick={(e) => { e.stopPropagation(); abrirRota(clinic); }}
                      >
                        <Map size={18} /> Ver Rota
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="w-full text-center py-4 text-xs text-gray-100 bg-[#003b50] shadow-inner mt-10">
        © {new Date().getFullYear()} oBomVet — Plataforma de Emergências Veterinárias
      </footer>
    </div>
  );
}