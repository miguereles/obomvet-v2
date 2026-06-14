import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";
import { User, Building2, Navigation, MapPin, Clock, AlertCircle, WifiOff, Home } from "lucide-react";
import { Emergencia } from "../../services/types";

// Usando LCircle como alias para o Circle do react-leaflet
const LCircle = Circle; 

interface TrackingMapProps {
  emergencia: Emergencia;
  // Dados de localização com o campo accuracy (precisão)
  tutorLocation: { lat: number; lng: number; accuracy?: number | null } | null; 
  clinicLocation: { lat: number; lng: number; accuracy?: number | null } | null;
}

// -----------------------------------------------------------------------------------
// 🖼️ GERAÇÃO DE ÍCONES CUSTOMIZADOS (DivIcon)
// -----------------------------------------------------------------------------------

const createCustomIcon = (Icon: any, color: string, pulse: boolean = false) => {
  const iconHtml = ReactDOMServer.renderToStaticMarkup(
    <div className={`relative flex items-center justify-center w-12 h-12`}>
      {pulse && (
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping`} style={{ backgroundColor: color }}></span>
      )}
      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg border-2 border-white text-white`} style={{ backgroundColor: color }}>
        <Icon size={20} />
      </div>
      {/* Flecha de baixo */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]" style={{ borderTopColor: color }}></div>
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: "custom-leaflet-icon",
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
};

const tutorIcon = createCustomIcon(User, "#EF4444", true); // Vermelho (Tutor)
const clinicIcon = createCustomIcon(Building2, "#25A18E", false); // Verde (Clínica)
const vetIcon = createCustomIcon(Navigation, "#004E64", true); // Azul (Vet em movimento)
const homeIcon = createCustomIcon(Home, "#F59E0B", false); // Laranja (Casa/Domicílio)

// -----------------------------------------------------------------------------------
// 🗺️ COMPONENTE AUXILIAR PARA AJUSTE AUTOMÁTICO DO ZOOM (FIT BOUNDS)
// -----------------------------------------------------------------------------------

function AutoFitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  
  const pointsHash = points.map(p => p.join(',')).join('|');

  useEffect(() => {
    if (points.length === 0) return;
    
    try {
        if (points.length === 1) {
            // Se há apenas 1 ponto, centraliza e define um zoom fixo (15)
            map.flyTo([points[0][0], points[0][1]], 15, { duration: 1.5 }); 
        } else {
            // Se há 2 ou mais pontos, ajusta para mostrar todos
            const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
            map.flyToBounds(bounds, { padding: [80, 80], duration: 1.5 }); 
        }
    } catch(e) { console.warn("Erro ao ajustar zoom", e); }
  }, [pointsHash, map, points]); 
  return null;
}

// -----------------------------------------------------------------------------------
// ⭕ NOVO COMPONENTE: CÍRCULO DE PRECISÃO (ACURÁCIA)
// -----------------------------------------------------------------------------------

function AccuracyCircle({ location, color }: { location: { lat: number; lng: number; accuracy?: number | null } | null, color: string }) {
    // Só desenha se tivermos a localização e uma precisão razoável (acima de 10 metros de incerteza)
    if (!location || !location.accuracy || location.accuracy < 10) {
        return null;
    }

    // O valor do accuracy é o raio do erro em metros
    return (
        <LCircle
            center={[location.lat, location.lng]}
            radius={location.accuracy} 
            pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.1, 
                weight: 1.5, 
                opacity: 0.5 
            }}
        />
    );
}

// -----------------------------------------------------------------------------------
// 📐 HELPERS E FUNÇÕES DE FORMATAÇÃO
// -----------------------------------------------------------------------------------

// Helper para formatar a precisão em texto
const formatAccuracy = (accuracy: number | undefined | null) => {
    if (accuracy === undefined || accuracy === null) return "Desconhecida";
    if (accuracy <= 30) return `Alta Precisão (< ${accuracy.toFixed(0)}m)`;
    if (accuracy <= 100) return `Média Precisão (~ ${accuracy.toFixed(0)}m)`;
    return `Baixa Precisão (> ${accuracy.toFixed(0)}m)`;
}


