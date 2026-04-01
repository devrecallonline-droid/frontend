'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download, Lock, Loader2, Image as ImageIcon, Calendar, FolderOpen, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type SharedPhoto = {
    id: string;
    filename: string;
    file_size: number | null;
    url: string;
};

type SharedData = {
    requires_password: boolean;
    event_title: string;
    event_description?: string;
    event_date?: string;
    photo_count: number;
    photos?: SharedPhoto[];
};

const SharedDownloadPage = () => {
    const params = useParams();
    const token = params.token as string;

    const [data, setData] = useState<SharedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchSharedContent();
    }, [token]);

    const fetchSharedContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/shared/${token}`);
            if (res.status === 404) {
                setError('This link does not exist or has been removed.');
                return;
            }
            if (res.status === 410) {
                const body = await res.json();
                setError(body.detail || 'This link has expired.');
                return;
            }
            if (!res.ok) {
                setError('Something went wrong. Please try again.');
                return;
            }
            const json = await res.json();
            setData(json);
        } catch {
            setError('Unable to connect. Please check the link and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyPassword = async () => {
        if (!password.trim()) return;
        setVerifying(true);
        try {
            const res = await fetch(`${API_URL}/shared/${token}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (res.status === 401) {
                setError('Incorrect password. Please try again.');
                setVerifying(false);
                return;
            }
            if (!res.ok) {
                setError('Something went wrong.');
                setVerifying(false);
                return;
            }
            const json = await res.json();
            setData(json);
            setError(null);
        } catch {
            setError('Unable to verify password.');
        } finally {
            setVerifying(false);
        }
    };

    const handleDownloadAll = async () => {
        if (!data?.photos || data.photos.length === 0) return;
        setDownloading(true);
        setDownloadProgress({ current: 0, total: data.photos.length });

        const zip = new JSZip();

        for (let i = 0; i < data.photos.length; i++) {
            const photo = data.photos[i];
            try {
                const response = await fetch(photo.url);
                const blob = await response.blob();
                const filename = photo.filename || `photo-${i + 1}.jpg`;
                zip.file(filename, blob);
                setDownloadProgress({ current: i + 1, total: data.photos.length });
            } catch (err) {
                console.error(`Failed to fetch ${photo.filename}:`, err);
            }
        }

        try {
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipName = `${data.event_title?.replace(/[^a-zA-Z0-9]/g, '_') || 'photos'}.zip`;
            saveAs(zipBlob, zipName);
        } catch (err) {
            console.error('Failed to generate zip:', err);
        }

        setDownloading(false);
    };

    const handleDownloadSingle = async (photo: SharedPhoto) => {
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
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '';
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-ivory flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-titanium/30 animate-spin mx-auto mb-6" />
                    <p className="text-titanium/40 font-bold uppercase tracking-widest text-xs">Loading shared content...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error && !data) {
        return (
            <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-titanium/5 rounded-2xl flex items-center justify-center mx-auto mb-8">
                        <FolderOpen className="w-10 h-10 text-titanium/20" />
                    </div>
                    <h1 className="text-3xl font-black text-titanium mb-4 tracking-tight">Link Unavailable</h1>
                    <p className="text-titanium/40 font-medium mb-8">{error}</p>
                </div>
            </div>
        );
    }

    // Password gate
    if (data?.requires_password) {
        return (
            <div className="min-h-screen bg-ivory flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-titanium/5 rounded-2xl flex items-center justify-center mx-auto mb-8">
                            <Lock className="w-10 h-10 text-titanium/30" />
                        </div>
                        <h1 className="text-3xl font-black text-titanium mb-2 tracking-tight">{data.event_title}</h1>
                        <p className="text-titanium/40 font-medium">{data.photo_count} photos · Password protected</p>
                    </div>

                    <div className="bg-white border border-titanium/10 rounded-2xl p-8 shadow-sm">
                        <label className="text-xs font-bold uppercase tracking-widest text-titanium/40 block mb-3">Enter Password</label>
                        <div className="relative mb-4">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
                                placeholder="••••••••"
                                className="w-full px-6 py-4 bg-titanium/5 border border-titanium/10 rounded-xl text-titanium placeholder:text-titanium/20 focus:outline-none focus:border-titanium/30 pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-titanium/30 hover:text-titanium/60 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                        <Button
                            onClick={handleVerifyPassword}
                            disabled={verifying || !password.trim()}
                            className="w-full bg-titanium text-white hover:bg-titanium/90 py-5 h-auto font-semibold"
                        >
                            {verifying ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</>
                            ) : (
                                <><Lock className="w-5 h-5 mr-2" /> Unlock Photos</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Main content — photos available
    return (
        <div className="min-h-screen bg-ivory text-titanium">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12">
                <div className="text-center mb-12">
                    <Badge variant="secondary" className="bg-titanium/5 text-titanium/60 border-titanium/10 mb-6">
                        <FolderOpen className="w-3 h-3 mr-2" />
                        Shared Photos
                    </Badge>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-titanium mb-4 tracking-tighter leading-[0.9]">
                        {data?.event_title}
                    </h1>
                    {data?.event_description && (
                        <p className="text-lg text-titanium/40 font-medium max-w-xl mx-auto mb-6">{data.event_description}</p>
                    )}
                    <div className="flex items-center justify-center gap-6 text-titanium/30 text-sm font-medium">
                        {data?.event_date && (
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(data.event_date).toLocaleDateString()}
                            </span>
                        )}
                        <span className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" />
                            {data?.photo_count} photos
                        </span>
                    </div>
                </div>

                {/* Download All Button */}
                <div className="flex justify-center mb-16">
                    <Button
                        onClick={handleDownloadAll}
                        disabled={downloading}
                        className="bg-titanium text-white hover:bg-titanium/90 px-10 py-5 h-auto font-bold text-lg rounded-xl shadow-xl"
                    >
                        {downloading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                Preparing ZIP {downloadProgress.current}/{downloadProgress.total}...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5 mr-3" />
                                Download All as ZIP
                            </>
                        )}
                    </Button>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {data?.photos?.map((photo, index) => (
                        <div
                            key={photo.id}
                            className="relative w-full overflow-hidden rounded-xl group cursor-pointer"
                            onClick={() => handleDownloadSingle(photo)}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={photo.url}
                                alt={photo.filename || `Photo ${index + 1}`}
                                className="w-full object-contain rounded-xl"
                                loading={index < 8 ? 'eager' : 'lazy'}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center rounded-xl">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center text-white">
                                    <Download className="w-6 h-6 mb-1" />
                                    <span className="text-xs font-bold">Download</span>
                                    {photo.file_size && (
                                        <span className="text-[10px] text-white/50">{formatFileSize(photo.file_size)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center py-12 border-t border-titanium/5">
                <p className="text-titanium/20 text-xs font-medium">
                    Powered by Async · Photos shared securely
                </p>
            </div>
        </div>
    );
};

export default SharedDownloadPage;
