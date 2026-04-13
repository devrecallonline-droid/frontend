'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, Modal } from './ui';
import { Calendar, MapPin, X, Sparkles, Loader2, Link as LinkIcon, Check, ListFilter, Camera } from 'lucide-react';
import { useCreateEventMutation, useGetEventTypesQuery, useUploadEventCoverMutation } from '@/lib/api';
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

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateEventModal = ({ isOpen, onClose, onSuccess }: CreateEventModalProps) => {
    const router = useRouter();
    const [createEvent, { isLoading }] = useCreateEventMutation();
    const [uploadEventCover, { isLoading: isUploadingCover }] = useUploadEventCoverMutation();
    const { data: eventTypes = [], isLoading: isLoadingTypes } = useGetEventTypesQuery();
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [createdEvent, setCreatedEvent] = useState<any>(null);
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: '',
        location: '',
        event_date: ''
    });

    // Cropper state
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImage(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setIsCropping(true);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
        }
    };

    const handleCropComplete = useCallback((_: any, areaPixels: any) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    const handleCropConfirm = async () => {
        if (!previewUrl || !croppedAreaPixels) return;
        try {
            const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
            const croppedFile = new File([croppedBlob], coverImage?.name || 'cover.jpg', { type: 'image/jpeg' });
            setCoverImage(croppedFile);
            setPreviewUrl(URL.createObjectURL(croppedBlob));
            setIsCropping(false);
        } catch (err) {
            console.error('Crop failed:', err);
            alert('Failed to crop image. Please try again.');
        }
    };

    const handleCropCancel = () => {
        setIsCropping(false);
        setCoverImage(null);
        setPreviewUrl(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await createEvent({
                ...formData,
                event_date: formData.event_date ? new Date(formData.event_date).toISOString() : new Date().toISOString()
            }).unwrap();

            if (coverImage) {
                try {
                    await uploadEventCover({ eventId: result.id, file: coverImage }).unwrap();
                } catch (imgErr) {
                    console.error("Failed to upload cover:", imgErr);
                }
            }

            setCreatedEvent(result);
            setStep('success');
            onSuccess();
        } catch (err: any) {
            console.error('Failed to create event:', {
                status: err?.status,
                data: err?.data,
                message: err?.message || 'Unknown creation error'
            });
            const errorMsg = err?.data?.detail || err?.data?.message || 'Failed to create your gathering. Please try again.';
            alert(`❌ ${errorMsg}`);
        }
    };

    const handleCopyLink = () => {
        if (createdEvent) {
            const link = `${window.location.origin}/events/${createdEvent.id}`;
            navigator.clipboard.writeText(link);
            // We could add a local "copied" state but alert is simplified for now
        }
    };

    const resetAndClose = () => {
        setStep('form');
        setFormData({ title: '', description: '', event_type: '', location: '', event_date: '' });
        setCoverImage(null);
        setPreviewUrl(null);
        setIsCropping(false);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        onClose();
        if (step === 'success') {
            onSuccess();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={resetAndClose}>
            <div className="relative">
                <button
                    onClick={resetAndClose}
                    className="absolute -top-2 -right-2 p-2 text-titanium/20 hover:text-titanium transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {step === 'form' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8 text-center relative">
                            {/* Stylized Thumbnail Uploader */}
                            <div
                                className="relative w-full aspect-video mb-6 rounded-3xl overflow-hidden group bg-titanium/[0.02] border-2 border-dashed border-titanium/10 hover:border-titanium/30 transition-all flex flex-col items-center justify-center animate-in zoom-in-95 duration-500"
                                onClick={() => !isCropping && fileInputRef.current?.click()}
                            >
                                {isCropping && previewUrl ? (
                                    <>
                                        <div className="absolute inset-0 cursor-move">
                                            <Cropper
                                                image={previewUrl}
                                                crop={crop}
                                                zoom={zoom}
                                                aspect={16 / 9}
                                                minZoom={0.3}
                                                maxZoom={3}
                                                onCropChange={setCrop}
                                                onCropComplete={handleCropComplete}
                                                onZoomChange={setZoom}
                                                showGrid={false}
                                                style={{
                                                    containerStyle: { borderRadius: '24px' }
                                                }}
                                            />
                                        </div>
                                        <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center gap-2">
                                            <input
                                                type="range"
                                                min={0.3}
                                                max={3}
                                                step={0.1}
                                                value={zoom}
                                                onChange={(e) => setZoom(Number(e.target.value))}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-1 h-1 bg-white/40 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleCropConfirm(); }}
                                                className="px-3 py-1.5 bg-white text-titanium text-xs font-bold rounded-full shadow-sm hover:bg-white/90 transition-colors"
                                            >
                                                Apply
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleCropCancel(); }}
                                                className="px-3 py-1.5 bg-black/50 text-white text-xs font-bold rounded-full backdrop-blur-sm hover:bg-black/60 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm cursor-pointer">
                                            <Camera className="w-8 h-8 text-white mb-2" />
                                            <span className="text-white font-medium text-sm">Change Cover</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-14 w-14 bg-titanium/5 rounded-full flex items-center justify-center mb-3 text-titanium/40 group-hover:scale-110 transition-transform duration-300">
                                            <Camera className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-semibold text-titanium/80">Add a cover photo</p>
                                        <p className="text-[10px] text-titanium/40 mt-1 uppercase tracking-wider font-bold">High resolution recommended</p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </div>

                            <h2 className="text-3xl font-black text-titanium mb-2 tracking-tighter">New Gathering</h2>
                            <p className="text-titanium/40 font-medium">Create a private space for your memories.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 ml-1">Event Title</label>
                                <Input
                                    required
                                    placeholder="e.g., Summer Rooftop Soirée"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 ml-1">Event Type</label>
                                <div className="relative">
                                    <ListFilter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-titanium/30 pointer-events-none" />
                                    <select
                                        className="w-full bg-titanium/5 border border-titanium/10 rounded-apple-lg px-12 py-3 text-titanium focus:outline-none focus:ring-2 focus:ring-titanium/20 transition-all appearance-none"
                                        value={formData.event_type}
                                        onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                                        disabled={isLoadingTypes}
                                    >
                                        <option value="" disabled>Select event type...</option>
                                        {eventTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 ml-1">Description</label>
                                <Textarea
                                    placeholder="Tell your guests about the gathering..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 ml-1">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-titanium/30 pointer-events-none" />
                                        <Input
                                            type="date"
                                            className="pl-12"
                                            value={formData.event_date}
                                            onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 ml-1">Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-titanium/30 pointer-events-none" />
                                        <Input
                                            placeholder="City or Venue"
                                            className="pl-12"
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-14" disabled={isLoading || isUploadingCover}>
                                {isLoading || isUploadingCover ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Host Gathering'}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="text-center animate-in fade-in zoom-in duration-500">
                        <div className="inline-flex h-20 w-20 bg-green-500 rounded-apple-lg items-center justify-center text-white mb-8 shadow-xl shadow-green-500/20">
                            <Check className="w-10 h-10" />
                        </div>

                        <h2 className="text-4xl font-black text-titanium mb-4 tracking-tighter">Gathering Live!</h2>
                        <p className="text-titanium/50 font-medium mb-10 max-w-xs mx-auto">
                            Your private vault for <span className="text-titanium font-bold">"{createdEvent?.title}"</span> is ready. Share it with your friends.
                        </p>

                        <div className="space-y-4">
                            <Button
                                className="w-full h-14 bg-black text-white hover:bg-black/90"
                                onClick={() => router.push(`/upload/${createdEvent?.id}`)}
                            >
                                <Sparkles className="w-5 h-5 mr-3" />
                                Upload Photos Now
                            </Button>
                            <Button variant="glass" className="w-full h-14" onClick={handleCopyLink}>
                                <LinkIcon className="w-5 h-5 mr-3 opacity-40" />
                                Copy Invite Link
                            </Button>
                            <Button variant="outline" className="w-full h-14" onClick={() => router.push(`/events/${createdEvent?.id}`)}>
                                View Gathering
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
