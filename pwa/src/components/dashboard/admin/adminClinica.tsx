import React, { useEffect, useState } from 'react';
import { Building, Loader2, AlertTriangle, Trash2, Edit, X, Plus, Save, CheckCircle, Clock } from 'lucide-react';
import { Clinica } from '../../../services/types';
import AdminService from '../../../services/AdminService';
import { useToast } from '../../ui/ToastProvider';

export default function AdminManageClinics() {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClinica, setSelectedClinica] = useState<Clinica | null>(null);
  const [newClinica, setNewClinica] = useState({
    name: '', email: '', password: '', nome_fantasia: '', cnpj: '', telefone_principal: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => { fetchClinicas(); }, []);

  const handleApprove = async (clinica: Clinica) => {
      if (!clinica.usuario_id) return;
      try {
          await AdminService.approveUser(clinica.usuario_id);
          showToast("Clínica aprovada com sucesso!", { type: 'success' });
          fetchClinicas();
      } catch (e) {
          showToast("Erro ao aprovar clínica.", { type: 'error' });
      }
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false); setIsDeleteModalOpen(false); setIsCreateModalOpen(false);
    setSelectedClinica(null); setIsSubmitting(false);
    setNewClinica({ name: '', email: '', password: '', nome_fantasia: '', cnpj: '', telefone_principal: '' });
  };

  const handleCreateClinica = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
        await AdminService.createClinica(newClinica);
        showToast('Clínica criada e aprovada!', { type: 'success' });
        handleCloseModals(); fetchClinicas();
    } catch (err: any) {
        showToast(err.response?.data?.error || "Erro ao criar", { type: 'error' });
    } finally { setIsSubmitting(false); }
  };

  const handleConfirmDelete = async () => {
    if (!selectedClinica) return; setIsSubmitting(true);
    try {
      await AdminService.deleteClinica(selectedClinica.id);
      setClinicas(prev => prev.filter(c => c.id !== selectedClinica.id));
      showToast('Excluída!', { type: 'success' }); handleCloseModals();
    } catch (err: any) { showToast("Erro ao excluir", { type: 'error' }); } finally { setIsSubmitting(false); }
  };

  const handleUpdateClinica = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedClinica) return; setIsSubmitting(true);
    try {
      await AdminService.updateClinica(selectedClinica.id, selectedClinica);
      showToast('Atualizada!', { type: 'success' }); handleCloseModals(); fetchClinicas();
    } catch (err: any) { showToast("Erro ao atualizar", { type: 'error' }); } finally { setIsSubmitting(false); }
  };


  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Building size={20} className="text-[#004E64]" /> Gestão de Clínicas
            </h2>
            <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-[#25A18E] text-white px-4 py-2 rounded-lg hover:bg-[#1F7A6B] transition font-medium shadow-sm">
                <Plus size={18} /> Nova Clínica
            </button>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
        {!loading && !error && (
          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clinicas.map((clinica) => {
                    // Verifica aprovação (assume que usuario vem no eager load)
                    const isApproved = clinica.usuario?.approved;
                    return (
                      <tr key={clinica.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">#{clinica.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {clinica.nome_fantasia}
                            <div className="text-xs text-gray-500">{clinica.email_contato}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                            {isApproved ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle size={12} className="mr-1"/> Aprovada
                                </span>
                            ) : (
                                <button onClick={() => handleApprove(clinica)} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer border border-yellow-300 shadow-sm">
                                    <Clock size={12} className="mr-1"/> Pendente (Aprovar)
                                </button>
                            )}
                        </td>
                        <td className="px-4 py-3 text-sm flex gap-3">
                          <button onClick={() => { setSelectedClinica({...clinica}); setIsEditModalOpen(true); }} className="text-blue-600"><Edit size={16} /></button>
                          <button onClick={() => { setSelectedClinica(clinica); setIsDeleteModalOpen(true); }} className="text-red-600"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* --- MODAL CRIAR --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <form onSubmit={handleCreateClinica} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="bg-[#004E64] p-4 flex justify-between items-center text-white">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Building size={20}/> Cadastrar Nova Clínica</h3>
                    <button type="button" onClick={handleCloseModals} className="hover:bg-white/20 p-1 rounded"><X size={20} /></button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome do Responsável</label>
                        <input required type="text" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" value={newClinica.name} onChange={e => setNewClinica({...newClinica, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                        <input required type="text" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" value={newClinica.nome_fantasia} onChange={e => setNewClinica({...newClinica, nome_fantasia: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input required type="email" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" value={newClinica.email} onChange={e => setNewClinica({...newClinica, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Senha</label>
                        <input required type="password" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" value={newClinica.password} onChange={e => setNewClinica({...newClinica, password: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                        <input required type="text" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" value={newClinica.cnpj} onChange={e => setNewClinica({...newClinica, cnpj: e.target.value})} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input type="tel" className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" value={newClinica.telefone_principal} onChange={e => setNewClinica({...newClinica, telefone_principal: e.target.value})} />
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button type="button" onClick={handleCloseModals} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#25A18E] text-white rounded-lg font-bold hover:bg-[#1F7A6B] disabled:opacity-50 flex items-center gap-2">
                        {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* MODAL EDITAR */}
      {isEditModalOpen && selectedClinica && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleUpdateClinica} className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold">Editar Clínica #{selectedClinica.id}</h3>
              <button type="button" onClick={handleCloseModals}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                <input type="text" value={selectedClinica.nome_fantasia || ''} onChange={(e) => setSelectedClinica(p => p ? {...p, nome_fantasia: e.target.value} : null)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email de Contato</label>
                <input type="email" value={selectedClinica.email_contato || ''} onChange={(e) => setSelectedClinica(p => p ? {...p, email_contato: e.target.value} : null)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefone Principal</label>
                <input type="tel" value={selectedClinica.telefone_principal || ''} onChange={(e) => setSelectedClinica(p => p ? {...p, telefone_principal: e.target.value} : null)} className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm" />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
              <button type="button" onClick={handleCloseModals} className="px-4 py-2 bg-white border rounded-lg">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {isDeleteModalOpen && selectedClinica && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-xl font-bold text-gray-900">Excluir Clínica?</h3>
              <p className="mt-2 text-gray-600">Tem a certeza que quer excluir <strong>{selectedClinica.nome_fantasia}</strong>?</p>
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