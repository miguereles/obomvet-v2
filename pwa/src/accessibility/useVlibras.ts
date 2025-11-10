// src/accessibility/useVLibras.ts
import { useEffect } from 'react';

export function useVLibras() {
  useEffect(() => {
    const scriptId = "vlibras-plugin-script";

    if (document.getElementById(scriptId)) return;

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;

    script.onload = () => {
      if ((window as any).VLibras) {
        new (window as any).VLibras.Widget('https://vlibras.gov.br/app');
      }
    };

    document.body.appendChild(script);

  }, []); // Array vazio garante que só corre uma vez
}

// Função para remover o widget (caso mude de página, etc.)
export function removeVLibrasWidget() {
    const widget = document.querySelector('[vw-access-button]');
    if (widget) widget.remove();
    const wrapper = document.querySelector('[vw-plugin-wrapper]');
    if (wrapper) wrapper.remove();
}