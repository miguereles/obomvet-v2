// hooks/usePets.ts
import { useState, useCallback } from "react";
import { PetService } from "../services/PetService";
import TutorService from "../services/TutorService";
import { Pet } from "../services/types";

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPets = useCallback(async () => {
    setLoading(true);
    try {
      // Busca via TutorService
      const tutorData = await TutorService.getMeuTutor();
      const petsArray = tutorData.pets || [];
      
      // Recalcula idades
      const hoje = new Date();
      petsArray.forEach((p: Pet) => {
        if (p.data_nascimento) {
          const nascimento = new Date(p.data_nascimento);
          let idade = hoje.getFullYear() - nascimento.getFullYear();
          const mesDiff = hoje.getMonth() - nascimento.getMonth();
          if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
          }
          p.idade = idade;
        }
      });
      
      setPets(petsArray);
    } catch (error: any) {
      console.error("Erro ao buscar pets", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const removePet = async (id: number) => {
    try {
      await PetService.delete(id);
      setPets((prev) => prev.filter((p) => p.id !== id));
      return true; // Sucesso
    } catch (error: any) {
      console.error("Erro ao excluir pet:", error);
      return false; // Falha
    }
  };

  return {
    pets,
    setPets,
    loading,
    fetchPets,
    removePet
  };
}