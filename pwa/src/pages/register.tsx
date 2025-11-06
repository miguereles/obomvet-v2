import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
// ✅ 1. Importe o seu novo service
import AuthService from "../services/AuthService"; 

type UserType = "tutor" | "clinica" | "veterinario";

// (Sua função de validação de CPF está ótima)
function isValidCPF(cpf: string) {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/\D/g, '');
  
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Calcula dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cpf.substring(i-1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cpf.substring(i-1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

export default function Register() {
  const [tipo, setTipo] = useState<UserType>("tutor");
  // (Seu state de formData está ótimo, mantém toda a lógica de UI)
  const [formData, setFormData] = useState<any>({
    nome_completo: "",
    email: "",
    password: "",
    telefone_principal: "",
    telefone_alternativo: "", // Campo ainda existe no state
    cpf: "", 
    cnpj: "",
    nome_fantasia: "",
    razao_social: "",
    endereco: "",
    telefone_emergencia: "",
    horario_funcionamento: "08:00-18:00",
    disponivel_24h: false,
    publica: false,
    localizacao: "",
    email_contato: "",
    // campos para veterinário
    crmv: "",
    especialidade: "",
    autonomo: true,
    area_atuacao: { raio_km: 10 },
    area_atuacao_endereco: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ❌ API_URL não é mais necessário aqui
  // const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

  // (Sua função getCoordinates está ótima)
  async function getCoordinates(endereco: string): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        endereco
      )}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        return `${lat},${lon}`;
      } else {
        return null;
      }
    } catch (err) {
      console.error("Erro ao obter coordenadas:", err);
      return null;
    }
  }

  // (Sua função handleChange está ótima)
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const value =
      target.type === "checkbox"
        ? (target as HTMLInputElement).checked
        : target.value;
    setFormData((prev: any) => ({ ...prev, [target.name]: value }));
  }

  function isValidEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // (Validações simples - mantidas)
    if (!isValidEmail(formData.email)) {
      setError("Email inválido.");
      setLoading(false);
      return;
    }

    try {
      // (Sua lógica de montar o 'payload' está perfeita e mantida)
      // Ela corresponde ao AuthController.php
      let payload: any = {};

      if (tipo === "tutor") {
        if (!isValidCPF(formData.cpf)) {
          throw new Error("CPF inválido. Por favor, digite um CPF válido.");
        }
        payload = {
          name: formData.nome_completo || "", // AuthController espera 'name'
          nome_completo: formData.nome_completo,
          email: formData.email,
          password: formData.password,
          tipo: "tutor",
          cpf: formData.cpf.replace(/\D/g, ''), // AuthController espera 11 dígitos
          telefone_principal: formData.telefone_principal,
        };
      } else if (tipo === "veterinario") {
        let localizacao = formData.localizacao;
        if (!localizacao && formData.endereco) {
          const coords = await getCoordinates(formData.endereco);
          localizacao = coords; // Pode ser null
        }

        let areaAtuacao: any = null;
        if (formData.area_atuacao_endereco) {
          const areaCoords = await getCoordinates(formData.area_atuacao_endereco);
          if (areaCoords) {
            const [lat, lng] = areaCoords.split(",");
            areaAtuacao = {
              endereco: formData.area_atuacao_endereco,
              lat,
              lng,
            };
          } else {
            areaAtuacao = { endereco: formData.area_atuacao_endereco };
          }
        } else if (formData.area_atuacao?.raio_km) {
          areaAtuacao = formData.area_atuacao;
        }

        payload = {
          name: formData.nome_completo.split(' ')[0], // AuthController espera 'name'
          nome_completo: formData.nome_completo,
          email: formData.email,
          password: formData.password,
          tipo: "veterinario",
          crmv: formData.crmv,
          especialidade: formData.especialidade,
          // Ajustado para 'telefone_emergencia' que o AuthController espera
          telefone_emergencia: formData.telefone_emergencia || formData.telefone_principal, 
          endereco: formData.endereco,
          disponivel_24h: formData.disponivel_24h,
          autonomo: true, // Forçado, como no seu componente
          localizacao: localizacao, // "lat,lng"
        };
        if (areaAtuacao) payload.area_atuacao = areaAtuacao; // Objeto
      } else { // clinica
        let localizacao = formData.localizacao;
        if (!localizacao && formData.endereco) {
          const coords = await getCoordinates(formData.endereco);
          localizacao = coords; // Pode ser null
        }

        payload = {
          name: formData.nome_fantasia || formData.nome_completo, // AuthController espera 'name'
          email: formData.email,
          password: formData.password,
          tipo: "clinica",
          cnpj: formData.cnpj || null,
          nome_fantasia: formData.nome_fantasia || formData.nome_completo,
          razao_social: formData.razao_social || formData.nome_completo,
          endereco: formData.endereco || "",
          telefone_principal: formData.telefone_principal,
          telefone_emergencia: formData.telefone_emergencia,
          horario_funcionamento: formData.horario_funcionamento,
          disponivel_24h: !!formData.disponivel_24h,
          publica: formData.publica ?? false, // Campo não está no AuthController, mas não quebra
          localizacao: localizacao, // "lat,lng"
          email_contato: formData.email_contato || formData.email,
        };
      }

      // ✅ 2. Use o AuthService para registrar
      const data = await AuthService.register(payload);

      console.log("Registro bem-sucedido:", data);
      alert("Cadastro realizado com sucesso!");
      navigate("/login"); // Leva para o login após o cadastro
    
    } catch (err: any) {
      console.error("Erro no registro:", err);
      // ✅ 3. Trate o erro do Axios (erros de validação 422)
      let errorMsg = err.message || "Erro inesperado";
      if (err.response?.status === 422 && err.response.data?.errors) {
        // Pega a primeira mensagem de erro de validação do Laravel
        errorMsg = Object.values(err.response.data.errors).flat()[0] as string;
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="flex min-h-screen bg-gradient-to-br from-[#004E64] to-[#25A18E] items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="p-8 w-full max-w-xl bg-white shadow-xl rounded-2xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft size={22} className="mr-1" />
          <span className="text-sm">Voltar</span>
        </button>

        <h1 className="text-3xl font-bold mb-6 text-center text-[#004E64]">
          Crie sua conta
        </h1>

        {error && (
          <motion.p
            className="text-red-500 mb-4 text-center bg-red-50 border border-red-200 rounded p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-[#004E64]">
              Tipo de usuário
            </label>
            <select
              name="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as UserType)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E] transition"
            >
              <option value="tutor">Tutor</option>
              <option value="clinica">Clínica</option>
              <option value="veterinario">Veterinário Autônomo</option>
              </select>
          </div>

          <input
          type="text"
          name="nome_completo"
          placeholder={
            tipo === "tutor" ? "Nome completo" : tipo === "clinica" ? "Nome da clínica (Fantasia)" : "Nome completo"
          }
            value={formData.nome_completo}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email de login"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Senha (mínimo 8 caracteres)"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
            required
            minLength={8}
          />

          {tipo === "tutor" && (
            <>
              <input
                type="text"
                name="cpf"
                placeholder="CPF (somente números)"
                value={formData.cpf}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
                required
                maxLength={14} // Permite formatação (ex: 123.456.789-00)
              />
              <input
                type="tel"
                name="telefone_principal"
                placeholder="Telefone principal (WhatsApp)"
                value={formData.telefone_principal}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
                required
              />
            </>
          )}

          {tipo === "clinica" && (
            <>
              {/* O nome_completo já é pedido acima como "Nome da Clínica (Fantasia)" */}
              <input
                type="text"
                name="nome_fantasia"
                placeholder="Nome fantasia (repetir)"
                value={formData.nome_fantasia}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
                required
              />
              <input
                type="text"
                name="razao_social"
                placeholder="Razão social"
                value={formData.razao_social}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
              />
              <input
                type="text"
                name="cnpj"
                placeholder="CNPJ (somente números)"
                value={formData.cnpj}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
              />
              <input
                type="text"
                name="endereco"
                placeholder="Endereço completo (para geolocalização)"
                value={formData.endereco}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
                required
              />
              <input
                type="tel"
                name="telefone_principal"
                placeholder="Telefone principal (WhatsApp)"
                value={formData.telefone_principal}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
                required
              />
              <input
                type="tel"
                name="telefone_emergencia"
                placeholder="Telefone emergência (24h, se houver)"
                value={formData.telefone_emergencia}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
                required
              />
              <input
                type="email"
                name="email_contato"
                placeholder="Email de contato (se diferente do login)"
                value={formData.email_contato}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
              />
              <label className="flex items-center gap-2 text-[#004E64]">
                <input
                  type="checkbox"
                  name="disponivel_24h"
                  checked={formData.disponivel_24h}
                  onChange={handleChange}
                  className="rounded text-[#25A18E] focus:ring-[#25A18E]"
                />
                Disponível 24h
              </label>
              <label className="flex items-center gap-2 text-[#004E64] text-sm">
                <input
                  type="checkbox"
                  name="publica"
                  checked={formData.publica}
                  onChange={handleChange}
                  className="rounded text-[#25A18E] focus:ring-[#25A18E]"
                />
                Permitir que qualquer pessoa visualize a clínica no mapa
              </label>
            </>
          )}

          {tipo === "veterinario" && (
            <>
              <input
                type="text"
                name="crmv"
                placeholder="CRMV"
                value={formData.crmv}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
                required
              />
              <input
                type="text"
                name="especialidade"
                placeholder="Especialidade (ex: clínica geral, cirurgia)"
                value={formData.especialidade}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
              />
              <input
                type="tel"
                name="telefone_principal"
                placeholder="Telefone principal (WhatsApp)"
                value={formData.telefone_principal}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
                required
              />
              <input
                type="tel"
                name="telefone_emergencia"
                placeholder="Telefone emergência (24h, se houver)"
                value={formData.telefone_emergencia}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
              />
              <input
                type="text"
                name="endereco"
                placeholder="Endereço (opcional, p/ calcular sua localização)"
                value={formData.endereco}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
              />
              <label className="flex items-center gap-2 text-[#004E64]">
                <input
                  type="checkbox"
                  name="disponivel_24h"
                  checked={formData.disponivel_24h}
                  onChange={handleChange}
                  className="rounded text-[#25A18E] focus:ring-[#25A18E]"
                />
                Disponível 24h
              </label>
              <div className="p-2 bg-gray-50 rounded border border-gray-100 text-sm text-gray-700">
                Cadastro público: este formulário só cria veterinários autônomos. Se você trabalha em uma clínica, peça para que a clínica faça o cadastro pelo dashboard dela.
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  name="area_atuacao_endereco"
                  placeholder="Endereço de atuação (ex: bairro ou rua)"
                  value={formData.area_atuacao_endereco || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({ ...prev, area_atuacao_endereco: e.target.value }))
                  }
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E]"
                />
                <div className="text-sm text-gray-500">Opcional: informe um endereço (bairro/rua) para definir sua área de atuação. Usamos para encontrar suas coordenadas.</div>
              </div>
            </>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#25A18E] text-white p-3 rounded-lg font-semibold hover:bg-[#208B7C] transition"
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}