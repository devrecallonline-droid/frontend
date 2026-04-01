'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useUI } from '@/hooks/use-api';
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ProcessingStatus {
    event_id: string;
    total: number;
    processed: number;
    percentage: number;
    completed?: boolean;
}

const BackgroundProcessor = () => {
    const { user, isAuthenticated } = useAuth();
    const { addAlert } = useUI();
    const [processingEvents, setProcessingEvents] = useState<string[]>([]);
    const [activeStatuses, setActiveStatuses] = useState<Record<string, ProcessingStatus>>({});

    useEffect(() => {
        const loadStoredEvents = () => {
            if (typeof window !== 'undefined') {
                const stored = JSON.parse(localStorage.getItem('processing_events') || '[]');
                setProcessingEvents(stored);
            }
        };

        loadStoredEvents();

        // Listen for custom events and storage events
        window.addEventListener('processing_started', loadStoredEvents);
        window.addEventListener('storage', loadStoredEvents);

        return () => {
            window.removeEventListener('processing_started', loadStoredEvents);
            window.removeEventListener('storage', loadStoredEvents);
        };
    }, []);

    useEffect(() => {
        if (!isAuthenticated || processingEvents.length === 0) return;

        const pollStatus = async () => {
            const updatedProcessing = [...processingEvents];
            const newStatuses = { ...activeStatuses };
            let hasChanges = false;

            for (const eventId of processingEvents) {
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/events/${eventId}/processing-status`, {
                        headers: {
                            'Authorization': `Bearer ${user?.id}`
                        }
                    });

                    if (response.status === 403 || response.status === 404 || response.status === 500) {
                        // User no longer has access, event deleted, or invalid ID format - stop polling
                        console.warn(`Stopping polling for ${eventId} (Status: ${response.status})`);
                        const index = updatedProcessing.indexOf(eventId);
                        if (index > -1) updatedProcessing.splice(index, 1);
                        delete newStatuses[eventId];
                        localStorage.setItem('processing_events', JSON.stringify(updatedProcessing));
                        hasChanges = true;
                        continue;
                    }

                    const data = await response.json();

                    if (data.status === 'success') {
                        // Only update state if percentage changed or didn't exist
                        if (!newStatuses[eventId] || newStatuses[eventId].percentage !== data.processing.percentage) {
                            newStatuses[eventId] = data.processing;
                            hasChanges = true;
                        }

                        if (data.processing.percentage >= 100) {
                            // Done! But keep it in the list so user can see it
                            if (!newStatuses[eventId]?.completed) {
                                hasChanges = true;
                                newStatuses[eventId] = { ...data.processing, completed: true }; // Add a local completed flag if needed

                                addAlert({
                                    type: 'success',
                                    message: `AI Scan Complete: Your memories in this gathering are now searchable.`
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error polling status for ${eventId}:`, error);
                }
            }

            if (hasChanges) {
                setProcessingEvents(updatedProcessing);
                setActiveStatuses(newStatuses);
            }
        };

        // Poll immediately
        pollStatus();

        // Then every 3 seconds
        const interval = setInterval(pollStatus, 3000);

        return () => clearInterval(interval);
    }, [isAuthenticated, processingEvents, user?.id, addAlert]);

    if (Object.keys(activeStatuses).length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-8 duration-700">
            <div className="bg-obsidian/90 glass-dark text-ivory rounded-apple-xl p-5 premium-shadow border border-white/10 w-[240px]">
                <div className="flex items-center mb-4">
                    {Object.values(activeStatuses).every(s => s.percentage >= 100) ? (
                        <>
                            <CheckCircle2 className="w-4 h-4 text-[#34C759] mr-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#34C759]">Scan Complete</span>
                        </>
                    ) : (
                        <>
                            <Loader2 className="w-4 h-4 text-ivory animate-spin mr-3 opacity-60" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-ivory/60">Scanning Vault</span>
                        </>
                    )}
                </div>

                {Object.entries(activeStatuses).map(([eventId, status]) => (
                    <div key={eventId} className="space-y-2 group relative">
                        <div className="flex justify-between items-end">
                            <p className="text-xs font-bold truncate pr-4">
                                {status.percentage >= 100 ? (
                                    <span className="text-[#34C759] flex items-center">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Completed
                                    </span>
                                ) : (
                                    "AI Processing"
                                )}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const updated = processingEvents.filter(id => id !== eventId);
                                        setProcessingEvents(updated);
                                        const newStatuses = { ...activeStatuses };
                                        delete newStatuses[eventId];
                                        setActiveStatuses(newStatuses);
                                        localStorage.setItem('processing_events', JSON.stringify(updated));

                                        // If this was the last one, we might want to refresh to show data
                                        if (updated.length === 0) {
                                            window.location.reload();
                                        }
                                    }}
                                    className="text-white/20 hover:text-white transition-colors"
                                >
                                    <span className="sr-only">Dismiss</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all duration-500 ease-out",
                                    status.percentage >= 100 ? "bg-[#34C759]" : "bg-ivory"
                                )}
                                style={{ width: `${status.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BackgroundProcessor;
