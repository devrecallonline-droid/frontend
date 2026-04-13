'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useUI } from '@/hooks/use-api';
import { useGetEventsQuery, useGetEventPhotosQuery, useGetEventDetailsQuery, useSearchPhotosMutation, useDeletePhotoMutation, useDeletePhotosBulkMutation, useCreateCollectionMutation, useRequestEventAccessMutation, useGetEventAccessStatusQuery, useUpdateEventMutation, useUploadEventCoverMutation, useGetEventAccessRequestsQuery, useHandleEventAccessRequestMutation, useCreateShareLinkMutation, useGetShareLinksQuery, useDeleteShareLinkMutation, type Photo, type Event } from '@/lib/api';
import { canUseCustomLayout } from '@/lib/featureFlags';
import { PaidEventLayout } from '@/components/PaidEventLayout';
import Navigation from '@/components/Navigation';
import { OptimizedImage, useProgressiveImage } from '@/components/OptimizedImage';
// Face detection models no longer loaded on the frontend (liveness disabled in favor of guided 3-pose capture)

import { Button, Card, Badge, Input, Textarea, Modal } from '@/components/ui';
import { EventQrCode } from '@/components/EventQrCode';
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
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // Preserve original resolution of the crop - no downscaling
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            resolve(blob);
        }, 'image/jpeg', 0.98);
    });
};

