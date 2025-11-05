import { useState, useEffect, useCallback } from "react";
import {
  EmergencyForm,
  AutofillResponse,
  Clinica,
  VisitaTipo,
  URGENCIAS,
  Pet,
} from "../types/emergency.types";
import {
  analyzeSymptoms,
  createPet,
  submitEmergency,
} from "../services/apiService";
import { useGeolocation } from "./useGeolocation";
import { usePets } from "./usePets";
import { useAudioRecording } from "./useAudioRecording";

export function useEmergencyReport(token: string | null) {
  const [formData, setFormData] = useState<EmergencyForm>({
    descricao_sintomas: "",
    nivel_urgencia: "media",
    tutor_nome: "",
    tutor_email: "",
    tutor_telefone: "",
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

  const { location, locationError } = useGeolocation();
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
    const autofillResponse = (await analyzeSymptoms(
      textInput.trim(),
      token
    )) as AutofillResponse;

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

  // ✅ NOVA FUNÇÃO DE VALIDAÇÃO
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
      if (!formData.tutor_nome.trim()) {
        setError("Digite seu nome.");
        return false;
      }
      if (!formData.tutor_email.trim()) {
        setError("Digite seu e-mail.");
        return false;
      }
      if (!formData.tutor_telefone.trim()) {
        setError("Digite seu telefone.");
        return false;
      }
      if (!formData.nome_pet.trim()) {
        setError("Digite o nome do pet.");
        return false;
      }
    } else {
      if (!formData.pet_id && !formData.nome_pet.trim()) {
        setError("Selecione ou digite o pet.");
        return false;
      }
    }
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
          if (formData.pet_id) {
            payload.pet_id = Number(formData.pet_id);
          } else if (formData.nome_pet.trim()) {
            const newPetId = await createPet(formData.nome_pet.trim(), token);
            setPets((prev: Pet[]) => [
              ...prev,
              { id: newPetId, nome: formData.nome_pet!.trim() },
            ]);
            payload.pet_id = Number(newPetId);
          }
        } else {
          payload.tutor_nome = formData.tutor_nome.trim();
          payload.tutor_email = formData.tutor_email.trim();
          payload.tutor_telefone = formData.tutor_telefone.trim();
          payload.pet_nome = formData.nome_pet.trim();
        }

        const data = await submitEmergency(payload, token);

        setReport("Emergência registrada!");
        setClinica(data.clinica || null);
        setShowSuccessModal(true);
      } catch (err: any) {
        setError(err.message || "Erro ao enviar emergência.");
      } finally {
        setLoading(false);
      }
    },
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
    });
    setTextInput("");
    setAiResponse(null);
    setMissingFields([]);
    setVisitaTipo(null);
    setLastVisitaTipo(null);
    setReport(null);
    setClinica(null);
    setError(null);
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
    validateForm, // ✅ agora existe
  };
}
