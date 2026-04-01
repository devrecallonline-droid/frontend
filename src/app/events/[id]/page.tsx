'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useUI } from '@/hooks/use-api';
import { useGetEventsQuery, useGetEventPhotosQuery, useGetEventDetailsQuery, useSearchPhotosMutation, useDeletePhotoMutation, useCreateCollectionMutation, useRequestEventAccessMutation, useGetEventAccessStatusQuery, useUpdateEventMutation, useGetEventAccessRequestsQuery, useHandleEventAccessRequestMutation, useCreateShareLinkMutation, useGetShareLinksQuery, useDeleteShareLinkMutation, type Photo } from '@/lib/api';
import Navigation from '@/components/Navigation';
import { OptimizedImage, useProgressiveImage } from '@/components/OptimizedImage';
import { 
    loadFaceDetectionModels, 
    performLivenessCheck, 
    areModelsLoaded,
    type LivenessResult 
} from '@/lib/faceDetection';

import { Button, Card, Badge, Input, Textarea, Modal } from '@/components/ui';
import {
    Calendar,
    MapPin,
    Users,
    Upload,
    ArrowLeft,
    Loader2,
    Image as ImageIcon,
    Search,
    ShieldCheck,
    Sparkles,
    Trash2,
    X,
    Download,
    Lock,
    Unlock,
    Settings,
    Check,
    XCircle,
    Link2,
    Copy,
    ExternalLink,
    Eye,
    EyeOff,
    Camera
} from 'lucide-react';

// Memoized photo grid item - prevents re-renders and keeps image loaded
const PhotoGridItem = React.memo(({
    photo,
    index,
    isOwner,
    onSelect,
    onDelete
}: {
    photo: Photo;
    index: number;
    isOwner: boolean;
    onSelect: (photo: Photo) => void;
    onDelete: (photo: Photo) => void;
}) => {
    return (
        <div
            onClick={() => onSelect(photo)}
            className="relative w-full overflow-hidden cursor-pointer group"
        >
            <OptimizedImage
                src={photo.url}
                alt={photo.filename}
                className="rounded-lg object-contain w-full"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={index < 6}
            />
            {isOwner && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(photo);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                    title="Delete Photo"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
});

PhotoGridItem.displayName = 'PhotoGridItem';

// Optimized modal component
const PhotoModal = ({
    photo,
    onClose,
    onDownload
}: {
    photo: Photo;
    onClose: () => void;
    onDownload: (photo: Photo) => void;
}) => {
    const { loadedSrc, isLoading, error } = useProgressiveImage(photo.url);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            onClick={onClose}
            style={{ contain: 'strict' }}
        >
            <div className="relative w-full h-full max-w-7xl max-h-screen mx-auto p-4 flex flex-col">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Image container */}
                <div
                    className="flex-1 flex items-center justify-center overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {isLoading && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
                            <p className="text-white/50 text-sm">Loading image...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-white/50 text-center">
                            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>Failed to load image</p>
                        </div>
                    )}

                    {loadedSrc && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={loadedSrc}
                            alt={photo.filename}
                            className="max-w-full max-h-[calc(100vh-140px)] object-contain rounded-lg"
                            style={{
                                maxHeight: 'calc(100vh - 140px)',
                                willChange: 'transform'
                            }}
                        />
                    )}
                </div>

                {/* Photo info bar */}
                <div className="mt-4 px-4 py-3 bg-black/40 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="text-white font-medium text-sm">{photo.filename}</p>
                        <p className="text-white/50 text-xs">
                            {new Date(photo.uploaded_at).toLocaleDateString()}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownload(photo)}
                        className="text-white hover:bg-white/10"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                    </Button>
                </div>
            </div>
        </div>
    );
};

