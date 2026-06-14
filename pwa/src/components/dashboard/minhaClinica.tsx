import { useState, useEffect, useRef } from "react";
import { Loader2, Camera, Info, Save, Mail, Phone, Clock, MapPin } from "lucide-react";
import { Clinica } from "../../services/types";
import ClinicaService from "../../services/ClinicaService";
import { getUser } from "../../utils/auth";

const PLACEHOLDER_IMAGE = "https://placehold.co/150x150/EAF9F5/004E64?text=SEM+FOTO";

// ✅ Função auxiliar robusta para resolver a URL absoluta da imagem
function resolveImageUrl(relativePath: string | undefined): string {
    if (!relativePath) {
        return PLACEHOLDER_IMAGE;
    }
    // Se já é uma URL absoluta (ex: se o Storage::url() retorna o domínio)
    if (relativePath.startsWith('http') || relativePath.startsWith('blob:')) {
        return relativePath;
    }
    
    // Assume que a URL da foto está no mesmo servidor da API.
    // Pega a base da API (ex: http://localhost:8000/api) e remove o /api
    const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';
    
    // Constrói a URL: http://localhost:8000 + /storage/...
    const base = API_BASE.replace(/\/api$/, '').replace(/\/$/, '');
    
    // Remove barras iniciais para normalizar o caminho
    let cleanPath = relativePath.replace(/^\/+/, "");

    // Garante que o caminho comece com 'storage/'
    if (cleanPath.startsWith("public/")) {
        cleanPath = cleanPath.replace("public/", "storage/");
    } else if (!cleanPath.startsWith("storage/")) {
        cleanPath = "storage/" + cleanPath;
    }
    
    // Concatena a base do projeto com o caminho limpo
    return `${base}/${cleanPath}`;
}


export default function MinhaClinica() {
  const [data, setData] = useState<Partial<Clinica> | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Estado para forçar atualização da imagem (cache busting)
  const [imageKey, setImageKey] = useState(Date.now());


  // FETCH REAL: Carrega os dados da clínica logada
  useEffect(() => {
    const user = getUser();
    if (!user || user.tipo !== 'clinica') {
        setMessage({ text: "Erro: Não foi possível identificar a clínica logada.", type: 'error' });
        return;
    }

    setLoading(true);
    ClinicaService.getMinhaClinica()
        .then(fetchedData => {
            setData(fetchedData);
        })
        .catch(err => {
            console.error("Erro ao carregar dados da clínica:", err);
            setMessage({ text: "Erro ao carregar dados da clínica.", type: 'error' });
        })
        .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setData(prev => ({ ...prev, [name]: value }));
    }
    setMessage(null);
  };

  // Upload de foto — Com Cache-Busting
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data || !data.id) return;

    setLoading(true);
    setMessage(null);
    try {
        const { foto_url } = await ClinicaService.uploadFoto(data.id, file); 
        
        // ✅ CORREÇÃO DE CACHE: Adiciona um timestamp na URL
        const cacheBustedUrl = foto_url.includes('?') 
            ? `${foto_url}&t=${Date.now()}` 
            : `${foto_url}?t=${Date.now()}`;

        // Atualiza o estado com a nova URL retornada pelo backend
        setData(prev => ({ ...prev, foto_url: cacheBustedUrl }));
        setImageKey(Date.now()); // Força o re-render
        setMessage({ text: "Foto atualizada com sucesso!", type: 'success' });
    } catch (err: any) {
        const errorMsg = err.response?.data?.message || "Erro ao fazer upload da foto.";
        setMessage({ text: errorMsg, type: 'error' });
    } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !data.id) return;

    setLoading(true);
    setMessage(null);
    try {
        await ClinicaService.updateClinica(data.id, data);
        
        setMessage({ text: "Dados atualizados com sucesso!", type: 'success' });
    } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || "Erro ao salvar os dados.";
        setMessage({ text: errorMsg, type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  if (!data && loading) return <div className="text-center py-10"><Loader2 className="animate-spin w-8 h-8 mx-auto text-[#25A18E]" /></div>;
  if (!data) return <div className="text-center py-10 text-red-600">Erro: Dados da clínica não carregados.</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-bold text-[#004E64] mb-6 flex items-center gap-3">
        Minha Clínica <Info size={28} className="text-[#25A18E]" />
      </h2>
      <p className="text-gray-500 mb-6">
        Gerencie as informações que aparecerão para os tutores no mapa e catálogo.
      </p>

      {message && (
        <div className={`p-3 mb-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção de Foto e Descrição */}
        <div className="flex flex-col md:flex-row gap-6 border-b pb-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-md border-4 border-[#25A18E]">
              <img
                key={imageKey} // Força o re-render
                src={resolveImageUrl(data.foto_url)}
                alt="Foto da Clínica"
                className="w-full h-full object-cover"
                onError={(e) => {
                    // Se falhar ao carregar, mostra o placeholder
                    e.currentTarget.src = PLACEHOLDER_IMAGE;
                    e.currentTarget.onerror = null; // Previne loop infinito
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center text-white opacity-0 hover:opacity-100"
                title="Trocar Foto"
              >
                <Camera size={24} />
              </button>
            </div>
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
              accept="image/*"
              disabled={loading}
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição Curta (Máx 255 caracteres)
            </label>
            <textarea
              name="descricao"
              rows={4}
              value={data.descricao || ''}
              onChange={handleChange}
              maxLength={255}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]"
              placeholder="Descreva a clínica em poucas palavras. Ex: Especializada em cirurgia e atendimento 24h."
            />
          </div>
        </div>

        {/* Informações Básicas (Exemplo) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
            <input type="text" name="nome_fantasia" value={data.nome_fantasia || ''} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Contato</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
              <input type="email" name="email_contato" value={data.email_contato || ''} onChange={handleChange} required className="w-full pl-9 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone de Emergência</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
              <input type="tel" name="telefone_emergencia" value={data.telefone_emergencia || ''} onChange={handleChange} required className="w-full pl-9 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário de Funcionamento</label>
            <div className="relative">
              <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
              <input type="text" name="horario_funcionamento" value={data.horario_funcionamento || ''} onChange={handleChange} className="w-full pl-9 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
              <input type="text" name="endereco" value={data.endereco || ''} onChange={handleChange} required className="w-full pl-9 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]" />
            </div>
          </div>
        </div>

        {/* Opções */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4">
          <label className="flex items-center gap-2 text-gray-700">
            <input type="checkbox" name="disponivel_24h" checked={!!data.disponivel_24h} onChange={handleChange} className="rounded text-[#25A18E] focus:ring-[#25A18E]" />
            Disponível 24h
          </label>
          <label className="flex items-center gap-2 text-gray-700">
            <input type="checkbox" name="publica" checked={!!data.publica} onChange={handleChange} className="rounded text-[#25A18E] focus:ring-[#25A18E]" />
            Visível no Catálogo Público
          </label>
        </div>

        {/* Botão de Salvar */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[#25A18E] text-white rounded-lg font-semibold hover:bg-[#208B7C] transition disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}