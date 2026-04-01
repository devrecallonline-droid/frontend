'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useUI } from '@/hooks/use-api';
import { useGetUploadUrlsMutation, useConfirmUploadsMutation, useGetEventsQuery } from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Navigation from '@/components/Navigation';
import { Button, Card, Badge } from '@/components/ui';
import {
    Upload,
    Camera,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Image as ImageIcon,
    ArrowLeft,
    Plus,
    Shield
} from 'lucide-react';

/**
 * Utility for merging tailwind classes
 */
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const UploadPage = () => {
    const params = useParams();
    const eventId = params.id as string;
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const { addAlert } = useUI();
    const [getUploadUrls] = useGetUploadUrlsMutation();
    const [confirmUploads] = useConfirmUploadsMutation();
    const { data: events } = useGetEventsQuery();

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });

    const event = events?.find(e => e.id === eventId);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push('/auth');
        }
    }, [mounted, isAuthenticated, router]);

    // Polling removed from page - will be handled by global tracker

    const processFiles = (files: File[]) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        setSelectedFiles(prev => [...prev, ...imageFiles]);
        const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files));
        }
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;
        setIsUploading(true);
        setProgress({ current: 0, total: selectedFiles.length, percentage: 0 });

        try {
            // Step 1: Get presigned upload URLs from API
            const filesMeta = selectedFiles.map(f => ({ name: f.name, type: f.type, size: f.size }));
            const { uploads } = await getUploadUrls({ eventId, files: filesMeta }).unwrap();

            // Step 2: Upload each file directly to GCS/MinIO
            for (let i = 0; i < uploads.length; i++) {
                const upload = uploads[i];
                const file = selectedFiles[i];

                await fetch(upload.uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type },
                });

                setProgress({
                    current: i + 1,
                    total: uploads.length,
                    percentage: Math.round(((i + 1) / uploads.length) * 100),
                });
            }

            // Step 3: Confirm uploads with API (creates DB records + queues processing)
            const photosToConfirm = uploads.map((u, i) => ({
                photoId: u.photoId,
                storageKey: u.storageKey,
                filename: u.filename,
                size: selectedFiles[i].size,
                mimeType: selectedFiles[i].type,
            }));

            await confirmUploads({ eventId, photos: photosToConfirm }).unwrap();

            addAlert({ type: 'success', message: 'Memories shared! AI scanning started in background.' });

            // Set a flag for the global scanner
            if (typeof window !== 'undefined') {
                const processing = JSON.parse(localStorage.getItem('processing_events') || '[]');
                if (!processing.includes(eventId)) {
                    processing.push(eventId);
                    localStorage.setItem('processing_events', JSON.stringify(processing));
                    window.dispatchEvent(new Event('processing_started'));
                }
            }

            router.push(`/events/${eventId}`);
        } catch (error: any) {
            console.error('Upload Error:', error);
            if (error?.status === 403 && error?.data?.detail?.includes('quota')) {
                addAlert({ type: 'error', message: error.data.detail });
            } else {
                addAlert({ type: 'error', message: 'Something went wrong while sharing your photos. Please try again.' });
            }
        } finally {
            setIsUploading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-ivory flex flex-col">
            <Navigation />

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 pt-32 pb-20">
                {/* Header Section */}
                <div className="mb-12 lg:mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8 animate-slide-up">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-titanium/40 hover:text-titanium transition-colors mb-6 group text-[10px] font-bold uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                            Back to Gathering
                        </button>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-titanium tracking-tighter leading-[0.9]">
                            Share <span className="opacity-30">Memories.</span>
                        </h1>
                        <p className="mt-6 text-titanium/50 font-medium">
                            Sharing to <span className="text-titanium font-bold">{event?.title || 'Gathering...'}</span>
                        </p>
                    </div>
                </div>

                <Card className="p-1 w-full bg-white/40 glass border-white/60 rounded-apple-2xl overflow-hidden animate-slide-up [animation-delay:100ms]">
                    <div className="bg-white/20 p-8 md:p-12 rounded-apple-xl">
                        {selectedFiles.length === 0 ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={cn(
                                    "text-center py-16 md:py-24 border-2 border-dashed rounded-apple-lg transition-all duration-300 group cursor-pointer relative",
                                    isDragging
                                        ? "border-titanium bg-titanium/5 scale-[0.99] shadow-inner"
                                        : "border-black/5 hover:bg-black/5"
                                )}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                />
                                <div className={cn(
                                    "w-20 h-20 rounded-apple-lg flex items-center justify-center mx-auto mb-8 transition-all duration-500",
                                    isDragging ? "bg-titanium/20 scale-110" : "bg-titanium/5 group-hover:scale-110"
                                )}>
                                    <Upload className={cn(
                                        "w-10 h-10 transition-colors",
                                        isDragging ? "text-titanium opacity-100" : "text-titanium opacity-20"
                                    )} />
                                </div>
                                <h2 className="text-2xl font-black text-titanium mb-4 tracking-tight italic">
                                    {isDragging ? "Drop to Add" : "Select Photos"}
                                </h2>
                                <p className="text-titanium/40 font-medium mb-12 max-w-xs mx-auto text-sm leading-relaxed px-4">
                                    {isDragging
                                        ? "Release your mouse to start the magic."
                                        : "Choose the best moments to share with everyone in this gathering."}
                                </p>
                                <Button variant="default" className={cn(
                                    "bg-titanium text-ivory pointer-events-none px-12 h-14 transition-all",
                                    isDragging && "opacity-0 scale-90"
                                )}>
                                    Add Memories
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                    {previews.map((preview, index) => (
                                        <div key={index} className="relative aspect-square group rounded-apple-lg overflow-hidden glass border-white/60 p-1 premium-shadow-sm">
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="w-full h-full object-cover rounded-apple-md"
                                            />
                                            <button
                                                onClick={() => removeFile(index)}
                                                className="absolute top-2 right-2 p-2 bg-black/80 backdrop-blur-md text-white rounded-full sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-black shadow-lg"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square border-2 border-dashed border-black/5 rounded-apple-lg flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-all text-titanium/20 hover:text-titanium/40">
                                        <Plus className="w-8 h-8 sm:w-10 sm:h-10" />
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                </div>

                                <div className="p-6 md:p-8 bg-black text-ivory rounded-apple-xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                                    <div className="flex items-center text-center md:text-left flex-col md:flex-row">
                                        <div className="w-14 h-14 bg-ivory/10 rounded-apple-md flex items-center justify-center mb-4 md:mb-0 md:mr-6">
                                            <ImageIcon className="w-7 h-7 text-ivory/40" />
                                        </div>
                                        <div>
                                            <p className="text-xl font-black tracking-tight">{selectedFiles.length} Photos Selected</p>
                                            <p className="text-sm font-medium text-ivory/40">Almost ready to share.</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="w-full md:w-auto px-12 h-16 md:h-20 bg-ivory text-black hover:bg-white text-lg"
                                    >
                                        {isUploading ? (
                                            <div className="flex items-center">
                                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                                <span>Uploading {progress.current}/{progress.total}...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-5 h-5 mr-3" />
                                                <span>Upload Now</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Security Protocols */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-black/5 pt-20">
                    <div className="space-y-4">
                        <div className="w-10 h-10 bg-titanium/5 rounded-apple-lg flex items-center justify-center text-titanium/60">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-titanium uppercase tracking-widest italic">Secure Sharing</h4>
                        <p className="text-sm text-titanium/40 font-medium leading-relaxed">End-to-end encryption ensures your memories stay private and safe.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-10 h-10 bg-titanium/5 rounded-apple-lg flex items-center justify-center text-titanium/60">
                            <Camera className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-titanium uppercase tracking-widest italic">Privacy First</h4>
                        <p className="text-sm text-titanium/40 font-medium leading-relaxed">We use AI to help you find your photos without ever compromising your identity.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-10 h-10 bg-titanium/5 rounded-apple-lg flex items-center justify-center text-titanium/60">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <h4 className="text-sm font-black text-titanium uppercase tracking-widest italic">7-Day Gallery</h4>
                        <p className="text-sm text-titanium/40 font-medium leading-relaxed">To keep things light and private, photos are automatically cleared after 7 days.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UploadPage;
