import React, { useState, useEffect } from 'react';
import { Dog, Cat, X, Plus, Loader2, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Pet {
  id: number;
  nome: string;
  especie: string;
  raca?: string;
  idade?: number;
  peso?: number;
  sexo?: 'M' | 'F';
  cor?: string;
  observacoes?: string;
  foto_url?: string;
}

interface PetFormProps {
  onSubmit: (pet: Omit<Pet, 'id'>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onCancel: () => void;
  initialData?: Pet;
  isEditing?: boolean;
}

export default function PetForm({ onSubmit, onDelete, onCancel, initialData, isEditing = false }: PetFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Pet, 'id'>>({
    nome: '',
    especie: 'cachorro',
    raca: '',
    idade: undefined,
    peso: undefined,
    sexo: undefined,
    cor: '',
    observacoes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome,
        especie: initialData.especie,
        raca: initialData.raca || '',
        idade: initialData.idade,
        peso: initialData.peso,
        sexo: initialData.sexo,
        cor: initialData.cor || '',
        observacoes: initialData.observacoes || '',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onCancel(); // Fecha o formulário após sucesso
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar pet');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !onDelete) return;
    
    if (!confirm('Tem certeza que deseja excluir este pet?')) return;

    setLoading(true);
    setError(null);

    try {
      await onDelete(initialData.id);
      onCancel(); // Fecha o formulário após sucesso
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir pet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Editar Pet' : 'Adicionar Novo Pet'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={e => setFormData(d => ({ ...d, nome: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] focus:border-transparent"
                  placeholder="Nome do pet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Espécie *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(d => ({ ...d, especie: 'cachorro' }))}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      formData.especie === 'cachorro'
                        ? 'bg-[#25A18E] text-white border-transparent'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Dog size={20} />
                    Cachorro
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(d => ({ ...d, especie: 'gato' }))}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      formData.especie === 'gato'
                        ? 'bg-[#25A18E] text-white border-transparent'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Cat size={20} />
                    Gato
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raça
                </label>
                <input
                  type="text"
                  value={formData.raca}
                  onChange={e => setFormData(d => ({ ...d, raca: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] focus:border-transparent"
                  placeholder="Raça do pet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idade (anos)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.idade || ''}
                  onChange={e => setFormData(d => ({ ...d, idade: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] focus:border-transparent"
                  placeholder="Idade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.peso || ''}
                  onChange={e => setFormData(d => ({ ...d, peso: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] focus:border-transparent"
                  placeholder="Peso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sexo
                </label>
                <select
                  value={formData.sexo || ''}
                  onChange={e => setFormData(d => ({ ...d, sexo: e.target.value as 'M' | 'F' | undefined }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] focus:border-transparent"
                >
                  <option value="">Selecione</option>
                  <option value="M">Macho</option>
                  <option value="F">Fêmea</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor
              </label>
              <input
                type="text"
                value={formData.cor}
                onChange={e => setFormData(d => ({ ...d, cor: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] focus:border-transparent"
                placeholder="Cor do pet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={e => setFormData(d => ({ ...d, observacoes: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#25A18E] focus:border-transparent"
                rows={3}
                placeholder="Informações adicionais, alergias, condições especiais, etc."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#25A18E] text-white rounded-lg hover:bg-[#208B7C] transition-colors disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isEditing ? (
                <Save size={20} />
              ) : (
                <Plus size={20} />
              )}
              {isEditing ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}