const EventDetailPage = () => {
    const params = useParams();
    const eventId = params.id as string;
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const { data: events, isLoading: eventsLoading } = useGetEventsQuery();
    const { data: eventDetails, isLoading: detailsLoading, error: eventError } = useGetEventDetailsQuery(eventId);
    const event = eventDetails;
    const isOwner = event?.owner_id === user?.id;
    const [page, setPage] = useState(1);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const { data: photosData, isLoading: photosLoading, isFetching: isFetchingPhotos } = useGetEventPhotosQuery(
        { eventId, page, limit: 12 },
        { skip: !eventId || !isOwner }
    );
    const [searchPhotos, { isLoading: isSearching }] = useSearchPhotosMutation();
    const [deletePhoto] = useDeletePhotoMutation();
    const [createCollection] = useCreateCollectionMutation();
    const [requestEventAccess] = useRequestEventAccessMutation();
    const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
    const { data: accessRequestsData, refetch: refetchAccessRequests } = useGetEventAccessRequestsQuery(undefined, {
        skip: !isAuthenticated,
    });
    const [handleAccessRequest] = useHandleEventAccessRequestMutation();
    const [mounted, setMounted] = useState(false);
    const [matchedPhotos, setMatchedPhotos] = useState<Photo[] | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [showAccessPrompt, setShowAccessPrompt] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '', event_date: '', location: '', is_private: true });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addAlert } = useUI();
    const [createShareLink] = useCreateShareLinkMutation();
    const { data: shareLinksData, refetch: refetchShareLinks } = useGetShareLinksQuery(eventId, { skip: !eventId || !event || !isOwner });
    const [deleteShareLink] = useDeleteShareLinkMutation();
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareForm, setShareForm] = useState({ label: '', password: '', expires_in_days: '' });
    const [isCreatingLink, setIsCreatingLink] = useState(false);
    const [showSharePassword, setShowSharePassword] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Liveness detection state
    const [livenessStep, setLivenessStep] = useState<'idle' | 'loading' | 'challenge' | 'analyzing' | 'complete' | 'failed'>('idle');
    const [currentChallenge, setCurrentChallenge] = useState<'blink' | 'turn_left' | 'turn_right'>('blink');
    const [livenessResult, setLivenessResult] = useState<LivenessResult | null>(null);
    const [livenessProgress, setLivenessProgress] = useState({ status: '', percent: 0 });
    const [modelsLoading, setModelsLoading] = useState(false);

    // Challenges pool
    const challenges: Array<{ id: 'blink' | 'turn_left' | 'turn_right'; text: string }> = [
        { id: 'blink', text: 'Blink your eyes naturally' },
        { id: 'turn_left', text: 'Turn your head slightly to the left' },
        { id: 'turn_right', text: 'Turn your head slightly to the right' },
    ];

    // Detect if user is on mobile device
    const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Load face detection models
    const loadModels = async () => {
        if (areModelsLoaded()) return;
        
        setModelsLoading(true);
        try {
            await loadFaceDetectionModels();
            console.log('Face detection models loaded');
        } catch (err) {
            console.error('Failed to load face detection models:', err);
            addAlert({ type: 'error', message: 'Failed to load face detection. Please refresh.' });
        } finally {
            setModelsLoading(false);
        }
    };

    // Start camera stream
    const startCamera = async () => {
        try {
            // Load models first
            await loadModels();
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }, // Front camera for selfie
                audio: false
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to be ready
                videoRef.current.onloadedmetadata = () => {
                    console.log('Video metadata loaded, playing...');
                    videoRef.current?.play().catch(err => console.error('Play error:', err));
                };
            }
        } catch (err) {
            console.error('Camera access error:', err);
            addAlert({ type: 'error', message: 'Could not access camera. Please allow camera permissions.' });
        }
    };

    // Stop camera stream
    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

    // Capture photo from camera - crops to oval area
    const capturePhoto = async () => {
        if (!videoRef.current) {
            console.error('No video element');
            return;
        }

        const video = videoRef.current;
        
        // Ensure video is playing
        if (video.paused) {
            console.log('Video is paused, attempting to play...');
            try {
                await video.play();
            } catch (err) {
                console.error('Could not play video:', err);
                return;
            }
        }

        // Wait a frame for video to stabilize
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // CAPTURE MAIN PHOTO
        let mainPhoto: string | null = null;
        if (canvasRef.current) {
            const tempCanvas = document.createElement('canvas');
            const tempContext = tempCanvas.getContext('2d');
            
            if (tempContext) {
                tempCanvas.width = video.videoWidth;
                tempCanvas.height = video.videoHeight;
                tempContext.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
                
                const cropWidth = tempCanvas.width * 0.625;
                const cropHeight = tempCanvas.height * 0.60;
                const cropX = (tempCanvas.width - cropWidth) / 2;
                const cropY = tempCanvas.height * 0.05;
                
                const cropCanvas = canvasRef.current;
                const cropContext = cropCanvas.getContext('2d');
                
                if (cropContext) {
                    cropCanvas.width = cropWidth;
                    cropCanvas.height = cropHeight;
                    cropContext.drawImage(
                        tempCanvas,
                        cropX, cropY, cropWidth, cropHeight,
                        0, 0, cropWidth, cropHeight
                    );
                    
                    mainPhoto = cropCanvas.toDataURL('image/jpeg', 0.9);
                }
            }
        }

        if (!mainPhoto) {
            console.error('Failed to capture main photo');
            return;
        }

        // START REAL LIVENESS CHECK with face-api.js
        console.log('Starting real liveness check with face-api.js...');
        
        // Pick random challenge
        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        setCurrentChallenge(randomChallenge.id);
        setLivenessStep('challenge');
        setLivenessProgress({ status: 'Looking for face...', percent: 0 });

        try {
            // Perform liveness detection
            const result = await performLivenessCheck(
                video,
                randomChallenge.id,
                (progress) => {
                    setLivenessProgress({
                        status: progress.status,
                        percent: progress.percent
                    });
                }
            );

            console.log('Liveness result:', result);
            setLivenessResult(result);

            if (result.isLive) {
                setLivenessStep('complete');
                setCapturedImage(mainPhoto);
                addAlert({ 
                    type: 'success', 
                    message: `Liveness verified! Confidence: ${Math.round(result.confidence)}%` 
                });
            } else {
                setLivenessStep('failed');
                addAlert({ 
                    type: 'error', 
                    message: `Liveness check failed. ${result.details.blinkCount === 0 ? 'Please try blinking naturally.' : 'Please ensure you are a real person.'}` 
                });
            }
        } catch (err) {
            console.error('Liveness check error:', err);
            setLivenessStep('failed');
            addAlert({ type: 'error', message: 'Liveness check failed. Please try again.' });
        }

        // Stop camera
        stopCamera();
    };

    // Retake photo
    const retakePhoto = () => {
        setCapturedImage(null);
        setLivenessStep('idle');
        setLivenessResult(null);
        setLivenessProgress({ status: '', percent: 0 });
        startCamera();
    };

    // Submit captured photo for search
    const submitPhoto = async () => {
        if (capturedImage && livenessResult?.isLive) {
            try {
                // Convert base64 to blob
                const response = await fetch(capturedImage);
                const blob = await response.blob();
                const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
                
                const formData = new FormData();
                formData.append('file', file);
                
                // Add liveness proof to form data
                formData.append('liveness_verified', 'true');
                formData.append('liveness_confidence', livenessResult.confidence.toString());
                formData.append('liveness_details', JSON.stringify({
                    blinkCount: livenessResult.details.blinkCount,
                    faceCount: livenessResult.details.faceCount,
                    totalFrames: livenessResult.details.totalFrames,
                    checks: livenessResult.checks
                }));
                
                setShowCameraModal(false);
                addAlert({ type: 'info', message: 'Analyzing your selfie and searching through photos...' });
                
                const result = await searchPhotos({ eventId, formData }).unwrap();
                if (result.matches_found > 0) {
                    setMatchedPhotos(result.photos);
                    addAlert({ type: 'success', message: `Found ${result.matches_found} photos of you!` });
                } else {
                    setMatchedPhotos([]);
                    addAlert({ type: 'error', message: "We could not find any matches for you in this event." });
                }
                
                // Reset camera state
                setCapturedImage(null);
            } catch (err: any) {
                console.error('Search error:', err);
                addAlert({ type: 'error', message: 'Error during face processing. Please try again.' });
            }
        } else {
            addAlert({ type: 'error', message: 'Liveness verification required. Please complete the liveness check.' });
        }
    };

    // Convert base64 to Blob
    const base64ToBlob = (base64: string, type: string): Blob => {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type });
    };

    // Handle modal close
    const handleCloseCamera = () => {
        stopCamera();
        setCapturedImage(null);
        setLivenessStep('idle');
        setLivenessResult(null);
        setLivenessProgress({ status: '', percent: 0 });
        setShowCameraModal(false);
    };

    // Virtual scroll removed - render all photos directly to prevent DOM remount stutter
    const photos = photosData?.photos || [];

    // Extract event info from access error (403 response)
    const accessErrorData = eventError && (eventError as any)?.status === 403
        ? (eventError as any)?.data?.detail
        : null;
    const eventFromError = accessErrorData?.event;
    const eventOwnerFromError = accessErrorData?.owner;
    const isAccessError = !!accessErrorData;
    const accessStatusFromError = accessErrorData?.access_status
        ? { status: accessErrorData.access_status }
        : null;
    const requiresAuth = accessErrorData?.requires_auth || false;

    // Check event access status
    const { data: eventAccessData } = useGetEventAccessStatusQuery(eventId, {
        skip: !eventId || isOwner,
    });

    // Use layout effect to set mounted state immediately to avoid hydration issues
    useEffect(() => {
        // Schedule state update for next tick to avoid synchronous setState warning
        const timeoutId = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        // Only redirect if not authenticated AND not showing access error
        if (mounted && !isAuthenticated && !isAccessError) {
            router.push('/auth');
        }
    }, [mounted, isAuthenticated, router, isAccessError]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && photosData?.hasMore && !isFetchingPhotos) {
                    setPage((p) => p + 1);
                }
            },
            { threshold: 0.1, rootMargin: '400px' }
        );

        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [photosData?.hasMore, isFetchingPhotos]);

    const handleFindMe = () => {
        setShowCameraModal(true);
        // Start camera when modal opens
        setTimeout(() => {
            startCamera();
        }, 300);
    };

    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);

            try {
                addAlert({ type: 'info', message: 'Analyzing your selfie and searching through photos...' });
                const result = await searchPhotos({ eventId, formData }).unwrap();
                if (result.matches_found > 0) {
                    setMatchedPhotos(result.photos);
                    addAlert({ type: 'success', message: `Found ${result.matches_found} photos of you!` });

                    // Automatically save to collection
                    if (event) {
                        try {
                            const collectionPhotos = result.photos.map((photo: Photo) => ({
                                photo_id: photo.id,
                                photo_url: photo.url,
                                photo_filename: photo.filename,
                                similarity_score: photo.similarity || 0
                            }));

                            await createCollection({
                                event_id: eventId,
                                name: event.title,
                                photos: collectionPhotos
                            }).unwrap();

                            addAlert({ type: 'success', message: 'Photos saved to your collection!' });
                        } catch (collectionErr) {
                            console.error('Failed to save collection:', collectionErr);
                            // Don't show error to user, the search was successful
                        }
                    }
                } else {
                    setMatchedPhotos([]);
                    addAlert({ type: 'error', message: "We could not find any matches for you in this event." });
                }
            } catch (err: any) {
                console.error('Search error:', err);
                // Check if error is due to not having access to the event
                if (err?.status === 403 || err?.data?.detail?.message?.includes('No access')) {
                    setShowAccessPrompt(true);
                    addAlert({
                        type: 'error',
                        message: 'You need access to this event to search for photos. Request access below.'
                    });
                } else {
                    addAlert({ type: 'error', message: 'Error during face processing. Please try again.' });
                }
            }
        }
    };

    const handleRequestAccess = async () => {
        try {
            await requestEventAccess(eventId).unwrap();
            addAlert({ type: 'success', message: 'Access request sent! Waiting for event owner approval.' });
            setShowAccessPrompt(false);
        } catch (err) {
            console.error('Request access error:', err);
            addAlert({ type: 'error', message: 'Failed to send access request.' });
        }
    };

    const handleDownloadPhoto = async (photo: Photo) => {
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
        if (!matchedPhotos || matchedPhotos.length === 0) return;

        addAlert({ type: 'info', message: `Preparing ${matchedPhotos.length} photos...` });

        let downloaded = 0;
        let failed = 0;

        for (const photo of matchedPhotos) {
            try {
                const response = await fetch(photo.url);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = photo.filename || `photo-${photo.id}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                downloaded++;
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (err) {
                console.error(`Failed to download photo ${photo.id}:`, err);
                failed++;
            }
        }

        if (failed === 0) {
            addAlert({ type: 'success', message: `Downloaded ${downloaded} photos!` });
        } else {
            addAlert({ type: 'warning', message: `Downloaded ${downloaded}, ${failed} failed.` });
        }
    };

    const handleDeletePhoto = useCallback(async (photo: Photo) => {
        if (window.confirm('Are you sure you want to delete this photo?')) {
            try {
                await deletePhoto({ eventId, photoId: photo.id }).unwrap();
                addAlert({ type: 'success', message: 'Photo deleted' });
            } catch {
                addAlert({ type: 'error', message: 'Failed to delete photo' });
            }
        }
    }, [deletePhoto, eventId, addAlert]);

    if (!mounted) return null;

    if (eventsLoading || photosLoading) {
        return (
            <div className="min-h-screen bg-ivory flex flex-col">
                <Navigation />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-titanium animate-spin mb-6 opacity-20" />
                    <p className="text-titanium/40 font-bold uppercase tracking-widest text-xs">Opening Event...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-ivory flex flex-col">
                <Navigation />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-32">
                    {isAccessError ? (
                        <>
                            {/* Event Info Card */}
                            {eventFromError && (
                                <div className="mb-8 p-8 bg-white border border-titanium/10 rounded-2xl max-w-lg w-full shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Badge variant="secondary" className="bg-titanium/5 text-titanium">
                                            Private Event
                                        </Badge>
                                    </div>
                                    <h1 className="text-3xl font-black text-titanium mb-3 tracking-tight">
                                        {eventFromError.title}
                                    </h1>
                                    {eventFromError.description && (
                                        <p className="text-titanium/60 font-medium mb-4">
                                            {eventFromError.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-titanium/40">
                                        {eventFromError.event_date && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(eventFromError.event_date).toLocaleDateString()}
                                            </span>
                                        )}
                                        {eventFromError.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {eventFromError.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <h2 className="text-2xl font-black text-titanium mb-3 italic tracking-tight">Access Required</h2>
                            <p className="text-titanium/40 font-medium mb-8 max-w-md mx-auto">
                                You need to request access to view photos and use face search in this event.
                            </p>

                            {eventOwnerFromError && (
                                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl max-w-md">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black">
                                            {eventOwnerFromError.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-blue-900">{eventOwnerFromError.username}</p>
                                            <p className="text-sm text-blue-700">Event Owner</p>
                                        </div>
                                    </div>

                                    {accessStatusFromError?.status === 'pending' ? (
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                                                <span className="font-bold text-amber-700">Access Request Pending</span>
                                            </div>
                                            <p className="text-sm text-amber-600">
                                                Your request is waiting for approval. You will be able to view this event once approved.
                                            </p>
                                        </div>
                                    ) : requiresAuth ? (
                                        <div className="text-center">
                                            <p className="text-sm text-blue-600 mb-4">
                                                You need to log in or create an account to request access to this event.
                                            </p>
                                            <Button
                                                onClick={() => router.push('/auth')}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                <Lock className="w-4 h-4 mr-2" />
                                                Log In to Request Access
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={async () => {
                                                try {
                                                    await requestEventAccess(eventId).unwrap();
                                                    addAlert({ type: 'success', message: `Access request sent to event owner!` });
                                                    window.location.reload();
                                                } catch (err) {
                                                    addAlert({ type: 'error', message: 'Failed to send access request.' });
                                                }
                                            }}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Lock className="w-4 h-4 mr-2" />
                                            Request Access to Event
                                        </Button>
                                    )}
                                </div>
                            )}

                            <Button
                                onClick={() => router.push('/events')}
                                variant="outline"
                            >
                                Back to Events
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-titanium/5 rounded-xl flex items-center justify-center mb-8">
                                <ShieldCheck className="w-10 h-10 text-titanium opacity-10" />
                            </div>
                            <h1 className="text-4xl font-black text-titanium mb-4 italic tracking-tight">Event Not Found</h1>
                            <p className="text-titanium/40 font-medium mb-12 max-w-xs mx-auto">We could not find this event.</p>
                            <Button onClick={() => router.push('/events')}>Back to Events</Button>
                        </>
                    )}
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

                {/* Event Dashboard Hero */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-16">
                    <div className="lg:col-span-3">
                        <Card className="p-6 sm:p-10 bg-white/40 border-white/60 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-8">
                                    <Badge variant="secondary" className="bg-titanium/5 text-titanium">
                                        Live Event
                                    </Badge>
                                    <Badge variant="secondary" className="bg-titanium/5 text-titanium">
                                        Private
                                    </Badge>
                                    {event.owner_username === user?.username && (
                                        <Badge variant="default" className="bg-titanium text-ivory">
                                            Host
                                        </Badge>
                                    )}
                                    {isOwner && (
                                        <button
                                            onClick={() => {
                                                setEditForm({
                                                    title: event.title || '',
                                                    description: event.description || '',
                                                    event_date: event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : '',
                                                    location: event.location || '',
                                                    is_private: event.is_private !== false,
                                                });
                                                setShowEditModal(true);
                                            }}
                                            className="ml-auto p-2 rounded-full bg-titanium/5 hover:bg-titanium/10 text-titanium transition-colors"
                                            title="Event Settings"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-titanium mb-6 tracking-tighter leading-[0.9]">
                                    {event.title}
                                </h1>

                                <p className="text-xl text-titanium/60 mb-12 max-w-2xl font-medium leading-relaxed">
                                    {event.description || 'No description provided.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10 pt-10 border-t border-black/5">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-titanium/5 rounded-lg flex items-center justify-center mr-4 text-titanium">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold italic text-titanium/30 uppercase tracking-widest">When</p>
                                        <p className="text-sm font-bold text-titanium">
                                            {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBD'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-titanium/5 rounded-lg flex items-center justify-center mr-4 text-titanium">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold italic text-titanium/30 uppercase tracking-widest">Where</p>
                                        <p className="text-sm font-bold text-titanium truncate max-w-[120px]">
                                            {event.location || 'TBD'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-titanium/5 rounded-lg flex items-center justify-center mr-4 text-titanium">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold italic text-titanium/30 uppercase tracking-widest">Privacy</p>
                                        <p className="text-sm font-bold text-titanium">7 Days</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-titanium/5 rounded-lg flex items-center justify-center mr-4 text-titanium">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold italic text-titanium/30 uppercase tracking-widest">Faces</p>
                                        <p className="text-sm font-bold text-titanium">
                                            {detailsLoading ? '...' : (event.face_count !== undefined ? `${event.face_count}` : '0')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl h-full flex flex-col justify-center">
                            <h3 className="text-2xl font-black mb-3 tracking-tight text-white">Find Your Photos</h3>
                            <p className="text-slate-300 mb-6 text-sm font-medium leading-relaxed">
                                {isOwner
                                    ? "Upload photos or use a selfie to find yourself."
                                    : "Upload a selfie and our AI will find every photo of you."}
                            </p>
                            <div className="space-y-3">
                                {isOwner && (
                                    <Button
                                        onClick={() => router.push(`/upload/${eventId}`)}
                                        className="w-full bg-white text-slate-900 hover:bg-slate-100 py-5 h-auto font-semibold whitespace-nowrap"
                                    >
                                        <Upload className="w-5 h-5 mr-2 flex-shrink-0" />
                                        <span className="truncate">Add Photos</span>
                                    </Button>
                                )}
                                {isOwner && (
                                    <Button
                                        onClick={() => setShowShareModal(true)}
                                        variant="outline"
                                        className="w-full py-5 h-auto bg-transparent text-white border-white/30 hover:bg-white/10 font-semibold whitespace-nowrap"
                                    >
                                        <Link2 className="w-5 h-5 mr-2 flex-shrink-0" />
                                        <span className="truncate">Share Download Link</span>
                                    </Button>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleSearch}
                                    accept="image/*"
                                    className="hidden"
                                />
                                {/* Hidden file inputs - one for desktop, one for mobile camera */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleSearch}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Button
                                    onClick={handleFindMe}
                                    disabled={isSearching}
                                    variant="outline"
                                    className="w-full py-5 h-auto bg-transparent text-white border-white/30 hover:bg-white/10 font-semibold whitespace-nowrap"
                                >
                                    {isSearching ? (
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin flex-shrink-0" />
                                    ) : (
                                        <Search className="w-5 h-5 mr-2 flex-shrink-0" />
                                    )}
                                    <span className="truncate">{isSearching ? 'Scanning...' : 'Scan for My Photos'}</span>
                                </Button>

                                {/* Request Access button for non-owners */}
                                {!isOwner && (
                                    <Button
                                        onClick={handleRequestAccess}
                                        variant="outline"
                                        disabled={eventAccessData?.status === 'pending' || eventAccessData?.status === 'approved'}
                                        className={`w-full py-5 h-auto font-semibold whitespace-nowrap ${eventAccessData?.status === 'pending'
                                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 cursor-not-allowed'
                                            : eventAccessData?.status === 'approved' || eventAccessData?.has_access
                                                ? 'bg-green-500/20 border-green-500/50 text-green-300 cursor-not-allowed'
                                                : 'bg-blue-500/20 border-blue-500/50 text-blue-300 hover:bg-blue-500/30'
                                            }`}
                                    >
                                        {eventAccessData?.status === 'pending' ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin flex-shrink-0" />
                                                <span className="truncate">Access Request Pending</span>
                                            </>
                                        ) : eventAccessData?.status === 'approved' || eventAccessData?.has_access ? (
                                            <>
                                                <Unlock className="w-5 h-5 mr-2 flex-shrink-0" />
                                                <span className="truncate">Access Granted</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="w-5 h-5 mr-2 flex-shrink-0" />
                                                <span className="truncate">Request Event Access</span>
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Access Requests (Owner only) */}
                {isOwner && (() => {
                    const eventRequests = accessRequestsData?.requests?.filter(r => r.event_id === eventId) || [];
                    if (eventRequests.length === 0) return null;
                    return (
                        <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <Users className="w-4 h-4 text-amber-600" />
                                </div>
                                <h3 className="font-bold text-amber-900">Pending Access Requests</h3>
                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 ml-auto">
                                    {eventRequests.length}
                                </Badge>
                            </div>
                            <div className="space-y-3">
                                {eventRequests.map((req) => (
                                    <div key={req.id} className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold">
                                                {req.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-titanium">{req.username}</p>
                                                <p className="text-xs text-titanium/40">
                                                    {new Date(req.requested_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={async () => {
                                                    try {
                                                        await handleAccessRequest({ request_id: req.id, action: 'approve' }).unwrap();
                                                        addAlert({ type: 'success', message: `Approved access for ${req.username}` });
                                                        refetchAccessRequests();
                                                    } catch {
                                                        addAlert({ type: 'error', message: 'Failed to approve request' });
                                                    }
                                                }}
                                                className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                                            >
                                                <Check className="w-3.5 h-3.5 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={async () => {
                                                    try {
                                                        await handleAccessRequest({ request_id: req.id, action: 'reject' }).unwrap();
                                                        addAlert({ type: 'success', message: `Rejected access for ${req.username}` });
                                                        refetchAccessRequests();
                                                    } catch {
                                                        addAlert({ type: 'error', message: 'Failed to reject request' });
                                                    }
                                                }}
                                                className="text-red-500 border-red-200 hover:bg-red-50 h-8 px-3"
                                            >
                                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* Access Required Prompt */}
                {showAccessPrompt && !isOwner && !eventAccessData?.has_access && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                {eventAccessData?.status === 'pending' ? (
                                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                ) : (
                                    <Lock className="w-6 h-6 text-blue-600" />
                                )}
                            </div>
                            <div className="flex-1">
                                {eventAccessData?.status === 'pending' ? (
                                    <>
                                        <h3 className="text-lg font-bold text-blue-900 mb-2">
                                            Access Request Pending
                                        </h3>
                                        <p className="text-blue-700 mb-4">
                                            Your access request has been sent to the event owner. You'll be able to search for photos once they approve your request.
                                        </p>
                                        <Button
                                            disabled
                                            className="bg-blue-400 text-white cursor-not-allowed"
                                        >
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Waiting for Approval
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-bold text-blue-900 mb-2">
                                            Event Access Required
                                        </h3>
                                        <p className="text-blue-700 mb-4">
                                            To search for your photos in this event, you need to request access from the event owner. This helps maintain privacy and ensures only approved users can access photo matching.
                                        </p>
                                        <Button
                                            onClick={handleRequestAccess}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Lock className="w-4 h-4 mr-2" />
                                            Request Event Access
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Identity Search Results */}
                {matchedPhotos !== null && (
                    <div className="mb-20 border-y border-black/5 py-16">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <Badge variant="default" className="bg-titanium text-ivory mb-4">
                                    <Sparkles className="w-3 h-3 mr-2" />
                                    Found You!
                                </Badge>
                                <h2 className="text-4xl font-black text-titanium tracking-tighter">Your Photos</h2>
                                <p className="text-titanium/40 font-medium">{matchedPhotos.length} photos found</p>
                            </div>
                            <div className="flex gap-3">
                                {matchedPhotos.length > 0 && (
                                    <Button
                                        variant="default"
                                        onClick={handleDownloadAll}
                                        size="sm"
                                        className="bg-titanium text-ivory"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download All
                                    </Button>
                                )}
                                <Button variant="outline" onClick={() => setMatchedPhotos(null)} size="sm">
                                    Dismiss
                                </Button>
                            </div>
                        </div>

                        {matchedPhotos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                {matchedPhotos.map((photo: Photo) => {
                                    const similarity = photo.similarity || 0;
                                    const getBadgeColor = (s: number) => {
                                        if (s >= 0.75) return 'bg-green-600 text-white';
                                        if (s >= 0.68) return 'bg-green-500 text-white';
                                        if (s >= 0.65) return 'bg-green-400 text-black';
                                        return 'bg-yellow-500 text-black';
                                    };

                                    return (
                                        <div key={photo.id} className="aspect-square rounded-xl overflow-hidden glass border-white/60 p-1 group relative">
                                            <div className={`absolute top-2 right-2 z-10 ${getBadgeColor(similarity)} text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-lg`}>
                                                {Math.round(similarity * 100)}% Match
                                            </div>
                                            <button
                                                onClick={() => handleDownloadPhoto(photo)}
                                                className="absolute bottom-2 right-2 z-10 bg-titanium text-ivory p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <OptimizedImage
                                                src={photo.url}
                                                alt={photo.filename}
                                                className="rounded-lg"
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-black/5 rounded-xl p-16 text-center border-dashed border-2 border-black/5">
                                <p className="text-titanium/40 font-bold uppercase tracking-widest text-xs italic">No matches found.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Photos Matrix - Owner only */}
                {isOwner ? (
                    <div>
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-4xl font-black text-titanium tracking-tighter">Photos</h2>
                                <p className="text-titanium/40 font-medium">
                                    {photosData?.totalPhotos
                                        ? `${photos.length} out of ${photosData.totalPhotos} photos`
                                        : `${photos.length} photos`
                                    }
                                </p>
                            </div>
                        </div>

                        {photos.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {photos.map((photo: Photo, index: number) => (
                                        <PhotoGridItem
                                            key={photo.id}
                                            photo={photo}
                                            index={index}
                                            isOwner={isOwner}
                                            onSelect={setSelectedPhoto}
                                            onDelete={handleDeletePhoto}
                                        />
                                    ))}
                                </div>

                                {photosData?.hasMore && (
                                    <div ref={loadMoreRef} className="flex justify-center mt-10 py-6">
                                        {isFetchingPhotos && (
                                            <div className="flex items-center gap-3 text-titanium/40">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="text-xs font-bold uppercase tracking-widest">
                                                    Loading more...
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-40 text-center bg-white/40 rounded-xl border-dashed border-2 border-black/5">
                                <div className="w-20 h-20 bg-titanium/5 rounded-xl flex items-center justify-center mx-auto mb-8">
                                    <ImageIcon className="w-10 h-10 text-titanium opacity-10" />
                                </div>
                                <h3 className="text-2xl font-black text-titanium mb-4 italic tracking-tight">
                                    No Photos Yet
                                </h3>
                                <p className="text-titanium/40 font-medium mb-12 max-w-xs mx-auto">
                                    {isOwner
                                        ? "Upload photos to get started."
                                        : "Check back soon for photos!"}
                                </p>
                                {isOwner && (
                                    <Button variant="outline" className="px-10 h-14" onClick={() => router.push(`/upload/${eventId}`)}>
                                        Upload Photos
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-white/40 rounded-xl border border-black/5">
                        <div className="w-20 h-20 bg-titanium/5 rounded-xl flex items-center justify-center mx-auto mb-8">
                            <ImageIcon className="w-10 h-10 text-titanium opacity-10" />
                        </div>
                        <h3 className="text-2xl font-black text-titanium mb-4 italic tracking-tight">
                            {event.photo_count || 0} Photos in This Event
                        </h3>
                        <p className="text-titanium/40 font-medium max-w-md mx-auto">
                            Use the &quot;Find Your Photos&quot; feature above to search for photos of yourself. Only your matched photos will be shown to protect everyone&apos;s privacy.
                        </p>
                    </div>
                )}
            </main>

            {/* Photo Modal */}
            {selectedPhoto && (
                <PhotoModal
                    photo={selectedPhoto}
                    onClose={() => setSelectedPhoto(null)}
                    onDownload={handleDownloadPhoto}
                />
            )}

            {/* Edit Event Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Event Settings"
            >
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            await updateEvent({
                                eventId,
                                data: {
                                    title: editForm.title,
                                    description: editForm.description,
                                    event_date: editForm.event_date || undefined,
                                    location: editForm.location,
                                    is_private: editForm.is_private,
                                },
                            }).unwrap();
                            addAlert({ type: 'success', message: 'Event updated successfully' });
                            setShowEditModal(false);
                        } catch {
                            addAlert({ type: 'error', message: 'Failed to update event' });
                        }
                    }}
                    className="space-y-5"
                >
                    <div>
                        <label className="block text-xs font-bold text-titanium/50 uppercase tracking-widest mb-2">
                            Title
                        </label>
                        <Input
                            value={editForm.title}
                            onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Event title"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-titanium/50 uppercase tracking-widest mb-2">
                            Description
                        </label>
                        <Textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Event description (optional)"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-titanium/50 uppercase tracking-widest mb-2">
                                Date
                            </label>
                            <Input
                                type="date"
                                value={editForm.event_date}
                                onChange={(e) => setEditForm(prev => ({ ...prev, event_date: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-titanium/50 uppercase tracking-widest mb-2">
                                Location
                            </label>
                            <Input
                                value={editForm.location}
                                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Location"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-3 px-4 bg-titanium/5 rounded-2xl">
                        <div>
                            <p className="text-sm font-bold text-titanium">Private Event</p>
                            <p className="text-xs text-titanium/40">Only approved users can search photos</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, is_private: !prev.is_private }))}
                            className={`relative w-12 h-7 rounded-full transition-colors ${editForm.is_private ? 'bg-titanium' : 'bg-titanium/20'
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${editForm.is_private ? 'left-6' : 'left-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEditModal(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isUpdating || !editForm.title.trim()}
                            className="flex-1"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Share Link Modal */}
            <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="Share Download Link">
                <div className="space-y-6">
                    {/* Create New Link Form */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-titanium/40 block mb-2">Label (optional)</label>
                            <Input
                                placeholder="e.g. Wedding Photos for Sarah"
                                value={shareForm.label}
                                onChange={(e) => setShareForm(prev => ({ ...prev, label: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-titanium/40 block mb-2">Password (optional)</label>
                            <div className="relative">
                                <Input
                                    type={showSharePassword ? 'text' : 'password'}
                                    placeholder="Leave empty for no password"
                                    value={shareForm.password}
                                    onChange={(e) => setShareForm(prev => ({ ...prev, password: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSharePassword(!showSharePassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-titanium/30 hover:text-titanium transition-colors"
                                >
                                    {showSharePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-titanium/40 block mb-2">Expires In (optional)</label>
                            <select
                                value={shareForm.expires_in_days}
                                onChange={(e) => setShareForm(prev => ({ ...prev, expires_in_days: e.target.value }))}
                                className="w-full h-12 px-4 bg-titanium/5 border border-black/5 rounded-xl text-titanium font-medium focus:outline-none"
                            >
                                <option value="">Never expires</option>
                                <option value="1">1 day</option>
                                <option value="7">7 days</option>
                                <option value="30">30 days</option>
                                <option value="90">90 days</option>
                            </select>
                        </div>
                        <Button
                            onClick={async () => {
                                setIsCreatingLink(true);
                                try {
                                    await createShareLink({
                                        eventId,
                                        label: shareForm.label || undefined,
                                        password: shareForm.password || undefined,
                                        expires_in_days: shareForm.expires_in_days ? parseInt(shareForm.expires_in_days) : undefined,
                                    }).unwrap();
                                    addAlert({ type: 'success', message: 'Share link created!' });
                                    setShareForm({ label: '', password: '', expires_in_days: '' });
                                    refetchShareLinks();
                                } catch {
                                    addAlert({ type: 'error', message: 'Failed to create share link' });
                                } finally {
                                    setIsCreatingLink(false);
                                }
                            }}
                            disabled={isCreatingLink}
                            className="w-full"
                        >
                            {isCreatingLink ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                            ) : (
                                <><Link2 className="w-4 h-4 mr-2" /> Generate Share Link</>
                            )}
                        </Button>
                    </div>

                    {/* Existing Links */}
                    {shareLinksData?.links && shareLinksData.links.length > 0 && (
                        <div className="border-t border-black/5 pt-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-titanium/40 mb-4">Active Links</h4>
                            <div className="space-y-3">
                                {shareLinksData.links.map((link) => {
                                    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${link.token}`;
                                    return (
                                        <div key={link.id} className="p-4 bg-titanium/5 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-sm text-titanium truncate max-w-[200px]">
                                                    {link.label || 'Untitled Link'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {link.has_password && <Lock className="w-3 h-3 text-titanium/40" />}
                                                    <span className="text-[10px] text-titanium/40">{link.download_count} views</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    readOnly
                                                    value={shareUrl}
                                                    className="flex-1 text-xs bg-white/50 border border-black/5 rounded-lg px-3 py-2 text-titanium/60 truncate"
                                                />
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(shareUrl);
                                                        addAlert({ type: 'success', message: 'Link copied to clipboard!' });
                                                    }}
                                                    className="p-2 hover:bg-titanium/10 rounded-lg transition-colors"
                                                    title="Copy Link"
                                                >
                                                    <Copy className="w-4 h-4 text-titanium" />
                                                </button>
                                                <button
                                                    onClick={() => window.open(shareUrl, '_blank')}
                                                    className="p-2 hover:bg-titanium/10 rounded-lg transition-colors"
                                                    title="Open Link"
                                                >
                                                    <ExternalLink className="w-4 h-4 text-titanium" />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await deleteShareLink(link.id).unwrap();
                                                            addAlert({ type: 'success', message: 'Link revoked' });
                                                            refetchShareLinks();
                                                        } catch {
                                                            addAlert({ type: 'error', message: 'Failed to delete link' });
                                                        }
                                                    }}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Revoke Link"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                            {link.expires_at && (
                                                <p className="text-[10px] text-titanium/30 mt-2">
                                                    Expires {new Date(link.expires_at).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Face Recognition Camera Modal */}
            {showCameraModal && (
                <div className="fixed inset-0 z-50 bg-black">
                    {!capturedImage ? (
                        <>
                            {/* Header */}
                            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center p-6 pt-12">
                                <button
                                    onClick={handleCloseCamera}
                                    className="absolute left-6 top-12 w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <h2 className="text-white font-semibold text-lg">Face Recognition</h2>
                            </div>

                            {/* Video Preview */}
                            <div className="relative w-full h-full">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                    onLoadedMetadata={() => console.log('Video metadata loaded')}
                                    onCanPlay={() => console.log('Video can play')}
                                    onPlay={() => console.log('Video started playing')}
                                    onPause={() => console.log('Video paused')}
                                    onEnded={() => console.log('Video ended')}
                                />
                                
                                {/* Combined overlay and oval border - single SVG for perfect alignment */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <svg className="w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMin slice">
                                        <defs>
                                            <mask id="faceMask">
                                                <rect width="400" height="500" fill="white" />
                                                <ellipse cx="200" cy="175" rx="125" ry="150" fill="black" />
                                            </mask>
                                        </defs>
                                        {/* Dark overlay */}
                                        <rect width="400" height="500" fill="rgba(0,0,0,0.65)" mask="url(#faceMask)" />
                                        {/* Dashed oval border - same size as mask cutout */}
                                        <ellipse 
                                            cx="200" 
                                            cy="175" 
                                            rx="125" 
                                            ry="150" 
                                            fill="none" 
                                            stroke="white" 
                                            strokeWidth="2.5"
                                            strokeDasharray="8 4"
                                        />
                                    </svg>
                                </div>

                                {/* Loading state */}
                                {!cameraStream && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            <canvas ref={canvasRef} className="hidden" />

                            {/* Loading Models Indicator */}
                            {modelsLoading && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
                                    <div className="text-center">
                                        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                                        <p className="text-white font-semibold">Loading face detection...</p>
                                    </div>
                                </div>
                            )}

                            {/* Liveness Challenge Indicator */}
                            {livenessStep === 'challenge' && currentChallenge && (
                                <div className="absolute top-24 left-0 right-0 z-30 flex flex-col items-center gap-2">
                                    <div className="bg-titanium/90 text-white px-6 py-3 rounded-full font-semibold animate-pulse">
                                        {challenges.find(c => c.id === currentChallenge)?.text}
                                    </div>
                                    {livenessProgress.percent > 0 && (
                                        <div className="text-white/80 text-sm">
                                            {livenessProgress.status}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Analyzing indicator */}
                            {livenessStep === 'analyzing' && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
                                    <div className="text-center">
                                        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                                        <p className="text-white font-semibold">Analyzing liveness...</p>
                                        <p className="text-white/60 text-sm mt-2">{livenessProgress.percent}%</p>
                                    </div>
                                </div>
                            )}

                            {/* Failed indicator */}
                            {livenessStep === 'failed' && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
                                    <div className="text-center px-6">
                                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                        <p className="text-white font-semibold text-lg mb-2">Liveness Check Failed</p>
                                        <p className="text-white/60 text-sm mb-6">
                                            Could not verify you are a real person.
                                            Please ensure good lighting and try again.
                                        </p>
                                        <Button
                                            onClick={retakePhoto}
                                            className="bg-white text-black hover:bg-white/90"
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <canvas ref={canvasRef} className="hidden" />

                            {/* Bottom Controls */}
                            <div className="absolute bottom-0 left-0 right-0 z-20 pb-16 px-6">
                                <p className="text-white text-center text-sm mb-10 max-w-sm mx-auto leading-relaxed">
                                    Place your face in the oval, then<br />
                                    move your face left, right and smile
                                </p>

                                <div className="flex items-center justify-center relative">
                                    {/* Capture button */}
                                    <button
                                        onClick={capturePhoto}
                                        disabled={!cameraStream || livenessStep !== 'idle'}
                                        className="relative w-16 h-16 rounded-full bg-white disabled:opacity-50 active:scale-95 transition-transform border-2 border-white"
                                    >
                                        <div className="absolute inset-1 rounded-full border-2 border-black" />
                                    </button>

                                    {/* Flash button */}
                                    <button
                                        className="absolute right-8 text-white/60 hover:text-white transition-colors"
                                        onClick={() => {
                                            // Toggle flash if supported
                                            addAlert({ type: 'info', message: 'Flash toggle coming soon' });
                                        }}
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Review Header */}
                            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 pt-12">
                                <button
                                    onClick={retakePhoto}
                                    className="text-white font-medium hover:text-white/80 transition-colors"
                                >
                                    Retake
                                </button>
                                <h2 className="text-white font-semibold text-lg">Review Photo</h2>
                                <button
                                    onClick={handleCloseCamera}
                                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Captured Image */}
                            <div className="w-full h-full bg-black">
                                <img
                                    src={capturedImage}
                                    alt="Captured"
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Liveness Status */}
                            <div className="absolute top-24 left-0 right-0 z-20 flex justify-center">
                                {livenessResult?.isLive ? (
                                    <div className="bg-green-500/90 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2">
                                        <Check className="w-5 h-5" />
                                        Liveness verified ({Math.round(livenessResult.confidence)}%)
                                    </div>
                                ) : livenessResult && !livenessResult.isLive ? (
                                    <div className="bg-red-500/90 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2">
                                        <XCircle className="w-5 h-5" />
                                        Liveness failed
                                    </div>
                                ) : null}
                            </div>

                            {/* Liveness Details */}
                            {livenessResult && (
                                <div className="absolute top-36 left-0 right-0 z-20 flex justify-center">
                                    <div className="bg-black/50 backdrop-blur-md rounded-lg px-4 py-2 text-white/80 text-xs">
                                        Blinks: {livenessResult.details.blinkCount} | 
                                        Frames: {livenessResult.details.totalFrames} | 
                                        Face detected: {livenessResult.checks.faceDetected ? 'Yes' : 'No'}
                                    </div>
                                </div>
                            )}

                            {/* Bottom Action */}
                            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-12">
                                <Button
                                    onClick={submitPhoto}
                                    disabled={!livenessResult?.isLive}
                                    className="w-full h-14 bg-white text-black font-semibold rounded-full hover:bg-white/90 disabled:opacity-50"
                                >
                                    <Search className="w-5 h-5 mr-2" />
                                    Find My Photos
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventDetailPage;
