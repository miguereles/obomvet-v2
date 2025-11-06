// src/hooks/useEmergencyReport.ts
import { useState, useEffect, useCallback } from "react";
import {
  EmergencyForm,
  AutofillResponse,
  Clinica,
  VisitaTipo,
  URGENCIAS,
  // ❌ Pet removido daqui
} from "../types/emergency.types";

// ✅ 1. Importe os types e services corretos
import { Pet } from "../services/types"; // Importa o tipo Pet central
import IaService from "../services/IaService";
import PetService from "../services/PetService";
import EmergenciaService from "../services/EmergenciaService";

import { loadRecaptcha, getRecaptchaToken } from "../utils/recaptcha";
import { useGeolocation } from "./useGeolocation";
import { usePets } from "./usePets"; // Agora usa o hook 'usePets' corrigido
import { useAudioRecording } from "./useAudioRecording"; // Já está refatorado

// Tipagem local para o formulário
type LocalEmergencyForm = EmergencyForm & {
  tutor_nome?: string;
  tutor_email?: string;
  tutor_telefone?: string;
  nome_pet?: string;
  pet_id?: string; // O <select> usa string
};

export function useEmergencyReport(token: string | null) {
  const [formData, setFormData] = useState<LocalEmergencyForm>({
    descricao_sintomas: "",
    nivel_urgencia: "media",
    tutor_nome: "",
    tutor_email: "",
    tutor_telefone: "",
    nome_pet: "",
    pet_id: "", // pet_id é string no formulário (select)
  });
  const [textInput, setTextInput] = useState("");
  const [visitaTipo, setVisitaTipo] = useState<VisitaTipo | null>(null);

  const [aiResponse, setAiResponse] = useState<AutofillResponse | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [lastVisitaTipo, setLastVisitaTipo] = useState<VisitaTipo | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [editTokens, setEditTokens] = useState<null | { tutor?: string; pet?: string }>(null);

  const { location, locationError } = useGeolocation();
  // ✅ 2. 'usePets' agora retorna o tipo Pet[] correto (com id: number)
  const { pets, setPets } = usePets(token); 
  const {
    isRecording,
    isTranscribing,
    transcribedText,
    setTranscribedText,
    audioError,
    setAudioError,
    startRecording,
    stopRecording,
  } = useAudioRecording(token);

  // carregar reCAPTCHA v3 (se configurado)
  useEffect(() => {
    try {
      loadRecaptcha();
    } catch (e) {
      // noop
    }
  }, []);

  const analyzeTextWithAI = useCallback(async () => {
    if (!token) {
      setError("Faça login para usar a análise de IA.");
      return;
    }
    if (!textInput.trim()) {
      setError("Digite ou grave os sintomas antes de analisar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ Use o Service
      const autofillResponse = await IaService.analyzeText(textInput.trim());

      setAiResponse(autofillResponse);
      setMissingFields(autofillResponse.faltando || []);

      const preenchidos = autofillResponse.preenchidos || {};
      const updates: Partial<EmergencyForm> = {};

      if (preenchidos.descricao_sintomas)
        updates.descricao_sintomas = preenchidos.descricao_sintomas;

      if (
        preenchidos.nivel_urgencia &&
        URGENCIAS.includes(preenchidos.nivel_urgencia)
      )
        updates.nivel_urgencia = preenchidos.nivel_urgencia;

      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({ ...prev, ...updates }));
        if (updates.descricao_sintomas) setTextInput(updates.descricao_sintomas);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao conectar à IA.");
    } finally {
      setLoading(false);
    }
  }, [textInput, token]);

  useEffect(() => {
    if (transcribedText && textInput !== transcribedText) {
      setTextInput(transcribedText);
      setFormData((prev) => ({ ...prev, descricao_sintomas: transcribedText }));
    }
  }, [transcribedText, textInput]);

  useEffect(() => {
    if (audioError) setError(audioError);
  }, [audioError]);

  const validateForm = useCallback((): boolean => {
    if (!formData.descricao_sintomas.trim()) {
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
  }, [formData, visitaTipo, token]);

  const handleSubmit = useCallback(
    async (clinicId?: number) => {
      if (!validateForm()) return;

      setLoading(true);
      setError(null);
      setLastVisitaTipo(visitaTipo);

      try {
        const nivel_urgencia = formData.nivel_urgencia
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        const payload: any = {
          descricao_sintomas: formData.descricao_sintomas.trim(),
          nivel_urgencia,
          visita_tipo: visitaTipo,
          ...(location && {
            location: { latitude: location.latitude, longitude: location.longitude },
          }),
        };

        if (clinicId) payload.clinica_id = clinicId;

        if (token) {
          // --- Usuário Logado ---
          if (formData.pet_id) {
            payload.pet_id = Number(formData.pet_id);
          } else if ((formData.nome_pet || '').trim()) {
            
            // Seu PetController::store (logado) só precisa do 'nome' e 'especie'
            const newPet = await PetService.create({ 
              nome: (formData.nome_pet || '').trim(),
              especie: 'N/A', // PetController exige 'especie'
            });
            
            // ✅ 3. ESTA É A CORREÇÃO (o código da imagem)
            // O estado 'pets' agora é Pet[] (com id: number)
            // O 'newPet' retornado é Pet (com id: number)
            // Agora os tipos são compatíveis e não precisamos converter nada.
            setPets((prev: Pet[]) => [
              ...prev,
              newPet // Adiciona o objeto Pet completo
            ]);

            payload.pet_id = newPet.id; // Já é number
          }
        } else {
          // --- Usuário Anônimo ---
          payload.tutor_nome = (formData.tutor_nome || '').trim();
          payload.tutor_telefone = (formData.tutor_telefone || '').trim();
          payload.pet_nome = (formData.nome_pet || '').trim();
          
          try {
            const recaptchaToken = await getRecaptchaToken('emergencia_submit');
            if (recaptchaToken) payload.recaptcha_token = recaptchaToken;
          } catch (e) {
            // Envio sem recaptcha
          }
        }

        const data = await EmergenciaService.create(payload);

        setReport("Emergência registrada!");
        setClinica(data.clinica || null);
        setEditTokens(data.edit_tokens || null);
        setShowSuccessModal(true);

      } catch (err: any) {
        console.error("Erro no handleSubmit:", err.response || err);
        setError(err.response?.data?.message || err.message || "Erro ao enviar emergência.");
      } finally {
        setLoading(false);
      }
    },
    // 'pets' foi removido das dependências pois 'setPets' garante a atualização
    [formData, visitaTipo, token, location, setPets, validateForm] 
  );

  const closeModal = useCallback(() => {
    setShowSuccessModal(false);
    setFormData({
      descricao_sintomas: "",
      nivel_urgencia: "media",
      tutor_nome: "",
      tutor_email: "",
      tutor_telefone: "",
      pet_id: "",
      nome_pet: ""
    });
    setTextInput("");
    setAiResponse(null);
    setMissingFields([]);
    setVisitaTipo(null);
    setLastVisitaTipo(null);
    setReport(null);
    setClinica(null);
    setError(null);
    setEditTokens(null);
  }, []);

  return {
    formData,
    textInput,
    visitaTipo,
    loading,
    error,
    report,
    clinica,
    lastVisitaTipo,
    showSuccessModal,
    location,
    locationError,
    pets,
    isRecording,
    isTranscribing,
    transcribedText,
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
    editTokens,
  };
}