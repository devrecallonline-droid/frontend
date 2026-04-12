'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Textarea, Modal, Badge } from './ui';
import { Calendar, MapPin, X, Sparkles, Loader2, Link as LinkIcon, Check, ListFilter, Camera } from 'lucide-react';
import { useCreateEventMutation, useGetEventTypesQuery, useUploadEventCoverMutation } from '@/lib/api';

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
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: '',
        location: '',
        event_date: ''
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverImage(file);
            setPreviewUrl(URL.createObjectURL(file));
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
                                className="relative w-full h-40 sm:h-48 mb-6 rounded-3xl overflow-hidden group cursor-pointer bg-titanium/[0.02] border-2 border-dashed border-titanium/10 hover:border-titanium/30 transition-all flex flex-col items-center justify-center animate-in zoom-in-95 duration-500"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {previewUrl ? (
                                    <>
                                        <img src={previewUrl} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
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
