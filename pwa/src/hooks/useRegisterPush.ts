import { useEffect } from "react";
import PushService from "../services/PushService";

// Helper function (mantida como estava)
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer;
}

/**
 * [HOOK ATUALIZADO]
 * Hook para registrar o Service Worker para Push Notifications.
 * Agora ele roda para TODOS os usuários (logados e anónimos).
 * O backend (PushController) decidirá quem é o usuário.
 */
export function useRegisterPush() {
  
  useEffect(() => {
    // Esta função agora corre para todos, uma vez por visita.
    
    async function registerPush() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn("Push notifications não são suportados neste navegador.");
        return;
      }
      
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("Permissão de notificação não concedida.");
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        
        if (sub === null) {
          console.log("Criando nova subscrição de Push...");
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY as string) as ArrayBuffer,
          });
        } else {
          console.log("Subscrição de Push já existe.");
        }

        // [LÓGICA MANTIDA]
        // Procura o token anónimo no localStorage.
        // O 'useEmergencyReport.ts' é responsável por colocar este token aqui.
        const anonymousTutorToken = localStorage.getItem('anonymousTutorToken');

        // [CHAMADA ATUALIZADA]
        // Enviamos o JSON da subscrição E o token anónimo (que pode ser null).
        // O 'api.ts' (interceptor) irá adicionar automaticamente o token
        // de autenticação se o usuário estiver logado.
        await PushService.subscribe(sub.toJSON(), anonymousTutorToken);

        console.log("✅ Push registrado com sucesso no backend");
      
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          console.warn('Usuário bloqueou as notificações.');
        } else {
          console.error("Erro ao registrar Push:", err.response?.data || err.message);
        }
      }
    }

    registerPush();
    
  }, []); // Roda apenas uma vez na inicialização da app
}