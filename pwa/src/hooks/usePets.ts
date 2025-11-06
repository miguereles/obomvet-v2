// src/hooks/usePets.ts
import { useState, useEffect } from "react";
// ✅ 1. Importe o tipo 'Pet' completo do service
import { Pet } from "../services/types"; 
// ✅ 2. Importe o 'TutorService' para buscar os pets do usuário
import TutorService from "../services/TutorService";
import { getUser } from "../utils/auth"; // Para pegar o ID do usuário logado

export function usePets(token: string | null) {
  // ✅ 3. O estado agora usa o tipo 'Pet' completo (onde id é 'number')
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    const loadPets = async () => {
      if (token) {
        try {
          // 1. Precisamos do ID do usuário logado
          const user = getUser(); // Pega { id, name, ... } do localStorage
          if (!user || !user.id) {
            console.log("Nenhum ID de usuário encontrado, não buscará pets.");
            setPets([]);
            return;
          }

          // 2. Usamos o ID do usuário para encontrar o ID do Tutor
          // (Seu TutorController tem a rota /tutores/usuario/{id})
          const tutor = await TutorService.getByUsuarioId(user.id.toString());
          if (!tutor || !tutor.id) {
            console.warn("Nenhum perfil de tutor encontrado para este usuário.");
            setPets([]);
            return;
          }
          
          // 3. Agora buscamos os pets com o ID do Tutor
          // (Seu TutorController tem a rota /tutores/{tutor}/pets)
          const fetchedPets = await TutorService.getPets(tutor.id);
          
          // ✅ 4. Não é mais necessário formatar. 
          // O backend já envia o tipo 'Pet' correto (com id: number).
          console.log("Pets recebidos:", fetchedPets);
          setPets(fetchedPets);

        } catch (err) {
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