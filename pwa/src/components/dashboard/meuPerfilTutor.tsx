import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Camera,
  User,
  Save,
  Mail,
  Phone,
  IdCard
} from "lucide-react";
import TutorService from "../../services/TutorService";
import { getUser } from "../../utils/auth";

// Interface Corrigida (Adicionando foto_url)
interface Tutor {
  id: number;
  nome_completo: string;
  cpf: string;
  telefone_principal: string;
  telefone_alternativo?: string | null;
  email_contato?: string | null;
  // ✅ Adicionado foto_url na interface para tipagem correta
  foto_url?: string | null;
}

const PLACEHOLDER_IMAGE = "https://placehold.co/150x150/EAF9F5/004E64?text=SEM+FOTO";


// Função auxiliar robusta para resolver URLs do Laravel
function resolveImageUrl(relativePath?: string): string {
  if (!relativePath) return PLACEHOLDER_IMAGE;
  // Se já for uma URL completa (http/https) ou blob (preview local), retorna.
  if (relativePath.startsWith("http") || relativePath.startsWith("blob:"))
    return relativePath;

  const API_BASE =
    (import.meta as any).env.VITE_API_URL || "http://localhost:8000/api";
  const base = API_BASE.replace(/\/api\/?$/, "").replace(/\/$/, ""); // Ex: http://localhost:8000

  let cleanPath = relativePath.replace(/^\/+/, "");

  // Garante que o caminho comece com 'storage/'
  if (cleanPath.startsWith("public/")) {
    cleanPath = cleanPath.replace("public/", "storage/");
  } else if (!cleanPath.startsWith("storage/")) {
    cleanPath = "storage/" + cleanPath;
  }

  // A URL deve ser resolvida corretamente mesmo que contenha o parâmetro ?t=...
  return `${base}/${cleanPath}`;
}

export default function MeuPerfilTutor() {
  // Alterei o estado para usar 'Tutor' em vez de 'Partial<Tutor>' apenas para a inicialização ser mais clara
  const [data, setData] = useState<Partial<Tutor> | null>(null); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para forçar atualização da imagem (cache busting)
  const [imageKey, setImageKey] = useState(Date.now());

  // Carregar dados do tutor logado
  useEffect(() => {
    const user = getUser();

    if (!user || user.tipo !== "tutor") {
      setMessage({
        text: "Erro: Usuário logado não é um tutor.",
        type: "error",
      });
    }

    setLoading(true);

    TutorService.getMeuTutor()
      .then((raw) => {
        const formatted: Partial<Tutor> = {
          id: raw.id,
          nome_completo: raw.nome_completo || "",
          cpf: raw.cpf || "",
          telefone_principal: raw.telefone_principal || "",
          telefone_alternativo: raw.telefone_alternativo || "",
          email_contato: raw.email_contato || "",
          // ✅ CORREÇÃO AQUI: Garante que foto_url é carregado
          foto_url: raw.foto_url || null, 
        };
        setData(formatted);
      })
      .catch((err) => {
        console.error("Erro ao carregar tutor:", err);
        setMessage({
          text: "Erro ao carregar os dados.",
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  // Atualização dos campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setMessage(null);
  };

  // Upload de foto — Com Cache-Busting
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data || !data.id) return;

    setLoading(true);
    setMessage(null);

    try {
      const { foto_url } = await TutorService.uploadFoto(data.id, file);
      
      // ✅ CORREÇÃO DE CACHE: Adiciona um timestamp na URL
      const cacheBustedUrl = foto_url.includes('?') 
            ? `${foto_url}&t=${Date.now()}` 
            : `${foto_url}?t=${Date.now()}`;
      
      setData((prev) => ({ ...prev, foto_url: cacheBustedUrl }));
      setImageKey(Date.now()); // Força o re-render
      setMessage({ text: "Foto atualizada!", type: "success" });
    } catch (err: any) {
      setMessage({
        text:
          err.response?.data?.message || "Erro ao enviar a foto.",
        type: "error",
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !data.id) return;

    setLoading(true);
    setMessage(null);

    try {
      await TutorService.update(data.id, data);
      setMessage({ text: "Dados atualizados com sucesso!", type: "success" });
    } catch (err: any) {
      setMessage({
        text:
          err.response?.data?.message ||
          err.message ||
          "Erro ao salvar os dados.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!data && loading)
    return (
      <div className="text-center py-10">
        <Loader2 className="animate-spin w-8 h-8 mx-auto text-[#25A18E]" />
      </div>
    );

  if (!data)
    return (
      <div className="text-center py-10 text-red-600">
        Erro: Dados do tutor não carregados.
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-bold text-[#004E64] mb-6 flex items-center gap-3">
        Meu Perfil <User size={28} className="text-[#25A18E]" />
      </h2>

      <p className="text-gray-500 mb-6">
        Mantenha seus dados atualizados para melhorar o atendimento em
        emergências.
      </p>

      {message && (
        <div
          className={`p-3 mb-4 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* FOTO + NOME */}
        <div className="flex flex-col md:flex-row gap-6 border-b pb-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-md border-4 border-[#25A18E] bg-gray-100">
              <img
                key={imageKey}
                src={resolveImageUrl(data.foto_url)}
                alt="Foto do Tutor"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                  e.currentTarget.onerror = null; // Previne loop infinito
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center text-white opacity-0 hover:opacity-100"
              >
                <Camera size={32} />
              </button>
            </div>
            
            {/* Botão visível para mobile ou acessibilidade */}
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-[#25A18E] font-semibold hover:underline"
            >
                Alterar Foto
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="image/jpeg,image/png,image/jpg"
            />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="nome_completo"
                value={data.nome_completo || ""}
                onChange={handleChange}
                required
                className="w-full pl-10 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] outline-none text-lg font-semibold text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* INFO BÁSICA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF
            </label>
            <div className="relative">
              <IdCard size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                name="cpf"
                value={data.cpf || ""}
                onChange={handleChange}
                className="w-full pl-9 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone Principal
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="tel"
                name="telefone_principal"
                value={data.telefone_principal || ""}
                onChange={handleChange}
                required
                className="w-full pl-9 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone Alternativo
            </label>
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="tel"
                name="telefone_alternativo"
                value={data.telefone_alternativo || ""}
                onChange={handleChange}
                className="w-full pl-9 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail de Contato
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                name="email_contato"
                value={data.email_contato || ""}
                onChange={handleChange}
                className="w-full pl-9 px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-[#25A18E]"
              />
            </div>
          </div>
        </div>

        {/* SALVAR */}
        <div className="flex justify-end pt-6 border-t border-gray-100 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-[#25A18E] text-white rounded-lg font-bold hover:bg-[#208B7C] transition disabled:opacity-70 shadow-md hover:shadow-lg active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
      
    </div>
  );
}