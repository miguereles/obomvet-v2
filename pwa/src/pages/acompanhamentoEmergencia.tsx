import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Loader2, AlertTriangle, MapPin, Phone, RefreshCw, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Emergencia, Clinica } from "../services/types";
import EmergenciaService from "../services/EmergenciaService";
import ClinicaService from "../services/ClinicaService";
import { useGeolocation } from "../hooks/useGeolocation";
import ClinicMap from "../components/ClinicMap";
import { getToken, getUser } from "../utils/auth";
import { echo } from "../services/echo";

type StatusInfo = {
  texto: string;
  cor: string;
  icone: React.ReactNode;
};

export default function AcompanhamentoEmergencia() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { location: userLocation, locationError } = useGeolocation();
  
  const [emergencia, setEmergencia] = useState<Emergencia | null>(null);
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = getToken();
  const user = getUser();

  const getStatusInfo = (status: string): StatusInfo => {
    switch (status) {
      case "aberta":
      case "pendente":
      case "assigned":
        return {
          texto: "Clínica Notificada. Aguardando aceite...",
          cor: "bg-yellow-100 text-yellow-800",
          icone: <Clock className="w-6 h-6 text-yellow-600" />,
        };
      case "em_atendimento":
      case "accepted":
        return {
          texto: "Emergência Aceita! A clínica está aguardando sua chegada.",
          cor: "bg-green-100 text-green-800",
          icone: <CheckCircle className="w-6 h-6 text-green-600" />,
        };
      case "concluida":
        return {
          texto: "Atendimento Concluído.",
          cor: "bg-blue-100 text-blue-800",
          icone: <CheckCircle className="w-6 h-6 text-blue-600" />,
        };
      case "cancelada":
      case "rejected":
        return {
          texto: "Emergência Cancelada ou Rejeitada.",
          cor: "bg-red-100 text-red-800",
          icone: <AlertTriangle className="w-6 h-6 text-red-600" />,
        };
      default:
        return {
          texto: "Status desconhecido.",
          cor: "bg-gray-100 text-gray-800",
          icone: <Clock className="w-6 h-6 text-gray-600" />,
        };
    }
  };

  const fetchEmergencia = async (showLoading = true) => {
    if (!id) {
      setError("ID da emergência não encontrado.");
      return;
    }
    if (showLoading) setLoading(true);
    
    try {
      const emgData = await EmergenciaService.getById(id);
      setEmergencia(emgData);
      
      if (emgData.clinica_id) {
        const clinicaData = await ClinicaService.getById(emgData.clinica_id.toString());
        setClinica(clinicaData);
      } else {
        setError("Emergência não associada a nenhuma clínica.");
      }
    } catch (err: any) {
      console.error("Erro ao buscar emergência:", err);
      setError(err.response?.data?.message || "Não foi possível carregar os dados da emergência.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencia(true);
  }, [id]);

  useEffect(() => {
    if (token && user?.tutor_id && emergencia) {
      const channelName = `emergencias.tutor.${user.tutor_id}`;
      console.log(`Escutando no canal: ${channelName}`);
      
      try {
        echo.channel(channelName)
          .listen('.EmergenciaAtualizada', (event: any) => {
            console.log("Evento Recebido:", event);
            if (event.emergencia && event.emergencia.id === emergencia.id) {
              setEmergencia(prev => ({ ...prev, ...event.emergencia }));
            }
          });
      } catch (e) {
        console.error("Falha ao se inscrever no canal do Echo:", e);
      }

      return () => {
        echo.leave(channelName);
      };
    }
  }, [token, user, emergencia]);

  const abrirRota = () => {
    if (!clinica?.localizacao) return setError("Clínica sem localização cadastrada.");
    if (!userLocation) return setError("Sua localização não está disponível para traçar a rota.");
    
    const [lat, lng] = clinica.localizacao.split(",");
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = `${lat},${lng}`;
    const url = `https://maps.google.com/?daddr=${destination}&saddr=${origin}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const ligarParaClinica = () => {
    if (!clinica?.telefone_principal) return setError("Clínica sem telefone cadastrado.");
    window.open(`tel:${clinica.telefone_principal}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#25A18E]" />
        <p className="text-lg text-gray-600 mt-4">Carregando acompanhamento...</p>
      </div>
    );
  }

  if (error || !emergencia || !clinica) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Navbar />
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ocorreu um Erro</h1>
          <p className="text-gray-600 mb-6">{error || "Não foi possível carregar os dados."}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-[#004E64] text-white rounded-lg font-semibold hover:bg-[#003b50] transition"
          >
            Voltar para a Home
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(emergencia.status);
  const [clinicLat, clinicLng] = clinica.localizacao?.split(",").map(Number) || [0, 0];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 mt-24 max-w-4xl">
        
        <motion.div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="p-6">
            <h1 className="text-3xl font-extrabold text-[#004E64] mb-2">
              Acompanhamento da Emergência
            </h1>
            <p className="text-lg text-gray-600">
              Clínica notificada: <span className="font-semibold">{clinica.nome_fantasia}</span>
            </p>
          </div>

          <div className={`p-6 border-y ${statusInfo.cor} flex items-center gap-4`}>
            {statusInfo.icone}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide">Status Atual</h2>
              <p className="text-xl font-bold">{statusInfo.texto}</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Clínica de Destino</h3>
                <p className="text-gray-600">{clinica.endereco}</p>
                <p className="text-gray-600 font-medium mt-1">Telefone: {clinica.telefone_principal}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={abrirRota}
                  disabled={!userLocation}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  <MapPin size={18} /> Abrir Rota
                </button>
                <button
                  onClick={ligarParaClinica}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
                >
                  <Phone size={18} /> Ligar para Clínica
                </button>
              </div>
              {locationError && (
                <p className="text-xs text-red-600 text-center">{locationError}</p>
              )}
            </div>
            
            <div className="h-64 md:h-80 w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <ClinicMap
                clinics={[clinica]}
                userLocation={userLocation ? [userLocation.latitude, userLocation.longitude] : null}
                selectedClinic={clinica}
                hoveredClinic={null}
              />
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-center">
            {!token && (
              <button
                onClick={() => fetchEmergencia(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100"
              >
                <RefreshCw size={14} /> Atualizar Status
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}