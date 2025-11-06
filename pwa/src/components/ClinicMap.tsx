import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { BriefcaseMedical, User } from "lucide-react";
import ReactDOMServer from "react-dom/server";

// ==========================
// ÍCONES CUSTOMIZADOS
// ==========================
function createIcon(IconComponent: React.ElementType, bgColor: string, pulse = false) {
 const iconHtml = ReactDOMServer.renderToStaticMarkup(
  <IconComponent size={20} color="white" style={{ transform: 'rotate(45deg)' }} />
 );
 const pulseStyle = pulse ? `
  <style>
   @keyframes pulse-animation {
    0% { box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 0 0 ${bgColor}99; }
    70% { box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 0 15px ${bgColor}00; }
    100% { box-shadow: 0 4px 10px rgba(0,0,0,0.4), 0 0 0 0 ${bgColor}00; }
   }
  </style>` : '';
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
 return L.divIcon({ html, className: '', iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] });
}

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
// AutoBounds
// ==========================
function AutoBounds({ clinics, userLocation }: Omit<ClinicMapProps, "selectedClinic" | "hoveredClinic">) {
 const map = useMap();
 useEffect(() => {
  if (clinics.length === 0 && !userLocation) return;

  const bounds = new L.LatLngBounds();
  if (userLocation) bounds.extend(userLocation);

  clinics.forEach(c => {
   const [lat, lng] = c.localizacao.split(",").map(Number);
   if (!isNaN(lat) && !isNaN(lng)) bounds.extend([lat, lng]);
  });

  if (bounds.isValid()) map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 15, duration: 1.0 });
 }, [clinics, userLocation, map]);

 return null;
}

// ==========================
// AutoPopup
// ==========================
function AutoPopup({ clinic, hovered }: { clinic: Clinic | null; hovered: boolean }) {
 const map = useMap();
 const popupRef = useRef<L.Popup | null>(null);

 useEffect(() => {
  if (popupRef.current) { map.closePopup(popupRef.current); popupRef.current = null; }
  if (!clinic) return;

  const [lat, lng] = clinic.localizacao.split(",").map(Number);
  if (isNaN(lat) || isNaN(lng)) return;

  const popupContent = ReactDOMServer.renderToStaticMarkup(
   <div className="p-1">
    <h3 className="font-bold text-[#004E64]">{clinic.nome_fantasia}</h3>
    <p className="text-sm mt-1">☎️ {clinic.telefone_emergencia}</p>
   </div>
  );

  popupRef.current = L.popup({ offset: [0, -40], closeButton: !hovered, autoClose: !hovered })
   .setLatLng([lat, lng])
   .setContent(popupContent)
   .openOn(map);
 }, [clinic, map, hovered]);

 return null;
}

// ==========================
// Componente principal
// ==========================
export default function ClinicMap({ clinics, userLocation, selectedClinic, hoveredClinic }: ClinicMapProps) {
 const activeClinic = selectedClinic || hoveredClinic;
 const isHover = !!hoveredClinic && !selectedClinic;

 // Limites Brasil
 const brazilBounds: L.LatLngBoundsLiteral = [
  [-33.75, -73.98],
  [5.27, -34.79],
 ];

 return (
  <MapContainer
   center={[-14.2350, -51.9253]}
   zoom={4}
   scrollWheelZoom
   style={{ height: "100%", width: "100%" }}
   className="rounded-2xl shadow-2xl"
   maxBounds={brazilBounds}
   minZoom={4}
  >
   <TileLayer
    attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
   />

   <AutoBounds clinics={clinics} userLocation={userLocation} />
   <AutoPopup clinic={activeClinic} hovered={isHover} />

   {userLocation && (
    <Marker position={userLocation} icon={userIcon}>
     <Popup><strong>📍 Você está aqui</strong></Popup>
    </Marker>
   )}

   {clinics.map((clinic) => {
    const [lat, lng] = clinic.localizacao.split(",").map(Number);
    if (isNaN(lat) || isNaN(lng)) return null; // 🔹 Ignora coordenadas inválidas
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
