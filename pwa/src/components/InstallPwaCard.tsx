import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Smartphone, X } from "lucide-react";
import { useDarkMode } from "./DarkModeContext.tsx"; // Importe se estiver usando Dark Mode globalmente

// Definição global do evento de instalação
let deferredPrompt: any;

export default function InstallPwaCard() {
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [installing, setInstalling] = useState(false);
    const [installed, setInstalled] = useState(false);
    // const { darkMode } = useDarkMode(); // Descomente se estiver usando Dark Mode

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Só mostra o card se não estiver já instalado ou dispensado
            if (!window.matchMedia('(display-mode: standalone)').matches && 
                !installed && 
                localStorage.getItem('pwaDismissed') !== 'true'
            ) {
                setShowInstallPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        if (window.matchMedia('(display-mode: standalone)').matches) {
            setInstalled(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, [installed]);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            console.error("Evento de instalação não disponível.");
            return;
        }

        setInstalling(true);
        
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setInstalled(true);
            setShowInstallPrompt(false);
            localStorage.removeItem('pwaDismissed');
        } else {
            setInstalling(false);
            // Opcional: Dispensar por um tempo ou até próxima visita
        }
    };
    
    // Lógica de fechar/dispensar
    const handleDismiss = () => {
        setShowInstallPrompt(false);
        // Marcamos que o usuário dispensou, para não re-aparecer na próxima recarga
        localStorage.setItem('pwaDismissed', 'true'); 
    };

    if (!showInstallPrompt || installed) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 50, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                // ✅ POSICIONAMENTO NOVO: Canto superior direito, abaixo da navbar
                className="fixed top-20 right-4 z-[900] p-2" 
            >
                <div
                    className="
                        bg-white dark:bg-gray-800 rounded-xl shadow-xl transition-shadow duration-300
                        max-w-xs w-full border border-l-4 border-teal-500 dark:border-teal-400
                        flex flex-col items-center justify-between p-3 gap-3 
                        relative
                    "
                >
                    {/* Botão de Fechar no canto */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors z-10"
                        aria-label="Fechar sugestão de instalação"
                    >
                        <X size={16} />
                    </button>

                    {/* Conteúdo Principal */}
                    <div className="flex items-center gap-3 text-left w-full pr-4">
                        <Smartphone 
                            size={28} 
                            className="text-teal-600 dark:text-teal-400 flex-shrink-0" 
                            aria-hidden="true" 
                        />
                        <div>
                            <h3 className="text-base font-bold text-[#004E64] dark:text-white leading-snug">
                                Instale o App
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                Adicione o oBomVet à sua tela inicial para acesso rápido.
                            </p>
                        </div>
                    </div>

                    {/* Botão de Ação */}
                    <motion.button
                        onClick={handleInstall}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={installing}
                        className={`
                            w-full px-4 py-2 text-sm rounded-lg font-semibold text-white transition-all duration-300
                            shadow-md shadow-teal-400/50 dark:shadow-teal-600/50
                            flex items-center justify-center gap-2 flex-shrink-0
                            ${installing 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700'
                            }
                        `}
                    >
                        {installing ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Instalando...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Instalar Agora <ArrowRight size={16} />
                            </span>
                        )}
                    </motion.button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}