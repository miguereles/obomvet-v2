import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, MapPin, User, Phone, Clock, PawPrint, CheckCircle, XCircle } from 'lucide-react';
import { Emergencia, Usuario, Pet, Tutor } from '../../services/types';
// ✅ CORREÇÃO: Removendo a extensão .ts
import VeterinarioService from '../../services/VeterinarioService';
import { getUser } from '../../utils/auth';
import { echo } from '../../services/echo';

export default function EmergenciasVet() {
    const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<Usuario | null>(null);

    const fetchEmergencias = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await VeterinarioService.getMinhasEmergencias();
            setEmergencias(data);
        } catch (err: any) {
            console.error("Erro em fetchEmergencias:", err); 
            const errorMsg = err.response?.data?.message || err.message || "Erro ao carregar emergências";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (emergenciaId: number) => {
        if (!user || !user.veterinario) return;
        
        try {
            const updatedEmergencia = await VeterinarioService.acceptEmergencia(user.veterinario.id, emergenciaId);
            upsertEmergencia(updatedEmergencia);
        } catch (err) {
            console.error("Erro ao aceitar emergência:", err);
            setError("Erro ao aceitar emergência");
        }
    };

    const handleReject = async (emergenciaId: number) => {
        if (!user || !user.veterinario) return;

        try {
            await VeterinarioService.rejectEmergencia(user.veterinario.id, emergenciaId);
            setEmergencias(prev => prev.filter(e => e.id !== emergenciaId));
        } catch (err) {
            console.error("Erro ao rejeitar emergência:", err);
            setError("Erro ao rejeitar emergência");
        }
    };

    const upsertEmergencia = (emergencia: Emergencia) => {
        setEmergencias(prev => {
            const index = prev.findIndex(e => e.id === emergencia.id);
            if (index > -1) {
                const newState = [...prev];
                newState[index] = emergencia;
                return newState;
            }
            return [emergencia, ...prev];
        });
    };

    useEffect(() => {
        const userData = getUser();
        if (userData) {
            setUser(userData);
        }
        fetchEmergencias();
    }, []);

    useEffect(() => {
        if (user && user.veterinario) {
            const vetId = user.veterinario.id;
            const channel = `veterinario.${vetId}`;
            
            console.log(`[Echo] Tentando ouvir canal: ${channel}`);

            try {
                echo.private(channel)
                    .listen('.emergencia.nova', (data: { emergencia: Emergencia }) => {
                        console.log('[Echo] Nova Emergência Recebida:', data.emergencia);
                        upsertEmergencia(data.emergencia);
                    })
                    .listen('.emergencia.atualizada', (data: { emergencia: Emergencia }) => {
                        console.log('[Echo] Emergência Atualizada:', data.emergencia);
                        upsertEmergencia(data.emergencia);
                    });

            } catch (e) {
                console.error("[Echo] Falha ao se inscrever no canal privado:", e);
                setError("Erro de conexão em tempo real. Verifique o console.");
            }

            return () => {
                console.log(`[Echo] Saindo do canal: ${channel}`);
                echo.leave(channel);
            };
        }
    }, [user]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending':
                return { text: 'Aguardando', color: 'bg-yellow-100 text-yellow-800' };
            case 'assigned':
                return { text: 'Atribuída', color: 'bg-blue-100 text-blue-800' };
            case 'accepted':
                return { text: 'Aceita', color: 'bg-green-100 text-green-800' };
            case 'in_progress':
                return { text: 'Em Atendimento', color: 'bg-indigo-100 text-indigo-800' };
            case 'completed':
                return { text: 'Concluída', color: 'bg-gray-100 text-gray-800' };
            case 'rejected':
                return { text: 'Rejeitada', color: 'bg-red-100 text-red-800' };
            default:
                return { text: status, color: 'bg-gray-100 text-gray-800' };
        }
    };
    
    const getTutor = (tutor: Tutor | null | undefined, emergencia: Emergencia): { nome: string, telefone: string | null } => {
        if (tutor) {
            return {
                nome: tutor.nome_completo,
                telefone: tutor.telefone_principal || null
            };
        }
        return {
            nome: emergencia.nome_tutor || 'Não informado',
            telefone: emergencia.telefone_tutor || null
        };
    };

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Minhas Emergências</h1>

            {loading && emergencias.length === 0 && (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="animate-spin text-[#25A18E]" size={32} />
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} />
                    <p>
                        <strong>Erro:</strong> {error}
                    </p>
                </div>
            )}

            {!loading && !error && emergencias.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <p>Nenhuma emergência encontrada.</p>
                </div>
            )}

            <div className="space-y-4">
                {emergencias.map(emergencia => {
                    const statusInfo = getStatusInfo(emergencia.status);
                    const pet = emergencia.pet;
                    const tutorInfo = getTutor(emergencia.tutor, emergencia);
                    
                    return (
                        <div key={emergencia.id} className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                        Emergência #{emergencia.id} - {emergencia.descricao_caso}
                                    </h2>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusInfo.color}`}>
                                        {statusInfo.text}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {new Date(emergencia.created_at).toLocaleString('pt-BR')}
                                </span>
                            </div>

                            <div className="border-t border-gray-100 my-4"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                                {pet ? (
                                     <div className="flex items-center gap-2">
                                        <PawPrint size={16} className="text-[#25A18E]" />
                                        <span><strong>Pet:</strong> {pet.nome} ({pet.especie} - {pet.raca})</span>
                                    </div>
                                ) : (
                                     <div className="flex items-center gap-2">
                                        <PawPrint size={16} className="text-[#25A18E]" />
                                        <span><strong>Pet:</strong> Nome não informado</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-[#25A18E]" />
                                    <span><strong>Tutor:</strong> {tutorInfo.nome}</span>
                                </div>
                                
                                {tutorInfo.telefone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-[#25A18E]" />
                                        <a href={`tel:${tutorInfo.telefone}`} className="text-[#25A18E] hover:underline">
                                            {tutorInfo.telefone}
                                        </a>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-[#25A18E]" />
                                    {emergencia.lat && emergencia.lng ? (
                                        <a
                                          href={`https://www.google.com/maps?q=${emergencia.lat},${emergencia.lng}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[#25A18E] hover:underline truncate"
                                        >
                                          {emergencia.endereco || 'Ver no mapa'}
                                        </a>
                                    ) : (
                                        <span className="truncate">{emergencia.endereco || 'Local não informado'}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-[#25A18E]" />
                                    <span><strong>Nível:</strong> {emergencia.gravidade || 'Não informado'}</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-end mt-4 gap-2">
                                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                                    Ver Detalhes
                                </button>
                                {['pending', 'assigned'].includes(emergencia.status) && (
                                    <button 
                                        onClick={() => handleReject(emergencia.id)}
                                        className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                    >
                                        <XCircle size={18} />
                                        Rejeitar
                                    </button>
                                )}
                                {['pending', 'assigned'].includes(emergencia.status) && (
                                    <button 
                                        onClick={() => handleAccept(emergencia.id)}
                                        className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                    >
                                        <CheckCircle size={18} />
                                        Aceitar
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}