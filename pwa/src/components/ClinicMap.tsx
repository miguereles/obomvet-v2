import { useState, useEffect, useRef } from "react";
import { 
  AlertTriangle, 
  MapPin, 
  List, 
  Loader2, 
  Navigation, 
  BriefcaseMedical, 
  User, 
  Phone, 
  Crosshair, 
  Plus, 
  Minus, 
  Map as MapIcon,
  Satellite
} from "lucide-react";

// ============================================================================
// 1. UTILITÁRIOS DE MAPA (Projeção Mercator)
// ============================================================================

const TILE_SIZE = 256;

function latLonToPoint(lat: number, lon: number, zoom: number) {
  const x = (lon + 180) / 360 * Math.pow(2, zoom);
  const y = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
  return { x: x * TILE_SIZE, y: y * TILE_SIZE };
}

function getTileUrl(x: number, y: number, z: number) {
  return `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${Math.floor(x)}/${Math.floor(y)}.png`;
}

// ============================================================================
// 2. COMPONENTE DE MAPA (Tile Engine)
// ============================================================================

export interface Clinic {
  id: number;
  nome_fantasia: string;
  endereco: string;
  localizacao: string;
  telefone_emergencia: string;
}
export type UserLocation = [number, number];

interface ClinicMapProps {
  clinics: Clinic[];
  userLocation: UserLocation | null;
  selectedClinic: Clinic | null;
  onSelectClinic: (clinic: Clinic) => void;
}

