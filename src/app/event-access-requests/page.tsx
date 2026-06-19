'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUI } from '@/hooks/use-api';
import { useGetEventAccessRequestsQuery, useHandleEventAccessRequestMutation } from '@/lib/api';
import Navigation from '@/components/Navigation';

import {
    Loader2,
    UserCheck,
    UserX,
    Calendar,
    ArrowLeft,
    Clock,
    Lock
} from 'lucide-react';

const EventAccessRequestsPage = () => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { addAlert } = useUI();
    const { data: requestsData, isLoading, error } = useGetEventAccessRequestsQuery();
    const [handleRequest] = useHandleEventAccessRequestMutation();
    const [mounted, setMounted] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const timeoutId = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push('/auth');
        }
    }, [mounted, isAuthenticated, router]);

    const handleApprove = async (requestId: string, username: string, eventTitle: string) => {
        setProcessingId(requestId);
        try {
            await handleRequest({ request_id: requestId, action: 'approve' }).unwrap();
            addAlert({ type: 'success', message: `Approved ${username}'s access to ${eventTitle}` });
        } catch (err) {
            addAlert({ type: 'error', message: 'Failed to approve request' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string, username: string, eventTitle: string) => {
        setProcessingId(requestId);
        try {
            await handleRequest({ request_id: requestId, action: 'reject' }).unwrap();
            addAlert({ type: 'success', message: `Rejected ${username}'s access to ${eventTitle}` });
        } catch (err) {
            addAlert({ type: 'error', message: 'Failed to reject request' });
        } finally {
            setProcessingId(null);
        }
    };

    if (!mounted) return null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-ivory flex flex-col">
                <Navigation />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-titanium animate-spin mb-6 opacity-20" />
                    <p className="text-titanium/40 font-bold uppercase tracking-widest text-xs">Checking for requests...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-ivory flex flex-col">
                <Navigation />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-32">
                    <div className="w-20 h-20 bg-titanium/5 rounded-xl flex items-center justify-center mb-8">
                        <Lock className="w-10 h-10 text-titanium opacity-10" />
                    </div>
                    <h1 className="text-4xl font-black text-titanium mb-4 italic tracking-tight">Something Went Wrong</h1>
                    <p className="text-titanium/40 font-medium mb-12 max-w-xs mx-auto">We couldn't load your access requests right now.</p>
                    <button onClick={() => router.push('/profile')} className="px-6 py-3 rounded-full border border-titanium/[0.08] text-titanium/40 hover:text-titanium text-sm font-bold transition-all cursor-pointer">
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    const requests = requestsData?.requests || [];

    return (
        <div className="min-h-screen bg-ivory flex flex-col">
            <Navigation />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
                {/* Header/Breadcrumb */}
                <button
                    onClick={() => router.push('/profile')}
                    className="flex items-center text-titanium/40 hover:text-titanium transition-colors mb-8 sm:mb-12 group text-[10px] font-bold uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Profile
                </button>

                {/* Page Header */}
                <div className="mb-16">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-titanium/[0.06] rounded-full flex items-center justify-center">
                            <Lock className="w-8 h-8 text-titanium/30" />
                        </div>
                        <div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-titanium tracking-tighter leading-[0.9]">
                                Who Wants In
                            </h1>
                            <p className="text-xl text-titanium/60 font-medium">
                                {requests.length} pending request{requests.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <p className="text-titanium/60 max-w-2xl font-medium leading-relaxed">
                        People requesting access to your moments. Approve them and they can view and search photos from your events.
                    </p>
                </div>

                {/* Requests List */}
                {requests.length > 0 ? (
                    <div className="space-y-4">
                        {requests.map((request) => (
                            <div key={request.id} className="border border-titanium/[0.08] rounded-[24px] p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-titanium/10 rounded-full flex items-center justify-center text-titanium font-black text-xl">
                                            {request.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-titanium">{request.username}</h3>
                                            <div className="flex items-center gap-2 text-titanium/40 text-sm mt-1">
                                                <span>wants access to</span>
                                                <span className="text-xs font-bold uppercase tracking-widest text-titanium/40 border border-titanium/[0.08] rounded-full px-3 py-1 inline-flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {request.event_title}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-titanium/40 text-sm mt-1">
                                                <Clock className="w-4 h-4" />
                                                <span>Requested {request.requested_at ? new Date(request.requested_at).toLocaleDateString() : 'recently'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleReject(request.id, request.username, request.event_title)}
                                            disabled={processingId === request.id}
                                            className="px-6 py-3 rounded-full border border-titanium/[0.08] text-red-500/50 hover:text-red-500 hover:bg-red-500/5 text-sm font-bold transition-all cursor-pointer disabled:opacity-30"
                                        >
                                            {processingId === request.id ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                                            ) : (
                                                <UserX className="w-4 h-4 mr-2 inline" />
                                            )}
                                            Decline
                                        </button>
                                        <button
                                            onClick={() => handleApprove(request.id, request.username, request.event_title)}
                                            disabled={processingId === request.id}
                                            className="px-6 py-3 rounded-full bg-titanium text-ivory hover:bg-titanium/90 text-sm font-bold transition-all cursor-pointer disabled:opacity-30"
                                        >
                                            {processingId === request.id ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                                            ) : (
                                                <UserCheck className="w-4 h-4 mr-2 inline" />
                                            )}
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-40 text-center bg-white/40 rounded-xl border-dashed border-2 border-black/5">
                        <div className="w-20 h-20 bg-titanium/5 rounded-xl flex items-center justify-center mx-auto mb-8">
                            <Lock className="w-10 h-10 text-titanium opacity-10" />
                        </div>
                        <h3 className="text-2xl font-black text-titanium mb-4 italic tracking-tight">
                            No Requests Yet
                        </h3>
                        <p className="text-titanium/40 font-medium max-w-xs mx-auto">
                            When someone asks to access your moments, you'll see it here.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default EventAccessRequestsPage;
