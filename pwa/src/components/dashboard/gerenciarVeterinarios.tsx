import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, Loader2 } from "lucide-react";

// 1. Importe os services e os tipos!
import ClinicaService from "../../services/ClinicaService";
import VeterinarioService from "../../services/VeterinarioService";
import { Veterinario, CreateVetDto } from "../../services/types"; // Use seu tipo central

// 2. Remova a interface duplicada
// interface Veterinario { ... } // (Removida, usamos a de types.ts)

// 3. Atualize o FormData para bater com o DTO
interface VeterinarioFormData {
  nome_completo: string;
  crmv: string;
  especialidade?: string;
  disponivel_24h: boolean;
  telefone_principal?: string;
  email: string;
  password?: string;
}

export default function GerenciarVeterinarios() {
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<VeterinarioFormData>({
    nome_completo: "",
    crmv: "",
    especialidade: "",
    disponivel_24h: false,
    telefone_principal: "",
    email: "",
    password: "",
  });

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      crmv: "",
      especialidade: "",
      disponivel_24h: false,
      telefone_principal: "",
      email: "",
      password: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  // ======================
  // 🔹 Buscar veterinários (Refatorado)
  // ======================
  const fetchVeterinarios = async () => {
    setLoading(true);
    setError(null);

    // O token já é tratado pelo 'api.ts'
    const clinicaId = localStorage.getItem("clinica_id");

    if (!clinicaId) {
      console.error("ID da clínica não encontrado");
      window.location.href = "/login";
      return;
    }

    try {
      // 4. Use o Service!
      const data = await ClinicaService.getVeterinarios(clinicaId);
      if (!Array.isArray(data)) throw new Error("Formato inválido da API");

      setVeterinarios(data);
    } catch (err) {
      console.error("Erro ao buscar veterinários:", err);
      setError(
        err instanceof Error ? err.message : "Erro ao carregar veterinários"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // 🔹 Criar ou atualizar (Refatorado)
  // ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const clinicaId = localStorage.getItem("clinica_id");
      if (!clinicaId) throw new Error("Credenciais não encontradas");

      if (editingId) {
        // --- LÓGICA DE UPDATE ---
        const payload: Partial<Veterinario> = {
          nome_completo: formData.nome_completo,
          crmv: formData.crmv,
          especialidade: formData.especialidade,
          telefone_emergencia: formData.telefone_principal,
          disponivel_24h: formData.disponivel_24h,
          // Nota: O backend não parece suportar update de email/senha por aqui
        };
        // 5. Use o Service!
        const savedVet = await VeterinarioService.update(editingId, payload);
        setVeterinarios((vets) =>
          vets.map((v) => (v.id === editingId ? savedVet : v))
        );

      } else {
        // --- LÓGICA DE CREATE ---
        const payload: CreateVetDto = {
          nome: formData.nome_completo.split(' ')[0], // 'name' é obrigatório no seu AuthController
          nome_completo: formData.nome_completo,
          email: formData.email,
          password: formData.password, // Senha é obrigatória na criação
          crmv: formData.crmv,
          especialidade: formData.especialidade,
          telefone_emergencia: formData.telefone_principal,
          disponivel_24h: formData.disponivel_24h,
          clinica_id: clinicaId,
        };
        
        // 6. Use o Service!
        const savedData = await VeterinarioService.createForClinica(payload);
        setVeterinarios((vets) => [...vets, savedData.veterinario]);
      }

      resetForm();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err) || "Erro ao salvar veterinário";
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // 🔹 Excluir (Refatorado)
  // ======================
  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este veterinário?")) return;

    setLoading(true);
    setError(null);

    try {
      // 7. Use o Service!
      await VeterinarioService.delete(id);
      setVeterinarios((vets) => vets.filter((v) => v.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Erro ao excluir veterinário");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // 🔹 Editar
  // ======================
  const handleEdit = (vet: Veterinario) => {
    setFormData({
      nome_completo: vet.nome_completo,
      crmv: vet.crmv,
      especialidade: vet.especialidade || "",
      disponivel_24h: vet.disponivel_24h,
      telefone_principal: vet.telefone_principal || vet.telefone_emergencia || "",
      email: vet.email || "",
      password: "",
    });
    setEditingId(vet.id);
    setShowForm(true);
  };

  useEffect(() => {
    fetchVeterinarios();
  }, []);

  // ======================
  // 🔹 Render (Sem alterações)
  // ======================
  return (
    <div className="space-y-6">
      {/* ... todo o seu JSX de renderização ... */}
      {/* ... (ele não muda, pois a lógica está separada) ... */}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Gerenciar Veterinários
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#25A18E] text-white rounded-lg hover:bg-[#208B7C] transition"
          disabled={showForm}
        >
          <Plus size={20} />
          Adicionar Veterinário
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      {showForm && (
         <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          {/* ... (Todo o seu formulário JSX) ... */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nome_completo}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, nome_completo: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CRMV *
              </label>
              <input
                type="text"
                required
                value={formData.crmv}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, crmv: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidade
              </label>
              <input
                type="text"
                value={formData.especialidade}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, especialidade: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.telefone_principal}
                onChange={(e) =>
                  setFormData((d) => ({
                    ...d,
                    telefone_principal: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                disabled={!!editingId} // Não permita editar email (geralmente)
                value={formData.email}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, email: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha {!editingId && "*"}
              </label>
              <input
                type="password"
                required={!editingId} // Senha só é obrigatória ao criar
                value={formData.password}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, password: e.target.value }))
                }
                placeholder={
                  editingId
                    ? "Deixe em branco para manter a senha atual"
                    : ""
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E]"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.disponivel_24h}
                  onChange={(e) =>
                    setFormData((d) => ({
                      ...d,
                      disponivel_24h: e.target.checked,
                    }))
                  }
                  className="rounded text-[#25A18E] focus:ring-[#25A18E]"
                />
                Disponível 24h
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#25A18E] text-white rounded-lg hover:bg-[#208B7C] transition disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Check size={18} />
              )}
              {editingId ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      )}

      {/* ... (Todo o seu JSX de listagem) ... */}
       {loading && !veterinarios.length ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-[#25A18E]" size={32} />
        </div>
      ) : veterinarios.length > 0 ? (
        <div className="grid gap-4">
          {veterinarios.map((vet) => (
            <div
              key={vet.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-start"
            >
              <div>
                <h3 className="font-semibold text-gray-800">
                  {vet.nome_completo}
                </h3>
                <p className="text-sm text-gray-600">CRMV: {vet.crmv}</p>
                {vet.especialidade && (
                  <p className="text-sm text-gray-600">
                    Especialidade: {vet.especialidade}
                  </p>
                )}
                {vet.disponivel_24h && (
                  <span className="text-xs mt-2 inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    Disponível 24h
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(vet)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(vet.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-gray-500">
          Nenhum veterinário cadastrado. Clique em Adicionar Veterinário para começar.
        </p>
      )}
    </div>
  );
}