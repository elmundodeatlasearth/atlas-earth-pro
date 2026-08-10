// src/components/toast.tsx
// Sistema de notificaciones toast elegante
"use client";
import { useState, createContext, useContext, useCallback } from "react";

interface ToastMessage {
  id: number;
  text: string;
  type: "success" | "error" | "info";
}

interface ToastCtx {
  show: (text: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastCtx>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-slide-up px-4 py-3 rounded-xl shadow-2xl text-sm font-bold backdrop-blur-xl border flex items-center gap-2.5 transition-all duration-500 ${
              toast.type === "success"
                ? "bg-green-900/80 border-green-500/30 text-green-200 shadow-green-900/30"
                : toast.type === "error"
                ? "bg-red-900/80 border-red-500/30 text-red-200 shadow-red-900/30"
                : "bg-blue-900/80 border-blue-500/30 text-blue-200 shadow-blue-900/30"
            }`}
          >
            <span className="text-base">
              {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
            </span>
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