// Memoized photo grid item - prevents re-renders and keeps image loaded
const PhotoGridItem = React.memo(({
    photo,
    index,
    isOwner,
    isSelectionMode,
    isSelected,
    onSelect,
    onToggleSelect,
    onDelete
}: {
    photo: Photo;
    index: number;
    isOwner: boolean;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onSelect: (photo: Photo) => void;
    onToggleSelect?: (photo: Photo) => void;
    onDelete: (photo: Photo) => void;
}) => {
    return (
        <div
            onClick={() => isSelectionMode && onToggleSelect ? onToggleSelect(photo) : onSelect(photo)}
            className="relative w-full overflow-hidden cursor-pointer group rounded-lg"
        >
            <OptimizedImage
                src={photo.url}
                alt={photo.filename}
                className="rounded-lg object-contain w-full"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={index < 6}
            />
            {isSelectionMode && (
                <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-black/20 border-white shadow-sm'}`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
            )}
            {isSelectionMode && isSelected && (
                <div className="absolute inset-0 bg-indigo-600/20 z-0 pointer-events-none rounded-lg" />
            )}
            {!isSelectionMode && isOwner && (
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

    // Check event access status early so photos query knows if it can run
    const { data: eventAccessData } = useGetEventAccessStatusQuery(eventId, {
        skip: !eventId || isOwner,
    });

    const canViewPhotos = Boolean(isOwner || eventAccessData?.status === 'approved' || eventAccessData?.has_access);

    const { data: photosData, isLoading: photosLoading, isFetching: isFetchingPhotos } = useGetEventPhotosQuery(
        { eventId, page, limit: 12 },
        { skip: !eventId || !canViewPhotos }
    );
    const [searchPhotos, { isLoading: isSearching }] = useSearchPhotosMutation();
    const [deletePhoto] = useDeletePhotoMutation();
    const [deletePhotosBulk] = useDeletePhotosBulkMutation();
    const [createCollection] = useCreateCollectionMutation();
    const [requestEventAccess] = useRequestEventAccessMutation();
    const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
    const [uploadEventCover, { isLoading: isUploadingCover }] = useUploadEventCoverMutation();
    const { data: accessRequestsData, refetch: refetchAccessRequests } = useGetEventAccessRequestsQuery(undefined, {
        skip: !isAuthenticated,
    });
    const [handleAccessRequest] = useHandleEventAccessRequestMutation();
    const [mounted, setMounted] = useState(false);
    const [matchedPhotos, setMatchedPhotos] = useState<Photo[] | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
    const [showAccessPrompt, setShowAccessPrompt] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', description: '', event_date: '', location: '', is_private: true, has_paid_features: false });
    const [editCoverImage, setEditCoverImage] = useState<File | null>(null);
    const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit cover cropping state
    const [isEditCropping, setIsEditCropping] = useState(false);
    const [editCrop, setEditCrop] = useState({ x: 0, y: 0 });
    const [editZoom, setEditZoom] = useState(1);
    const [editCroppedAreaPixels, setEditCroppedAreaPixels] = useState<any>(null);
    const [originalCoverUrl, setOriginalCoverUrl] = useState<string | null>(null);
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
    // 3-step guided selfie capture (front → left → right)
    type CaptureStep = 'front' | 'left' | 'right' | 'review';
    const [captureStep, setCaptureStep] = useState<CaptureStep>('front');
    const [capturedPhotos, setCapturedPhotos] = useState<{ front: string | null; left: string | null; right: string | null }>({
        front: null, left: null, right: null
    });
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Image Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
    const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

    // Description State
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
    const descriptionRef = useRef<HTMLParagraphElement>(null);
    const [editHasPaidFeatures] = useState(false);

    // Preview Mode State - allows owners to see how guests view their event
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        const checkTruncation = () => {
            if (descriptionRef.current && !isDescriptionExpanded) {
                const { scrollHeight, clientHeight } = descriptionRef.current;
                setIsDescriptionTruncated(scrollHeight > clientHeight);
            }
        };

        const timeoutId = setTimeout(checkTruncation, 10);
        window.addEventListener('resize', checkTruncation);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', checkTruncation);
        };
    }, [event?.description, isDescriptionExpanded]);

    // Step labels and instructions for the 3-pose capture
    const STEP_META: Record<'front' | 'left' | 'right', { label: string; instruction: string; icon: string; stepNum: number }> = {
        front: { label: 'Front View', instruction: 'Look straight at the camera', icon: '😊', stepNum: 1 },
        left: { label: 'Left View', instruction: 'Turn your head slightly to the right', icon: '👉', stepNum: 2 },
        right: { label: 'Right View', instruction: 'Turn your head slightly to the left', icon: '👈', stepNum: 3 },
    };

    // Start camera stream
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
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

    // Capture the current camera frame for the current step
    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;

        if (video.paused) {
            try { await video.play(); } catch { return; }
        }

        await new Promise(resolve => requestAnimationFrame(resolve));

        // Draw full frame to a temp canvas, then crop to face area
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

        const cropW = tempCanvas.width * 0.625;
        const cropH = tempCanvas.height * 0.60;
        const cropX = (tempCanvas.width - cropW) / 2;
        const cropY = tempCanvas.height * 0.05;

        const cropCanvas = canvasRef.current;
        const cropCtx = cropCanvas.getContext('2d');
        if (!cropCtx) return;

        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        cropCtx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        const dataUrl = cropCanvas.toDataURL('image/jpeg', 0.9);

        // Save to the correct step slot and advance
        if (captureStep === 'front') {
            setCapturedPhotos(prev => ({ ...prev, front: dataUrl }));
            setCaptureStep('left');
        } else if (captureStep === 'left') {
            setCapturedPhotos(prev => ({ ...prev, left: dataUrl }));
            setCaptureStep('right');
        } else if (captureStep === 'right') {
            setCapturedPhotos(prev => ({ ...prev, right: dataUrl }));
            stopCamera();
            setCaptureStep('review');
        }
    };

    // Restart from a specific step
    const retakeStep = (step: 'front' | 'left' | 'right') => {
        setCapturedPhotos(prev => ({ ...prev, [step]: null }));
        setCaptureStep(step);
        startCamera();
    };

    // Restart everything from scratch
    const retakeAll = () => {
        setCapturedPhotos({ front: null, left: null, right: null });
        setCaptureStep('front');
        startCamera();
    };

    // Submit all 3 captured photos for multi-probe face search
    const submitPhotos = async () => {
        const { front, left, right } = capturedPhotos;
        if (!front || !left || !right) {
            addAlert({ type: 'error', message: 'Please capture all 3 poses before searching.' });
            return;
        }

        try {
            // Convert each base64 image to a File
            const toFile = async (dataUrl: string, name: string) => {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                return new File([blob], name, { type: 'image/jpeg' });
            };

            const [frontFile, leftFile, rightFile] = await Promise.all([
                toFile(front, 'selfie_front.jpg'),
                toFile(left, 'selfie_left.jpg'),
                toFile(right, 'selfie_right.jpg'),
            ]);

            // Append all 3 under the 'files' key to match multer.array('files', 3)
            const formData = new FormData();
            formData.append('files', frontFile);
            formData.append('files', leftFile);
            formData.append('files', rightFile);

            stopCamera();
            setShowCameraModal(false);
            addAlert({ type: 'info', message: 'Scanning 3 angles — searching through photos...' });

            const result = await searchPhotos({ eventId, formData }).unwrap();

            if (result.matches_found > 0) {
                setMatchedPhotos(result.photos);
                addAlert({ type: 'success', message: `Found ${result.matches_found} photos of you!` });

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
                    }
                }
            } else {
                setMatchedPhotos([]);
                addAlert({ type: 'error', message: 'We could not find any matches for you in this event.' });
            }

            // Reset state
            setCapturedPhotos({ front: null, left: null, right: null });
            setCaptureStep('front');
        } catch (err: unknown) {
            console.error('Search error:', err);
            addAlert({ type: 'error', message: 'Error during face processing. Please try again.' });
        }
    };

    // Handle modal close — reset all capture state
    const handleCloseCamera = () => {
        stopCamera();
        setCapturedPhotos({ front: null, left: null, right: null });
        setCaptureStep('front');
        setShowCameraModal(false);
    };

    // Ensure camera is killed when the component unmounts or modal is hidden
    useEffect(() => {
        if (!showCameraModal && cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showCameraModal]);

    // Virtual scroll removed - render all photos directly to prevent DOM remount stutter
    const photos = photosData?.photos || [];

    // Check if we should use the paid custom layout
    const usePaidLayout = canUseCustomLayout(event?.has_paid_features || false);

    // Extract event info from access error (403 response)
    type ApiErrorDetail = { event?: { title?: string; description?: string; event_type?: string; event_date?: string; location?: string; cover_image_url?: string }; owner?: { username?: string }; access_status?: string; requires_auth?: boolean };
    type ApiError = { status?: number; data?: { detail?: ApiErrorDetail } };
    const typedEventError = eventError as ApiError | undefined;
    const accessErrorData = typedEventError?.status === 403
        ? typedEventError?.data?.detail
        : null;
    const eventFromError = accessErrorData?.event;
    const eventOwnerFromError = accessErrorData?.owner;
    const isAccessError = !!accessErrorData;
    const accessStatusFromError = accessErrorData?.access_status
        ? { status: accessErrorData.access_status }
        : null;
    const requiresAuth = accessErrorData?.requires_auth || false;

    // Event access status check moved up

    // Use layout effect to set mounted state immediately to avoid hydration issues
    useEffect(() => {
        // Schedule state update for next tick to avoid synchronous setState warning
        const timeoutId = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        // Only redirect if not authenticated AND not showing access error AND details have finished loading
        if (mounted && !isAuthenticated && !isAccessError && !detailsLoading) {
            router.push('/auth');
        }
    }, [mounted, isAuthenticated, router, isAccessError, detailsLoading]);

    // Removed Infinite scroll observer

    const handleFindMe = () => {
        setCapturedPhotos({ front: null, left: null, right: null });
        setCaptureStep('front');
        setShowCameraModal(true);
        setTimeout(() => startCamera(), 300);
    };

    // Legacy file-input search (kept for fallback, sends single file)
    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('files', file); // Backend now expects 'files'

            try {
                addAlert({ type: 'info', message: 'Searching through photos...' });
                const result = await searchPhotos({ eventId, formData }).unwrap();
                if (result.matches_found > 0) {
                    setMatchedPhotos(result.photos);
                    addAlert({ type: 'success', message: `Found ${result.matches_found} photos of you!` });
                } else {
                    setMatchedPhotos([]);
                    addAlert({ type: 'error', message: 'We could not find any matches for you in this event.' });
                }
            } catch (err: unknown) {
                console.error('Search error:', err);
                const apiErr = err as { status?: number; data?: { detail?: { message?: string } } };
                if (apiErr?.status === 403 || apiErr?.data?.detail?.message?.includes('No access')) {
                    setShowAccessPrompt(true);
                    addAlert({ type: 'error', message: 'You need access to this event to search for photos.' });
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

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedPhotos(new Set());
    };

    const togglePhotoSelection = useCallback((photo: Photo) => {
        setSelectedPhotos(prev => {
            const next = new Set(prev);
            if (next.has(photo.id)) {
                next.delete(photo.id);
            } else {
                next.add(photo.id);
            }
            return next;
        });
    }, []);

    const handleSelectAll = () => {
        if (photosData?.photos) {
            setSelectedPhotos(new Set(photosData.photos.map((p: Photo) => p.id)));
        }
    };

    const handleDeleteSelectedPhotos = async () => {
        if (selectedPhotos.size === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedPhotos.size} photo(s)?`)) {
            setIsDeletingMultiple(true);

            try {
                const response = await deletePhotosBulk({ eventId, photoIds: Array.from(selectedPhotos) }).unwrap();
                addAlert({ type: 'success', message: `Successfully deleted ${response.deleted_count} photo(s)` });
            } catch (error) {
                console.error('Bulk delete error:', error);
                addAlert({ type: 'error', message: 'Failed to delete selected photos. Please try again.' });
            }

            setSelectedPhotos(new Set());
            setIsSelectionMode(false);
            setIsDeletingMultiple(false);
        }
    };

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
        // If we have an access error but the feature is free, show the premium layout with limited event data
        if (isAccessError && eventFromError && usePaidLayout) {
            const limitedEvent: Event = {
                id: eventId,
                title: eventFromError.title ?? '',
                description: eventFromError.description,
                event_type: eventFromError.event_type,
                event_date: eventFromError.event_date,
                location: eventFromError.location,
                owner_id: '',
                cover_image_url: eventFromError.cover_image_url,
                has_paid_features: true, // Force true since we're showing the premium layout
                owner_username: eventOwnerFromError?.username,
            };

            return (
                <>
                    {/* Access Banner - shows for all users without access */}
                    <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
                        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                                    {eventOwnerFromError?.username?.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="text-xs font-medium opacity-90">Exclusive Invitation</p>
                                    <p className="text-sm font-bold">
                                        {eventOwnerFromError?.username} invites you to <span className="italic">{eventFromError.title}</span>
                                    </p>
                                </div>
                            </div>
                            {isAuthenticated ? (
                                <Button
                                    onClick={handleRequestAccess}
                                    className="bg-white text-indigo-600 hover:bg-white/90 px-6 py-2 h-auto text-sm font-bold rounded-full whitespace-nowrap"
                                >
                                    Request Access
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => router.push(`/auth?returnUrl=/events/${eventId}`)}
                                    className="bg-white text-indigo-600 hover:bg-white/90 px-6 py-2 h-auto text-sm font-bold rounded-full whitespace-nowrap"
                                >
                                    Accept Invitation
                                </Button>
                            )}
                        </div>
                    </div>

                    <PaidEventLayout
                        event={limitedEvent}
                        isOwner={false}
                        isAuthenticated={isAuthenticated}
                        accessStatus='none'
                        photos={[]} // No photos for guests without access
                        onSearch={() => {
                            if (!isAuthenticated) {
                                router.push(`/auth?returnUrl=/events/${eventId}`);
                            }
                        }}
                        onUpload={() => router.push('/auth')}
                        onPhotoClick={() => { }}
                        onRequestAccess={handleRequestAccess}
                        onLogin={() => router.push(`/auth?returnUrl=/events/${eventId}`)}
                    />
                </>
            );
        }

        return (
            <div className="min-h-screen bg-ivory flex flex-col">
                <Navigation />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-32">
                    {isAccessError ? (
                        <>
                            {/* Premium E-Ticket Invitation */}
                            {eventFromError && eventOwnerFromError && (
                                <div className="mb-12 w-full max-w-sm mx-auto animate-in fade-in zoom-in duration-700">
                                    <div className="relative bg-white shadow-2xl rounded-[2rem] overflow-hidden flex flex-col border border-titanium/5">

                                        {/* Ticket Top Section: Event Info */}
                                        <div className="p-8 pb-6 flex flex-col items-center text-center">
                                            <div className="w-14 h-14 bg-titanium text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg mb-4 ring-4 ring-titanium/5">
                                                {eventOwnerFromError.username?.charAt(0).toUpperCase()}
                                            </div>

                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-titanium/40 mb-1">
                                                Exclusive Invitation
                                            </p>

                                            <h2 className="text-sm font-bold text-titanium mb-4">
                                                {eventOwnerFromError.username} <span className="font-medium text-titanium/40">invites you to the private vault of</span>
                                            </h2>

                                            <h1 className="text-2xl font-black text-titanium mb-2 tracking-tight leading-none uppercase italic">
                                                {eventFromError.title}
                                            </h1>

                                            {eventFromError.description && (
                                                <p className="text-titanium/50 font-medium text-xs line-clamp-2 px-4">
                                                    {eventFromError.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Perforation Divider */}
                                        <div className="relative flex items-center px-4">
                                            {/* Left Hole */}
                                            <div className="absolute left-[-12px] w-6 h-6 bg-ivory rounded-full border border-titanium/5 shadow-inner"></div>
                                            {/* Dashed Line */}
                                            <div className="flex-1 border-t-2 border-dashed border-titanium/10 mx-2"></div>
                                            {/* Right Hole */}
                                            <div className="absolute right-[-12px] w-6 h-6 bg-ivory rounded-full border border-titanium/5 shadow-inner"></div>
                                        </div>

                                        {/* Ticket Bottom Section: Details & Action */}
                                        <div className="p-8 pt-6 bg-gray-50/50 flex flex-col items-center">
                                            <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                                <div className="flex flex-col items-start gap-1 p-3 bg-white rounded-xl border border-titanium/5">
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-titanium/30">Date</span>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-titanium">
                                                        <Calendar className="w-3 h-3 text-indigo-500" />
                                                        {eventFromError.event_date ? new Date(eventFromError.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-start gap-1 p-3 bg-white rounded-xl border border-titanium/5">
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-titanium/30">Location</span>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-titanium truncate w-full">
                                                        <MapPin className="w-3 h-3 text-indigo-500" />
                                                        <span className="truncate">{eventFromError.location || 'TBA'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full flex flex-col gap-5">
                                                <p className="text-sm text-center text-titanium/70 font-medium leading-relaxed px-4">
                                                    Unlock the Vault to explore high-resolution photos, share your own moments, and instantly find every picture you’re in—without the endless scrolling
                                                </p>

                                                {accessStatusFromError?.status === 'pending' ? (
                                                    <div className="w-full bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col items-center gap-2">
                                                        <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                                                        <span className="text-xs font-bold text-amber-900 uppercase tracking-widest">Entry Pending</span>
                                                    </div>
                                                ) : requiresAuth ? (
                                                    <Button
                                                        onClick={() => router.push(`/auth?returnUrl=/events/${eventId}`)}
                                                        className="w-full h-14 bg-titanium hover:bg-black text-white rounded-2xl shadow-xl shadow-titanium/20 transition-all font-black uppercase tracking-widest text-xs"
                                                    >
                                                        Admit One
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={async () => {
                                                            try {
                                                                await requestEventAccess(eventId).unwrap();
                                                                addAlert({ type: 'success', message: `Vault entry requested!` });
                                                                window.location.reload();
                                                            } catch {
                                                                addAlert({ type: 'error', message: 'Failed to request entry.' });
                                                            }
                                                        }}
                                                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 transition-all font-black uppercase tracking-widest text-xs"
                                                    >
                                                        Claim Ticket
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Decorative Footer */}
                                            <div className="mt-8 flex flex-col items-center gap-2 opacity-20">
                                                <div className="flex gap-0.5">
                                                    {[...Array(12)].map((_, i) => (
                                                        <div key={i} className={`w-1 h-3 bg-titanium ${i % 3 === 0 ? 'h-4' : ''}`}></div>
                                                    ))}
                                                </div>
                                                <span className="text-[8px] font-mono font-bold">{eventId.slice(0, 8).toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>
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

    // Preview Mode for Owners - allows them to see the guest view
    if (showPreview && event && isOwner) {
        return (
            <>
                {/* Exit Preview Button */}
                <div className="fixed top-4 right-4 z-[60]">
                    <button
                        onClick={() => setShowPreview(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-titanium text-white rounded-full shadow-lg hover:bg-titanium/90 transition-colors text-sm font-medium"
                    >
                        <X className="w-4 h-4" />
                        Exit Preview
                    </button>
                </div>

                <PaidEventLayout
                    event={event}
                    isOwner={false}  // Show as guest view
                    isAuthenticated={isAuthenticated}
                    accessStatus='approved'
                    photos={photos}
                    page={page}
                    totalPages={photosData?.totalPhotos ? Math.ceil(photosData.totalPhotos / 12) : 1}
                    hasNextPage={photosData?.hasMore}
                    isFetchingPhotos={isFetchingPhotos}
                    onPageChange={setPage}
                    onSearch={handleFindMe}
                    onUpload={() => router.push(`/upload/${eventId}`)}
                    onPhotoClick={setSelectedPhoto}
                />

                {/* Photo Modal for Paid Layout */}
                {selectedPhoto && (
                    <PhotoModal
                        photo={selectedPhoto}
                        onClose={() => setSelectedPhoto(null)}
                        onDownload={handleDownloadPhoto}
                    />
                )}
            </>
        );
    }

    // Render the appropriate layout based on paid status
    // Premium layout is for GUESTS only - owners always see the dashboard
    if (usePaidLayout && event && !isOwner) {
        return (
            <>
                <PaidEventLayout
                    event={event}
                    isOwner={isOwner}
                    isAuthenticated={isAuthenticated}
                    accessStatus={(eventAccessData?.status as 'approved' | 'none' | 'pending' | undefined) || 'none'}
                    photos={photos}
                    page={page}
                    totalPages={photosData?.totalPhotos ? Math.ceil(photosData.totalPhotos / 12) : 1}
                    hasNextPage={photosData?.hasMore}
                    isFetchingPhotos={isFetchingPhotos}
                    onPageChange={setPage}
                    onSearch={handleFindMe}
                    onUpload={() => router.push(`/upload/${eventId}`)}
                    onPhotoClick={setSelectedPhoto}
                />

                {/* Photo Modal for Paid Layout */}
                {selectedPhoto && (
                    <PhotoModal
                        photo={selectedPhoto}
                        onClose={() => setSelectedPhoto(null)}
                        onDownload={handleDownloadPhoto}
                    />
                )}
            </>
        );
    }

    return (
        <div className="min-h-screen bg-ivory flex flex-col">
            <Navigation />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
                {/* Header/Breadcrumb */}
                <button
                    onClick={() => router.push('/events')}
                    className="flex mt-10 items-center text-titanium/40 hover:text-titanium transition-colors mb-8 sm:mb-12 group text-[10px] font-bold uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Events
                </button>

                {/* Event Dashboard Hero */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-16">
                    <div className="lg:col-span-3">
                        <Card className="p-4 sm:p-8 lg:p-10 bg-white/40 border-white/60 h-full flex flex-col justify-between">
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
                                                    has_paid_features: event.has_paid_features || false,
                                                });
                                                setEditCoverImage(null);
                                                setEditPreviewUrl(event.cover_image_url || null);
                                                setOriginalCoverUrl(event.cover_image_url || null);
                                                setIsEditCropping(false);
                                                setEditCrop({ x: 0, y: 0 });
                                                setEditZoom(1);
                                                setShowEditModal(true);
                                            }}
                                            className="ml-auto p-2 rounded-full bg-titanium/5 hover:bg-titanium/10 text-titanium transition-colors"
                                            title="Event Settings"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    )}
                                    {isOwner && (
                                        <button
                                            onClick={() => setShowPreview(true)}
                                            className="p-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-700 transition-colors border border-amber-200"
                                            title="Preview Guest View"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-titanium tracking-tighter leading-[0.9]">
                                        {event.title}
                                    </h1>

                                    <EventQrCode 
                                        url={`https://nenge.ng/events/${event.id}`} 
                                        eventName={event.title}
                                        lightMode={true} 
                                    />
                                </div>

                                <div>
                                    <p
                                        ref={descriptionRef}
                                        className={`text-xl text-titanium/60 max-w-2xl font-medium leading-relaxed transition-all duration-300 ${isDescriptionExpanded ? 'mb-4' : 'line-clamp-3 md:line-clamp-4 mb-2'}`}
                                    >
                                        {event.description || 'No description provided.'}
                                    </p>
                                    {(isDescriptionTruncated || isDescriptionExpanded) && event.description && (
                                        <button
                                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                            className="text-sm font-bold text-titanium/70 hover:text-titanium transition-colors mb-12 flex items-center gap-1"
                                        >
                                            {isDescriptionExpanded ? 'Read less' : 'Read more'}
                                        </button>
                                    )}
                                    {(!event.description || (!isDescriptionTruncated && !isDescriptionExpanded)) && (
                                        <div className="mb-12"></div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-10 pt-8 sm:pt-10 border-t border-black/5">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-titanium/5 rounded-lg flex items-center justify-center mr-3 sm:mr-4 text-titanium flex-shrink-0">
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
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-titanium/5 rounded-lg flex items-center justify-center mr-3 sm:mr-4 text-titanium flex-shrink-0">
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
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-titanium/5 rounded-lg flex items-center justify-center mr-3 sm:mr-4 text-titanium flex-shrink-0">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold italic text-titanium/30 uppercase tracking-widest">Privacy</p>
                                        <p className="text-sm font-bold text-titanium">7 Days</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-titanium/5 rounded-lg flex items-center justify-center mr-3 sm:mr-4 text-titanium flex-shrink-0">
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
                        <div className="rounded-3xl p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl h-full flex flex-col justify-center">
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
                                            Your access request has been sent to the event owner. You&apos;ll be able to search for photos once they approve your request.
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
                    <div className="mb-20 border-y border-black/5 py-10 sm:py-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                            <div>
                                <Badge variant="default" className="bg-titanium text-ivory mb-4">
                                    <Sparkles className="w-3 h-3 mr-2" />
                                    Found You!
                                </Badge>
                                <h2 className="text-3xl md:text-4xl font-black text-titanium tracking-tight mb-1">Your Photos</h2>
                                <p className="text-xs text-titanium/40 font-bold uppercase tracking-widest">{matchedPhotos.length} matches found</p>
                            </div>
                            <div className="flex flex-row flex-wrap gap-3 w-full md:w-auto">
                                {matchedPhotos.length > 0 && (
                                    <Button
                                        variant="default"
                                        onClick={handleDownloadAll}
                                        className="flex-1 md:flex-none bg-titanium text-ivory h-12 px-6 rounded-apple-md shadow-premium font-bold tracking-tight"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Save All
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => setMatchedPhotos(null)}
                                    className="flex-1 md:flex-none h-12 px-6 rounded-apple-md border-black/5 text-titanium/60 hover:bg-black/5 hover:text-titanium font-bold tracking-tight"
                                >
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
                            <div>
                                <h2 className="text-4xl font-black text-titanium tracking-tighter">Photos</h2>
                                <p className="text-titanium/40 font-medium">
                                    {photosData?.totalPhotos
                                        ? `${photos.length} out of ${photosData.totalPhotos} photos`
                                        : `${photos.length} photos`
                                    }
                                </p>
                            </div>
                            {photos.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {isSelectionMode ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={toggleSelectionMode}
                                                className="whitespace-nowrap"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSelectAll}
                                                className="whitespace-nowrap"
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={handleDeleteSelectedPhotos}
                                                disabled={selectedPhotos.size === 0 || isDeletingMultiple}
                                                className="bg-red-600 hover:bg-red-700 text-white border-0 whitespace-nowrap"
                                            >
                                                {isDeletingMultiple ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                )}
                                                Delete Selected ({selectedPhotos.size})
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={toggleSelectionMode}
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Select
                                        </Button>
                                    )}
                                </div>
                            )}
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
                                            isSelectionMode={isSelectionMode}
                                            isSelected={selectedPhotos.has(photo.id)}
                                            onSelect={setSelectedPhoto}
                                            onToggleSelect={togglePhotoSelection}
                                            onDelete={handleDeletePhoto}
                                        />
                                    ))}
                                </div>

                                {(photosData?.hasMore || page > 1) && (
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-10 py-6 border-t border-black/5 px-2">
                                        <Button
                                            variant="outline"
                                            disabled={page === 1 || isFetchingPhotos}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className="w-full sm:w-auto px-4 sm:px-6 border-black/5 text-sm"
                                        >
                                            <span className="sm:hidden">Prev</span>
                                            <span className="hidden sm:inline">Previous Page</span>
                                        </Button>
                                        <span className="text-xs sm:text-sm font-bold text-titanium/60 order-first sm:order-none">
                                            Page {page} {photosData?.totalPhotos ? `of ${Math.ceil(photosData.totalPhotos / 12)}` : ''}
                                        </span>
                                        <Button
                                            variant="outline"
                                            disabled={!photosData?.hasMore || isFetchingPhotos}
                                            onClick={() => setPage(p => p + 1)}
                                            className="w-full sm:w-auto px-4 sm:px-6 border-black/5 text-sm"
                                        >
                                            {isFetchingPhotos ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
                                            ) : (
                                                <><span className="sm:hidden">Next</span><span className="hidden sm:inline">Next Page</span></>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-24 sm:py-32 md:py-40 text-center bg-white/40 rounded-xl border-dashed border-2 border-black/5">
                                <div className="px-6 sm:px-12">
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
                                </div>
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
                onClose={() => {
                    setShowEditModal(false);
                    setIsEditCropping(false);
                    setEditCrop({ x: 0, y: 0 });
                    setEditZoom(1);
                }}
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
                                    has_paid_features: editForm.has_paid_features,
                                },
                            }).unwrap();
                            if (editCoverImage) {
                                try {
                                    await uploadEventCover({ eventId, file: editCoverImage }).unwrap();
                                } catch (imgErr) {
                                    console.error("Failed to upload cover", imgErr);
                                }
                            }
                            addAlert({ type: 'success', message: 'Event updated successfully' });
                            setShowEditModal(false);
                        } catch {
                            addAlert({ type: 'error', message: 'Failed to update event' });
                        }
                    }}
                    className="space-y-5"
                >
                    <div className="mb-6 relative">
                        <div
                            className="relative w-full aspect-video rounded-2xl overflow-hidden group bg-titanium/[0.02] border-2 border-dashed border-titanium/10 hover:border-titanium/30 transition-all flex flex-col items-center justify-center animate-in zoom-in-95 duration-500"
                            onClick={() => !isEditCropping && !editPreviewUrl && editFileInputRef.current?.click()}
                        >
                            {isEditCropping && editPreviewUrl ? (
                                <>
                                    <div className="absolute inset-0 cursor-move">
                                        <Cropper
                                            image={editPreviewUrl}
                                            crop={editCrop}
                                            zoom={editZoom}
                                            aspect={16 / 9}
                                            minZoom={0.3}
                                            maxZoom={3}
                                            onCropChange={setEditCrop}
                                            onCropComplete={(_, areaPixels) => setEditCroppedAreaPixels(areaPixels)}
                                            onZoomChange={setEditZoom}
                                            showGrid={false}
                                            style={{
                                                containerStyle: { borderRadius: '16px' }
                                            }}
                                        />
                                    </div>
                                    <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-2">
                                        <input
                                            type="range"
                                            min={0.3}
                                            max={3}
                                            step={0.1}
                                            value={editZoom}
                                            onChange={(e) => setEditZoom(Number(e.target.value))}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 h-1 bg-white/40 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <button
                                            type="button"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!editPreviewUrl || !editCroppedAreaPixels) return;
                                                try {
                                                    const croppedBlob = await getCroppedImg(editPreviewUrl, editCroppedAreaPixels);
                                                    const croppedFile = new File([croppedBlob], editCoverImage?.name || 'cover.jpg', { type: 'image/jpeg' });
                                                    setEditCoverImage(croppedFile);
                                                    setEditPreviewUrl(URL.createObjectURL(croppedBlob));
                                                    setIsEditCropping(false);
                                                } catch (err) {
                                                    console.error('Crop failed:', err);
                                                    addAlert({ type: 'error', message: 'Failed to crop image' });
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-white text-titanium text-xs font-bold rounded-full shadow-sm hover:bg-white/90 transition-colors"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsEditCropping(false);
                                                setEditCoverImage(null);
                                                setEditPreviewUrl(originalCoverUrl);
                                                setEditCrop({ x: 0, y: 0 });
                                                setEditZoom(1);
                                                if (editFileInputRef.current) {
                                                    editFileInputRef.current.value = '';
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-black/50 text-white text-xs font-bold rounded-full backdrop-blur-sm hover:bg-black/60 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : editPreviewUrl ? (
                                <>
                                    <img src={editPreviewUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm gap-3">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsEditCropping(true);
                                                setEditCrop({ x: 0, y: 0 });
                                                setEditZoom(1);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white text-titanium text-sm font-bold rounded-full shadow-sm hover:bg-white/90 transition-colors"
                                        >
                                            <Camera className="w-4 h-4" />
                                            Edit Cover
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                editFileInputRef.current?.click();
                                            }}
                                            className="text-white font-medium text-sm hover:underline"
                                        >
                                            Change Cover
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="h-14 w-14 bg-titanium/5 rounded-full flex items-center justify-center mb-3 text-titanium/40 group-hover:scale-110 transition-transform duration-300">
                                        <Camera className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-semibold text-titanium/80">Update cover photo</p>
                                    <p className="text-[10px] text-titanium/40 mt-1 uppercase tracking-wider font-bold">16:9 aspect ratio recommended</p>
                                </>
                            )}
                            <input
                                ref={editFileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setEditCoverImage(file);
                                        setEditPreviewUrl(URL.createObjectURL(file));
                                        setIsEditCropping(true);
                                        setEditCrop({ x: 0, y: 0 });
                                        setEditZoom(1);
                                    }
                                }}
                            />
                        </div>
                    </div>

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

                    {/* Paid Features Toggle - Commented out temporarily
                    <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl">
                        <div>
                            <p className="text-sm font-bold text-amber-900">Premium Layout</p>
                            <p className="text-xs text-amber-700/60">Enable customizable wedding-style layout</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, has_paid_features: !prev.has_paid_features }))}
                            className={`relative w-12 h-7 rounded-full transition-colors ${editForm.has_paid_features ? 'bg-amber-500' : 'bg-amber-200'
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${editForm.has_paid_features ? 'left-6' : 'left-1'
                                    }`}
                            />
                        </button>
                    </div>
                    */}

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
                    {captureStep !== 'review' ? (
                        <>
                            {/* Header */}
                            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-6 pt-safe-top">
                                {/* Step progress pills */}
                                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md rounded-full px-4 py-2">
                                    {(['front', 'left', 'right'] as const).map((step, i) => (
                                        <div key={step} className="flex items-center gap-1.5">
                                            <div className={`w-2.5 h-2.5 rounded-full transition-all ${capturedPhotos[step] ? 'bg-green-400 scale-110' :
                                                captureStep === step ? 'bg-white scale-125' : 'bg-white/30'
                                                }`} />
                                            {i < 2 && <div className="w-3 h-px bg-white/20" />}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleCloseCamera}
                                    className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Live camera feed */}
                            <div className="absolute inset-0 bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />

                                {/* Framing overlay */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <svg className="w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMin slice">
                                        <mask id="faceMask3">
                                            <rect width="400" height="500" fill="white" />
                                            <rect x="75" y="75" width="250" height="300" rx="32" fill="black" />
                                        </mask>
                                        <rect width="400" height="500" fill="rgba(0,0,0,0.45)" mask="url(#faceMask3)" />
                                        <g stroke="white" strokeWidth="4" strokeLinecap="round" fill="none">
                                            <path d="M 75 125 v -18 a 32 32 0 0 1 32 -32 h 18" />
                                            <path d="M 275 75 h 18 a 32 32 0 0 1 32 32 v 18" />
                                            <path d="M 75 325 v 18 a 32 32 0 0 0 32 32 h 18" />
                                            <path d="M 275 375 h 18 a 32 32 0 0 0 32 -32 v -18" />
                                        </g>
                                    </svg>
                                </div>

                                {/* Camera loading spinner */}
                                {!cameraStream && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            <canvas ref={canvasRef} className="hidden" />

                            {/* Instruction card */}
                            {STEP_META[captureStep as 'front' | 'left' | 'right'] && (
                                <div className="absolute top-24 left-0 right-0 z-30 flex flex-col items-center gap-3 px-6">
                                    <div className="bg-black/50 backdrop-blur-md rounded-2xl px-6 py-4 text-center max-w-xs w-full border border-white/10">
                                        <p className="text-white/50 text-[10px] font-black tracking-[0.2em] uppercase mb-1">
                                            Step {STEP_META[captureStep].stepNum} of 3
                                        </p>
                                        <p className="text-white font-bold text-base">
                                            {STEP_META[captureStep].icon} {STEP_META[captureStep].label}
                                        </p>
                                        <p className="text-white/70 text-sm mt-1">
                                            {STEP_META[captureStep].instruction}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Capture button */}
                            <div className="absolute bottom-0 left-0 right-0 z-30 pb-16 px-8 flex flex-col items-center gap-5">
                                {/* Thumbnails of already captured shots */}
                                <div className="flex items-center gap-3">
                                    {(['front', 'left', 'right'] as const).map(step => (
                                        <div key={step} className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${capturedPhotos[step] ? 'border-green-400' : captureStep === step ? 'border-white' : 'border-white/20'
                                            }`}>
                                            {capturedPhotos[step] ? (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={capturedPhotos[step]!} alt={step} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                        <Check className="w-4 h-4 text-green-400" />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                    <span className="text-white/30 text-xs font-bold capitalize">{step[0].toUpperCase()}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={capturePhoto}
                                    disabled={!cameraStream}
                                    className="group relative w-20 h-20 rounded-full bg-white flex items-center justify-center disabled:opacity-40 active:scale-90 transition-all shadow-2xl"
                                >
                                    <div className="absolute inset-1.5 rounded-full border border-black/5" />
                                    <Camera className="w-8 h-8 text-black group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Review Header */}
                            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 pt-12 pb-4">
                                <button
                                    onClick={retakeAll}
                                    className="text-white font-bold text-sm tracking-widest uppercase hover:text-white/70 transition-colors bg-black/20 px-5 py-2 rounded-full backdrop-blur-sm"
                                >
                                    Start Over
                                </button>
                                <button
                                    onClick={handleCloseCamera}
                                    className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Review body */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-6">
                                <div className="text-center mb-2">
                                    <p className="text-white/50 text-[10px] font-black tracking-[0.2em] uppercase">All 3 angles captured</p>
                                    <h2 className="text-white font-black text-2xl mt-1">Ready to Search</h2>
                                    <p className="text-white/60 text-sm mt-1">Tap a shot to retake it, or search now</p>
                                </div>

                                {/* 3 preview thumbnails */}
                                <div className="flex items-start gap-4 w-full max-w-sm">
                                    {(['front', 'left', 'right'] as const).map(step => (
                                        <div key={step} className="flex-1 flex flex-col items-center gap-2">
                                            <button
                                                onClick={() => retakeStep(step)}
                                                className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/20 hover:border-white/60 transition-all group active:scale-95"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={capturedPhotos[step]!}
                                                    alt={STEP_META[step].label}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full px-3 py-1">
                                                        <span className="text-black text-xs font-bold">Retake</span>
                                                    </div>
                                                </div>
                                            </button>
                                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">{STEP_META[step].label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Search button */}
                            <div className="absolute bottom-0 left-0 right-0 z-30 p-8 pb-16 flex flex-col items-center gap-3">
                                <p className="text-white/40 text-[10px] font-black tracking-[0.15em] uppercase">
                                    Scanning 3 angles for best results
                                </p>
                                <button
                                    onClick={submitPhotos}
                                    disabled={isSearching}
                                    className="w-full max-w-xs h-16 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-white/90 disabled:opacity-50 shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {isSearching ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
                                    ) : (
                                        <><Search className="w-5 h-5" /> Find Me</>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default EventDetailPage;

