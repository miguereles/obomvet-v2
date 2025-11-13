import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// ✅ 1. CORREÇÃO DE IMPORTS (Removendo extensões)
import ClinicMap from "../components/ClinicMap";
import {
  ArrowLeft,
  Phone,
  Map,
  Loader2,
  AlertTriangle,
  Clock, // Novo ícone
  ListChecks, // Novo ícone
} from "lucide-react";
import ClinicaService from "../services/ClinicaService";
import { Provider } from "../services/types";

type UserLocation = [number, number]; // [lat, lng]

// ==========================
// ✅ 2. NOVO COMPONENTE DE FILTRO
// (Substitui o FilterToggle por um switch mais claro e bonito)
// ==========================
function FilterSwitch({
  enabled,
  setEnabled,
}: {
  enabled: boolean;
  setEnabled: (val: boolean) => void;
}) {
  const label = enabled ? "Apenas 24h" : "Todas as Clínicas";
  const Icon = enabled ? Clock : ListChecks;

  return (
    <div className="flex items-center gap-3 mb-4 p-3 bg-white/10 rounded-lg">
      <Icon
        className={`w-6 h-6 transition-colors ${
          enabled ? "text-blue-300" : "text-gray-200"
        }`}
      />
      <span className="font-medium text-white flex-1">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled(!enabled)}
        className={`relative inline-flex items-center h-7 w-12 flex-shrink-0 rounded-full cursor-pointer transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-white/50
          ${enabled ? "bg-blue-400" : "bg-gray-700"}
        `}
      >
        <span className="sr-only">Filtrar clínicas 24h</span>
        <motion.span
          aria-hidden="true"
          className="inline-block w-5 h-5 bg-white rounded-full shadow-lg transform ring-0 transition duration-200 ease-in-out"
          layout
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
          style={{ x: enabled ? "1.4rem" : "0.4rem" }}
        />
      </button>
    </div>
  );
}
// ==========================
// FIM DO NOVO COMPONENTE
// ==========================

