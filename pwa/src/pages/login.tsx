import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
// 1. Importa os ícones de olho
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
// 2. CORREÇÃO: Adicionando a extensão .ts ao import
import AuthService from "../services/AuthService.ts";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 2. Estado para mostrar/ocultar senha
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Para msg de registro
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 3. Verifica se o usuário acabou de se registrar
  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Cadastro realizado com sucesso! Faça seu login.");
    }
  }, [searchParams]);

  async function solicitarPermissao() {
    try {
      if ('Notification' in window && Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          console.log("Usuário autorizou notificações.");
        }
      }
    } catch (err) {
      console.error("Erro ao solicitar permissão de notificação:", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage(null); // Limpa a msg de sucesso ao tentar logar

    try {
      const data = await AuthService.login({ email, password });
      console.info("Resposta do login:", data);

      solicitarPermissao();
      navigate("/dashboard");

    } catch (err: any) {
      // 4. Tratamento de erro amigável (como você já tinha)
      console.error("Erro no handleSubmit do Login:", err);
      let errorMsg = err.response?.data?.message || err.message || "Erro ao fazer login.";
      
      if (err.response?.status === 401 || errorMsg.includes("Credenciais inválidas")) {
         errorMsg = "Email ou senha incorretos. Verifique e tente novamente.";
      } else if (err.response?.status === 422) {
         errorMsg = "Formato de email ou senha inválido.";
      } else if (!err.response) {
         errorMsg = "Não foi possível conectar ao servidor. Verifique sua internet.";
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
        className="p-8 w-full max-w-md bg-white shadow-xl rounded-2xl"
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
          Entrar no oBomVet
        </h1>
        
        {/* 5. Mensagem de Sucesso (após registro) */}
        {successMessage && (
          <motion.p
            className="text-green-700 mb-4 text-center bg-green-50 border border-green-200 rounded p-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {successMessage}
          </motion.p>
        )}

        {/* 6. Mensagem de Erro (amigável) */}
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
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E] transition"
              required
            />
            
            {/* 7. Campo de Senha com Ícone */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E] transition pr-10" // Padding à direita
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-[#004E64]"
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#25A18E] text-white p-3 rounded-lg font-semibold hover:bg-[#208B7C] transition disabled:opacity-70"
          >
            {loading ? "Entrando..." : "Entrar"}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Não tem conta?{" "}
          <Link to="/register" className="font-semibold underline text-[#004E64]">
            Cadastre-se
          </Link>
        </p>
      </motion.div>
    </motion.div>
  );
}