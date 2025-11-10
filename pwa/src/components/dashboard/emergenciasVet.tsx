import React, { useState, useEffect } from 'react';
import { MapPin, Phone, MessageCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { echo } from '../../services/echo';

interface Emergencia {
  id: number;
  status: string;
  pet: {
    nome: string;
    especie: string;
    raca?: string;
  };
  tutor: {
    nome_completo: string;
    telefone_principal?: string;
  };
  descricao: string;
  lat?: number;
  lng?: number;
  created_at: string;
}

export default function EmergenciasVet() {
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmergencias = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/veterinario/emergencias', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Erro ao carregar emergências');

      const data = await response.json();
      setEmergencias(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar emergências');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/emergencias/${id}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Erro ao aceitar emergência');

      const updatedEmergencia = await response.json();
      setEmergencias(prev => prev.map(e => e.id === id ? updatedEmergencia : e));
    } catch (err) {
      console.error(err);
      // Mostrar erro em um toast ou alerta
    }
  };

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/emergencias/${id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Erro ao rejeitar emergência');

      setEmergencias(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
      // Mostrar erro em um toast ou alerta
    }
  };

  useEffect(() => {
    fetchEmergencias();

    // Configure subscriptions using the shared Echo instance (centralized authorizer)
    const veterinarioId = localStorage.getItem('veterinario_id');

    if (veterinarioId) {
      echo.private(`veterinario.${veterinarioId}`)
        .listen('.emergencia.nova', (e: Emergencia) => {
          setEmergencias(prev => [e, ...prev]);
        })
        .listen('.emergencia.atualizada', (e: { emergencia: Emergencia }) => {
          setEmergencias(prev => prev.map(em => em.id === e.emergencia.id ? e.emergencia : em));
        });

      return () => {
        // Defensive: attempt to leave the channel on unmount
        try {
          echo.leave(`veterinario.${veterinarioId}`);
        } catch (err) {
          // swallow errors during unmount to avoid noisy crashes
          // these will be visible in console for debugging
          // eslint-disable-next-line no-console
          console.warn('Failed to leave echo channel', err);
        }
      };
    }
  }, []);

  if (loading && !emergencias.length) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-[#25A18E]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Emergências Designadas</h2>

      {emergencias.length === 0 ? (
        <p className="text-center py-8 text-gray-500">
          Nenhuma emergência designada no momento.
        </p>
      ) : (
        <div className="grid gap-4">
          {emergencias.map((emergencia) => (
            <div
              key={emergencia.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {emergencia.pet.nome} - {emergencia.pet.especie}
                    {emergencia.pet.raca && ` (${emergencia.pet.raca})`}
                  </h3>
                  <p className="text-gray-600 mt-1">{emergencia.descricao}</p>
                </div>
                <div className="flex gap-2">
                  {emergencia.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAccept(emergencia.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                      >
                        <CheckCircle size={18} />
                        Aceitar
                      </button>
                      <button
                        onClick={() => handleReject(emergencia.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        <XCircle size={18} />
                        Rejeitar
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={18} />
                  {emergencia.lat && emergencia.lng ? (
                    <a
                      href={`https://www.google.com/maps?q=${emergencia.lat},${emergencia.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#25A18E] hover:underline"
                    >
                      Ver no mapa
                    </a>
                  ) : (
                    'Localização não disponível'
                  )}
                </div>

                {emergencia.tutor.telefone_principal && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={18} />
                    <a
                      href={`tel:${emergencia.tutor.telefone_principal}`}
                      className="text-[#25A18E] hover:underline"
                    >
                      {emergencia.tutor.telefone_principal}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <MessageCircle size={18} />
                  Tutor: {emergencia.tutor.nome_completo}
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Reportado em: {new Date(emergencia.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}