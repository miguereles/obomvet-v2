import React, { useEffect, useState } from 'react';
import { Stethoscope, Loader2, AlertTriangle, Trash2, Edit, X } from 'lucide-react';
import { Veterinario } from '../../../services/types';
import AdminService from '../../../services/AdminService';
import { useToast } from '../../ui/ToastProvider';

export default function AdminManageVets() {
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Estado dos Modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVet, setSelectedVet] = useState<Veterinario | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchVets = async () => {
      try {
        setLoading(true);
        const data = await AdminService.getAllVeterinarios();
        setVeterinarios(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar veterinários.');
      } finally {
        setLoading(false);
      }
    };
    fetchVets();
  }, []);

  // --- Handlers de Ações ---
  const handleEditClick = (vet: Veterinario) => {
    setSelectedVet({ ...vet }); // Clona para edição
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (vet: Veterinario) => {
    setSelectedVet(vet);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedVet(null);
    setIsSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedVet) return;
    
    setIsSubmitting(true);
    try {
      // O controller do backend (destroy) também apaga o 'usuario' associado
      await AdminService.deleteVeterinario(selectedVet.id);
      setVeterinarios(prev => prev.filter(v => v.id !== selectedVet.id));
      showToast('Veterinário e utilizador associado excluídos!', { type: 'success' });
      handleCloseModals();
    } catch (err: any) {
      showToast(`Erro ao excluir veterinário: ${err.message}`, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVet) return;

    setIsSubmitting(true);
    try {
      const updatedData: Partial<Veterinario> = {
        nome_completo: selectedVet.nome_completo,
        especialidade: selectedVet.especialidade,
        autonomo: selectedVet.autonomo,
        clinica_id: selectedVet.autonomo ? null : selectedVet.clinica_id, // Se for autônomo, anula clinica_id
      };

      const updatedVet = await AdminService.updateVeterinario(selectedVet.id, updatedData);
      setVeterinarios(prev => prev.map(v => (v.id === updatedVet.id ? updatedVet : v)));
      showToast('Veterinário atualizado com sucesso!', { type: 'success' });
      handleCloseModals();
    } catch (err: any) {
      showToast(`Erro ao atualizar veterinário: ${err.message}`, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Stethoscope size={20} /> Gerir Perfis de Veterinários
        </h2>
        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Carregando veterinários...
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {!loading && !error && (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email (Login)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Autônomo?</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clínica ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {veterinarios.map((vet) => (
                  <tr key={vet.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{vet.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{vet.nome_completo}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{vet.usuario?.email || 'N/D'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {vet.autonomo ? 
                        <span className="text-green-600 font-medium">Sim</span> : 
                        <span className="text-gray-500">Não</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{vet.clinica_id || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => handleEditClick(vet)} className="text-blue-600 hover:text-blue-800" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(vet)} className="text-red-600 hover:text-red-800 ml-3" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {isEditModalOpen && selectedVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form onSubmit={handleUpdateVet} className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Editar Veterinário #{selectedVet.id}</h3>
              <button type="button" onClick={handleCloseModals}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input
                  type="text"
                  value={selectedVet.nome_completo || ''}
                  onChange={(e) => setSelectedVet(p => p ? {...p, nome_completo: e.target.value} : null)}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Especialidade</label>
                <input
                  type="text"
                  value={selectedVet.especialidade || ''}
                  onChange={(e) => setSelectedVet(p => p ? {...p, especialidade: e.target.value} : null)}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autonomo"
                  checked={!!selectedVet.autonomo}
                  onChange={(e) => setSelectedVet(p => p ? {...p, autonomo: e.target.checked} : null)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="autonomo" className="ml-2 block text-sm text-gray-900">É Autônomo?</label>
              </div>
              {!selectedVet.autonomo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID da Clínica (Se vinculado)</label>
                  <input
                    type="number"
                    value={selectedVet.clinica_id || ''}
                    onChange={(e) => setSelectedVet(p => p ? {...p, clinica_id: e.target.value ? parseInt(e.target.value) : null} : null)}
                    className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                    placeholder="Deixe em branco se não houver"
                  />
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button type="button" onClick={handleCloseModals} className="px-4 py-2 bg-gray-100 rounded">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                {isSubmitting ? 'A guardar...' : 'Guardar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && selectedVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-bold text-gray-900">Excluir Veterinário</h3>
              <p className="mt-2 text-sm text-gray-600">
                Tem a certeza que quer excluir **{selectedVet.nome_completo || 'Vet Sem Nome'}** (ID: {selectedVet.id})? A conta de utilizador associada também será excluída.
              </p>
            </div>
            <div className="p-4 bg-gray-50 flex justify-center gap-4 rounded-b-lg">
              <button type="button" onClick={handleCloseModals} className="px-4 py-2 bg-white border rounded-md">Cancelar</button>
              <button type="button" onClick={handleConfirmDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50">
                {isSubmitting ? 'A excluir...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}