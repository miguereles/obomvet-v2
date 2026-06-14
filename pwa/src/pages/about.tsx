import { Link } from "react-router-dom";
import React from "react";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { PawPrint, HeartPulse, Users } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col items-center justify-center pt-28 pb-20 px-8 gap-16">
        {/* Título animado */}
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-5xl md:text-7xl font-extrabold text-[#004E64] text-center drop-shadow-md"
        >
          Sobre o <span className="text-[#25A18E]">oBomVet</span>
        </motion.h1>

        {/* Card principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl bg-white rounded-3xl shadow-2xl border border-[#25A18E]/20 p-12 flex flex-col gap-8 text-center"
        >
          <p className="text-lg md:text-2xl text-gray-700 leading-relaxed">
            O <strong className="text-[#004E64]">oBomVet</strong> é um projeto desenvolvido por alunos da{" "}
            <strong>ETEC de Praia Grande</strong> como parte do Trabalho de Conclusão de Curso (TCC). 
            Nosso objetivo é conectar tutores e clínicas veterinárias em situações de emergência, 
            garantindo respostas rápidas e eficazes para salvar vidas animais.
          </p>

          <p className="text-lg md:text-2xl text-gray-700 leading-relaxed">
            Acreditamos que tecnologia e empatia podem andar juntas. Com o{" "}
            <strong className="text-[#25A18E]">oBomVet</strong>, tutores podem localizar a clínica mais próxima,
            registrar emergências e receber atendimento com agilidade, tudo em poucos cliques.
          </p>

          <p className="text-lg md:text-2xl text-gray-700 leading-relaxed">
            Nosso compromisso é promover o bem-estar animal e fortalecer a conexão entre quem ama e cuida deles.
          </p>
        </motion.div>

        {/* Seção de valores */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="bg-[#25A18E]/10 p-5 rounded-full">
              <PawPrint className="w-14 h-14 text-[#25A18E]" />
            </div>
            <h3 className="text-xl font-semibold text-[#004E64]">Cuidado Animal</h3>
            <p className="text-gray-600 max-w-xs">
              Dedicação e carinho para garantir o bem-estar dos pets em qualquer situação.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="bg-[#25A18E]/10 p-5 rounded-full">
              <HeartPulse className="w-14 h-14 text-[#25A18E]" />
            </div>
            <h3 className="text-xl font-semibold text-[#004E64]">Saúde e Agilidade</h3>
            <p className="text-gray-600 max-w-xs">
              A união entre tecnologia e atendimento veterinário rápido e humanizado.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="bg-[#25A18E]/10 p-5 rounded-full">
              <Users className="w-14 h-14 text-[#25A18E]" />
            </div>
            <h3 className="text-xl font-semibold text-[#004E64]">Trabalho em Equipe</h3>
            <p className="text-gray-600 max-w-xs">
              Uma equipe unida por um propósito: salvar vidas e inovar com empatia.
            </p>
          </div>
        </motion.div>

        
      </main>

      {/* Rodapé */}
      <footer className="w-full text-center py-6 text-sm text-white bg-[#004E64] mt-10 shadow-inner">
        &copy; {new Date().getFullYear()} oBomVet — Plataforma de Emergências Veterinárias
      </footer>
    </div>
  );
}
