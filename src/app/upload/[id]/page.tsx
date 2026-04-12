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
    Plus,
    Shield,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';
import GoogleDrivePicker from '@/components/GoogleDrivePicker';

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
    const [currentPage, setCurrentPage] = useState(0);
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

        // Filter out duplicates (same name, size, and type)
        const uniqueSelectedFiles = [...selectedFiles];
        const duplicates: string[] = [];
        const newUniqueFiles = imageFiles.filter(file => {
            const isDuplicate = selectedFiles.some(existing => 
                existing.name === file.name && 
                existing.size === file.size && 
                existing.type === file.type
            );
            if (isDuplicate) duplicates.push(file.name);
            return !isDuplicate;
        });

        if (newUniqueFiles.length === 0) {
            if (duplicates.length > 0) {
                addAlert({ type: 'error', message: 'All selected files are already in your list.' });
            }
            return;
        }

        if (duplicates.length > 0) {
            addAlert({ 
                type: 'warning', 
                message: `Skipped ${duplicates.length} duplicate file${duplicates.length > 1 ? 's' : ''}.` 
            });
        }

        setSelectedFiles(prev => [...prev, ...newUniqueFiles]);
        const newPreviews = newUniqueFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
        
        // Reset to first page when adding new files to show them
        setCurrentPage(0);
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

    const removeFile = (index: number, imagesPerPage: number = 5) => {
        // Adjust index based on current page
        const actualIndex = (currentPage * imagesPerPage) + index;
        URL.revokeObjectURL(previews[actualIndex]);
        setPreviews(prev => prev.filter((_, i) => i !== actualIndex));
        setSelectedFiles(prev => prev.filter((_, i) => i !== actualIndex));
        
        // If the current page becomes empty, go back
        const newTotal = previews.length - 1;
        const maxPage = Math.max(0, Math.ceil(newTotal / imagesPerPage) - 1);
        if (currentPage > maxPage) {
            setCurrentPage(maxPage);
        }
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
                <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8 animate-slide-up">
                    <div className="space-y-4">
                        <button
                            onClick={() => router.push(`/events/${eventId}`)}
                            className="flex items-center text-titanium/30 hover:text-titanium transition-all mb-2 group text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-2 transition-transform group-hover:-translate-x-1" />
                            Back to Event
                        </button>
                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-titanium tracking-tighter leading-[0.8] uppercase italic">
                            Share <span className="opacity-20">Memories.</span>
                        </h1>
                        <p className="text-sm sm:text-base text-titanium/40 font-bold uppercase tracking-tight">
                            Sharing to <span className="text-titanium underline decoration-titanium/10 underline-offset-4">{event?.title || 'this gathering...'}</span>
                        </p>
                    </div>
                </div>

                <div className="w-full animate-slide-up [animation-delay:100ms]">
                    {selectedFiles.length === 0 ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "block text-center py-20 px-10 md:py-32 md:px-20 border border-dashed border-black/10 rounded-[2.5rem] bg-white/40 glass transition-all duration-500 group relative overflow-hidden",
                                isDragging
                                    ? "border-titanium/40 bg-titanium/5 scale-[0.98] shadow-inner"
                                    : "hover:bg-white/60"
                            )}
                        >
                            {/* Decorative elements */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-titanium/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            <div className={cn(
                                "w-24 h-24 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 transition-all duration-700 relative z-10",
                                isDragging ? "bg-titanium text-ivory rotate-12 scale-110" : "bg-titanium/5 text-titanium opacity-20 group-hover:opacity-100 group-hover:bg-titanium/10 group-hover:-rotate-3"
                            )}>
                                <Upload className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-black text-titanium mb-4 tracking-tighter italic uppercase relative z-10 px-4">
                                {isDragging ? "Release the Magic" : "Add Memories"}
                            </h2>
                            <p className="text-titanium/40 font-bold uppercase tracking-widest text-[10px] mb-12 max-w-xs mx-auto leading-relaxed px-8 relative z-10">
                                {isDragging
                                    ? "Drop them here"
                                    : "Select the most beautiful moments from your camera roll."}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 w-full max-w-xs mx-auto">
                                <label className={cn(
                                    "flex-1 w-full inline-flex items-center justify-center bg-titanium text-ivory h-16 rounded-full font-bold uppercase tracking-widest text-[10px] shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer",
                                    isDragging && "opacity-0 scale-90"
                                )}>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    From Device
                                </label>

                                {/* TEMPORARILY DISABLED PENDING GOOGLE VERIFICATION
                                <GoogleDrivePicker 
                                    onFilesSelected={processFiles}
                                    className={cn(
                                        "flex-1 w-full bg-white/80 border border-black/10 text-titanium h-16 rounded-full shadow-sm hover:bg-white",
                                        isDragging && "opacity-0 scale-90"
                                    )}
                                />
                                */}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-slide-up">
                            {/* Action Bar Moved to Top */}
                            <div className="p-1 bg-black rounded-[2.5rem] shadow-2xl shadow-black/20 overflow-hidden relative group">
                                {/* Progress Background */}
                                {isUploading && (
                                    <div 
                                        className="absolute inset-0 bg-titanium/20 transition-all duration-500 origin-left"
                                        style={{ width: `${progress.percentage}%` }}
                                    />
                                )}
                                
                                <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center pl-4 sm:pl-6">
                                        <div className="flex-1">
                                            <p className="text-xl sm:text-2xl font-black tracking-tighter text-ivory uppercase italic leading-none">
                                                {isUploading ? `Sending...` : `${selectedFiles.length} Selected`}
                                            </p>
                                            <p className="text-[9px] font-black text-ivory/40 uppercase tracking-[0.2em] mt-1 hidden sm:block">
                                                {isUploading ? `${progress.percentage}% COMPLETE` : 'Ready to share'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <Button
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="px-8 sm:px-12 h-14 sm:h-16 bg-ivory text-black hover:bg-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <div className="flex items-center">
                                                <Upload className="w-4 h-4 mr-2" />
                                                Share
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {(() => {
                                const IMAGES_PER_PAGE = 5;
                                const totalPages = Math.ceil(previews.length / IMAGES_PER_PAGE);
                                const pageImages = previews.slice(currentPage * IMAGES_PER_PAGE, (currentPage + 1) * IMAGES_PER_PAGE);
                                
                                return (
                                    <>
                                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                            {pageImages.map((preview, index) => (
                                                <div key={index} className="relative aspect-square group rounded-[1rem] overflow-hidden bg-white/40 glass border-white/60 p-1 shadow-xl transition-all hover:scale-[1.02]">
                                                    <img
                                                        src={preview}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover rounded-[0.8rem]"
                                                    />
                                                    <button
                                                        onClick={() => removeFile(index, IMAGES_PER_PAGE)}
                                                        className="absolute top-2 right-2 p-1.5 bg-black/80 backdrop-blur-xl text-white rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-black hover:scale-110 shadow-lg z-10"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            {/* Always show 'Add More' on every page slide */}
                                            <label className="aspect-square border border-dashed border-black/5 rounded-[1rem] flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-all text-titanium/10 hover:text-titanium/30 group">
                                                <Plus className="w-6 h-6 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                                                <span className="text-[9px] font-black uppercase tracking-widest mt-1.5 hidden sm:block">Add More</span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-center gap-6 py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                                    disabled={currentPage === 0}
                                                    className="w-12 h-12 rounded-full border border-black/5 hover:bg-white transition-all disabled:opacity-20"
                                                >
                                                    <ArrowLeft className="w-5 h-5" />
                                                </Button>
                                                
                                                <div className="flex items-center gap-2">
                                                    {Array.from({ length: totalPages }).map((_, i) => (
                                                        <div 
                                                            key={i}
                                                            className={cn(
                                                                "h-1.5 rounded-full transition-all duration-500",
                                                                currentPage === i ? "w-8 bg-titanium" : "w-1.5 bg-titanium/10"
                                                            )}
                                                        />
                                                    ))}
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                                    disabled={currentPage >= totalPages - 1}
                                                    className="w-12 h-12 rounded-full border border-black/5 hover:bg-white transition-all disabled:opacity-20"
                                                >
                                                    <ArrowRight className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Security Protocols */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16 border-t border-black/5 pt-20">
                    <div className="space-y-6 group">
                        <div className="w-12 h-12 bg-titanium/5 rounded-[1rem] flex items-center justify-center text-titanium/20 group-hover:bg-titanium group-hover:text-ivory transition-all duration-500 group-hover:-rotate-6">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-black text-titanium uppercase tracking-[0.2em] italic">Secure Sharing</h4>
                            <p className="text-sm text-titanium/40 font-bold leading-relaxed uppercase tracking-tight">End-to-end encryption ensures your memories stay private and safe.</p>
                        </div>
                    </div>
                    <div className="space-y-6 group">
                        <div className="w-12 h-12 bg-titanium/5 rounded-[1rem] flex items-center justify-center text-titanium/20 group-hover:bg-titanium group-hover:text-ivory transition-all duration-500 group-hover:rotate-6">
                            <Camera className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-black text-titanium uppercase tracking-[0.2em] italic">Privacy First</h4>
                            <p className="text-sm text-titanium/40 font-bold leading-relaxed uppercase tracking-tight">AI scanning for identities happens locally before cloud processing.</p>
                        </div>
                    </div>
                    <div className="space-y-6 group">
                        <div className="w-12 h-12 bg-titanium/5 rounded-[1rem] flex items-center justify-center text-titanium/20 group-hover:bg-titanium group-hover:text-ivory transition-all duration-500 group-hover:-rotate-3">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-black text-titanium uppercase tracking-[0.2em] italic">7-Day Gallery</h4>
                            <p className="text-sm text-titanium/40 font-bold leading-relaxed uppercase tracking-tight">To protect privacy, ephemeral galleries are cleared after 7 days.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UploadPage;
