import React, { createContext, useContext, useCallback, useState } from 'react';

type Toast = {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error';
};

type ToastContextValue = {
  showToast: (message: string, opts?: { type?: Toast['type']; native?: boolean }) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(s => s.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, opts?: { type?: Toast['type']; native?: boolean }) => {
    const id = Math.random().toString(36).slice(2, 9);
    const toast: Toast = { id, message, type: opts?.type || 'info' };
    setToasts(s => [toast, ...s]);

    // native notification
    try {
      if (opts?.native && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(message);
      }
    } catch (e) {
      // ignore
    }

    // remove after 4s
    window.setTimeout(() => remove(id), 4000);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2 rounded shadow-lg text-white ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : 'bg-slate-700'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default ToastProvider;
