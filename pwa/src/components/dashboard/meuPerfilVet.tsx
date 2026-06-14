import { useState, useEffect, useRef } from "react";
import { Loader2, Camera, Stethoscope, Save, Mail, Phone, MapPin } from "lucide-react";
import { Veterinario } from "../../services/types";
import VeterinarioService from "../../services/VeterinarioService"; 
import { getUser } from "../../utils/auth";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150/EAF9F5/004E64?text=SEM+FOTO";

// ✅ Função auxiliar robusta para resolver URLs do Laravel
function resolveImageUrl(url: string | undefined): string {
  if (!url) return PLACEHOLDER_IMAGE;

  // Se já for uma URL completa (http/https) ou blob (preview local), retorna ela mesma
  if (url.startsWith('http') || url.startsWith('blob:')) {
    return url;
  }

  // Pega a URL base da API e remove o sufixo "/api" para ficar apenas a raiz (ex: http://localhost:8000)
  const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';
  const host = API_BASE.replace(/\/api\/?$/, '').replace(/\/$/, '');

  // Remove barras iniciais para normalizar o caminho
  let cleanPath = url.replace(/^\/+/, '');

  // Correção específica do Laravel:
  // Se o caminho salvo no banco começar com "public/", o navegador deve acessar via "storage/"
  if (cleanPath.startsWith('public/')) {
      cleanPath = cleanPath.replace(/^public\//, 'storage/');
  }
  // Se o caminho não começar com "storage/" (e não for http), adicionamos o prefixo
  else if (!cleanPath.startsWith('storage/')) {
      cleanPath = `storage/${cleanPath}`;
  }

  // Garante que a URL resolvida possa ter um cache-buster (timestamp)
  return `${host}/${cleanPath}`;
}

export default function MeuPerfilVet() {
  const [data, setData] = useState<Partial<Veterinario> | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para forçar atualização da imagem (cache busting)
  const [imageKey, setImageKey] = useState(Date.now());

  useEffect(() => {
    const user = getUser();
    if (!user || user.tipo !== 'veterinario') {
        setMessage({ text: "Erro: Não foi possível identificar o perfil de veterinário logado.", type: 'error' });
        return;
    }

    setLoading(true);
    VeterinarioService.getMeuPerfil()
        .then(fetchedData => {
            setData(fetchedData);
        })
        .catch(err => {
            console.error("Erro ao carregar dados do perfil:", err);
            setMessage({ text: "Erro ao carregar dados do perfil.", type: 'error' });
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
        // Faz o upload
        const { foto_url } = await VeterinarioService.uploadFoto(data.id, file); 
        
        // ✅ CORREÇÃO DE CACHE: Adiciona um timestamp na URL
        const cacheBustedUrl = foto_url.includes('?') 
            ? `${foto_url}&t=${Date.now()}` 
            : `${foto_url}?t=${Date.now()}`;

        // Atualiza o estado local com a nova URL
        setData(prev => ({ ...prev, foto_url: cacheBustedUrl }));
        // Atualiza a chave para forçar o componente de imagem a recarregar (evita cache)
        setImageKey(Date.now());
        
        setMessage({ text: "Foto atualizada com sucesso!", type: 'success' });
    } catch (err: any) {
        const errorMsg = err.response?.data?.message || "Erro ao fazer upload da foto.";
        setMessage({ text: errorMsg, type: 'error' });
    } finally {
        setLoading(false);
        // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !data.id) return;

    setLoading(true);
    setMessage(null);
    try {
        await VeterinarioService.updateVeterinario(data.id, data);
        setMessage({ text: "Dados atualizados com sucesso!", type: 'success' });
    } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || "Erro ao salvar os dados.";
        setMessage({ text: errorMsg, type: 'error' });
    } finally {
        setLoading(false);
    }
  };

  if (!data && loading) return <div className="text-center py-10"><Loader2 className="animate-spin w-8 h-8 mx-auto text-[#25A18E]" /></div>;
  if (!data) return <div className="text-center py-10 text-red-600">Erro: Dados do veterinário não carregados.</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-bold text-[#004E64] mb-6 flex items-center gap-3">
        Meu Perfil <Stethoscope size={28} className="text-[#25A18E]" />
      </h2>
      <p className="text-gray-500 mb-6">
        Gerencie suas informações pessoais e profissionais que serão visíveis aos tutores.
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
            <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-md border-4 border-[#004E64] bg-gray-100">
              <img
                key={imageKey} // Força o re-render ao mudar a imagem
                src={resolveImageUrl(data.foto_url)}
                alt="Foto do Veterinário"
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
              disabled={loading}
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição Profissional (Máx 500 caracteres)
            </label>
            <textarea
              name="descricao"
              rows={6}
              value={data.descricao || ''}
              onChange={handleChange}
              maxLength={500}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] outline-none transition"
              placeholder="Descreva sua experiência, áreas de atuação e o que te move na profissão."
            />
            <div className="text-right text-xs text-gray-400 mt-1">
                {(data.descricao || '').length}/500
            </div>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input type="text" name="nome_completo" value={data.nome_completo || ''} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CRMV</label>
            <input type="text" name="crmv" value={data.crmv || ''} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
            <div className="relative">
              <Stethoscope size={16} className="absolute left-3 top-3 text-gray-400" />
              <input type="text" name="especialidade" value={data.especialidade || ''} onChange={handleChange} className="w-full pl-9 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] outline-none" placeholder="Ex: Dermatologia, Cirurgia..." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Emergência</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
              <input type="tel" name="telefone_emergencia" value={data.telefone_emergencia || ''} onChange={handleChange} required className="w-full pl-9 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] outline-none" />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço (Para Geolocalização)</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
              <input type="text" name="endereco" value={data.endereco || ''} onChange={handleChange} className="w-full pl-9 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] outline-none" placeholder="Rua, Número, Bairro, Cidade - Estado" />
            </div>
          </div>
        </div>

        {/* Opções */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
            <input type="checkbox" name="disponivel_24h" checked={!!data.disponivel_24h} onChange={handleChange} className="rounded text-[#25A18E] focus:ring-[#25A18E] h-5 w-5" />
            <span className="font-medium">Disponível 24h</span>
          </label>
        </div>

        {/* Botão de Salvar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-[#25A18E] text-white rounded-lg font-bold hover:bg-[#208B7C] transition disabled:opacity-70 shadow-md hover:shadow-lg transform active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}