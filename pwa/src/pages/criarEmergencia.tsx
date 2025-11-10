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
  Zap,
  ArrowRight,
  Sparkles,
  X,
  Send,
  MessageSquare,
  ClipboardList,
  Siren,
  Wrench,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ClinicSelectModal from "../components/emergency/ClinicSelectModal";
import { useEmergencyReport } from "../hooks";
import { EmergencyForm, URGENCIAS, Clinica, AIRelatorioFinal } from "../types/emergency.types";
import { PANIC_BUTTONS } from "../data/panicButtons";

const FormSection = ({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: React.ReactNode;
}) => (
  <motion.div
    className="bg-white rounded-xl shadow-md border border-gray-100 p-6 overflow-hidden"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: step * 0.1, duration: 0.3 }}
  >
    <h2 className="text-lg font-semibold text-[#004E64] mb-4 flex items-center gap-2">
      <span className="flex items-center justify-center w-6 h-6 bg-[#25A18E] text-white rounded-full text-sm font-bold">
        {step}
      </span>
      {title}
    </h2>
    <div className="space-y-4">{children}</div>
  </motion.div>
);

const FormInput = ({
  id,
  label,
  icon,
  ...props
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {icon}
      </div>
      <input
        id={id}
        {...props}
        className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E] transition"
      />
    </div>
  </div>
);