function ClinicMap({ clinics, userLocation, selectedClinic, onSelectClinic }: ClinicMapProps) {
  const [zoom, setZoom] = useState(15);
  const [center, setCenter] = useState<UserLocation | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Inicializa centro com usuário
  useEffect(() => {
    if (userLocation && !center) {
      setCenter(userLocation);
    }
  }, [userLocation, center]);

  // Atualiza dimensões ao redimensionar
  useEffect(() => {
    const updateDimensions = () => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Centraliza na clínica selecionada
  useEffect(() => {
    if (selectedClinic) {
        const parts = selectedClinic.localizacao.split(",");
        if (parts.length === 2) {
            const lat = parseFloat(parts[0].trim());
            const lng = parseFloat(parts[1].trim());
            setCenter([lat, lng]);
            setZoom(16); 
        }
    }
  }, [selectedClinic]);

  const centerOnUser = () => {
      if (userLocation) {
          setCenter(userLocation);
          setZoom(15);
      }
  };

  const renderTiles = () => {
    if (!center) return null;

    const centerPoint = latLonToPoint(center[0], center[1], zoom);
    const tiles = [];
    const cols = Math.ceil(dimensions.width / TILE_SIZE) + 2;
    const rows = Math.ceil(dimensions.height / TILE_SIZE) + 2;
    const startX = (centerPoint.x - dimensions.width / 2) / TILE_SIZE;
    const startY = (centerPoint.y - dimensions.height / 2) / TILE_SIZE;

    for (let i = -1; i < cols - 1; i++) {
      for (let j = -1; j < rows - 1; j++) {
        const tx = Math.floor(startX + i);
        const ty = Math.floor(startY + j);
        const posX = (tx * TILE_SIZE) - centerPoint.x + dimensions.width / 2;
        const posY = (ty * TILE_SIZE) - centerPoint.y + dimensions.height / 2;

        tiles.push(
          <img
            key={`${tx}-${ty}-${zoom}`}
            src={getTileUrl(tx, ty, zoom)}
            alt=""
            className="absolute select-none pointer-events-none transition-opacity duration-300"
            style={{ left: posX, top: posY, width: TILE_SIZE, height: TILE_SIZE }}
          />
        );
      }
    }
    return tiles;
  };

  const renderMarkers = () => {
      if (!center) return null;
      const centerPoint = latLonToPoint(center[0], center[1], zoom);

      const getScreenPos = (lat: number, lon: number) => {
          const p = latLonToPoint(lat, lon, zoom);
          return {
              left: p.x - centerPoint.x + dimensions.width / 2,
              top: p.y - centerPoint.y + dimensions.height / 2
          };
      };

      return (
          <>
            {/* Marcador do Usuário */}
            {userLocation && (
                <div 
                    className="absolute z-20 flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
                    style={getScreenPos(userLocation[0], userLocation[1])}
                >
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md animate-pulse ring-4 ring-blue-500/20"></div>
                    <div className="w-10 h-10 bg-[#004E64] rounded-full rounded-bl-none transform rotate-45 border-2 border-white shadow-xl flex items-center justify-center -mt-2 hover:scale-110 transition-transform">
                        <User size={20} color="white" className="-rotate-45" />
                    </div>
                    <div className="mt-2 bg-white px-2 py-0.5 rounded-md text-[10px] font-bold text-[#004E64] shadow-sm whitespace-nowrap z-20 border border-gray-100">
                        Você
                    </div>
                </div>
            )}

            {/* Marcadores das Clínicas */}
            {clinics.map(clinic => {
                const parts = clinic.localizacao.split(",");
                if (parts.length !== 2) return null;
                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);
                const pos = getScreenPos(lat, lng);
                const isSelected = selectedClinic?.id === clinic.id;

                return (
                    <div
                        key={clinic.id}
                        onClick={() => onSelectClinic(clinic)}
                        className={`absolute z-10 cursor-pointer flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isSelected ? 'z-30' : ''}`}
                        style={{ left: pos.left, top: pos.top }}
                    >
                        <div className={`
                            w-10 h-10 rounded-full rounded-bl-none transform rotate-45 border-2 shadow-lg flex items-center justify-center transition-all duration-300
                            ${isSelected ? 'bg-[#FF6B6B] border-white scale-125 shadow-red-200' : 'bg-[#25A18E] border-white hover:scale-110 hover:bg-[#208B7C]'}
                        `}>
                            <BriefcaseMedical size={18} color="white" className="-rotate-45" />
                        </div>

                        {/* Tooltip Dinâmico */}
                        <div className={`
                            absolute bottom-full mb-3 w-56 bg-white p-3 rounded-xl shadow-xl border border-gray-100 text-left 
                            transition-all duration-300 origin-bottom z-50
                            ${isSelected ? 'opacity-100 scale-100 visible translate-y-0' : 'opacity-0 scale-90 invisible translate-y-2'}
                        `}>
                            <h3 className="font-bold text-[#004E64] text-sm mb-1 leading-tight">{clinic.nome_fantasia}</h3>
                            <p className="text-xs text-gray-500 flex items-start gap-1 mb-2 leading-snug">
                                <MapPin size={12} className="mt-0.5 shrink-0"/> {clinic.endereco}
                            </p>
                            <div className="bg-red-50 text-red-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-2 w-full">
                                <Phone size={12}/> {clinic.telefone_emergencia}
                            </div>
                            <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-gray-100"></div>
                        </div>
                    </div>
                );
            })}
          </>
      );
  };

  return (
    <div ref={containerRef} className="h-full w-full rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative bg-[#f0f4f8] group select-none">
        
        {/* Mensagem de Carregamento Inicial */}
        {!center && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-50 text-slate-400">
                <Loader2 className="animate-spin mb-2" size={32}/> 
                <span className="text-sm font-medium">Carregando Mapa...</span>
            </div>
        )}

        {/* Camadas */}
        <div className="absolute inset-0 overflow-hidden">
            {renderTiles()}
            {renderMarkers()}
        </div>

        {/* Créditos OSM */}
        <div className="absolute bottom-1 right-1 text-[8px] text-gray-400 bg-white/50 px-1 rounded z-10">
            © OpenStreetMap contributors, © CARTO
        </div>

        {/* Controles Flutuantes */}
        <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-40">
            <button onClick={centerOnUser} className="bg-white p-2.5 rounded-xl shadow-lg hover:bg-gray-50 text-blue-600 transition-transform active:scale-95 border border-gray-100" title="Minha Localização">
                <Crosshair size={20} />
            </button>
            <div className="flex flex-col bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <button onClick={() => setZoom(z => Math.min(z + 1, 19))} className="p-2.5 hover:bg-gray-50 border-b border-gray-100 active:bg-gray-100"><Plus size={20}/></button>
                <button onClick={() => setZoom(z => Math.max(z - 1, 10))} className="p-2.5 hover:bg-gray-50 active:bg-gray-100"><Minus size={20}/></button>
            </div>
        </div>

        {/* Status do GPS */}
        <div className="absolute top-4 left-4 z-40 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-gray-200 text-xs font-medium text-gray-600 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${userLocation ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            <span>{userLocation ? `GPS Ativo` : 'Buscando Sinal...'}</span>
        </div>
    </div>
  );
}

