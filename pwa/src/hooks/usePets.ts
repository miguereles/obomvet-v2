// src/hooks/usePets.ts
import { useState, useEffect } from "react";
import { Pet } from "../types/emergency.types";
import { fetchPets } from "../services/apiService";

export function usePets(token: string | null) {
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    if (token) {
      fetchPets(token)
        .then((formattedPets) => {
          console.log("Pets recebidos:", formattedPets);
          setPets(formattedPets);
        })
        .catch((err) => {
          console.error("Erro ao buscar pets:", err);
          setPets([]); // Evita travamento em caso de erro
        });
    } else {
      console.log("Nenhum token encontrado, não buscará pets.");
      setPets([]); // ✅ Garante que o array estará definido
    }
  }, [token]);

  return { pets, setPets };
}
