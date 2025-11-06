import { useEffect } from "react";
// ✅ 1. Importe o Service
import PushService from "../services/PushService";
import { getToken } from "../utils/auth"; // Para verificar se está logado

// Helper function
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * Hook para registrar o Service Worker para Push Notifications
 * Roda apenas se o usuário estiver logado (possui token).
 */
export function useRegisterPush() {
  
  useEffect(() => {
    const token = getToken();
    
    // Só tenta registrar se o usuário estiver logado
    if (!token) {
      console.log("Usuário não logado, pulando registro de Push.");
      return;
    }
    
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
          // Não tem subscrição, cria uma
          console.log("Criando nova subscrição de Push...");
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
          });
        } else {
          console.log("Subscrição de Push já existe.");
        }

        // ✅ 2. Use o Service!
        // Enviamos o objeto JSON da subscrição
        // O token é enviado automaticamente pelo 'api.ts'
        await PushService.subscribe(sub.toJSON());

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
    
  }, []); // Roda apenas uma vez
}