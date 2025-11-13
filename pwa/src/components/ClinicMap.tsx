import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { BriefcaseMedical, User, MapPin, Phone } from "lucide-react";
import ReactDOMServer from "react-dom/server";

// ==========================
// ÍCONES CUSTOMIZADOS (Versão "Bonita")
// ==========================
function createIcon(
  IconComponent: React.ElementType,
  bgColor: string,
  pulse = false
) {
  const iconHtml = ReactDOMServer.renderToStaticMarkup(
    <IconComponent size={20} color="white" style={{ transform: "rotate(45deg)" }} />
  );

  // Animação de pulso agora usa a cor do ícone
  const pulseStyle = pulse
    ? `
  <style>
  @keyframes pulse-animation-${bgColor.replace("#", "")} {
    0% { box-shadow: 0 0 0 0 ${bgColor}99; }
    70% { box-shadow: 0 0 0 15px ${bgColor}00; }
    100% { box-shadow: 0 0 0 0 ${bgColor}00; }
  }
  </style>`
    : "";

  const html = `
  ${pulseStyle}
  <div style="
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50% 50% 50% 0;
    background-color: ${bgColor};
    /* Sombra mais forte para destacar */
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
    transform: rotate(-45deg);
    /* Borda interna sutil para efeito 3D */
    border: 2px solid rgba(255,255,255,0.8);
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
    animation: ${
      pulse ? `pulse-animation-${bgColor.replace("#", "")} 2s infinite` : "none"
    };
  ">
    ${iconHtml}
  </div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 40], // Ponta do ícone
    popupAnchor: [0, -40], // Popup abre acima do ícone
  });
}

// Ícones com as cores da sua marca
const clinicIcon = createIcon(BriefcaseMedical, "#25A18E");
const userIcon = createIcon(User, "#004E64");
const selectedClinicIcon = createIcon(BriefcaseMedical, "#FF6B6B", true);

// ==========================
// Tipos
// ==========================
interface Clinic {
  id: number;
  nome_fantasia: string;
  endereco: string;
  localizacao: string; // "lat,lng"
  telefone_emergencia: string;
}
type UserLocation = [number, number];

interface ClinicMapProps {
  clinics: Clinic[];
  userLocation: UserLocation | null;
  selectedClinic: Clinic | null;
  hoveredClinic: Clinic | null;
}

// ==========================
// AutoBounds (Ajusta o zoom)
// ==========================
function AutoBounds({
  clinics,
  userLocation,
}: Omit<ClinicMapProps, "selectedClinic" | "hoveredClinic">) {
  const map = useMap();
  useEffect(() => {
    if (clinics.length === 0 && !userLocation) return;

    const bounds = new L.LatLngBounds();
    if (userLocation) bounds.extend(userLocation);

    clinics.forEach((c) => {
      const [lat, lng] = c.localizacao.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) bounds.extend([lat, lng]);
    });

    if (bounds.isValid())
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 15, duration: 1.0 });
  }, [clinics, userLocation, map]);

  return null;
}

// ==========================
// AutoPopup (Popup customizado)
// ==========================
function AutoPopup({
  clinic,
  hovered,
}: {
  clinic: Clinic | null;
  hovered: boolean;
}) {
  const map = useMap();
  const popupRef = useRef<L.Popup | null>(null);

  useEffect(() => {
    if (popupRef.current) {
      map.closePopup(popupRef.current);
      popupRef.current = null;
    }
    if (!clinic) return;

    const [lat, lng] = clinic.localizacao.split(",").map(Number);
    if (isNaN(lat) || isNaN(lng)) return;

    // Conteúdo HTML do Popup
    const popupContent = ReactDOMServer.renderToStaticMarkup(
      <div className="p-1 font-sans">
        <h3 className="font-bold text-base text-[#004E64] mb-2">
          {clinic.nome_fantasia}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
          <MapPin size={14} className="text-[#25A18E] flex-shrink-0" />
          <span>{clinic.endereco}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Phone size={14} className="text-[#25A18E] flex-shrink-0" />
          <span>{clinic.telefone_emergencia}</span>
        </div>
      </div>
    );

    popupRef.current = L.popup({
      offset: [0, -40],
      closeButton: !hovered,
      autoClose: !hovered,
    })
      .setLatLng([lat, lng])
      .setContent(popupContent)
      .openOn(map);
  }, [clinic, map, hovered]);

  return null;
}

// ==========================
// Componente principal
// ==========================
export default function ClinicMap({
  clinics,
  userLocation,
  selectedClinic,
  hoveredClinic,
}: ClinicMapProps) {
  const activeClinic = selectedClinic || hoveredClinic;
  const isHover = !!hoveredClinic && !selectedClinic;

  // Limites Brasil
  const brazilBounds: L.LatLngBoundsLiteral = [
    [-33.75, -73.98],
    [5.27, -34.79],
  ];

  return (
    <MapContainer
      center={[-14.235, -51.9253]}
      zoom={4}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      // Sombra interna para profundidade
      className="rounded-2xl shadow-inner"
      maxBounds={brazilBounds}
      minZoom={4}
    >
      {/* NOVO TEMA DE MAPA - CartoDB Positron */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      <AutoBounds clinics={clinics} userLocation={userLocation} />
      <AutoPopup clinic={activeClinic} hovered={isHover} />

      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>
            <strong className="font-sans text-sm text-[#004E64]">
              📍 Você está aqui
            </strong>
          </Popup>
        </Marker>
      )}

      {clinics.map((clinic) => {
        const [lat, lng] = clinic.localizacao.split(",").map(Number);
        if (isNaN(lat) || isNaN(lng)) return null;
        const isSelected = selectedClinic?.id === clinic.id;
        return (
          <Marker
            key={clinic.id}
            position={[lat, lng]}
            icon={isSelected ? selectedClinicIcon : clinicIcon}
            zIndexOffset={isSelected ? 1000 : 100}
          />
        );
      })}
    </MapContainer>
  );
}