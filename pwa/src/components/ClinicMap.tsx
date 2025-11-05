import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { BriefcaseMedical, User } from "lucide-react"; // Ícones trocados
import ReactDOMServer from "react-dom/server";
import { AnimatePresence, motion } from "framer-motion"; // Para o popup

// ==========================
// ÍCONES CUSTOMIZADOS (À PROVA DE FALHAS)
// ==========================
// Esta função agora injeta o CSS como estilos INLINE. Não depende de CSS externo.
function createIcon(
 IconComponent: React.ElementType,
 bgColor: string,
 pulse = false
) {
 // Renderiza o ícone do Lucide para HTML
 const iconHtml = ReactDOMServer.renderToStaticMarkup(
  <IconComponent size={20} color="white" style={{ transform: 'rotate(45deg)' }} />
 );

 // Define a animação de pulso (se necessário)
 const pulseStyle = pulse ? `
  <style>
   @keyframes pulse-animation {
    0% { box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 0 0 ${bgColor}99; }
    70% { box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 0 15px ${bgColor}00; }
    100% { box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 0 0 ${bgColor}00; }
   }
  </style>
 ` : '';

 // Monta o HTML final do ícone com estilos INLINE
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
   box-shadow: 0 4px 10px rgba(0,0,0,0.4);
   transform: rotate(-45deg);
   animation: ${pulse ? 'pulse-animation 1.5s infinite' : 'none'};
   border: 2px solid white;
  ">
   ${iconHtml}
  </div>`;

 return L.divIcon({
  html: html,
  className: '', // Classe externa não é mais necessária!
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
 });
}

// Ícones agora são infalíveis
const clinicIcon = createIcon(BriefcaseMedical, "#25A18E"); // Verde
const userIcon = createIcon(User, "#004E64"); // Azul escuro
const selectedClinicIcon = createIcon(BriefcaseMedical, "#FF6B6B", true); // Vermelho e pulsando

// ==========================
// Tipos (conforme a ClinicPage)
// ==========================
interface Clinic {
 id: number;
 nome_fantasia: string;
 endereco: string;
 localizacao: string; // "lat,lng"
 telefone_emergencia: string;
}
type UserLocation = [number, number]; // [lat, lng]

interface ClinicMapProps {
 clinics: Clinic[];
 userLocation: UserLocation | null;
 selectedClinic: Clinic | null;
 hoveredClinic: Clinic | null;
}

// ==========================
// Componente para Auto-Zoom
// ==========================
function AutoBounds({ clinics, userLocation }: Omit<ClinicMapProps, "selectedClinic" | "hoveredClinic">) {
 const map = useMap();
 useEffect(() => {
  if (clinics.length === 0 && !userLocation) return;

  const bounds = new L.LatLngBounds();
  if (userLocation) {
   bounds.extend(userLocation);
  }
  clinics.forEach(c => {
   const [lat, lng] = c.localizacao.split(",").map(Number) as UserLocation;
   bounds.extend([lat, lng]);
  });

  if (bounds.isValid()) {
   map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 15, duration: 1.0 });
  }
 }, [clinics, userLocation, map]);

 return null;
}

// ==========================
// Componente para Abrir Popups Automaticamente
// ==========================
function AutoPopup({ clinic, hovered }: { clinic: Clinic | null; hovered: boolean }) {
 const map = useMap();
 const popupRef = useRef<L.Popup | null>(null);

 useEffect(() => {
  // Fecha popups antigos
  if (popupRef.current) {
   map.closePopup(popupRef.current);
   popupRef.current = null;
  }

  if (clinic) {
   const [lat, lng] = clinic.localizacao.split(",").map(Number) as UserLocation;
   
   const popupContent = ReactDOMServer.renderToStaticMarkup(
    <div className="p-1">
     <h3 className="font-bold text-[#004E64]">{clinic.nome_fantasia}</h3>
     <p className="text-sm mt-1">☎️ {clinic.telefone_emergencia}</p>
    </div>
   );

   popupRef.current = L.popup({
    offset: [0, -40], // Ajusta para a nova âncora do ícone
    closeButton: !hovered,
    autoClose: !hovered,
   })
    .setLatLng([lat, lng])
    .setContent(popupContent)
    .openOn(map);
  }
 }, [clinic, map, hovered]);

 return null;
}

// ==========================
// Componente principal do Mapa
// ==========================
export default function ClinicMap({
 clinics,
 userLocation,
 selectedClinic,
 hoveredClinic
}: ClinicMapProps) {

 // Limites para o Brasil
 const brazilBounds: L.LatLngBoundsLiteral = [
  [-33.75, -73.98], // Sul-Oeste
  [5.27, -34.79],  // Norte-Leste
 ];

 // Prioridade de exibição: Seleção > Hover
 const activeClinic = selectedClinic || hoveredClinic;
 const isHover = !!hoveredClinic && !selectedClinic;

 return (
  <MapContainer
   center={[-14.2350, -51.9253]} // Centro do Brasil (Fallback)
   zoom={4}
   scrollWheelZoom
   style={{ height: "100%", width: "100%" }}
   className="rounded-2xl shadow-2xl"
   maxBounds={brazilBounds} // Limita o mapa ao Brasil
   minZoom={4}
  >
   <TileLayer
    attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
   />

   <AutoBounds clinics={clinics} userLocation={userLocation} />
   <AutoPopup clinic={activeClinic} hovered={isHover} />

   {/* Marcador do usuário */}
   {userLocation && (
    <Marker position={userLocation} icon={userIcon}>
    <Popup>
      <strong>📍 Você está aqui</strong>
     </Popup>
    </Marker>
   )}

   {/* Marcadores das clínicas */}
   {clinics.map((clinic) => {
    const [lat, lng] = clinic.localizacao.split(",").map(Number);
    const isSelected = selectedClinic?.id === clinic.id;
    return (
     <Marker
      key={clinic.id}
      position={[lat, lng]}
      icon={isSelected ? selectedClinicIcon : clinicIcon}
      zIndexOffset={isSelected ? 1000 : 100} // Traz o marcador selecionado para frente
     >
      {/* O Popup agora é controlado pelo AutoPopup */}
     </Marker>
    );
   })}
  </MapContainer>
 );
}