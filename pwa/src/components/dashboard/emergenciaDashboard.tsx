import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartPulse, CheckCircle, Shield, AlertTriangle, ArrowRight } from "lucide-react";

export default function EmergenciaDashboard() {
  const navigate = useNavigate();

  return (
    <motion.div
      key="emergency-bridge"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mt-6"
    >
      {/* === ESTE É O NOVO COMPONENTE "PONTE" === */}
      <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 flex flex-col items-center text-center">
        
        {/* Ícone Principal */}
        <div className="p-4 bg-red-100 rounded-full mb-4 ring-4 ring-red-50">
          <AlertTriangle size={40} className="text-red-600" />
        </div>
        
        {/* Título Convidativo */}
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Relatar uma Nova Emergência
        </h2>
        
        {/* Texto Intuitivo */}
        <p className="text-gray-600 max-w-md mb-6">
          Se o seu pet está precisando de atendimento imediato, clique no botão abaixo. 
          Você será levado ao formulário para descrever os sintomas e notificar a clínica mais próxima.
        </p>

        {/* Checklist de Preparação */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 w-full text-left mb-8 space-y-3">
          <h3 className="text-lg font-semibold text-[#004E64] mb-3">Antes de começar:</h3>
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-blue-600 flex-shrink-0 mt-1" />
            <p className="text-gray-700"><strong>Local Seguro:</strong> Garanta que você e seu pet estão em um local seguro.</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-1" />
            <p className="text-gray-700"><strong>Descreva os Sintomas:</strong> Tente observar o que aconteceu. Você poderá gravar um áudio ou digitar.</p>
          </div>
        </div>
        
        {/* Botão de Ação Principal */}
        <motion.button
          onClick={() => navigate("/reportInput")} // Navega para o formulário
          className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <HeartPulse size={22} /> Iniciar Relatório
        </motion.button>
      </div>
    </motion.div>
  );
}