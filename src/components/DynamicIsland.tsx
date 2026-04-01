'use client';

import React, { useState, useEffect } from 'react';
import { useUI } from '@/hooks/use-api';
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const DynamicIsland = () => {
    const { alerts, removeAlert } = useUI();
    const [currentAlert, setCurrentAlert] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!currentAlert && alerts.length > 0) {
            const next = alerts[0];
            setCurrentAlert(next);
            setIsExpanded(true);

            const timer = setTimeout(() => {
                setIsExpanded(false);
                setTimeout(() => {
                    removeAlert(next.id);
                    setCurrentAlert(null);
                }, 700); // Wait for collapse animation
            }, 6000); // 6 second visibility

            return () => clearTimeout(timer);
        }
    }, [alerts, currentAlert, removeAlert]);

    const activeAlert = currentAlert;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
            <div
                className={cn(
                    "glass bg-white/80 text-titanium rounded-apple-xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center overflow-hidden premium-shadow border-black/5",
                    isExpanded
                        ? "w-[340px] h-[80px] rounded-apple-lg p-6 opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "w-[120px] h-[36px] rounded-full p-2 opacity-0 -translate-y-8 scale-90 pointer-events-none"
                )}
            >
                {!isExpanded ? (
                    <div className="flex items-center justify-center animate-in fade-in zoom-in duration-500">
                        {/* Center icon removed for cleaner aesthetic */}
                    </div>
                ) : (
                    <div className="flex items-center w-full animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center mr-4",
                            activeAlert?.type === 'success' ? "bg-titanium/10 text-titanium" : "bg-titanium/5 text-titanium/40"
                        )}>
                            {activeAlert?.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">
                                {activeAlert?.type === 'success' ? 'System Notification' : 'Attention'}
                            </p>
                            <p className="text-sm font-medium truncate">{activeAlert?.message || 'Ready for process'}</p>
                        </div>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="ml-2 opacity-30 hover:opacity-100 transition-opacity"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DynamicIsland;
