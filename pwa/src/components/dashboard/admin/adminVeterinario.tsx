import React, { useEffect, useState } from 'react';
import { Stethoscope, Loader2, AlertTriangle, Trash2, Edit, X, Plus, Save, UserCheck, CheckCircle, Clock } from 'lucide-react';
import { Veterinario } from '../../../services/types';
import AdminService from '../../../services/AdminService';
import { useToast } from '../../ui/ToastProvider';

export default function AdminManageVets() {
  const [veterinarios, setVeterinarios] = useState<Veterinario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVet, setSelectedVet] = useState<Veterinario | null>(null);
  const [newVet, setNewVet] = useState({ name: '', email: '', password: '', nome_completo: '', crmv: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => { fetchVets(); }, []);

  const handleApprove = async (vet: Veterinario) => {
      if (!vet.usuario_id) return;
      try {
          await AdminService.approveUser(vet.usuario_id);
          showToast("Veterinário aprovado com sucesso!", { type: 'success' });
          fetchVets();
      } catch (e) {
          showToast("Erro ao aprovar.", { type: 'error' });
      }
  };

  // ... (Outros handlers de create/update/delete mantidos) ...
    const handleCloseModals = () => {
    setIsEditModalOpen(false); setIsDeleteModalOpen(false); setIsCreateModalOpen(false);
    setSelectedVet(null); setIsSubmitting(false);
    setNewVet({ name: '', email: '', password: '', nome_completo: '', crmv: '' });
  };

  const handleCreateVet = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
        await AdminService.createVeterinario(newVet);
        showToast('Veterinário criado e aprovado!', { type: 'success' });
        handleCloseModals(); fetchVets();
    } catch (err: any) {
        showToast(err.response?.data?.error || "Erro ao criar", { type: 'error' });
    } finally { setIsSubmitting(false); }
  };

  const handleConfirmDelete = async () => {
    if (!selectedVet) return; setIsSubmitting(true);
    try {
      await AdminService.deleteVeterinario(selectedVet.id);
      setVeterinarios(prev => prev.filter(v => v.id !== selectedVet.id));
      showToast('Excluído!', { type: 'success' }); handleCloseModals();
    } catch (err: any) { showToast(`Erro: ${err.message}`, { type: 'error' }); } finally { setIsSubmitting(false); }
  };

  const handleUpdateVet = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedVet) return; setIsSubmitting(true);
    try {
      const updatedData = { nome_completo: selectedVet.nome_completo, especialidade: selectedVet.especialidade, autonomo: selectedVet.autonomo, clinica_id: selectedVet.autonomo ? null : selectedVet.clinica_id };
      const updatedVet = await AdminService.updateVeterinario(selectedVet.id, updatedData);
      setVeterinarios(prev => prev.map(v => (v.id === updatedVet.id ? updatedVet : v)));
      showToast('Atualizado!', { type: 'success' }); handleCloseModals();
    } catch (err: any) { showToast(`Erro: ${err.message}`, { type: 'error' }); } finally { setIsSubmitting(false); }
  };


  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Stethoscope size={20} className="text-blue-600"/> Gerir Veterinários
             </h2>
             <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
                <Plus size={18} /> Novo Veterinário
            </button>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
        {!loading && !error && (
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">CRMV</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {veterinarios.map((vet) => {
                    const isApproved = vet.usuario?.approved;
                    return (
                      <tr key={vet.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {vet.nome_completo}
                            <div className="text-xs text-gray-400">{vet.usuario?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{vet.crmv}</td>
                        <td className="px-4 py-3 text-sm">
                            {isApproved ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle size={12} className="mr-1"/> Aprovado
                                </span>
                            ) : (
                                <button onClick={() => handleApprove(vet)} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer border border-yellow-300 shadow-sm">
                                    <Clock size={12} className="mr-1"/> Pendente (Aprovar)
                                </button>
                            )}
                        </td>
                        <td className="px-4 py-3 text-sm flex gap-3">
                          <button onClick={() => { setSelectedVet({...vet}); setIsEditModalOpen(true); }} className="text-blue-600"><Edit size={16} /></button>
                          <button onClick={() => { setSelectedVet(vet); setIsDeleteModalOpen(true); }} className="text-red-600"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* MODAL CRIAR */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <form onSubmit={handleCreateVet} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2"><UserCheck size={20}/> Novo Veterinário Autônomo</h3>
                    <button type="button" onClick={handleCloseModals} className="hover:bg-white/20 p-1 rounded"><X size={20} /></button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome de Usuário</label>
                        <input required type="text" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" value={newVet.name} onChange={e => setNewVet({...newVet, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input required type="text" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" value={newVet.nome_completo} onChange={e => setNewVet({...newVet, nome_completo: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input required type="email" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" value={newVet.email} onChange={e => setNewVet({...newVet, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Senha</label>
                        <input required type="password" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" value={newVet.password} onChange={e => setNewVet({...newVet, password: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">CRMV</label>
                        <input required type="text" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" value={newVet.crmv} onChange={e => setNewVet({...newVet, crmv: e.target.value})} />
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button type="button" onClick={handleCloseModals} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* MODAL EDITAR */}
      {isEditModalOpen && selectedVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleUpdateVet} className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
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
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Especialidade</label>
                <input
                  type="text"
                  value={selectedVet.especialidade || ''}
                  onChange={(e) => setSelectedVet(p => p ? {...p, especialidade: e.target.value} : null)}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm"
                />
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg border">
                <input
                  type="checkbox"
                  id="autonomo"
                  checked={!!selectedVet.autonomo}
                  onChange={(e) => setSelectedVet(p => p ? {...p, autonomo: e.target.checked} : null)}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="autonomo" className="ml-3 block text-sm font-medium text-gray-900">É Autônomo?</label>
              </div>
              {!selectedVet.autonomo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID da Clínica</label>
                  <input
                    type="number"
                    value={selectedVet.clinica_id || ''}
                    onChange={(e) => setSelectedVet(p => p ? {...p, clinica_id: e.target.value ? parseInt(e.target.value) : null} : null)}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm"
                  />
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
              <button type="button" onClick={handleCloseModals} className="px-4 py-2 bg-white border rounded-lg">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {isDeleteModalOpen && selectedVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-xl font-bold text-gray-900">Excluir?</h3>
              <p className="mt-2 text-gray-600">Tem a certeza que quer excluir <strong>{selectedVet.nome_completo}</strong>?</p>
            </div>
            <div className="p-4 bg-gray-50 flex justify-center gap-3 border-t">
              <button type="button" onClick={handleCloseModals} className="px-4 py-2 bg-white border rounded-lg">Cancelar</button>
              <button type="button" onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}