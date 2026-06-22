import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 6000) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, message, type, duration };
        setToasts((prevToasts) => [...prevToasts, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    // Icon helper matching modern designs
    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'info':
            default:
                return (
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getTypeClasses = (type) => {
        switch (type) {
            case 'success':
                return 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200 shadow-emerald-950/10';
            case 'error':
                return 'bg-rose-950/80 border-rose-500/40 text-rose-200 shadow-rose-950/10';
            case 'warning':
                return 'bg-amber-950/80 border-amber-500/40 text-amber-200 shadow-amber-950/10';
            case 'info':
            default:
                return 'bg-slate-900/90 border-slate-800 text-indigo-200 shadow-slate-950/20';
        }
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            
            {/* Custom isolated keyframe animations for high aesthetic transitions */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes toast-slide-in {
                    0% { transform: translateX(120%) scale(0.9); opacity: 0; }
                    100% { transform: translateX(0) scale(1); opacity: 1; }
                }
                @keyframes toast-progress {
                    0% { width: 100%; }
                    100% { width: 0%; }
                }
                .toast-animate-in {
                    animation: toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .toast-progress-bar {
                    animation: toast-progress linear forwards;
                }
            `}} />

            {/* Floating Toast Container */}
            <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`toast-animate-in pointer-events-auto flex flex-col overflow-hidden rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 ${getTypeClasses(toast.type)}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                                {getIcon(toast.type)}
                            </div>
                            <div className="flex-1 text-sm font-medium leading-relaxed pr-3">
                                {toast.message}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 text-slate-400 hover:text-slate-200 transition p-0.5 rounded-lg hover:bg-slate-800/40"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {toast.duration > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-current opacity-20">
                                <div
                                    className="h-full bg-current toast-progress-bar"
                                    style={{ animationDuration: `${toast.duration}ms` }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
