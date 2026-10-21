import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

export const showToast = (text: string, type: ToastType = 'success') => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('carewell-toast', {
        detail: {
          id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          text,
          type
        }
      })
    );
  }
};

export const ToastNotificationContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: CustomEvent<ToastMessage>) => {
      const newToast = e.detail;
      setToasts(prev => [newToast, ...prev.slice(0, 3)]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener('carewell-toast' as unknown as keyof WindowEventMap, handleToast as EventListener);
    return () => {
      window.removeEventListener('carewell-toast' as unknown as keyof WindowEventMap, handleToast as EventListener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        const bgClass = isSuccess
          ? 'bg-emerald-900/95 text-white border-emerald-700/60 shadow-emerald-950/20'
          : isError
          ? 'bg-rose-900/95 text-white border-rose-700/60 shadow-rose-950/20'
          : isWarning
          ? 'bg-amber-900/95 text-white border-amber-700/60 shadow-amber-950/20'
          : 'bg-slate-900/95 text-white border-slate-700/60 shadow-slate-950/20';

        const Icon = isSuccess
          ? CheckCircle2
          : isError
          ? AlertCircle
          : isWarning
          ? AlertCircle
          : Info;

        const iconColor = isSuccess
          ? 'text-emerald-400'
          : isError
          ? 'text-rose-400'
          : isWarning
          ? 'text-amber-400'
          : 'text-sky-400';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${bgClass}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <p className="text-xs font-semibold leading-relaxed truncate-2-lines">
                {toast.text}
              </p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="p-1 text-slate-400 hover:text-white rounded-md shrink-0 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