const LoadingOverlay = ({ status }: { status: string | null }) => {
  const [progressText, setProgressText] = useState("Aguarde...");

  useEffect(() => {
    if (status === "analisando") {
      setProgressText("Analisando sintomas...");
      const t1 = setTimeout(() => setProgressText("Consultando IA veterinária..."), 2000);
      const t2 = setTimeout(() => setProgressText("Gerando relatório..."), 4000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } 
    if (status === "enviando") {
      setProgressText("Enviando seu relatório...");
      const t1 = setTimeout(() => setProgressText("Buscando a clínica 24h mais próxima..."), 1500);
      const t2 = setTimeout(() => setProgressText("Notificando a clínica..."), 3000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [status]);

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl max-w-md w-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#25A18E] border-t-transparent rounded-full mx-auto"
        />
        <h2 className="text-2xl font-bold text-[#004E64] mt-6 mb-3">
          Por favor, aguarde...
        </h2>
        <p className="text-lg text-gray-700">
          {status === "analisando" ? "Nossa IA está analisando o caso." : "Estamos processando sua emergência."}
        </p>
        <p className="text-base text-[#208B7C] font-semibold mt-4 h-12">
          {progressText}
        </p>
      </div>
    </motion.div>
  );
};

interface PanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (relatorio: string, urgencia: EmergencyForm["nivel_urgencia"]) => void;
}

const PanicButtonModal = ({ isOpen, onClose, onSelect }: PanicModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-[#004E64] flex items-center gap-2">
                <Zap className="text-yellow-500" />
                Sugestões Rápidas (Pânico)
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto">
              {PANIC_BUTTONS.map((item) => (
                <motion.button
                  key={item.label}
                  onClick={() => {
                    onSelect(item.relatorio, item.urgencia);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-[#25A18E] transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">{item.label}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.relatorio}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AIRelatorioFinal | null;
  onConfirmManual: () => void;
  onConfirmAuto: () => void;
}

const AIReportModal = ({ isOpen, onClose, report, onConfirmManual, onConfirmAuto }: AIReportModalProps) => {
  if (!isOpen || !report) return null;

  const { emergencia } = report;
  const urgenciaNivel = emergencia.nivel_urgencia as UrgenciaNivel;

  const getUrgencyColor = (nivel: UrgenciaNivel | string) => {
    switch (nivel) {
      case "critica": return "bg-red-600 text-white";
      case "alta": return "bg-red-500 text-white";
      case "media": return "bg-yellow-500 text-black";
      case "baixa": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
     <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-gray-50 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-[#004E64] flex items-center gap-3">
                <CheckCircle className="text-green-500" />
                Análise da IA Concluída
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              
              <div className={`p-4 rounded-lg text-center ${getUrgencyColor(urgenciaNivel)}`}>
                <h3 className="text-sm font-semibold uppercase tracking-wider">Nível de Urgência Identificado</h3>
                <p className="text-2xl font-bold capitalize">{urgenciaNivel}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <ClipboardList size={20} className="text-[#25A18E]" />
                  Relatório Detalhado da IA
                </h3>
                <p className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                  {emergencia.relatorio_detalhado_ia}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Wrench size={20} className="text-[#25A18E]" />
                  Materiais Prováveis
                </h3>
                <p className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                  {emergencia.materiais_provaveis}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Próximo Passo: Notificar a Clínica
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onConfirmAuto}
                    className="p-4 bg-red-600 text-white rounded-lg font-semibold text-left flex items-center gap-3 transition-all transform hover:shadow-lg"
                  >
                    <Siren size={24} />
                    <div>
                      <span className="block">Notificar Mais Próxima</span>
                      <span className="text-sm font-normal opacity-90">(Automático)</span>
                    </div>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onConfirmManual}
                    className="p-4 bg-blue-600 text-white rounded-lg font-semibold text-left flex items-center gap-3 transition-all transform hover:shadow-lg"
                  >
                    <Building size={24} />
                    <div>
                      <span className="block">Escolher Clínica</span>
                      <span className="text-sm font-normal opacity-90">(Manual)</span>
                    </div>
                  </motion.button>
                </div>
              </div>
            </div>
            
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AIFollowUpModalProps {
  isOpen: boolean;
  question: string | null;
  onClose: () => void;
  onSubmit: (response: string) => void;
}

const AIFollowUpModal = ({ isOpen, question, onClose, onSubmit }: AIFollowUpModalProps) => {
  const [responseText, setResponseText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) return;
    onSubmit(responseText);
    setResponseText("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-[#004E64] flex items-center gap-3">
                <MessageSquare className="text-blue-500" />
                A IA precisa de mais detalhes...
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <p className="text-lg text-gray-700 font-medium text-center">
                  "{question}"
                </p>
                
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E] h-24 resize-y"
                  placeholder="Responda a pergunta da IA aqui..."
                  required
                />
              </div>

              <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end">
                <motion.button
                  type="submit"
                  disabled={!responseText.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Enviar Resposta <Send size={18} />
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function ReportInput() {
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);

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
  } = useEmergencyReport(token);

  const handleStartSubmission = () => {
    if (!validateForm()) return;
    analyzeTextWithAI(textInput);
  };
  
  const handleConfirmAuto = () => {
    handleSubmit();
  };
  
  const handleConfirmManual = () => {
    setAiReportModalOpen(false);
    setShowClinicModal(true);
  };

  const handleClinicSelectAndSubmit = (selectedClinic: Clinica) => {
    setShowClinicModal(false);
    handleSubmit(selectedClinic.id);
  };

  const handleQuickReport = (
    relatorio: string, 
    urgency: EmergencyForm["nivel_urgencia"]
  ) => {
    setTextInput(relatorio);
    setFormData((p) => ({
      ...p,
      descricao_sintomas: relatorio,
    }));
    setError(null);
    document.getElementById("descricaoSintomas")?.focus();
  };

  const buttonMotionProps = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 15 },
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      <AnimatePresence>
        {loading && <LoadingOverlay status={loading} />}
      </AnimatePresence>
      
      <div className="max-w-2xl w-full mx-auto mt-24 sm:mt-28 mb-10 px-4 sm:px-6">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <AlertTriangle className="w-9 h-9 text-red-500" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#004E64]">
              Relatório de Emergência
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Preencha os dados para notificarmos a clínica mais próxima.
          </p>
        </motion.div>

        <div className="space-y-6">
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm p-3 rounded-lg border bg-red-50 border-red-200 text-red-600 font-medium"
              >
                <Mic className="w-4 h-4 animate-pulse" /> Gravando áudio...
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isTranscribing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-sm p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-700 font-medium"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando áudio...
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {locationError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 text-sm p-3 rounded-lg border bg-yellow-100 border-yellow-300 text-yellow-800"
              >
                <AlertTriangle className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                <span>{locationError}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 text-sm p-3 rounded-lg border bg-red-100 border-red-300 text-red-800"
              >
                <AlertTriangle className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {!token && (
              <FormSection title="Seus Dados (para Contato)" step={1}>
                <FormInput
                  id="tutorNome"
                  label="Nome Completo*"
                  icon={<User className="h-4 w-4 text-gray-400" />}
                  type="text"
                  placeholder="Seu nome"
                  value={formData.tutor_nome || ""}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, tutor_nome: e.target.value }))
                  }
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    id="tutorEmail"
                    label="E-mail*"
                    icon={<Mail className="h-4 w-4 text-gray-400" />}
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.tutor_email || ""}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, tutor_email: e.target.value }))
                    }
                    required
                  />
                  <FormInput
                    id="tutorTelefone"
                    label="Telefone (WhatsApp)*"
                    icon={<Phone className="h-4 w-4 text-gray-400" />}
                    type="tel"
                    placeholder="(XX) 99999-9999"
                    value={formData.tutor_telefone || ""}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        tutor_telefone: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </FormSection>
            )}

            <FormSection title="Dados do Pet" step={token ? 1 : 2}>
              <div>
                <label
                  htmlFor="petSelect"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pet*
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
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E] mb-2"
                    >
                      <option value="">Selecione um pet</option>
                      {pets.map((pet: any) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.nome}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Ou digite o nome (novo pet)"
                      value={formData.nome_pet || ""}
                      onChange={(e) => {
                        setFormData((p) => ({
                          ...p,
                          nome_pet: e.target.value,
                          pet_id: "",
                        }));
                        setError(null);
                      }}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E]"
                    />
                  </>
                ) : (
                  <FormInput
                    id="petSelect"
                    label=""
                    icon={<PawPrint className="h-4 w-4 text-gray-400" />}
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
                    required
                  />
                )}
              </div>
            </FormSection>

            <FormSection title="Tipo de Atendimento" step={token ? 2 : 3}>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  {...buttonMotionProps}
                  type="button"
                  onClick={() => {
                    setVisitaTipo("clinica");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-150 text-base font-medium ${
                    visitaTipo === "clinica"
                      ? "border-[#25A18E] bg-[#EAF9F5] text-[#208B7C] font-semibold ring-2 ring-[#25A18E]/30"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  }`}
                >
                  <Building size={18} />
                  Na Clínica
                </motion.button>
                <motion.button
                  {...buttonMotionProps}
                  type="button"
                  onClick={() => {
                    setVisitaTipo("domicilio");
                    setError(null);
                  }}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all duration-150 text-base font-medium ${
                    visitaTipo === "domicilio"
                      ? "border-[#25A18E] bg-[#EAF9F5] text-[#208B7C] font-semibold ring-2 ring-[#25A1Redocument-your-codeE]/30"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  }`}
                >
                  <Home size={18} />
                  Em Domicílio
                </motion.button>
              </div>
            </FormSection>

            <FormSection title="Descreva os Sintomas" step={token ? 3 : 4}>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Não sabe o que escrever?
                </label>
                <motion.button
                  {...buttonMotionProps}
                  type="button"
                  onClick={() => setShowPanicModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-lg transition-all hover:bg-yellow-200 hover:text-black hover:shadow-sm"
                >
                  <Zap size={14} className="text-yellow-600" /> Ver Sugestões Rápidas (Pânico)
                </motion.button>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isRecording ? (
                  <motion.button
                    {...buttonMotionProps}
                    type="button"
                    onClick={startRecording}
                    className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm bg-[#25A18E] hover:bg-[#208B7C]"
                  >
                    <Mic size={16} /> Gravar Áudio
                  </motion.button>
                ) : (
                  <motion.button
                    {...buttonMotionProps}
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm bg-red-600 hover:bg-red-700 animate-pulse"
                  >
                    <Square size={16} /> Parar Gravação
                  </motion.button>
                )}
              </div>

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
                placeholder="Descreva os sintomas ou grave um áudio. A IA irá analisar e criar o relatório."
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[#25A18E]/50 focus:border-[#25A18E] h-32 resize-y"
                required
              />
            </FormSection>

            <motion.button
              {...buttonMotionProps}
              type="button"
              onClick={handleStartSubmission}
              disabled={loading != null || isTranscribing || isRecording}
              className="w-full mt-4 bg-red-600 text-white py-3.5 px-4 rounded-xl font-semibold text-lg hover:bg-red-700 transition duration-150 ease-in-out shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles size={20} /> Analisar e Enviar Relatório
            </motion.button>
          </form>
        </div>
      </div>

      <ClinicSelectModal
        isOpen={showClinicModal}
        onClose={() => setShowClinicModal(false)}
        onSelect={handleClinicSelectAndSubmit}
        visitaTipo={visitaTipo ?? "clinica"}
        userLocation={
          location ? { lat: location.latitude, lng: location.longitude } : null
        }
      />

      <PanicButtonModal
        isOpen={showPanicModal}
        onClose={() => setShowPanicModal(false)}
        onSelect={handleQuickReport}
      />
      
      <AIFollowUpModal
        isOpen={aiFollowUpModalOpen}
        question={aiQuestion}
        onClose={() => {
          setAiFollowUpModalOpen(false);
          setLoading(null);
        }}
        onSubmit={handleFollowUpSubmit}
      />

      <AIReportModal
        isOpen={aiReportModalOpen}
        onClose={() => {
          setAiReportModalOpen(false);
          closeModal();
        }}
        report={aiResponse}
        onConfirmAuto={handleConfirmAuto}
        onConfirmManual={handleConfirmManual}
      />
    </div>
  );
}