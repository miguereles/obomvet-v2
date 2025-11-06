// src/hooks/useAudioRecording.ts
import { useState, useRef } from "react";
// ❌ import { transcribeAudio } from "../services/apiService";
// ✅ 1. Importe o Service correto
import IaService from "../services/IaService";

export function useAudioRecording(token: string | null) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [audioError, setAudioError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    setAudioError(null);
    setTranscribedText("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const options = { mimeType: "audio/webm;codecs=opus" };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.warn("Webm/opus não suportado, fallback:", e);
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const recorder = mediaRecorderRef.current;
        const mimeType = recorder?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = []; // Limpa

        console.log(`Áudio gravado: ${mimeType}, Tamanho: ${audioBlob.size} bytes`);
        if (audioBlob.size === 0) {
          setAudioError("Gravação vazia. Verifique microfone.");
          setIsTranscribing(false);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          setIsRecording(false);
          return;
        }

        const formDataAudio = new FormData();
        const filename = `audio.${mimeType.split("/")[1].split(";")[0] || 'webm'}`;
        formDataAudio.append("file", audioBlob, filename);

        try {
          setIsTranscribing(true);
          setAudioError(null);
          console.log("Enviando áudio para transcrição...");
          
          // ✅ 2. Use o IaService
          // O token é injetado automaticamente pelo 'api.ts'
          const text = await IaService.transcribeAudio(formDataAudio);

          console.log("Transcrição ok:", text);
          setTranscribedText(text);
        } catch (err: any) {
          console.error("Erro onstop/transcrição:", err);
          setAudioError(err.message || "Erro ao processar áudio.");
        } finally {
          setIsTranscribing(false);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            console.log("Tracks de mídia paradas no final do onstop.");
          }
          setIsRecording(false);
          console.log("Processo onstop finalizado.");
        }
      };

      mediaRecorder.onerror = (event: Event & { error?: DOMException }) => {
        console.error("Erro no MediaRecorder:", event.error);
        setAudioError(`Erro gravação: ${event.error?.name || "desconhecido"}`);
        stopRecording(); // Chama stopRecording para limpar tudo
      };

      mediaRecorder.start();
      console.log("Gravação iniciada...");
      setIsRecording(true);
    } catch (err: any) {
      console.error("Erro ao iniciar gravação (getUserMedia):", err);
      let errorMessage = "Não foi possível acessar microfone.";
      if (err.name === "NotAllowedError") errorMessage = "Permissão negada.";
      else if (err.name === "NotFoundError") errorMessage = "Nenhum microfone encontrado.";
      else if (err.name === "NotReadableError") errorMessage = "Microfone em uso.";
      else if (err.name === "SecurityError") errorMessage = "Acesso bloqueado (use HTTPS).";
      else if (err.name === "AbortError") errorMessage = "Pedido cancelado.";
      setAudioError(errorMessage);
    }
  };

  const stopRecording = () => {
    console.log("Tentando parar gravação...");
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop(); // O onstop será chamado
      console.log("mediaRecorder.stop() chamado.");
    } else {
      console.log("MediaRecorder não estava gravando/não existe.");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        console.log("Tracks paradas manualmente.");
      }
      setIsRecording(false);
      setIsTranscribing(false);
    }
  };

  return {
    isRecording,
    isTranscribing,
    transcribedText,
    setTranscribedText, // Expor para o 'useEffect' de sincronia
    audioError,
    setAudioError, // Expor para o 'analyzeText' poder limpar
    startRecording,
    stopRecording,
  };
}