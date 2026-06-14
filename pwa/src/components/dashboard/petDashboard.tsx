import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PawPrint, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Loader2, 
  Eye, 
  X, 
  Activity, 
  Weight, 
  Calendar,
  Mars,   // Ícone novo para Macho (opcional, se tiver no lucide) ou use texto
  Venus,  // Ícone novo para Fêmea (opcional)
  Scissors // Ícone para Castrado (opcional)
} from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; 

// Importação dos serviços (mantendo a compatibilidade com seu código)
import { PetService } from "../../services/PetService"; 
import TutorService from "../../services/TutorService"; 
import { Pet as PetType, Usuario } from "../../services/types"; 
import { useToast } from "../ui/ToastProvider"; 

// Interfaces
interface Pet extends PetType {
    // Garantindo que a interface local tenha os novos campos caso o types.ts demore a atualizar
    sexo?: string | null;
    castrado?: boolean;
}

interface User extends Pick<Usuario, 'id' | 'tipo' | 'tutor_id' | 'clinica_id' | 'veterinario_id'> {}

interface Props {
  currentUser: User;
}

export default function PetDashboard({ currentUser }: Props) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Estados de Dados e UI
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // Estados dos Modais
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  // Estado do Pet Selecionado (para Edição ou Visualização)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  
  // Estados do Formulário
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    especie: "",
    raca: "",
    sexo: "",           // <--- NOVO
    castrado: false,    // <--- NOVO
    idade: "",
    peso: "",
    alergias: "",
    alergiasSim: false,
    medicamentos_continuos: "",
    medicamentosSim: false,
    cuidados_especiais: "",
    cuidadosSim: false,
  });

  // --- Funções Auxiliares ---

  function calcularIdade(dataNascimento: string) {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesDiff = hoje.getMonth() - nascimento.getMonth();
    if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  // --- Effects ---

  useEffect(() => {
    async function fetchPets() {
      setLoading(true);
      try {
        const tutorData = await TutorService.getMeuTutor();
        const petsArray = tutorData.pets || [];
        
        petsArray.forEach((p: Pet) => {
          if (p.data_nascimento) p.idade = calcularIdade(p.data_nascimento);
        });
        setPets(petsArray);
      } catch (err: any) {
        if (err.response?.status !== 401) {
           console.error("Erro ao buscar pets:", err);
        }
        setPets([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPets();
  }, [currentUser]);

  // --- Handlers ---

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, type } = e.target;
    // Tratamento para Checkbox e Select
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: e.target.value }));
    }
  }

  function openFormModal(pet?: Pet) {
    if (pet) {
      setSelectedPet(pet);
      setFormData({
        nome: pet.nome,
        especie: pet.especie,
        raca: pet.raca || "",
        sexo: pet.sexo || "",           // <--- PREENCHER
        castrado: !!pet.castrado,       // <--- PREENCHER
        idade: pet.idade?.toString() || "",
        peso: pet.peso?.toString() || "",
        alergias: pet.alergias || "",
        alergiasSim: !!pet.alergias,
        medicamentos_continuos: pet.medicamentos_continuos || "",
        medicamentosSim: !!pet.medicamentos_continuos,
        cuidados_especiais: pet.cuidados_especiais || "",
        cuidadosSim: !!pet.cuidados_especiais,
      });
    } else {
      setSelectedPet(null);
      setFormData({
        nome: "",
        especie: "",
        raca: "",
        sexo: "",           // <--- RESETAR
        castrado: false,    // <--- RESETAR
        idade: "",
        peso: "",
        alergias: "",
        alergiasSim: false,
        medicamentos_continuos: "",
        medicamentosSim: false,
        cuidados_especiais: "",
        cuidadosSim: false,
      });
    }
    setFormModalOpen(true);
    setModalError("");
    setModalLoading(false);
  }

  function openDetailsModal(pet: Pet) {
    setSelectedPet(pet);
    setDetailsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nome = formData.nome.trim();
    const especie = formData.especie.trim();
    const raca = formData.raca.trim();

    if (!nome || !especie) {
      setModalError("Preencha os campos obrigatórios: Nome e Espécie");
      return;
    }

    setModalLoading(true);
    setModalError("");

    try {
      const payload = {
        nome,
        especie,
        raca: raca || null,
        sexo: formData.sexo || null,        // <--- ENVIAR
        castrado: formData.castrado,        // <--- ENVIAR
        data_nascimento: formData.idade ? `${new Date().getFullYear() - Number(formData.idade)}-01-01` : null,
        peso: formData.peso ? Number(formData.peso) : null,
        alergias: formData.alergiasSim ? formData.alergias : null,
        medicamentos_continuos: formData.medicamentosSim ? formData.medicamentos_continuos : null,
        cuidados_especiais: formData.cuidadosSim ? formData.cuidados_especiais : null,
      };

      let data: Pet;
      if (selectedPet) {
        // Atualizar
        data = await PetService.update(selectedPet.id, payload as any);
        data.idade = formData.idade ? Number(formData.idade) : undefined;
        setPets((prev) => prev.map((p) => (p.id === selectedPet.id ? data : p)));
        setSuccessMessage(`✏️ Pet "${data.nome}" atualizado!`);
      } else {
        // Criar
        const responseData = await PetService.create(payload as any);
        data = (responseData as any).pet || responseData;
        data.idade = formData.idade ? Number(formData.idade) : undefined;
        setPets((prev) => [...prev, data]);
        setSuccessMessage(`🐾 Pet "${data.nome}" cadastrado!`);
      }

      setFormModalOpen(false);
      setSelectedPet(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setModalLoading(false);
        setFormModalOpen(false); 
        return; 
      }
      console.error("Erro ao salvar pet:", err);
      setModalError(err.response?.data?.message || err.message || "Erro ao salvar pet.");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja remover este pet? Essa ação não pode ser desfeita.")) return;

    try {
      await PetService.delete(id);
      setPets((prev) => prev.filter((p) => p.id !== id));
      showToast("Pet removido com sucesso!", { type: 'success' });
    } catch(err: any) {
      if (err.response?.status === 401) return;
      console.error(err);
      showToast(err.response?.data?.message || "Erro ao excluir pet.", { type: 'error' });
    }
  }

  // --- Renderização ---

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-[50vh] text-blue-600">
        <Loader2 className="animate-spin w-10 h-10 mb-3" /> 
        <p className="font-medium text-gray-600">Carregando seus pets...</p>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
              <span className="bg-blue-100 p-2 rounded-full text-blue-600"><PawPrint size={32} /></span>
              Meus Pets
            </h1>
            <p className="text-gray-500 mt-1 ml-1">Gerencie a saúde e o perfil dos seus companheiros</p>
          </div>
          
          <button
            onClick={() => openFormModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1 active:translate-y-0 font-semibold"
          >
            <Plus size={20} /> Novo Pet
          </button>
        </div>

        {/* Mensagem de Sucesso Flutuante */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="fixed top-6 left-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 font-medium"
            >
              <div className="bg-white/20 p-1 rounded-full"><Check size={16} /></div>
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid de Pets */}
        {pets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <PawPrint size={40} />
            </div>
            <h3 className="text-xl font-semibold text-gray-600">Nenhum pet cadastrado</h3>
            <p className="text-gray-400 mb-6">Cadastre seu primeiro pet para começar a acompanhar a saúde dele.</p>
            <button onClick={() => openFormModal()} className="text-blue-600 font-medium hover:underline">
              Cadastrar agora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <motion.div
                key={pet.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group"
              >
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-inner ${
                        pet.especie.toLowerCase().includes('gato') ? 'bg-purple-100 text-purple-600' : 
                        pet.especie.toLowerCase().includes('cachorro') ? 'bg-orange-100 text-orange-600' : 
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {pet.especie.toLowerCase().includes('gato') ? '🐱' : 
                         pet.especie.toLowerCase().includes('cachorro') ? '🐶' : '🐾'}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 leading-tight">{pet.nome}</h3>
                        <p className="text-sm text-gray-500 capitalize">
                             {/* Mostra Sexo e Raça */}
                             {pet.sexo ? pet.sexo : ''} • {pet.raca || 'Raça não def.'}
                        </p>
                      </div>
                   </div>
                   
                   {/* Badge de Castrado (Opcional) */}
                   {pet.castrado && (
                       <Tippy content="Pet Castrado">
                           <div className="text-green-500 bg-green-50 p-1 rounded-full">
                               <Scissors size={14} />
                           </div>
                       </Tippy>
                   )}
                </div>

                {/* Informações Rápidas */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-gray-50 p-2 rounded-lg flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} className="text-blue-400"/> 
                        <span>{pet.idade ? `${pet.idade} anos` : 'Idade n/a'}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg flex items-center gap-2 text-sm text-gray-600">
                        <Weight size={16} className="text-blue-400"/> 
                        <span>{pet.peso ? `${pet.peso} kg` : 'Peso n/a'}</span>
                    </div>
                </div>

                {/* Barra de Ações */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <Tippy content="Ver Detalhes Completos">
                    <button 
                      onClick={() => openDetailsModal(pet)}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye size={18} /> Ver Mais
                    </button>
                  </Tippy>
                  
                  <div className="flex gap-1">
                    <Tippy content="Editar Pet">
                      <button 
                        onClick={() => openFormModal(pet)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                    </Tippy>
                    <Tippy content="Remover Pet">
                      <button 
                        onClick={() => handleDelete(pet.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </Tippy>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* === MODAL DE FORMULÁRIO (CRIAR / EDITAR) === */}
      <AnimatePresence>
        {formModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFormModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-lg p-6 sm:p-8 relative shadow-2xl my-8"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {selectedPet ? <Edit2 className="text-blue-600" /> : <Plus className="text-blue-600" />}
                  {selectedPet ? "Editar Pet" : "Novo Pet"}
                </h2>
                <button onClick={() => setFormModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                  <X size={20} />
                </button>
              </div>
              
              {modalError && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 text-sm flex items-center gap-2">
                    <Activity size={18} />
                    {modalError}
                  </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Campos Padrão */}
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Nome do Pet <span className="text-red-500">*</span></label>
                    <input
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Ex: Rex"
                    />
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Espécie <span className="text-red-500">*</span></label>
                    <input
                      name="especie"
                      value={formData.especie}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Ex: Cachorro"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Raça</label>
                    <input
                      name="raca"
                      value={formData.raca}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="Ex: Labrador"
                    />
                  </div>

                  {/* NOVO CAMPO: Sexo */}
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <label className="text-sm font-medium text-gray-700">Sexo</label>
                    <select
                      name="sexo"
                      value={formData.sexo}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                    >
                        <option value="">Selecione...</option>
                        <option value="Macho">Macho</option>
                        <option value="Fêmea">Fêmea</option>
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Idade (anos)</label>
                        <input
                        name="idade"
                        type="number"
                        value={formData.idade}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Peso (kg)</label>
                        <input
                        name="peso"
                        type="number"
                        step="0.1"
                        value={formData.peso}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
                        />
                    </div>
                  </div>
                </div>

                {/* NOVO CAMPO: Castrado */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        name="castrado" 
                        id="castrado"
                        checked={formData.castrado} 
                        onChange={handleChange} 
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="castrado" className="text-blue-800 font-medium cursor-pointer select-none">
                        O pet é castrado?
                    </label>
                </div>

                <div className="border-t pt-4 space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Informações de Saúde</h3>
                    
                    {/* Alergias */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                            <input type="checkbox" name="alergiasSim" checked={formData.alergiasSim} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"/>
                            <span className="text-gray-700 font-medium">Possui Alergias?</span>
                        </label>
                        <AnimatePresence>
                            {formData.alergiasSim && (
                                <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}}>
                                    <input name="alergias" value={formData.alergias} onChange={handleChange} placeholder="Quais alergias?" className="w-full mt-1 p-2 border rounded bg-white"/>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Medicamentos */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                            <input type="checkbox" name="medicamentosSim" checked={formData.medicamentosSim} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"/>
                            <span className="text-gray-700 font-medium">Usa Medicamento Contínuo?</span>
                        </label>
                        <AnimatePresence>
                            {formData.medicamentosSim && (
                                <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}}>
                                    <input name="medicamentos_continuos" value={formData.medicamentos_continuos} onChange={handleChange} placeholder="Qual medicamento?" className="w-full mt-1 p-2 border rounded bg-white"/>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Cuidados */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer mb-2">
                            <input type="checkbox" name="cuidadosSim" checked={formData.cuidadosSim} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"/>
                            <span className="text-gray-700 font-medium">Cuidados Especiais?</span>
                        </label>
                        <AnimatePresence>
                            {formData.cuidadosSim && (
                                <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}}>
                                    <textarea name="cuidados_especiais" value={formData.cuidados_especiais} onChange={handleChange} placeholder="Descreva os cuidados..." className="w-full mt-1 p-2 border rounded bg-white h-20 resize-none"/>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setFormModalOpen(false)} 
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition"
                    disabled={modalLoading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 transition transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={modalLoading}
                  >
                    {modalLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (selectedPet ? "Salvar Alterações" : "Cadastrar Pet")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === MODAL DE DETALHES (VER MAIS) === */}
      <AnimatePresence>
        {detailsModalOpen && selectedPet && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetailsModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
                {/* Header Decorativo */}
                <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 relative">
                    <button 
                        onClick={() => setDetailsModalOpen(false)}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-1 backdrop-blur-md transition"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="px-8 pb-8 relative">
                    {/* Avatar Sobreposto */}
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                        <div className="w-32 h-32 rounded-full bg-white p-2 shadow-xl">
                            <div className={`w-full h-full rounded-full flex items-center justify-center text-6xl ${
                                selectedPet.especie.toLowerCase().includes('gato') ? 'bg-purple-100' : 
                                selectedPet.especie.toLowerCase().includes('cachorro') ? 'bg-orange-100' : 
                                'bg-blue-100'
                            }`}>
                                {selectedPet.especie.toLowerCase().includes('gato') ? '🐱' : 
                                 selectedPet.especie.toLowerCase().includes('cachorro') ? '🐶' : '🐾'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                        <h2 className="text-2xl font-bold text-gray-800">{selectedPet.nome}</h2>
                        <p className="text-gray-500">
                            {selectedPet.raca} • {selectedPet.especie}
                        </p>
                        {/* Exibição de Sexo e Castrado nos Detalhes */}
                        <div className="flex justify-center gap-3 mt-2 text-sm">
                             {selectedPet.sexo && (
                                 <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-700 font-medium">
                                     {selectedPet.sexo}
                                 </span>
                             )}
                             {selectedPet.castrado && (
                                 <span className="bg-green-100 px-2 py-1 rounded-md text-green-700 font-medium flex items-center gap-1">
                                     <Scissors size={12}/> Castrado
                                 </span>
                             )}
                        </div>
                    </div>

                    <div className="flex justify-center gap-8 my-6 border-b pb-6">
                        <div className="text-center">
                            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Idade</p>
                            <p className="text-lg font-semibold text-gray-700">{selectedPet.idade ? `${selectedPet.idade} anos` : '-'}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Peso</p>
                            <p className="text-lg font-semibold text-gray-700">{selectedPet.peso ? `${selectedPet.peso} kg` : '-'}</p>
                        </div>
                    </div>

                    <div className="space-y-4 text-left">
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-1">
                                <Activity size={18} className="text-red-500"/> Alergias
                            </h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
                                {selectedPet.alergias || "Nenhuma alergia registrada."}
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-1">
                                <span className="text-blue-500">💊</span> Medicamentos
                            </h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
                                {selectedPet.medicamentos_continuos || "Nenhum medicamento contínuo."}
                            </p>
                        </div>

                        <div>
                            <h4 className="flex items-center gap-2 font-semibold text-gray-800 mb-1">
                                <span className="text-yellow-500">⚠️</span> Cuidados Especiais
                            </h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
                                {selectedPet.cuidados_especiais || "Nenhum cuidado especial registrado."}
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => {
                            setDetailsModalOpen(false);
                            openFormModal(selectedPet);
                        }}
                        className="w-full mt-8 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                    >
                        <Edit2 size={18} /> Editar Informações
                    </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}