export default function ClinicPage() {
  const [allClinics, setAllClinics] = useState<Provider[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Provider | null>(null);
  const [hoveredClinic, setHoveredClinic] = useState<Provider | null>(null);

  // ✅ 3. ESTADOS DE LOADING SEPARADOS (Correção de Bug)
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingClinics, setLoadingClinics] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [filter24h, setFilter24h] = useState(false);

  const navigate = useNavigate();

  // ---------- 1. CALCULAR DISTÂNCIA (Sem alterações) ----------
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

  // ---------- 2. LOCALIZAÇÃO DO USUÁRIO (Corrigido) ----------
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLoadingLocation(false); // ✅ Localização obtida
          setLoadingClinics(true); // ✅ Começa a carregar clínicas
        },
        (err) => {
          console.error("Erro ao obter localização:", err);
          setError("Ative sua localização para vermos as clínicas próximas.");
          setLoadingLocation(false); // ✅ Erro de localização
          setLoadingClinics(true); // ✅ Tenta carregar clínicas mesmo assim
        }
      );
    } else {
      setError("Geolocalização não é suportada neste navegador.");
      setLoadingLocation(false); // ✅ Sem suporte
      setLoadingClinics(true); // ✅ Tenta carregar clínicas mesmo assim
    }
  }, []);

  // ---------- 3. FETCH DAS CLÍNICAS (Corrigido) ----------
  useEffect(() => {
    // Só busca clínicas DEPOIS de tentar pegar a localização
    if (loadingLocation) return;

    ClinicaService.getPublicMapList()
      .then((data: Provider[]) => {
        let dataProcessada = data;

        if (userLocation) {
          dataProcessada = data
            .map((clinic) => {
              if (!clinic.localizacao) return null;
              const [latStr, lngStr] = clinic.localizacao.split(",");
              const lat = parseFloat(latStr);
              const lng = parseFloat(lngStr);
              if (isNaN(lat) || isNaN(lng)) return null;

              return {
                ...clinic,
                distancia: calcularDistancia(userLocation, [lat, lng]),
              };
            })
            .filter(Boolean) as Provider[];

          dataProcessada.sort((a, b) => a.distancia! - b.distancia!);
        }

        setAllClinics(dataProcessada);
        setError(null);
      })
      .catch((err) => {
        console.error("Erro ao buscar clínicas:", err);
        setError(err.response?.data?.message || "Erro ao carregar clínicas.");
      })
      .finally(() => {
        setLoadingClinics(false); // ✅ Terminou de carregar clínicas
      });
  }, [loadingLocation, userLocation]); // Roda quando a localização é obtida (ou falha)

  // ---------- 4. FILTRO 24h (Sem alterações) ----------
  const filteredClinics = useMemo(
    () => allClinics.filter((c) => !filter24h || c.disponivel_24h),
    [allClinics, filter24h]
  );

  // ---------- 5. AÇÕES (Sem alterações) ----------
  const abrirRota = (clinic: Provider) => {
    const destino = clinic.localizacao;
    const origem = userLocation ? `${userLocation[0]},${userLocation[1]}` : "";
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origem}&destination=${destino}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const ligarParaClinica = (telefone: string) => {
    window.open(`tel:${telefone}`);
  };

  // Mensagem de loading dinâmica
  const loadingMessage = loadingLocation
    ? "Obtendo sua localização..."
    : "Buscando clínicas próximas...";

  // ---------- 6. RENDER (Layout Mobile-First) ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004E64] to-[#25A18E] flex flex-col">
      {/* CABEÇALHO */}
      <header className="pt-6 px-4 sm:px-6 md:px-10 flex justify-between items-center z-10">
        <button
          className="flex items-center gap-2 text-white font-semibold hover:text-gray-200 transition"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-white text-right">
          Clínicas Próximas
        </h1>
      </header>
      <p className="text-center text-gray-200 text-sm md:text-base mt-1 mb-4 px-4 z-10">
        Encontre a ajuda mais próxima para o seu pet.
      </p>

      {/* ✅ 4. LAYOUT ATUALIZADO (Mobile-First) */}
      {/* ⚠️ CORREÇÃO: Removido 'overflow-hidden' para permitir o 'sticky' do mapa */}
      <main className="flex-1 flex flex-col md:flex-row items-start justify-center gap-6 px-4 sm:px-6 md:px-10 pb-6">
        
        {/* COLUNA DA LISTA (Aparece primeiro no mobile) */}
        {/* ⚠️ CORREÇÃO: Adicionado 'md:max-h-[calc(100vh-150px)]' para o scroll da lista funcionar */}
        <div className="w-full md:w-2/5 flex flex-col h-full">
          {/* O filtro agora é o novo componente */}
          <FilterSwitch enabled={filter24h} setEnabled={setFilter24h} />

          {/* Container da lista com scroll independente */}
          <div className="flex-1 overflow-y-auto space-y-4 md:pr-2 md:max-h-[calc(100vh-210px)]">
            {(loadingLocation || loadingClinics) && (
              <div className="flex flex-col items-center justify-center bg-white/90 rounded-2xl p-10 shadow-lg">
                <Loader2 className="animate-spin text-4xl text-[#25A18E]" />
                <p className="mt-4 font-semibold text-[#004E64]">
                  {loadingMessage}
                </p>
              </div>
            )}

            {error && !loadingClinics && (
              <div className="flex flex-col items-center justify-center bg-red-50 rounded-2xl p-10 shadow-lg border border-red-200">
                <AlertTriangle className="text-4xl text-red-500" />
                <p className="mt-4 font-semibold text-red-700 text-center">
                  {error}
                </p>
              </div>
            )}

            {!loadingClinics && !error && filteredClinics.length === 0 && (
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
                      ${
                        selectedClinic?.id === clinic.id
                          ? "ring-4 ring-blue-500 ring-offset-2 ring-offset-[#004E64]"
                          : "hover:shadow-xl hover:scale-[1.02]"
                      }
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
                    <div
                      className={`p-5 ${
                        isNearest
                          ? "bg-teal-50 border-l-4 border-teal-500"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h2 className="font-bold text-xl text-[#004E64] mb-1 pr-2">
                          {clinic.nome_fantasia || clinic.nome_completo}
                        </h2>
                        {isNearest && (
                          <span className="block text-xs font-bold text-teal-800 bg-teal-200 px-2 py-1 rounded-full whitespace-nowrap">
                            Mais Próxima
                          </span>
                        )}
                      </div>

                      {clinic.disponivel_24h ? (
                        <p className="font-semibold text-green-600 text-sm mb-2">
                          ✅ Aberto 24h
                        </p>
                      ) : (
                        <p className="font-semibold text-gray-600 text-sm mb-2">
                          Horário:{" "}
                          {(clinic as any).horario_funcionamento ||
                            "Não informado"}
                        </p>
                      )}

                      <p className="text-sm text-gray-500 mb-3">
                        {clinic.endereco}
                      </p>
                      {clinic.distancia && (
                        <p className="text-base font-semibold text-blue-600 mb-4">
                          Distância: {clinic.distancia.toFixed(1)} km
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-gray-200">
                      <button
                        className="bg-white text-red-600 p-4 font-bold hover:bg-red-50 transition flex items-center justify-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          ligarParaClinica(clinic.telefone_emergencia);
                        }}
                      >
                        <Phone size={18} /> Ligar Agora
                      </button>
                      <button
                        className="bg-white text-blue-600 p-4 font-bold hover:bg-blue-50 transition flex items-center justify-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirRota(clinic);
                        }}
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

        {/* COLUNA DO MAPA (Aparece embaixo no mobile, fixo no desktop) */}
        {/* ⚠️ CORREÇÃO: Trocado 'md:h-full' por 'md:h-[calc(100vh-150px)]' */}
        <div className="w-full h-[400px] md:h-[calc(100vh-150px)] md:w-3/5 rounded-2xl overflow-hidden shadow-2xl md:sticky md:top-6">
          <ClinicMap
            clinics={filteredClinics}
            userLocation={userLocation}
            selectedClinic={selectedClinic}
            hoveredClinic={hoveredClinic}
          />
        </div>
      </main>
    </div>
  );
}