import React, { useEffect, useState } from 'react';
import { Users, Loader2, AlertTriangle, Edit, Trash2, X } from 'lucide-react';
import { Usuario } from '../../../services/types';
import AdminService from '../../../services/AdminService';
import { useToast } from '../../ui/ToastProvider';

// ✅ Função Helper para o Tipo
const getTipoLabel = (usuario: Usuario) => {
  switch (usuario.tipo) {
    case 'admin':
      return { label: 'Admin', color: 'bg-red-100 text-red-800' };
    case 'clinica':
      return { label: 'Clínica', color: 'bg-blue-100 text-blue-800' };
    case 'tutor':
      return { label: 'Tutor', color: 'bg-gray-100 text-gray-800' };
    case 'veterinario':
      // Verifica o perfil 'veterinario' que foi pré-carregado
      if (usuario.veterinario?.autonomo) {
        return { label: 'Vet (Autônomo)', color: 'bg-green-100 text-green-800' };
      }
      return { label: 'Vet (Clínica)', color: 'bg-cyan-100 text-cyan-800' };
    default:
      return { label: 'N/D', color: 'bg-gray-100 text-gray-800' };
  }
};

export default function AdminManageUsers() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Estado dos Modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setLoading(true);
        // O Controller agora faz o 'with('veterinario')'
        const data = await AdminService.getAllUsuarios();
        setUsuarios(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar utilizadores.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, []);

  // --- Handlers de Ações ---
  const handleEditClick = (usuario: Usuario) => {
    setSelectedUsuario({ ...usuario }); // Clona para edição
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedUsuario(null);
    setIsSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUsuario) return;
    
    setIsSubmitting(true);
    try {
      await AdminService.deleteUsuario(selectedUsuario.id);
      setUsuarios(prev => prev.filter(u => u.id !== selectedUsuario.id));
      showToast('Utilizador excluído com sucesso!', { type: 'success' });
      handleCloseModals();
    } catch (err: any) {
      showToast(`Erro ao excluir utilizador: ${err.message}`, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsuario) return;

    setIsSubmitting(true);
    try {
      const updatedData = {
        name: selectedUsuario.name,
        email: selectedUsuario.email,
        tipo: selectedUsuario.tipo,
      };

      const updatedUsuario = await AdminService.updateUsuario(selectedUsuario.id, updatedData);
      // Recarrega os dados completos após a atualização
      const data = await AdminService.getAllUsuarios();
      setUsuarios(data);
      showToast('Utilizador atualizado com sucesso!', { type: 'success' });
      handleCloseModals();
    } catch (err: any) {
      showToast(`Erro ao atualizar utilizador: ${err.message}`, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={20} /> Gerir Contas de Utilizadores
        </h2>
        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Carregando utilizadores...
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((usuario) => {
                  const tipoInfo = getTipoLabel(usuario); // ✅ Pega o label e cor corretos
                  return (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{usuario.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{usuario.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{usuario.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${tipoInfo.color}`}>
                          {tipoInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button onClick={() => handleEditClick(usuario)} className="text-blue-600 hover:text-blue-800" title="Editar">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(usuario)} className="text-red-600 hover:text-red-800 ml-3" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {isEditModalOpen && selectedUsuario && (
      // ... (Omitido por brevidade, código idêntico ao anterior) ...
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <form onSubmit={handleUpdateUsuario} className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Editar Utilizador #{selectedUsuario.id}</h3>
              <button type="button" onClick={handleCloseModals}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  value={selectedUsuario.name || ''}
                  onChange={(e) => setSelectedUsuario(p => p ? {...p, name: e.target.value} : null)}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={selectedUsuario.email || ''}
                  onChange={(e) => setSelectedUsuario(p => p ? {...p, email: e.target.value} : null)}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  value={selectedUsuario.tipo || ''}
                  onChange={(e) => setSelectedUsuario(p => p ? {...p, tipo: e.target.value as any} : null)}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm"
                >
                  <option value="tutor">Tutor</option>
                  <option value="veterinario">Veterinário</option>
                  <option value="clinica">Clínica</option>
                  <option value="admin">Admin</option>
                </select>
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
      {isDeleteModalOpen && selectedUsuario && (
      // ... (Omitido por brevidade, código idêntico ao anterior) ...
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-2 text-lg font-bold text-gray-900">Excluir Utilizador</h3>
              <p className="mt-2 text-sm text-gray-600">
                Tem a certeza que quer excluir o utilizador **{selectedUsuario.name}** (ID: {selectedUsuario.id})? Esta ação não pode ser revertida.
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