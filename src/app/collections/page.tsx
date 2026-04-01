'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUI } from '@/hooks/use-api';
import { useGetCollectionsQuery, useDeleteCollectionMutation, type Collection } from '@/lib/api';
import Navigation from '@/components/Navigation';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Button, Card, Badge } from '@/components/ui';
import {
    Loader2,
    Image as ImageIcon,
    ArrowLeft,
    Trash2,
    FolderOpen,
    Calendar
} from 'lucide-react';

const CollectionsPage = () => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { addAlert } = useUI();
    const { data: collections, isLoading, error } = useGetCollectionsQuery();
    const [deleteCollection] = useDeleteCollectionMutation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push('/auth');
        }
    }, [mounted, isAuthenticated, router]);

    const handleDeleteCollection = async (collectionId: string, collectionName: string) => {
        if (window.confirm(`Are you sure you want to delete the collection "${collectionName}"?`)) {
            try {
                await deleteCollection(collectionId).unwrap();
                addAlert({ type: 'success', message: 'Collection deleted successfully' });
            } catch (err) {
                console.error('Delete error:', err);
                addAlert({ type: 'error', message: 'Failed to delete collection' });
            }
        }
    };

    if (!mounted) return null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-ivory flex flex-col">
                <Navigation />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-titanium animate-spin mb-6 opacity-20" />
                    <p className="text-titanium/40 font-bold uppercase tracking-widest text-xs">Loading your collections...</p>
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
                        <ImageIcon className="w-10 h-10 text-titanium opacity-10" />
                    </div>
                    <h1 className="text-4xl font-black text-titanium mb-4 italic tracking-tight">Error Loading Collections</h1>
                    <p className="text-titanium/40 font-medium mb-12 max-w-xs mx-auto">Something went wrong while loading your collections.</p>
                    <Button onClick={() => router.push('/events')}>Back to Events</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ivory flex flex-col">
            <Navigation />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
                {/* Header/Breadcrumb */}
                <button
                    onClick={() => router.push('/events')}
                    className="flex items-center text-titanium/40 hover:text-titanium transition-colors mb-8 sm:mb-12 group text-[10px] font-bold uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Events
                </button>

                {/* Page Header */}
                <div className="mb-16">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-titanium mb-6 tracking-tighter leading-[0.9]">
                        My Collections
                    </h1>
                    <p className="text-xl text-titanium/60 max-w-2xl font-medium leading-relaxed">
                        Your saved photo searches from events. Each collection contains photos where you were found.
                    </p>
                </div>

                {/* Collections Grid */}
                {collections && collections.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {collections.map((collection: Collection) => (
                            <Card
                                key={collection.id}
                                className="overflow-hidden bg-white/40 border-white/60 cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => router.push(`/collections/${collection.id}`)}
                            >
                                {/* Collection Thumbnail */}
                                <div className="aspect-[4/3] bg-titanium/5 relative overflow-hidden">
                                    {collection.thumbnail_url ? (
                                        <OptimizedImage
                                            src={collection.thumbnail_url}
                                            alt={collection.name}
                                            className="rounded-none"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FolderOpen className="w-16 h-16 text-titanium/20" />
                                        </div>
                                    )}
                                    
                                    {/* Photo Count Badge */}
                                    <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-bold">
                                        {collection.photo_count} photos
                                    </div>
                                </div>

                                {/* Collection Info */}
                                <div className="p-6">
                                    <h3 className="text-xl font-black text-titanium mb-2 tracking-tight">
                                        {collection.name}
                                    </h3>
                                    <div className="flex items-center text-titanium/40 text-sm mb-4">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {collection.created_at 
                                            ? new Date(collection.created_at).toLocaleDateString() 
                                            : 'Unknown date'
                                        }
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <Badge variant="secondary" className="bg-titanium/5 text-titanium">
                                            {collection.event_title}
                                        </Badge>
                                        
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCollection(collection.id, collection.name);
                                            }}
                                            className="p-2 text-titanium/40 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="Delete Collection"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-40 text-center bg-white/40 rounded-xl border-dashed border-2 border-black/5">
                        <div className="w-20 h-20 bg-titanium/5 rounded-xl flex items-center justify-center mx-auto mb-8">
                            <FolderOpen className="w-10 h-10 text-titanium opacity-10" />
                        </div>
                        <h3 className="text-2xl font-black text-titanium mb-4 italic tracking-tight">
                            No Collections Yet
                        </h3>
                        <p className="text-titanium/40 font-medium mb-12 max-w-xs mx-auto">
                            Search for photos in events and they will be automatically saved here.
                        </p>
                        <Button variant="outline" className="px-10 h-14" onClick={() => router.push('/events')}>
                            Browse Events
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CollectionsPage;
