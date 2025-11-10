// src/hooks/usePets.ts
import { useState, useEffect } from "react";
// 1. Importe o tipo 'Pet' completo do service
import { Pet } from "../services/types"; 
// 2. Importe o 'TutorService' para buscar os pets do usuário
import TutorService from "../services/TutorService";
// ❌ getUser não é mais necessário aqui
// import { getUser } from "../utils/auth"; 

export function usePets(token: string | null) {
  // 3. O estado agora usa o tipo 'Pet' completo (onde id é 'number')
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    const loadPets = async () => {
      if (token) {
        try {
          // ✅ 4. Use a nova função do service (mais segura)
          // Ela usa o token para encontrar o usuário e o tutor no backend
          // Esta é a linha que corrige o erro!
          const tutor = await TutorService.getMeuTutor();
          
          if (!tutor || !tutor.id) {
            console.warn("Nenhum perfil de tutor encontrado para este usuário.");
            setPets([]);
            return;
          }
          
          // 5. O backend já deve retornar os pets dentro do objeto tutor
          // (O método 'meu' no TutorController já faz o with(['pets']))
          const fetchedPets = tutor.pets || [];
          
          console.log("Pets recebidos:", fetchedPets);
          setPets(fetchedPets);

        } catch (err) {
          // O interceptador 401 em api.ts já deve tratar tokens expirados
          console.error("Erro ao buscar pets:", err);
          setPets([]); // Evita travamento em caso de erro
        }
      } else {
        console.log("Nenhum token encontrado, não buscará pets.");
        setPets([]); // Garante que o array esteja definido
      }
    };
    
    loadPets();
  }, [token]); // Roda sempre que o token (login/logout) mudar

  return { pets, setPets };
}