export default function EmergencyTrackingMap({ emergencia, tutorLocation, clinicLocation }: TrackingMapProps) {
  const isSecure = window.isSecureContext;

  // --- LÓGICA DE LOADING E ERRO DE GPS ---
  if (!tutorLocation && !clinicLocation) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-100 rounded-xl text-gray-500 gap-4 p-8 text-center">
        {!isSecure ? (
            <div className="bg-red-50 p-6 rounded-xl border border-red-200 max-w-md">
                <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-red-800 font-bold text-lg">GPS Bloqueado</h3>
                <p className="text-red-600 text-sm mt-2">
                    Acesso via HTTP bloqueia geolocalização. Use HTTPS ou Localhost.
                </p>
            </div>
        ) : (
            <>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#25A18E]"></div>
                <p className="font-medium">Aguardando sinal de GPS...</p>
            </>
        )}
      </div>
    );
  }

  const isClinicVisit = emergencia.visita_tipo === "clinica";
  
  // Configuração dinâmica baseada no tipo de visita
  const mapConfig = {
    title: isClinicVisit ? "Indo à Clínica" : "Veterinário a Caminho",
    tutorLabel: isClinicVisit ? "Origem (Você)" : "Destino (Você)",
    clinicLabel: isClinicVisit ? "Destino (Clínica)" : "Origem (Equipe)",
    lineColor: isClinicVisit ? "#EF4444" : "#004E64", 
    tutorIcon: isClinicVisit ? tutorIcon : homeIcon, 
    clinicIcon: isClinicVisit ? clinicIcon : vetIcon, 
  };

  // Constrói pontos válidos para o ajuste do mapa
  const validPoints: [number, number][] = [];
  if (tutorLocation) validPoints.push([tutorLocation.lat, tutorLocation.lng]);
  if (clinicLocation) validPoints.push([clinicLocation.lat, clinicLocation.lng]);

  // Centro inicial
  const initialCenter: [number, number] = clinicLocation 
      ? [clinicLocation.lat, clinicLocation.lng] 
      : (tutorLocation ? [tutorLocation.lat, tutorLocation.lng] : [-23.5505, -46.6333]); // Default São Paulo

  // Distância (Fórmula Haversine)
  const distanceText = (tutorLocation && clinicLocation) ? (() => {
    const R = 6371; // Raio da Terra em km
    const lat1 = tutorLocation.lat * Math.PI / 180;
    const lat2 = clinicLocation.lat * Math.PI / 180;
    const dLat = lat2 - lat1;
    const dLon = (clinicLocation.lng - tutorLocation.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1) + " km";
  })() : "-- km";


  // Otimização: calcula a precisão a ser exibida no painel
  const tutorAccuracy = tutorLocation?.accuracy || 0;
  const status = tutorAccuracy <= 50 && tutorAccuracy > 0 ? 'Ótima' : (tutorAccuracy > 0 ? 'Média/Baixa' : 'Aguardando');
  const statusColor = tutorAccuracy <= 50 && tutorAccuracy > 0 ? 'text-green-600' : (tutorAccuracy > 0 ? 'text-yellow-600' : 'text-gray-500');
  const pulseColor = tutorAccuracy <= 50 && tutorAccuracy > 0 ? 'bg-green-400' : (tutorAccuracy > 0 ? 'bg-yellow-400' : 'bg-gray-400');


  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner">
      
      {/* Painel Flutuante */}
      <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-gray-100 max-w-xs w-full sm:w-auto animate-in slide-in-from-left-4 duration-500">
        <div className="flex items-center gap-2 mb-2">
            <div className="relative flex h-3 w-3">
              {(tutorLocation || clinicLocation) && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${tutorLocation || clinicLocation ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
        </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${statusColor}`}>{status}</span>
        </div>
        
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            {mapConfig.title}
        </h3>
        
        <div className="mt-3 space-y-2 text-sm text-gray-600">
             {tutorLocation && clinicLocation ? (
                <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100 text-blue-800">
                    <MapPin size={16} /> 
                    <span>Distância: <strong>{distanceText}</strong></span>
                </div>
             ) : (
                <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg text-yellow-800 border border-yellow-100">
                    <AlertCircle size={16} />
                    <span className="text-xs leading-tight">
                        Aguardando sinal de uma das partes...
                    </span>
                </div>
             )}
        </div>
      </div>

      <MapContainer
        // @ts-ignore
        center={initialCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <AutoFitBounds points={validPoints} />

        {/* Marcador do Tutor */}
        {tutorLocation && (
            <>
            <Marker position={[tutorLocation.lat, tutorLocation.lng]} icon={mapConfig.tutorIcon}>
            <Popup>
                <div className="text-center">
                <strong className="block text-base font-bold text-gray-800">{mapConfig.tutorLabel}</strong>
                <span className="block text-xs text-gray-500">Sinal GPS Ativo</span>
                {tutorLocation.accuracy && (
                    <span className="block text-xs font-semibold mt-1 text-blue-600">
                        {formatAccuracy(tutorLocation.accuracy)}
                    </span>
                )}
                </div>
            </Popup>
            </Marker>
            {/* CÍRCULO DE PRECISÃO DO TUTOR */}
            <AccuracyCircle location={tutorLocation} color={mapConfig.lineColor} /> 
            </>
        )}

        {/* Marcador da Clínica */}
        {clinicLocation && (
            <>
            <Marker 
                position={[clinicLocation.lat, clinicLocation.lng]} 
                icon={mapConfig.clinicIcon}
            >
            <Popup>
                <div className="text-center">
                <strong className="block text-base font-bold text-[#004E64]">{mapConfig.clinicLabel}</strong>
                <span className="block text-xs text-gray-500">Localização Confirmada</span>
                {clinicLocation.accuracy && (
                    <span className="block text-xs font-semibold mt-1 text-blue-600">
                        {formatAccuracy(clinicLocation.accuracy)}
                    </span>
                )}
                </div>
            </Popup>
            </Marker>
            {/* CÍRCULO DE PRECISÃO DA CLÍNICA */}
            <AccuracyCircle location={clinicLocation} color={mapConfig.lineColor} /> 
            </>
        )}

        {/* Rota (Polyline) */}
        {tutorLocation && clinicLocation && (
            <Polyline 
                positions={[
                    [tutorLocation.lat, tutorLocation.lng], 
                    [clinicLocation.lat, clinicLocation.lng]
                ]} 
                color={mapConfig.lineColor} 
                dashArray="12, 12" 
                weight={4}
                opacity={0.7} 
            />
        )}
      </MapContainer>
    </div>
  );
}