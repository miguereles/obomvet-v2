import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
// ✅ 1. Importe o seu novo service
import AuthService from "../services/AuthService";
// ❌ Funções de auth não são mais necessárias aqui
// import { setTokenFallback, setUserFallback } from "../utils/auth"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function solicitarPermissao() {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Usuário autorizou notificações.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ 2. Use o AuthService para fazer o login
      // A lógica de salvar no localStorage já está DENTRO do AuthService.login()
      const data = await AuthService.login({ email, password });

      console.info("Resposta do login:", data);

      // ✅ 3. Apenas solicite permissão e navegue
      solicitarPermissao();
      navigate("/dashboard");

    } catch (err: any) {
      // ✅ 4. Trate o erro do Axios
      // O interceptor em 'api.ts' trata o 401 (Não autenticado)
      // Aqui tratamos outros erros, como 422 (Validação) ou 500
      console.error("Erro no handleSubmit do Login:", err);
      const errorMsg = err.response?.data?.message || err.message || "Erro ao fazer login.";
      setError(errorMsg);
      // Se o erro for de credenciais inválidas (do AuthController)
      if (errorMsg.includes("Credenciais inválidas")) {
        setError("Email ou senha incorretos.");
      }
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
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25A18E] transition"
              required
            />
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#25A18E] text-white p-3 rounded-lg font-semibold hover:bg-[#208B7C] transition"
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