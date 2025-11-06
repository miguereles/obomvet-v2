import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Dog, Cat, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PetForm from './PetForm';

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

export default function PetList() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);

  const fetchPets = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/usuarios/tutor/pets', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Erro ao carregar pets');

      const data = await response.json();
      setPets(data.pets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (petData: Omit<Pet, 'id'>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(petData),
      });

      if (!response.ok) throw new Error('Erro ao criar pet');

      const newPet = await response.json();
      setPets(prev => [...prev, newPet]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao criar pet');
    }
  };

  const handleUpdate = async (petData: Omit<Pet, 'id'>) => {
    if (!editingPet) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/pets/${editingPet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(petData),
      });

      if (!response.ok) throw new Error('Erro ao atualizar pet');

      const updatedPet = await response.json();
      setPets(prev => prev.map(p => p.id === editingPet.id ? updatedPet : p));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar pet');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/pets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Erro ao excluir pet');

      setPets(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao excluir pet');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPet(null);
  };

  useEffect(() => {
    fetchPets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Meus Pets</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#25A18E] text-white rounded-lg hover:bg-[#208B7C] transition-colors"
        >
          <Plus size={20} />
          Adicionar Pet
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading && !pets.length ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-[#25A18E]" size={32} />
        </div>
      ) : pets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map(pet => (
            <div
              key={pet.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-gray-800">{pet.nome}</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    {pet.especie === 'cachorro' ? (
                      <Dog size={18} />
                    ) : (
                      <Cat size={18} />
                    )}
                    <span className="text-sm">
                      {pet.especie.charAt(0).toUpperCase() + pet.especie.slice(1)}
                      {pet.raca && ` • ${pet.raca}`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingPet(pet);
                    setShowForm(true);
                  }}
                  className="p-2 text-gray-500 hover:text-[#25A18E] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {pet.idade && (
                  <p>{pet.idade} {pet.idade === 1 ? 'ano' : 'anos'}</p>
                )}
                {pet.peso && (
                  <p>{pet.peso} kg</p>
                )}
                {pet.cor && (
                  <p>Cor: {pet.cor}</p>
                )}
                {pet.sexo && (
                  <p>Sexo: {pet.sexo === 'M' ? 'Macho' : 'Fêmea'}</p>
                )}
              </div>

              {pet.observacoes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  {pet.observacoes}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Você ainda não cadastrou nenhum pet.</p>
          <p className="mt-2">Clique em "Adicionar Pet" para começar.</p>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <PetForm
            onSubmit={editingPet ? handleUpdate : handleCreate}
            onDelete={editingPet ? handleDelete : undefined}
            onCancel={closeForm}
            initialData={editingPet || undefined}
            isEditing={!!editingPet}
          />
        )}
      </AnimatePresence>
    </div>
  );
}