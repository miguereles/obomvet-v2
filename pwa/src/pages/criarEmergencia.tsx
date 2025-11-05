import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import {
  Mic,
  Square,
  PawPrint,
  Loader2,
  AlertTriangle,
  Home,
  Building,
  User,
  Mail,
  Phone,
  Zap, // Ícone para "Botões de Pânico"
} from "lucide-react";
import SuccessModal from "../components/emergency/SuccessModal";
import ClinicSelectModal from "../components/emergency/ClinicSelectModal";
import { useEmergencyReport } from "../hooks";
import { EmergencyForm, URGENCIAS, Clinica } from "../types/emergency.types";

export default function ReportInput() {
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);

  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
  }, []);

  const {
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
  } = useEmergencyReport(token);

  // Handler para o <form>
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateForm();
    if (isValid) {
      setShowClinicModal(true);
    }
  };

  // Handler para o Modal
  const handleClinicSelectAndSubmit = (selectedClinic: Clinica) => {
    setShowClinicModal(false);
    handleSubmit(selectedClinic.id);
  };

  // --- NOVO: Função para pré-preencher sintomas ---
  const handleQuickReport = (
    symptom: string,
    urgency: EmergencyForm["nivel_urgencia"]
  ) => {
    setTextInput(symptom);
    setFormData((p) => ({
      ...p,
      descricao_sintomas: symptom,
      nivel_urgencia: urgency,
    }));
    setError(null);
    document.getElementById("descricaoSintomas")?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF9F5] via-[#D8F3DC] to-[#C3E5D0] flex flex-col font-sans">
      <Navbar />
      <div className="max-w-2xl w-full mx-auto mt-24 sm:mt-28 mb-10 px-4 sm:px-6">
        <div className="bg-white shadow-lg rounded-2xl border border-gray-200 p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-[#25A18E]/10 rounded-bl-full -z-10" />
          <div className="flex items-center gap-3 mb-6">
            <PawPrint className="w-7 h-7 text-[#25A18E]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[#004E64]">
              Relato de Emergência
            </h1>
          </div>

          {/* Feedbacks */}
          <div className="space-y-3 mb-4">
            {isRecording && (
              <div className="flex items-center gap-2 text-sm p-3 rounded-lg border bg-red-50 border-red-200 text-red-600">
                <Mic className="w-4 h-4 animate-pulse" /> Gravando...
              </div>
            )}
            {(isTranscribing || (loading && !isRecording)) && (
              <div className="flex items-center gap-2 text-sm p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" /> Processando...
              </div>
            )}
            {locationError && (
              <div className="flex items-start gap-2 text-sm p-3 rounded-lg border bg-yellow-100 border-yellow-300 text-yellow-800">
                <AlertTriangle className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                <span>{locationError}</span>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 text-sm p-3 rounded-lg border bg-red-100 border-red-300 text-red-800">
                <AlertTriangle className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* FORMULÁRIO */}
          <form onSubmit={handleFormSubmit} className="space-y-5">
            {!token && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                <h3 className="font-semibold text-gray-700">
                  Seus Dados (para a clínica entrar em contato)
                </h3>
                <div>
                  <label
                    htmlFor="tutorNome"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Seu Nome:
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      id="tutorNome"
                      placeholder="Seu nome completo"
                      value={formData.tutor_nome || ""}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          tutor_nome: e.target.value,
                        }))
                      }
                      className="w-full p-2 pl-8 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E]"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="tutorEmail"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Seu E-mail:
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        id="tutorEmail"
                        placeholder="seu@email.com"
                        value={formData.tutor_email || ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            tutor_email: e.target.value,
                          }))
                        }
                        className="w-full p-2 pl-8 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E]"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="tutorTelefone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Seu Telefone:
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        id="tutorTelefone"
                        placeholder="(XX) 99999-9999"
                        value={formData.tutor_telefone || ""}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            tutor_telefone: e.target.value,
                          }))
                        }
                        className="w-full p-2 pl-8 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E]"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seção Pet e Urgência */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="petSelect"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pet:
                </label>
                {token ? (
                  <>
                    <select
                      id="petSelect"
                      value={formData.pet_id || ""}
                      onChange={(e) => {
                        setFormData((p) => ({
                          ...p,
                          pet_id: e.target.value,
                          nome_pet: "",
                        }));
                        setError(null);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E] mb-2"
                    >
                      <option value="">Selecione pet</option>
                      {pets.map((pet: any) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.nome}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Ou nome (novo pet)"
                      value={formData.nome_pet || ""}
                      onChange={(e) => {
                        setFormData((p) => ({
                          ...p,
                          nome_pet: e.target.value,
                          pet_id: "",
                        }));
                        setError(null);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E]"
                    />
                  </>
                ) : (
                  <input
                    id="petSelect"
                    type="text"
                    placeholder="Nome do pet"
                    value={formData.nome_pet || ""}
                    onChange={(e) => {
                      setFormData((p) => ({
                        ...p,
                        nome_pet: e.target.value,
                      }));
                      setError(null);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E]"
                    required
                  />
                )}
              </div>
              <div>
                <label
                  htmlFor="urgenciaSelect"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Urgência:
                </label>
                <select
                  id="urgenciaSelect"
                  value={formData.nivel_urgencia}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      nivel_urgencia:
                        e.target.value as EmergencyForm["nivel_urgencia"],
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E]"
                >
                  {URGENCIAS.map((urg) => (
                    <option key={urg} value={urg}>
                      {urg.charAt(0).toUpperCase() + urg.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seleção de Tipo de Visita */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Atendimento:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setVisitaTipo("clinica");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-150 text-sm sm:text-base font-medium ${
                    visitaTipo === "clinica"
                      ? "border-[#25A18E] bg-[#EAF9F5] text-[#208B7C] font-semibold ring-2 ring-[#25A18E]/30"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  }`}
                >
                  <Building size={18} />
                  Na Clínica
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVisitaTipo("domicilio");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-150 text-sm sm:text-base font-medium ${
                    visitaTipo === "domicilio"
                      ? "border-[#25A18E] bg-[#EAF9F5] text-[#208B7C] font-semibold ring-2 ring-[#25A18E]/30"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  }`}
                >
                  <Home size={18} />
                  Em Domicílio
                </button>
              </div>
            </div>

            {/* Descrição dos Sintomas */}
            <div>
              <label
                htmlFor="descricaoSintomas"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sintomas:
              </label>

              {/* --- NOVOS BOTÕES DE PÂNICO --- */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickReport(
                      "Possível atropelamento, dificuldade para andar e dor.",
                      "critica"
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-full transition-all hover:bg-gray-200 hover:text-gray-800 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <Zap size={14} /> Atropelamento
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickReport(
                      "Possível intoxicação ou envenenamento, vômitos e salivação.",
                      "critica"
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-full transition-all hover:bg-gray-200 hover:text-gray-800 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <Zap size={14} /> Intoxicação
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickReport(
                      "Convulsão ou tremores fortes, perda de consciência.",
                      "alta"
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-full transition-all hover:bg-gray-200 hover:text-gray-800 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <Zap size={14} /> Convulsão
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mb-3">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm bg-[#25A18E] hover:bg-[#208B7C]"
                  >
                    <Mic size={16} /> Gravar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm bg-red-600 hover:bg-red-700"
                  >
                    <Square size={16} /> Parar
                  </button>
                )}
                <button
                  type="button"
                  onClick={analyzeTextWithAI}
                  className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  disabled={
                    !token || loading || isTranscribing || !textInput.trim()
                  }
                  title={
                    !token
                      ? "Faça login para usar a Análise IA"
                      : "Analisar sintomas com IA"
                  }
                >
                  {loading && !isRecording ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PawPrint size={16} />
                  )}
                  {loading && !isRecording
                    ? "Analisando..."
                    : "Analisar IA"}
                </button>
              </div>

              {transcribedText && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3 text-sm">
                  <p className="text-xs text-gray-500 mb-1 font-medium">
                    Transcrito:
                  </p>
                  <p className="text-gray-800">{transcribedText}</p>
                </div>
              )}

              <textarea
                id="descricaoSintomas"
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setFormData((p) => ({
                    ...p,
                    descricao_sintomas: e.target.value,
                  }));
                  setError(null);
                }}
                placeholder="Descreva os sintomas..."
                className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E] h-32 resize-y"
                required
              />
            </div>

            {/* Botão Enviar */}
            <button
              type="submit"
              disabled={loading || isTranscribing || isRecording}
              className="w-full mt-4 bg-[#25A18E] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#208B7C] transition duration-150 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25A18E] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Enviando...
                </span>
              ) : (
                "Procurar Clínica e Enviar"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* --- MODAL DE SUCESSO --- */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={closeModal}
        clinica={clinica}
        report={report}
        lastVisitaTipo={lastVisitaTipo}
        userLocation={location}
        onSetError={setError}
      />

      {/* --- MODAL DE SELEÇÃO DE CLÍNICA --- */}
      <ClinicSelectModal
        isOpen={showClinicModal}
        onClose={() => setShowClinicModal(false)}
        onSelect={handleClinicSelectAndSubmit}
        visitaTipo={visitaTipo}
        userLocation={
          location ? { lat: location.latitude, lng: location.longitude } : null
        }
      />
    </div>
  );
}
