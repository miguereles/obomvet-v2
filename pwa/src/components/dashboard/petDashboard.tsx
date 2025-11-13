import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PawPrint, Plus, Trash2, Edit2, Check, Loader2 } from "lucide-react"; // ✅ Adicionado Loader2
import { motion, AnimatePresence } from "framer-motion";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css"; // Tooltip styles

// ✅ 1. Importar Serviços e Tipos
import { PetService } from "../../services/PetService"; //
import TutorService from "../../services/TutorService"; //
import { Pet as PetType, Usuario } from "../../services/types"; //
import { useToast } from "../ui/ToastProvider"; // ✅ Usar Toasts ao invés de 'alert'

// ✅ 2. Interface Pet atualizada para usar o tipo central
interface Pet extends PetType {}

// ✅ Interface User atualizada para corresponder ao tipo central
interface User extends Pick<Usuario, 'id' | 'tipo' | 'tutor_id' | 'clinica_id' | 'veterinario_id'> {}

interface Props {
  currentUser: User;
}

export default function PetDashboard({ currentUser }: Props) {
  // ❌ 3. Remover 'navigate' e 'API_URL' (não são mais necessários aqui)
  const navigate = useNavigate(); // Navigate é mantido para o fallback de token
  // const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
  const { showToast } = useToast();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  
  // ✅ 4. Adicionar estado de erro para o modal
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [formData, setFormData] = useState({
    nome: "",
    especie: "",
    raca: "",
    idade: "",
    peso: "",
    alergias: "",
    alergiasSim: false,
    medicamentos_continuos: "",
    medicamentosSim: false,
    cuidados_especiais: "",
    cuidadosSim: false,
  });

  // ❌ 5. Remover função 'isTokenValid'. O interceptor em 'api.ts' já cuida disso.
  //

  // ---------- FUNÇÃO PARA CALCULAR IDADE ----------
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

  // ---------- BUSCAR PETS (Refatorado) ----------
  useEffect(() => {
    // ❌ 6. Verificação de token removida. O Service/api.ts cuida disso.
    
    async function fetchPets() {
      setLoading(true);
      try {
        // ✅ 7. Usar TutorService para buscar o tutor logado.
        // Esta rota (TutorController@meu) já retorna os pets.
        const tutorData = await TutorService.getMeuTutor();

        const petsArray = tutorData.pets || [];
        
        // Preenche a idade a partir da data_nascimento
        petsArray.forEach((p: Pet) => {
          if (p.data_nascimento) p.idade = calcularIdade(p.data_nascimento);
        });
        setPets(petsArray);
      } catch (err: any) {
        console.error(err);
        // O interceptor 'api.ts' já redireciona se for 401 (expirado)
        // Se for outro erro (ex: 500), apenas logamos.
        setPets([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPets();
  }, [currentUser]); // ✅ 8. Dependências limpas

  // ---------- HANDLE CHANGE ----------
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, type } = e.target;
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: e.target.value }));
    }
  }

  // ---------- ABRIR MODAL ----------
  function openModal(pet?: Pet) {
    if (pet) {
      setEditingPet(pet);
      setFormData({
        nome: pet.nome,
        especie: pet.especie,
        raca: pet.raca || "", // Corrigido para raca
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
      setEditingPet(null);
      setFormData({
        nome: "",
        especie: "",
        raca: "",
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
    setModalOpen(true);
    setModalError(""); // Limpa erros ao abrir
    setModalLoading(false);
  }

  // ---------- HANDLE SUBMIT (Refatorado) ----------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // ❌ 9. Verificação de token removida.

    const nome = formData.nome.trim();
    const especie = formData.especie.trim();
    const raca = formData.raca.trim();
    if (!nome || !especie) { // ✅ Raça não é mais obrigatória
      setModalError("Preencha os campos obrigatórios: Nome e Espécie");
      return;
    }

    setModalLoading(true); // ✅ Usar loading do modal
    setModalError("");

    try {
      // ❌ 10. Fetch de Tutor removido. O backend associa o usuário logado.

      const payload = {
        nome,
        especie,
        raca: raca || null, // Envia null se vazio
        // O backend espera data_nascimento
        data_nascimento: formData.idade ? `${new Date().getFullYear() - Number(formData.idade)}-01-01` : null,
        peso: formData.peso ? Number(formData.peso) : null,
        alergias: formData.alergiasSim ? formData.alergias : null,
        medicamentos_continuos: formData.medicamentosSim ? formData.medicamentos_continuos : null,
        cuidados_especiais: formData.cuidadosSim ? formData.cuidados_especiais : null,
        // ❌ tutor_id removido. O backend associa automaticamente.
      };

      let data: Pet; // ✅ Tipagem forte
      if (editingPet) {
        // ✅ 11. Usar PetService.update
        data = await PetService.update(editingPet.id, payload as any); //
        data.idade = formData.idade ? Number(formData.idade) : undefined;
        setPets((prev) => prev.map((p) => (p.id === editingPet.id ? data : p)));
        setSuccessMessage(`✏️ Pet "${data.nome}" atualizado com sucesso!`);
      } else {
        // ✅ 12. Usar PetService.create
        //
        // O PetController.store retorna { pet: ... }
        const responseData = await PetService.create(payload as any);
        data = (responseData as any).pet || responseData; // Lida com a resposta aninhada
        data.idade = formData.idade ? Number(formData.idade) : undefined;
        setPets((prev) => [...prev, data]);
        setSuccessMessage(`🐾 Pet "${data.nome}" cadastrado com sucesso!`);
      }

      setModalOpen(false);
      setEditingPet(null);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error(err);
      // ✅ 13. Mostrar erro no modal
      setModalError(err.response?.data?.message || err.message || "Erro ao salvar pet.");
    } finally {
      setModalLoading(false); // ✅ Parar loading do modal
    }
  }

  // ---------- HANDLE DELETE (Refatorado) ----------
  async function handleDelete(id: number) {
    // ❌ 14. Verificação de token removida.
    if (!confirm("Deseja realmente excluir este pet?")) return;

    try {
      // ✅ 15. Usar PetService.delete
      await PetService.delete(id); //
      setPets((prev) => prev.filter((p) => p.id !== id));
      showToast("Pet excluído com sucesso!", { type: 'success' });
    } catch(err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Erro ao excluir pet.", { type: 'error' });
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center p-6">
        <Loader2 className="animate-spin w-6 h-6 mr-2" /> Carregando pets...
    </div>
  );

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
            <PawPrint size={28} /> Meus Pets
          </h1>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus size={18} /> Novo Pet
          </button>
        </div>

        {/* SUCCESS ALERT */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2"
            >
              <Check size={20} /> {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* PETS TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Nome</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Espécie</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Raça</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Idade</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Peso</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pets.map((pet) => (
                <tr key={pet.id} className="hover:bg-gray-50 transition relative">
                  
                  {/* ✅ CORREÇÃO DO BUG: O Tippy deve ficar DENTRO do <td> */}
                  <td className="px-6 py-4 cursor-pointer">
                    <Tippy
                      content={
                        <div className="text-sm p-1">
                          {pet.alergias && <p>🩹 Alergias: {pet.alergias}</p>}
                          {pet.medicamentos_continuos && <p>💊 Medicamentos: {pet.medicamentos_continuos}</p>}
                          {pet.cuidados_especiais && <p>⚠️ Cuidados: {pet.cuidados_especiais}</p>}
                          {(!pet.alergias && !pet.medicamentos_continuos && !pet.cuidados_especiais) && <p>Sem observações.</p>}
                        </div>
                      }
                    >
                      {/* O Tippy precisa de um elemento DOM real (como span) para se ancorar */}
                      <span>{pet.nome}</span> 
                    </Tippy>
                  </td>
                  <td className="px-6 py-4">{pet.especie}</td>
                  <td className="px-6 py-4">{pet.raca || "-"}</td>
                  <td className="px-6 py-4">{pet.idade || "-"}</td>
                  <td className="px-6 py-4">{pet.peso ? `${pet.peso} kg` : "-"}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => openModal(pet)} className="text-blue-500 hover:text-blue-700">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(pet.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)} // Fecha ao clicar fora
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-lg p-8 relative shadow-2xl overflow-hidden"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()} // Impede de fechar ao clicar dentro
            >
              <h2 className="text-3xl font-extrabold mb-6 text-gray-800 flex items-center gap-2">
                {editingPet ? "Editar Pet" : "Cadastrar Novo Pet"} <PawPrint size={28} className="text-blue-600" />
              </h2>
              
              {/* ✅ 16. Mostrar erro do modal */}
              {modalError && (
                  <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg mb-4 text-sm">
                      {modalError}
                  </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: "nome", label: "Nome do Pet", required: true },
                    { name: "especie", label: "Espécie", required: true },
                    { name: "raca", label: "Raça", required: false }, // ✅ Raça não é mais obrigatória
                    { name: "idade", label: "Idade (anos)", type: "number", required: false },
                    { name: "peso", label: "Peso (kg)", type: "number", required: false },
                  ].map(({ name, label, type, required }) => (
                    <div className="relative" key={name}>
                      <input
                        name={name}
                        type={type || "text"}
                        value={formData[name as keyof typeof formData]}
                        onChange={handleChange}
                        placeholder=" "
                        required={required}
                        className="peer w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 text-gray-800 transition"
                      />
                      <label className="absolute left-0 -top-3.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>

                {[{ key: "alergiasSim", label: "Possui alergias?", inputName: "alergias" },
                  { key: "medicamentosSim", label: "Usa medicamentos contínuos?", inputName: "medicamentos_continuos" },
                  { key: "cuidadosSim", label: "Possui cuidados especiais?", inputName: "cuidados_especiais" }].map(({ key, label, inputName }) => (
                  <div key={key}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name={key} checked={formData[key as keyof typeof formData] as boolean} onChange={handleChange} className="accent-blue-600 w-5 h-5"/>
                      <span className="text-gray-700 font-medium">{label}</span>
                    </label>
                    {formData[key as keyof typeof formData] && (
                      <input
                        name={inputName}
                        value={formData[inputName as keyof typeof formData] as string}
                        onChange={handleChange}
                        placeholder={`Descreva ${label.toLowerCase()}`}
                        className="mt-1 w-full border rounded-lg p-2 shadow-sm focus:ring-2 focus:ring-blue-200 transition"
                      />
                    )}
                  </div>
                ))}

                <div className="flex gap-3 mt-4">
                  <button 
                    type="submit" 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 disabled:opacity-70"
                    disabled={modalLoading} // ✅ 17. Desabilitar botão
                  >
                    {modalLoading ? (
                        <Loader2 className="animate-spin w-5 h-5 mx-auto" />
                    ) : (
                        editingPet ? "Atualizar Pet" : "Salvar Pet"
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setModalOpen(false)} 
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl shadow transition transform hover:-translate-y-0.5"
                    disabled={modalLoading}
                  >
                    Cancelar
                  </button>
                </div>

                <button type="button" onClick={() => setModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-2xl">
                  ✕
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}