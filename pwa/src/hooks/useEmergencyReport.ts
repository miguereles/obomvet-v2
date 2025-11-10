import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  EmergencyForm,
  Clinica,
  VisitaTipo,
  URGENCIAS,
  UrgenciaNivel,
  AIResponse,
  AIPergunta,
  AIRelatorioFinal,
  ChatMessage,
} from "../types/emergency.types";
import { Pet } from "../services/types"; 
import IaService from "../services/IaService";
import { PetService } from "../services/PetService"; 
import EmergenciaService from "../services/EmergenciaService";
import { loadRecaptcha, getRecaptchaToken } from "../utils/recaptcha";
import { useGeolocation } from "./useGeolocation";
import { usePets } from "./usePets"; 
import { useAudioRecording } from "./useAudioRecording"; 

type LocalEmergencyForm = EmergencyForm & {
  tutor_nome?: string;
  tutor_email?: string;
  tutor_telefone?: string;
  nome_pet?: string;
  pet_id?: string; 
};

export function useEmergencyReport(token: string | null) {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<LocalEmergencyForm>({
    descricao_sintomas: "",
    nome_pet: "",
    pet_id: "", 
    tutor_nome: "",
    tutor_email: "",
    tutor_telefone: "",
  });
  
  const [textInput, setTextInput] = useState("");
  const [visitaTipo, setVisitaTipo] = useState<VisitaTipo | null>(null);
  
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [aiReportModalOpen, setAiReportModalOpen] = useState(false);
  const [aiFollowUpModalOpen, setAiFollowUpModalOpen] = useState(false);

  const [aiResponse, setAiResponse] = useState<AIRelatorioFinal | null>(null);
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const { location, locationError } = useGeolocation();
  const { pets, setPets } = usePets(token); 
  const {
    isRecording,
    isTranscribing,
    aiResponseFromAudio,
    audioError,
    setAudioError,
    startRecording,
    stopRecording,
  } = useAudioRecording(token);

  useEffect(() => {
    try {
      loadRecaptcha();
    } catch (e) {
      console.error("Falha ao carregar recaptcha:", e);
    }
  }, []);

  const processAIResponse = (response: AIResponse) => {
    if (response.tipo === "pergunta") {
      setAiQuestion(response.texto);
      setChatHistory(response.chat_history);
      setAiFollowUpModalOpen(true);
    } else if (response.tipo === "relatorio_final") {
      const { emergencia, animal, tutor } = response.dados;
      setAiResponse(response.dados);
      setChatHistory(response.chat_history);
      setAiFollowUpModalOpen(false);
      setAiReportModalOpen(true);

      const updates: Partial<LocalEmergencyForm> = {};
      if (emergencia.descricao_sintomas) {
        setTextInput(emergencia.descricao_sintomas);
      }
      
      if (!token) {
        if (tutor.nome) updates.tutor_nome = tutor.nome;
        if (tutor.telefone) updates.tutor_telefone = tutor.telefone;
        if (animal.nome) updates.nome_pet = animal.nome;
      }
      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({ ...prev, ...updates }));
      }
    }
  };

  const analyzeTextWithAI = useCallback(async (textToAnalyze: string) => {
    if (!textToAnalyze.trim()) {
      setError("Digite ou grave os sintomas antes de analisar.");
      return;
    }

    setLoading("analisando");
    setError(null);

    try {
      const response = await IaService.analyzeText(textToAnalyze.trim());
      processAIResponse(response);
    } catch (err: any) {
      console.error("Erro ao iniciar análise:", err);
      setError(err.response?.data?.error || err.message || "Erro ao conectar à IA.");
    } finally {
      setLoading(null);
    }
  }, [token]);

  useEffect(() => {
    if (aiResponseFromAudio) {
      processAIResponse(aiResponseFromAudio);
    }
  }, [aiResponseFromAudio]);
  
  useEffect(() => {
    if (audioError) setError(audioError);
  }, [audioError]);

  const handleFollowUpSubmit = async (userResponse: string) => {
    setLoading("analisando");
    setError(null);
    setAiFollowUpModalOpen(false);

    try {
      const response = await IaService.continueAnalysis(chatHistory, userResponse);
      processAIResponse(response);
    } catch (err: any) {
      console.error("Erro ao continuar análise:", err);
      setError(err.response?.data?.error || err.message || "Erro na conversa com IA.");
    } finally {
      setLoading(null);
    }
  };

  const validateForm = useCallback((): boolean => {
    if (!textInput.trim()) {
      setError("Descreva os sintomas.");
      return false;
    }
    if (!visitaTipo) {
      setError("Selecione o tipo de atendimento.");
      return false;
    }
    if (!token) {
      if (!((formData.tutor_nome || '').trim())) {
        setError("Digite seu nome.");
        return false;
      }
      if (!((formData.tutor_email || '').trim())) {
        setError("Digite seu e-mail.");
        return false;
      }
      if (!((formData.tutor_telefone || '').trim())) {
        setError("Digite seu telefone.");
        return false;
      }
      if (!((formData.nome_pet || '').trim())) {
        setError("Digite o nome do pet.");
        return false;
      }
    } else {
      if (!formData.pet_id && !((formData.nome_pet || '').trim())) {
        setError("Selecione ou digite o pet.");
        return false;
      }
    }
    setError(null);
    return true;
  }, [formData, visitaTipo, token, textInput]);
  
  const handleSubmit = useCallback(
    async (clinicId?: number) => {
      if (!validateForm() || !aiResponse) {
        setError("Dados do relatório da IA não encontrados.");
        return;
      }

      setLoading("enviando");
      setError(null);
      setAiReportModalOpen(false);

      try {
        const { emergencia } = aiResponse;
        let nivel_urgencia = emergencia.nivel_urgencia as UrgenciaNivel;
        if (!URGENCIAS.includes(nivel_urgencia)) {
            nivel_urgencia = "media";
        }

        const payload: any = {
          descricao_sintomas: textInput.trim(),
          relatorio_detalhado_ia: emergencia.relatorio_detalhado_ia,
          materiais_provaveis: emergencia.materiais_provaveis,
          nivel_urgencia,
          visita_tipo: visitaTipo,
          ...(location && {
            location: { latitude: location.latitude, longitude: location.longitude },
          }),
        };

        if (clinicId) payload.clinica_id = clinicId;

        if (token) {
          if (formData.pet_id) {
            payload.pet_id = Number(formData.pet_id);
          } else if ((formData.nome_pet || '').trim()) {
            const newPet = await PetService.create({ 
              nome: (formData.nome_pet || '').trim(),
              especie: aiResponse.animal.especie || 'N/A', 
            });
            setPets((prev: Pet[]) => [...prev, newPet]);
            payload.pet_id = newPet.id; 
          }
        } else {
          payload.tutor_nome = (formData.tutor_nome || '').trim();
          payload.tutor_email = (formData.tutor_email || '').trim();
          payload.tutor_telefone = (formData.tutor_telefone || '').trim();
          payload.pet_nome = (formData.nome_pet || '').trim();
          
          try {
            const recaptchaToken = await getRecaptchaToken('emergencia_submit');
            if (recaptchaToken) payload.recaptcha_token = recaptchaToken;
          } catch (e) { console.warn("Falha ao pegar recaptcha", e); }
        }

        const data = await EmergenciaService.create(payload);
        
        // ✅ --- INÍCIO DA ADIÇÃO: Salvar ID anónimo ---
        if (!token) {
          try {
            // Guarda o ID da emergência e o nome do pet para o pop-up
            localStorage.setItem('anonymousEmergencyId', data.emergencia.id.toString());
            localStorage.setItem('anonymousEmergencyPetName', payload.pet_nome || 'seu pet'); 
          } catch (e) {
            console.warn("Falha ao salvar emergência anónima no localStorage", e);
          }
        }
        // ✅ --- FIM DA ADIÇÃO ---
        
        navigate(`/emergencia/${data.emergencia.id}`);

      } catch (err: any) {
        console.error("Erro no handleSubmit:", err.response || err);
        setError(err.response?.data?.message || err.message || "Erro ao enviar emergência.");
      } finally {
        setLoading(null);
      }
    },
    [formData, visitaTipo, token, location, setPets, validateForm, aiResponse, textInput, navigate] 
  );
  
  const closeModal = () => {
    setFormData({
      descricao_sintomas: "",
      pet_id: "",
      nome_pet: "",
      tutor_nome: "",
      tutor_email: "",
      tutor_telefone: "",
    });
    setTextInput("");
    setAiResponse(null);
    setVisitaTipo(null);
    setError(null);
    setChatHistory([]);
    setAiReportModalOpen(false);
    setAiFollowUpModalOpen(false);
    setAiQuestion(null);
  };
  
  return {
    formData,
    textInput,
    visitaTipo,
    loading,
    error,
    location,
    locationError,
    pets,
    isRecording,
    isTranscribing,
    aiReportModalOpen,
    aiFollowUpModalOpen,
    aiResponse,
    aiQuestion,
    setLoading,
    setFormData,
    setTextInput,
    setVisitaTipo,
    setError,
    startRecording,
    stopRecording,
    analyzeTextWithAI,
    handleSubmit,
    closeModal,
    validateForm,
    handleFollowUpSubmit,
    setAiReportModalOpen,
    setAiFollowUpModalOpen,
  };
}