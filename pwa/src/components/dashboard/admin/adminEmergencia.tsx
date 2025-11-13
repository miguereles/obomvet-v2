import React, { useEffect, useState } from 'react';
import { HeartPulse, Loader2, AlertTriangle, Trash2, X } from 'lucide-react';
import { Emergencia } from '../../../services/types';
import AdminService from '../../../services/AdminService';
import { useToast } from '../../ui/ToastProvider';

export default function AdminAllEmergencies() {
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Estado do Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmergencia, setSelectedEmergencia] = useState<Emergencia | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEmergencias = async () => {
      try {
        setLoading(true);
        const data = await AdminService.getAllEmergencias();
        setEmergencias(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar emergências.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmergencias();
  }, []);

  // --- Handlers de Ações ---
  const handleDeleteClick = (emergencia: Emergencia) => {
    setSelectedEmergencia(emergencia);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsDeleteModalOpen(false);
    setSelectedEmergencia(null);
    setIsSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmergencia) return;
    
    setIsSubmitting(true);
    try {
      await AdminService.deleteEmergencia(selectedEmergencia.id);
      setEmergencias(prev => prev.filter(e => e.id !== selectedEmergencia.id));
      showToast('Emergência excluída com sucesso!', { type: 'success' });
      handleCloseModals();
    } catch (err: any) {
      showToast(`Erro ao excluir emergência: ${err.message}`, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <HeartPulse size={20} /> Todas as Emergências
        </h2>
        
        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Carregando emergências...
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pet ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutor ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clínica ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emergencias.map((em) => (
                  <tr key={em.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{em.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{em.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{em.pet_id || 'N/D'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{em.tutor_id || 'N/D'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{em.clinica_id || 'N/D'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {em.created_at ? new Date(em.created_at).toLocaleString("pt-BR") : "N/D"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => handleDeleteClick(em)} className="text-red-600 hover:text-red-800" title="Excluir">
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

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && selectedEmergencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-bold text-gray-900">Excluir Emergência</h3>
              <p className="mt-2 text-sm text-gray-600">
                Tem a certeza que quer excluir a emergência **ID: {selectedEmergencia.id}**? Esta ação não pode ser revertida.
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