'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useUI } from '@/hooks/use-api';
import { useGetCollectionQuery, useDeleteCollectionMutation, useRemovePhotoFromCollectionMutation, type CollectionPhoto } from '@/lib/api';
import Navigation from '@/components/Navigation';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Button, Card, Badge } from '@/components/ui';
import {
    Loader2,
    Image as ImageIcon,
    ArrowLeft,
    Trash2,
    Download,
    X,
    Calendar,
    FolderOpen
} from 'lucide-react';

const CollectionDetailPage = () => {
    const params = useParams();
    const collectionId = params.id as string;
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { addAlert } = useUI();
    const { data: collection, isLoading, error } = useGetCollectionQuery(collectionId);
    const [deleteCollection] = useDeleteCollectionMutation();
    const [removePhoto] = useRemovePhotoFromCollectionMutation();
    const [mounted, setMounted] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<CollectionPhoto | null>(null);

    useEffect(() => {
        const timeoutId = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push('/auth');
        }
    }, [mounted, isAuthenticated, router]);

    const handleDeleteCollection = async () => {
        if (collection && window.confirm(`Are you sure you want to delete the collection "${collection.name}"?`)) {
            try {
                await deleteCollection(collectionId).unwrap();
                addAlert({ type: 'success', message: 'Collection deleted successfully' });
                router.push('/collections');
            } catch (err) {
                console.error('Delete error:', err);
                addAlert({ type: 'error', message: 'Failed to delete collection' });
            }
        }
    };

    const handleRemovePhoto = async (photoId: string) => {
        try {
            await removePhoto({ collectionId, photoId }).unwrap();
            addAlert({ type: 'success', message: 'Photo removed from collection' });
        } catch (err) {
            console.error('Remove error:', err);
            addAlert({ type: 'error', message: 'Failed to remove photo' });
        }
    };

    const handleDownloadPhoto = async (photo: CollectionPhoto) => {
        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = photo.filename || 'photo.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            addAlert({ type: 'success', message: 'Photo downloaded!' });
        } catch (err) {
            console.error('Download error:', err);
            addAlert({ type: 'error', message: 'Failed to download photo.' });
        }
    };

    const handleDownloadAll = async () => {
        if (!collection || !collection.photos || collection.photos.length === 0) return;

        addAlert({ type: 'info', message: `Preparing ${collection.photos.length} photos...` });

        let downloaded = 0;
        let failed = 0;

        for (const photo of collection.photos) {
            try {
                const response = await fetch(photo.url);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = photo.filename || `photo-${photo.photo_id}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                downloaded++;
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
                console.error(`Failed to download photo ${photo.photo_id}:`, err);
                failed++;
            }
        }

        if (failed === 0) {
            addAlert({ type: 'success', message: `Downloaded ${downloaded} photos!` });
        } else {
            addAlert({ type: 'warning', message: `Downloaded ${downloaded}, ${failed} failed.` });
        }
    };

    if (!mounted) return null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-ivory flex flex-col">
                <Navigation />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-titanium animate-spin mb-6 opacity-20" />
                    <p className="text-titanium/40 font-bold uppercase tracking-widest text-xs">Loading collection...</p>
                </div>
            </div>
        );
    }

    if (error || !collection) {
        return (
            <div className="min-h-screen bg-ivory flex flex-col">
                <Navigation />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-32">
                    <div className="w-20 h-20 bg-titanium/5 rounded-xl flex items-center justify-center mb-8">
                        <FolderOpen className="w-10 h-10 text-titanium opacity-10" />
                    </div>
                    <h1 className="text-4xl font-black text-titanium mb-4 italic tracking-tight">Collection Not Found</h1>
                    <p className="text-titanium/40 font-medium mb-12 max-w-xs mx-auto">This collection does not exist or you do not have access to it.</p>
                    <Button onClick={() => router.push('/collections')}>Back to Collections</Button>
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
                    onClick={() => router.push('/collections')}
                    className="flex items-center text-titanium/40 hover:text-titanium transition-colors mb-8 sm:mb-12 group text-[10px] font-bold uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Collections
                </button>

                {/* Collection Header */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-16">
                    <div className="lg:col-span-3">
                        <div className="rounded-3xl p-6 sm:p-10 bg-white/60 backdrop-blur-sm border border-white/60 shadow-lg h-full flex flex-col justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-8">
                                    <Badge variant="secondary" className="bg-titanium/5 text-titanium">
                                        My Collection
                                    </Badge>
                                    <Badge variant="secondary" className="bg-titanium/5 text-titanium">
                                        {collection.photo_count} Photos
                                    </Badge>
                                </div>

                                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-titanium mb-6 tracking-tighter leading-[0.9]">
                                    {collection.name}
                                </h1>

                                <p className="text-xl text-titanium/60 mb-12 max-w-2xl font-medium leading-relaxed">
                                    {collection.event_description || `Photos from ${collection.event_title}`}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 pt-10 border-t border-black/5">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-titanium/5 rounded-lg flex items-center justify-center mr-4 text-titanium">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold italic text-titanium/30 uppercase tracking-widest">Event Date</p>
                                        <p className="text-sm font-bold text-titanium">
                                            {collection.event_date ? new Date(collection.event_date).toLocaleDateString() : 'TBD'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-titanium/5 rounded-lg flex items-center justify-center mr-4 text-titanium">
                                        <FolderOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold italic text-titanium/30 uppercase tracking-widest">Event</p>
                                        <p className="text-sm font-bold text-titanium">{collection.event_title}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="rounded-3xl p-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl h-full flex flex-col justify-center">
                            <h3 className="text-2xl font-black mb-4 tracking-tight text-white">Actions</h3>
                            <p className="text-slate-300 mb-10 text-sm font-medium leading-relaxed">
                                Download all photos or manage this collection.
                            </p>
                            <div className="space-y-4">
                                <Button
                                    onClick={handleDownloadAll}
                                    disabled={!collection.photos || collection.photos.length === 0}
                                    className="w-full bg-white text-slate-900 hover:bg-slate-100 py-6 h-auto font-semibold"
                                >
                                    <Download className="w-5 h-5 mr-3" />
                                    Download All
                                </Button>
                                <Button
                                    onClick={handleDeleteCollection}
                                    variant="outline"
                                    className="w-full py-6 h-auto bg-transparent text-red-400 border-red-400/30 hover:bg-red-400/10 hover:text-red-300 font-semibold"
                                >
                                    <Trash2 className="w-5 h-5 mr-3" />
                                    Delete Collection
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Photos Grid */}
                <div>
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-4xl font-black text-titanium tracking-tighter">Photos</h2>
                            <p className="text-titanium/40 font-medium">{collection.photos?.length || 0} photos in this collection</p>
                        </div>
                    </div>

                    {collection.photos && collection.photos.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {collection.photos.map((photo: CollectionPhoto, index: number) => (
                                <div
                                    key={photo.id}
                                    className="relative w-full overflow-hidden cursor-pointer group"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <OptimizedImage
                                        src={photo.url}
                                        alt={photo.filename || 'Photo'}
                                        className="rounded-lg object-contain w-full"
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        priority={index < 6}
                                    />

                                    {/* Similarity Badge */}
                                    {photo.similarity && (
                                        <div className="absolute top-2 left-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 transition-opacity">
                                            {Math.round(photo.similarity * 100)}% Match
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadPhoto(photo);
                                            }}
                                            className="p-2 bg-titanium text-ivory rounded-full shadow-lg hover:bg-titanium/80"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemovePhoto(photo.photo_id);
                                            }}
                                            className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"
                                            title="Remove from collection"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-40 text-center bg-white/40 rounded-xl border-dashed border-2 border-black/5">
                            <div className="w-20 h-20 bg-titanium/5 rounded-xl flex items-center justify-center mx-auto mb-8">
                                <ImageIcon className="w-10 h-10 text-titanium opacity-10" />
                            </div>
                            <h3 className="text-2xl font-black text-titanium mb-4 italic tracking-tight">
                                No Photos
                            </h3>
                            <p className="text-titanium/40 font-medium max-w-xs mx-auto">
                                This collection is empty. Photos you find in events will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Photo Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div className="relative w-full h-full max-w-7xl max-h-screen mx-auto p-4 flex flex-col">
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Image container */}
                        <div
                            className="flex-1 flex items-center justify-center overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedPhoto.url}
                                alt={selectedPhoto.filename || 'Photo'}
                                className="max-w-full max-h-[calc(100vh-140px)] object-contain rounded-lg"
                                style={{ maxHeight: 'calc(100vh - 140px)' }}
                            />
                        </div>

                        {/* Photo info bar */}
                        <div className="mt-4 px-4 py-3 bg-black/40 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium text-sm">{selectedPhoto.filename || 'Photo'}</p>
                                {selectedPhoto.similarity && (
                                    <p className="text-green-400 text-xs">
                                        {Math.round(selectedPhoto.similarity * 100)}% Match
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadPhoto(selectedPhoto)}
                                    className="text-white hover:bg-white/10"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollectionDetailPage;
