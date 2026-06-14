import { useState, useEffect, useRef } from "react";

// Definição de Location
interface Location {
    latitude: number;
    longitude: number;
}
// -----------------------------------------------------------------------------------

// Tipagem robusta para o retorno do Hook
interface GeoLocationResult {
    location: Location | null;
    locationError: string | null;
    setLocationError: React.Dispatch<React.SetStateAction<string | null>>;
}

// Opções de ALTA PRECISÃO (GPS)
const HIGH_ACCURACY_OPTIONS: PositionOptions = {
    // Mantém o timeout alto para permitir que o GPS real (se houver) se fixe
    timeout: 30000, 
    enableHighAccuracy: true,
    maximumAge: 5000 
};

// Opções de BAIXA PRECISÃO (REDE/IP) - Fallback
const LOW_ACCURACY_OPTIONS: PositionOptions = {
    timeout: 5000, 
    enableHighAccuracy: false,
    maximumAge: 0 // Não queremos um cache antigo para o fallback
};

// Limiar de Precisão Mínima Padrão (50 metros) - Ajuda a descartar leituras de IP muito ruins
const MIN_ACCEPTED_ACCURACY_THRESHOLD = 50; 

// -----------------------------------------------------------------------------------

export function useGeolocation(): GeoLocationResult {
    const [location, setLocation] = useState<Location | null>(null);
    const [locationError, setLocationError] = useState<string | null>("Iniciando rastreamento de localização precisa...");
    
    // Ref para armazenar a melhor precisão encontrada até agora
    // Começa com Infinity para que a primeira leitura seja sempre aceita
    const bestAccuracyRef = useRef<number>(Infinity); 

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError("Geolocalização não suportada neste dispositivo.");
            return;
        }

        const successHandler = (position: GeolocationPosition) => {
            const currentAccuracy = position.coords.accuracy;
            console.log("Localização obtida/atualizada. Precisão:", currentAccuracy.toFixed(1), "metros.");

            // 1. Filtragem de Precisão Mínima
            if (currentAccuracy > MIN_ACCEPTED_ACCURACY_THRESHOLD) {
                 // Esta filtragem é crucial para descartar localizações de IP/Rede com centenas de metros de erro
                const msg = `Precisão atual (${currentAccuracy.toFixed(1)}m) é insuficiente. Buscando < ${MIN_ACCEPTED_ACCURACY_THRESHOLD}m.`;
                setLocationError(msg);
                return; // Não atualiza a localização se for muito imprecisa
            }

            // 2. Filtragem de Melhor Leitura (o critério que você pediu)
            if (currentAccuracy < bestAccuracyRef.current) {
                // Nova leitura é mais precisa que a melhor anterior
                console.log(`Nova melhor precisão! ${bestAccuracyRef.current.toFixed(1)}m -> ${currentAccuracy.toFixed(1)}m`);
                bestAccuracyRef.current = currentAccuracy; // Atualiza a melhor precisão
                
                // Atualiza a localização no estado com a coordenada mais precisa
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLocationError(null);
            } else {
                 // A leitura atual é aceitável, mas não é a melhor já encontrada. 
                 // Se já temos uma localização, apenas atualiza a mensagem de status.
                 if (location === null) {
                    setLocationError("Localização encontrada, mas a precisão não melhorou ainda.");
                 }
            }
        };

        // Função de Fallback (para reutilização e melhor controle)
        const tryFallbackLowAccuracy = (originalErrorMsg: string) => {
            setLocationError(originalErrorMsg);
            console.warn("Iniciando Fallback de Baixa Precisão (Rede/IP)...");
            
            navigator.geolocation.getCurrentPosition(
                // Usa o mesmo successHandler, que já tem a lógica de filtragem de precisão
                successHandler,
                (fallbackErr) => {
                    console.error("Fallback falhou. Código:", fallbackErr.code);
                    setLocationError("Localização de alta e baixa precisão indisponível. Verifique as configurações.");
                },
                LOW_ACCURACY_OPTIONS
            );
        };

        const errorHandler = (err: GeolocationPositionError) => {
            console.warn("Erro no rastreamento de alta precisão:", err.code, err.message);
            
            if (err.code === 1) { // PERMISSION_DENIED
                setLocationError("Permissão de localização negada. Verifique as configurações do navegador/celular.");
            } else if (err.code === 2) { // POSITION_UNAVAILABLE
                // Monitoramento (watchPosition) continua tentando no background
                setLocationError("Sinal de localização fraco ou indisponível. Mantendo rastreamento...");
            } else if (err.code === 3) { // TIMEOUT
                // Se o watchPosition estourou o tempo inicial, tenta o Fallback rápido.
                tryFallbackLowAccuracy("Tempo esgotado para iniciar o rastreamento preciso. Tentando leitura rápida...");
            } else {
                setLocationError("Erro desconhecido ao obter localização. Tentando novamente...");
            }
        };

        // Inicia o monitoramento contínuo (watchPosition)
        const watchId = navigator.geolocation.watchPosition(
            successHandler,
            errorHandler,
            HIGH_ACCURACY_OPTIONS 
        );
        
        // CLEANUP: Interrompe o monitoramento quando o componente é desmontado
        return () => {
            console.log("Parando o monitoramento de geolocalização.");
            navigator.geolocation.clearWatch(watchId);
        };
    }, [location]); // Adicionado 'location' como dependência para evitar o warning, embora o controle principal seja via useRef

    return { location, locationError, setLocationError } as GeoLocationResult;
}