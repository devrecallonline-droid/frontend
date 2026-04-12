'use client';

import { useState, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';
import { useUI } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
// Use a generic icon or custom SVG for Google Drive since lucide doesn't have an exact one
import { Cloud } from 'lucide-react';

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

interface GoogleDrivePickerProps {
    onFilesSelected: (files: File[]) => void;
    className?: string;
    children?: React.ReactNode;
}

export default function GoogleDrivePicker({ onFilesSelected, className, children }: GoogleDrivePickerProps) {
    const { addAlert } = useUI();
    const [isPickerReady, setIsPickerReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const oauthTokenRef = useRef<string | null>(null);

    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;

    useEffect(() => {
        // Load the Google API Client script dynamically if it doesn't exist
        const loadGapi = () => {
            if (window.gapi && window.gapi.picker) {
                setIsPickerReady(true);
                return;
            }

            if (!document.getElementById('gapi-script')) {
                const script = document.createElement('script');
                script.id = 'gapi-script';
                script.src = 'https://apis.google.com/js/api.js';
                script.async = true;
                script.defer = true;
                script.onload = () => {
                    window.gapi.load('picker', {
                        callback: () => setIsPickerReady(true)
                    });
                };
                document.body.appendChild(script);
            } else if (window.gapi) {
                window.gapi.load('picker', {
                    callback: () => setIsPickerReady(true)
                });
            }
        };

        loadGapi();
    }, []);

    const pickerCallback = async (data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
            setIsDownloading(true);
            addAlert({ type: 'info', message: `Downloading ${data.docs.length} memory(s) from Google Drive...` });
            try {
                const docs = data.docs;
                const downloadedFiles: File[] = [];

                if (!oauthTokenRef.current) {
                    throw new Error('OAuth token lost');
                }

                for (const doc of docs) {
                    const fileId = doc.id;
                    const fileName = doc.name;
                    const mimeType = doc.mimeType;

                    // Download the file from Google Drive via REST API
                    const response = await fetch(
                        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                        {
                            headers: {
                                Authorization: `Bearer ${oauthTokenRef.current}`
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error(`Failed to download ${fileName}`);
                    }

                    const blob = await response.blob();
                    const file = new File([blob], fileName, { type: mimeType });
                    downloadedFiles.push(file);
                }

                if (downloadedFiles.length > 0) {
                    onFilesSelected(downloadedFiles);
                    addAlert({ type: 'success', message: 'Memories successfully retrieved from Drive!' });
                }
            } catch (error) {
                console.error('Error downloading from Drive:', error);
                addAlert({ type: 'error', message: 'Failed to download selected files from Google Drive.' });
            } finally {
                setIsDownloading(false);
                oauthTokenRef.current = null;
            }
        } else if (data.action === window.google.picker.Action.CANCEL) {
            setIsLoading(false);
            setIsDownloading(false);
            oauthTokenRef.current = null;
        }
    };

    const createPicker = (accessToken: string) => {
        if (!API_KEY) {
            addAlert({ type: 'error', message: 'Google Drive API key is missing in configuration.' });
            setIsLoading(false);
            return;
        }

        try {
            const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS_IMAGES);
            view.setIncludeFolders(true);

            const picker = new window.google.picker.PickerBuilder()
                .addView(view)
                .setOAuthToken(accessToken)
                .setDeveloperKey(API_KEY)
                .setCallback(pickerCallback)
                .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
                .build();

            picker.setVisible(true);
        } catch (e) {
            console.error("Failed to build picker", e);
            addAlert({ type: 'error', message: 'Failed to open Google Drive picker.' });
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        onSuccess: (tokenResponse) => {
            oauthTokenRef.current = tokenResponse.access_token;
            createPicker(tokenResponse.access_token);
        },
        onError: (errorResponse) => {
            console.error('Google login/consent failed', errorResponse);
            addAlert({ type: 'error', message: 'Failed to authenticate with Google Drive.' });
            setIsLoading(false);
        }
    });

    const handleClick = () => {
        if (!isPickerReady) {
            addAlert({ type: 'warning', message: 'Google API is still loading. Please wait a moment.' });
            return;
        }
        setIsLoading(true);
        handleGoogleLogin();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isLoading || isDownloading || !isPickerReady}
            className={cn(
                "inline-flex  items-center justify-center font-bold uppercase transition-all focus:outline-none",
                className
            )}
        >
            {isDownloading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Gathering Memories...
                </>
            ) : isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Connecting...
                </>
            ) : (
                <>

                    {children || "Browse Google Drive"}
                </>
            )}
        </button>
    );
}
