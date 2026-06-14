import { X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface PromptProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: 'clinica' | 'veterinario' | 'tutor';
  missingFields: string[];
}

export default function ProfileCompletionPrompt({ isOpen, onClose, tipo, missingFields }: PromptProps) {
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    onClose();
    const section =
      tipo === 'clinica'
        ? 'minha_clinica'
        : tipo === 'veterinario'
        ? 'meu_perfil'
        : 'perfil';
    navigate('/dashboard', { state: { activeSection: section } });
  };

  if (!isOpen) return null;

  const title = tipo === 'clinica' ? "Sua Clínica precisa de atenção!" : "Complete seu Perfil Profissional!";
  const instruction = missingFields.length > 0 ? (
    `Campos pendentes: ${missingFields.join(', ')}. Adicione-os para ser mais visível no catálogo.`
  ) : (
    "Adicione uma descrição e foto de perfil para atrair mais atenção no catálogo."
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 z-50 w-full max-w-sm"
        >
          <div className="bg-white p-6 rounded-xl shadow-2xl border-l-4 border-yellow-500 flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 mb-4">{instruction}</p>
              <button
                onClick={handleGoToProfile}
                className="w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition"
              >
                Completar Perfil Agora
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}