// ============================================================================
// 3. INTEGRAÇÃO COM BACKEND (Service)
// ============================================================================

const ClinicaService = {
  getAll: async () => {
    // ✅ Uso da variável de ambiente com fallback seguro para o preview
    // A variável `env` garante que o código não quebre se `import.meta.env` não existir
    const env = (import.meta as any).env || {};
    const API_BASE_URL = `${env.VITE_API_URL || 'http://localhost:8000'}/api`;
    
    try {
      // Utilizando a rota solicitada: /clinicas-publicas
      const response = await fetch(`${API_BASE_URL}/clinicas-publicas`);
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error("Erro ao conectar API:", error);
      return [];
    }
  }
};

// Cálculo de Distância (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
}

// ============================================================================
// 4. PÁGINA PRINCIPAL
// ============================================================================

export default function EmergencyDashboardPage() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [gpsAccuracy, setGpsAccuracy] = useState<string>("");
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const fetchRealClinics = async () => {
      try {
          const data = await ClinicaService.getAll();
          // Lida com possíveis formatos de retorno do Laravel (paginação ou direto)
          const clinicsList = Array.isArray(data) ? data : (data.data || data.clinicas || []);
          
          // Normaliza e filtra dados
          return clinicsList.map((c: any) => ({
              id: c.id,
              nome_fantasia: c.nome_fantasia || c.nome || "Clínica Registrada",
              endereco: c.endereco || "Endereço não informado",
              localizacao: (c.localizacao && c.localizacao.includes(',')) ? c.localizacao : null, 
              telefone_emergencia: c.telefone_emergencia || c.telefone || "(00) 0000-0000"
          })).filter((c: Clinic) => c.localizacao !== null);
      } catch { return []; }
  };

  useEffect(() => {
    const geoOptions = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };

    const success = async (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      setUserLocation([lat, lng]);
      
      if (accuracy < 20) setGpsAccuracy("Alta (GPS)");
      else if (accuracy < 100) setGpsAccuracy("Média (Wi-Fi)");
      else setGpsAccuracy("Baixa (Celular)");

      setClinics(prev => {
          // Carrega clínicas apenas se a lista estiver vazia
          if (prev.length === 0) {
              fetchRealClinics().then(systemClinics => {
                  if (systemClinics.length > 0) {
                      const sorted = [...systemClinics].sort((a, b) => {
                          const [latA, lngA] = a.localizacao.split(",").map(Number);
                          const [latB, lngB] = b.localizacao.split(",").map(Number);
                          return calculateDistance(lat, lng, latA, lngA) - calculateDistance(lat, lng, latB, lngB);
                      });
                      setClinics(sorted);
                      setSelectedClinic(sorted[0]); // Seleciona a mais próxima automaticamente
                  }
                  setLoading(false);
              });
              return []; 
          }
          setLoading(false);
          return prev;
      });
    };

    const error = () => {
        setLoading(false);
        // Você pode adicionar um fallback para uma posição padrão se desejar
        // setUserLocation([-23.5505, -46.6333]); 
    };

    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(success, error, geoOptions);
    } else {
      setLoading(false);
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col space-y-4 h-[calc(100vh-2rem)] sm:h-full overflow-hidden bg-gray-50/50">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-red-50/80 p-4 rounded-2xl border border-red-100 gap-3 shadow-sm shrink-0 backdrop-blur-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="fill-red-100 text-red-600" /> Emergência Veterinária
          </h2>
          <p className="text-red-600/80 text-sm mt-1 font-medium">
            {loading ? "Buscando clínicas próximas..." : `${clinics.length} clínicas encontradas na sua região.`}
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-red-100 shadow-sm">
            {loading ? (
                <>
                    <Loader2 className="animate-spin text-red-500" size={18}/>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-red-500">Calibrando...</span>
                    </div>
                </>
            ) : (
                <>
                    <Satellite size={18} className={`text-green-600 ${gpsAccuracy.includes('Alta') ? 'fill-green-100' : ''}`} />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider leading-none mb-0.5">Sinal</span>
                        <span className="text-xs font-bold text-green-700 leading-none">{gpsAccuracy || "Aguardando"}</span>
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Layout Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Lista Lateral (Responsivo: h-auto no mobile para scroll, fixo no desktop) */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-[300px] lg:h-full order-2 lg:order-1">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 font-semibold text-gray-700 flex items-center justify-between shrink-0">
                <span className="flex items-center gap-2"><List size={18} className="text-gray-400"/> Resultados</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{clinics.length}</span>
            </div>
            
            <div className="overflow-y-auto p-2 space-y-2 flex-1 custom-scrollbar">
                {loading && clinics.length === 0 && (
                    // Skeleton Loader
                    [1,2,3].map(i => (
                        <div key={i} className="p-4 rounded-xl border border-gray-100 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2 mb-3"></div>
                            <div className="h-6 bg-gray-100 rounded w-1/3"></div>
                        </div>
                    ))
                )}

                {clinics.map((clinic, index) => {
                    const isSelected = selectedClinic?.id === clinic.id;
                    let distanceLabel = "";
                    if (userLocation) {
                        const [cLat, cLng] = clinic.localizacao.split(",").map(Number);
                        const dist = calculateDistance(userLocation[0], userLocation[1], cLat, cLng);
                        distanceLabel = dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`;
                    }

                    return (
                        <button
                            key={clinic.id}
                            onClick={() => setSelectedClinic(clinic)}
                            className={`w-full text-left p-4 rounded-xl border transition-all group relative overflow-hidden ${
                                isSelected ? "bg-blue-50 border-blue-200 ring-1 ring-blue-300/50 shadow-sm" : "bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                        >
                            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"/>}
                            
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`font-bold transition-colors ${isSelected ? 'text-blue-800' : 'text-gray-800 group-hover:text-blue-700'}`}>{clinic.nome_fantasia}</h4>
                                {index === 0 && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200 whitespace-nowrap shadow-sm">Mais Próxima</span>}
                            </div>

                            <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                                <MapPin size={14} className="text-gray-400 shrink-0"/> <span className="truncate">{clinic.endereco}</span>
                            </p>
                            
                            <div className="mt-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="inline-flex items-center gap-1.5 bg-white text-gray-700 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-sm group-hover:border-blue-200 group-hover:text-blue-700 transition-colors">
                                        <Phone size={12} /> {clinic.telefone_emergencia}
                                    </div>
                                    {distanceLabel && <span className="text-xs font-medium text-gray-400 flex items-center gap-1"><MapIcon size={12}/> {distanceLabel}</span>}
                                </div>
                            </div>
                        </button>
                    );
                })}

                {!loading && clinics.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center mt-10">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <MapPin size={24} className="opacity-30"/>
                        </div>
                        <p className="text-sm font-medium">Nenhuma clínica encontrada.</p>
                        <p className="text-xs mt-1 opacity-70">Verifique se o GPS está ativo.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Mapa com Ruas */}
        <div className="lg:col-span-2 h-[350px] sm:h-[450px] lg:h-full bg-slate-100 rounded-2xl relative shadow-inner overflow-hidden border border-gray-200 order-1 lg:order-2">
            <ClinicMap 
                clinics={clinics} 
                userLocation={userLocation}
                selectedClinic={selectedClinic}
                onSelectClinic={setSelectedClinic}
            />
        </div>

      </div>
    </div>
  );
}