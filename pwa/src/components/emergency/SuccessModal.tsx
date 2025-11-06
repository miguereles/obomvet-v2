import { CheckCircle2, MapPin } from "lucide-react";
import { Clinica, Location, VisitaTipo } from "../../types/emergency.types";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinica: Clinica | null;
  report: string | null;
  lastVisitaTipo: VisitaTipo | null;
  userLocation: Location | null;
  onSetError: (error: string | null) => void;
  editTokens?: { tutor?: string; pet?: string } | null;
}

export default function SuccessModal({
  isOpen,
  onClose,
  clinica,
  report,
  lastVisitaTipo,
  userLocation,
  onSetError,
  editTokens = null,
}: SuccessModalProps) {
  function handleAbrirRota() {
    onSetError(null);
    if (!clinica?.localizacao) return onSetError("Localização clínica indisponível.");
    if (!userLocation) return onSetError("Sua localização indisponível.");

    const coords = clinica.localizacao.split(",");
    if (coords.length !== 2 || isNaN(+coords[0]) || isNaN(+coords[1])) {
      onSetError("Formato localização inválido.");
      return;
    }

    const [clinicLat, clinicLng] = coords;
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${clinicLat},${clinicLng}`;
    const url = `https://maps.google.com/?daddr=${destination}&saddr=${origin}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Clínica Notificada!
          </h2>
        </div>

        {clinica ? (
          <>
            <p className="text-gray-600 mb-5 text-sm sm:text-base">
              {lastVisitaTipo === "clinica"
                ? `Emergência enviada para ${clinica.nome_fantasia}. Dirija-se ao local.`
                : `Emergência enviada para ${clinica.nome_fantasia}. Aguarde contato.`}
            </p>
            <div className="bg-gray-100 rounded-lg p-4 mb-6 border border-gray-200 text-sm">
              <h3 className="font-semibold text-base text-[#004E64]">
                {clinica.nome_fantasia}
              </h3>
              {clinica.endereco && <p className="text-gray-700 mt-1">{clinica.endereco}</p>}
              <p className="text-gray-700 mt-1">
                Telefone: {clinica.telefone_principal || "N/A"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {lastVisitaTipo === "clinica" &&
                clinica.localizacao?.includes(",") &&
                userLocation && (
                  <button
                    onClick={handleAbrirRota}
                    className="button-modal bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                  >
                    <MapPin size={16} /> Abrir Rota
                  </button>
                )}
              <button
                onClick={onClose}
                className={`button-modal bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 ${
                  !(lastVisitaTipo === "clinica" && clinica.localizacao && userLocation)
                    ? "w-full"
                    : ""
                }`}
              >
                Fechar
              </button>
              <style>{`
                .button-modal {
                  flex: 1;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  gap: .5rem;
                  color: #fff;
                  padding: .625rem 1rem;
                  border-radius: .5rem;
                  font-weight: 600;
                  transition: background-color .15s ease-in-out;
                  font-size: .875rem;
                  box-shadow: 0 1px 2px 0 rgba(0,0,0,.05);
                  focus:outline-none;
                  focus:ring-2;
                  focus:ring-offset-2;
                }
              `}</style>
            </div>
            {editTokens && (editTokens.pet || editTokens.tutor) && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
                <h4 className="font-semibold text-yellow-800 mb-2">Códigos de edição (anon)</h4>
                {editTokens.tutor && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="break-words">Tutor token: <code className="bg-white px-2 py-1 rounded">{editTokens.tutor}</code></div>
                    <button onClick={() => { navigator.clipboard?.writeText(editTokens.tutor || ''); onSetError('Token copiado para a área de transferência'); setTimeout(()=>onSetError(null),2500); }} className="ml-2 text-sm text-yellow-800 underline">Copiar</button>
                  </div>
                )}
                {editTokens.pet && (
                  <div className="flex items-center justify-between">
                    <div className="break-words">Pet token: <code className="bg-white px-2 py-1 rounded">{editTokens.pet}</code></div>
                    <button onClick={() => { navigator.clipboard?.writeText(editTokens.pet || ''); onSetError('Token copiado para a área de transferência'); setTimeout(()=>onSetError(null),2500); }} className="ml-2 text-sm text-yellow-800 underline">Copiar</button>
                  </div>
                )}
                <p className="text-xs text-yellow-700 mt-2">Guarde esses códigos para editar/excluir o registro sem conta. Expiram em 7 dias.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-5 text-sm sm:text-base">
              {report || "Emergência registrada."}
            </p>
            <button
              onClick={onClose}
              className="button-modal w-full bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400"
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
