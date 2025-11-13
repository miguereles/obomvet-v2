import React, { useEffect, useState } from 'react';
import { Building, Loader2, AlertTriangle, Trash2, Edit, X, Shield } from 'lucide-react';
import { Clinica } from '../../../services/types';
import AdminService from '../../../services/AdminService';
import { useToast } from '../../ui/ToastProvider';

export default function AdminManageClinics() {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Estado dos Modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClinica, setSelectedClinica] = useState<Clinica | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carrega os dados
  useEffect(() => {
    const fetchClinicas = async () => {
      try {
        setLoading(true);
        const data = await AdminService.getAllClinicas();
        setClinicas(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar clínicas.');
      } finally {
        setLoading(false);
      }
    };
    fetchClinicas();
  }, []);

  // --- Handlers de Ações ---
  const handleEditClick = (clinica: Clinica) => {
    setSelectedClinica({ ...clinica }); // Clona para edição
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (clinica: Clinica) => {
    setSelectedClinica(clinica);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedClinica(null);
    setIsSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedClinica) return;
    
    setIsSubmitting(true);
    try {
      await AdminService.deleteClinica(selectedClinica.id);
      setClinicas(prev => prev.filter(c => c.id !== selectedClinica.id));
      showToast('Clínica excluída com sucesso!', { type: 'success' });
      handleCloseModals();
    } catch (err: any) {
      showToast(`Erro ao excluir clínica: ${err.message}`, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClinica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinica) return;

    setIsSubmitting(true);
    try {
      const updatedData = {
        nome_fantasia: selectedClinica.nome_fantasia,
        email_contato: selectedClinica.email_contato,
        telefone_principal: selectedClinica.telefone_principal,
        // Adicione outros campos aqui
      };

      const updatedClinica = await AdminService.updateClinica(selectedClinica.id, updatedData);
      setClinicas(prev => prev.map(c => (c.id === updatedClinica.id ? updatedClinica : c)));
      showToast('Clínica atualizada com sucesso!', { type: 'success' });
      handleCloseModals();
    } catch (err: any) {
      showToast(`Erro ao atualizar clínica: ${err.message}`, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Building size={20} /> Gerir Clínicas
        </h2>
        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Carregando clínicas...
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome Fantasia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clinicas.map((clinica) => (
                  <tr key={clinica.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{clinica.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{clinica.nome_fantasia}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{clinica.email_contato}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{clinica.telefone_principal}</td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => handleEditClick(clinica)} className="text-blue-600 hover:text-blue-800" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(clinica)} className="text-red-600 hover:text-red-800 ml-3" title="Excluir">
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
      {isEditModalOpen && selectedClinica && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form onSubmit={handleUpdateClinica} className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Editar Clínica #{selectedClinica.id}</h3>
              <button type="button" onClick={handleCloseModals}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                <input
                  type="text"
                  value={selectedClinica.nome_fantasia || ''}
                  onChange={(e) => setSelectedClinica(p => p ? {...p, nome_fantasia: e.target.value} : null)}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email de Contato</label>
                <input
                  type="email"
                  value={selectedClinica.email_contato || ''}
                  onChange={(e) => setSelectedClinica(p => p ? {...p, email_contato: e.target.value} : null)}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone Principal</label>
                <input
                  type="tel"
                  value={selectedClinica.telefone_principal || ''}
                  onChange={(e) => setSelectedClinica(p => p ? {...p, telefone_principal: e.target.value} : null)}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                />
              </div>
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
      {isDeleteModalOpen && selectedClinica && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-bold text-gray-900">Excluir Clínica</h3>
              <p className="mt-2 text-sm text-gray-600">
                Tem a certeza que quer excluir a clínica **{selectedClinica.nome_fantasia}** (ID: {selectedClinica.id})? Esta ação não pode ser revertida.
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