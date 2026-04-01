'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUI } from '@/hooks/use-api';
import { useGetFollowRequestsQuery, useHandleFollowRequestMutation, type User } from '@/lib/api';
import Navigation from '@/components/Navigation';
import { Button, Card, Badge } from '@/components/ui';
import {
    Loader2,
    UserCheck,
    UserX,
    Users,
    ArrowLeft,
    Clock
} from 'lucide-react';

const FollowRequestsPage = () => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { addAlert } = useUI();
    const { data: requestsData, isLoading, error } = useGetFollowRequestsQuery();
    const [handleRequest] = useHandleFollowRequestMutation();
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

    const handleApprove = async (followerId: string, username: string) => {
        setProcessingId(followerId);
        try {
            await handleRequest({ follower_id: followerId, action: 'approve' }).unwrap();
            addAlert({ type: 'success', message: `Approved ${username}'s follow request` });
        } catch (err) {
            addAlert({ type: 'error', message: 'Failed to approve request' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (followerId: string, username: string) => {
        setProcessingId(followerId);
        try {
            await handleRequest({ follower_id: followerId, action: 'reject' }).unwrap();
            addAlert({ type: 'success', message: `Rejected ${username}'s follow request` });
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
                    <p className="text-titanium/40 font-bold uppercase tracking-widest text-xs">Loading follow requests...</p>
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
                        <Users className="w-10 h-10 text-titanium opacity-10" />
                    </div>
                    <h1 className="text-4xl font-black text-titanium mb-4 italic tracking-tight">Error Loading Requests</h1>
                    <p className="text-titanium/40 font-medium mb-12 max-w-xs mx-auto">Something went wrong while loading follow requests.</p>
                    <Button onClick={() => router.push('/profile')}>Back to Profile</Button>
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
                        <div className="w-16 h-16 bg-titanium/10 rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-titanium" />
                        </div>
                        <div>
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-titanium tracking-tighter leading-[0.9]">
                                Follow Requests
                            </h1>
                            <p className="text-xl text-titanium/60 font-medium">
                                {requests.length} pending request{requests.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <p className="text-titanium/60 max-w-2xl font-medium leading-relaxed">
                        Users who want to follow you and access your events. Approve requests to grant them access to view and search for photos in your events.
                    </p>
                </div>

                {/* Requests List */}
                {requests.length > 0 ? (
                    <div className="space-y-4">
                        {requests.map((request: User) => (
                            <Card key={request.id} className="p-6 bg-white/40 border-white/60">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-titanium/10 rounded-full flex items-center justify-center text-titanium font-black text-xl">
                                            {request.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-titanium">{request.username}</h3>
                                            <div className="flex items-center gap-2 text-titanium/40 text-sm">
                                                <Clock className="w-4 h-4" />
                                                <span>Requested {request.followed_at ? new Date(request.followed_at).toLocaleDateString() : 'recently'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleReject(request.id, request.username)}
                                            disabled={processingId === request.id}
                                            variant="outline"
                                            className="border-red-400/30 text-red-400 hover:bg-red-400/10 hover:text-red-300"
                                        >
                                            {processingId === request.id ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <UserX className="w-4 h-4 mr-2" />
                                            )}
                                            Reject
                                        </Button>
                                        <Button
                                            onClick={() => handleApprove(request.id, request.username)}
                                            disabled={processingId === request.id}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {processingId === request.id ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <UserCheck className="w-4 h-4 mr-2" />
                                            )}
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-40 text-center bg-white/40 rounded-xl border-dashed border-2 border-black/5">
                        <div className="w-20 h-20 bg-titanium/5 rounded-xl flex items-center justify-center mx-auto mb-8">
                            <Users className="w-10 h-10 text-titanium opacity-10" />
                        </div>
                        <h3 className="text-2xl font-black text-titanium mb-4 italic tracking-tight">
                            No Pending Requests
                        </h3>
                        <p className="text-titanium/40 font-medium max-w-xs mx-auto">
                            When users request to follow you, they will appear here for your approval.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FollowRequestsPage;
