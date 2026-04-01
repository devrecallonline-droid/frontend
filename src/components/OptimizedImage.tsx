'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    containerClassName?: string;
    fill?: boolean;
    width?: number;
    height?: number;
    priority?: boolean;
    sizes?: string;
    quality?: number;
    onClick?: () => void;
    onLoad?: () => void;
}

export function OptimizedImage({
    src,
    alt,
    className,
    containerClassName,
    fill = true,
    width,
    height,
    priority = false,
    sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
    quality = 75,
    onClick,
    onLoad,
}: OptimizedImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [shouldLoad, setShouldLoad] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        if (priority || shouldLoad) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldLoad(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '400px', // Load images slightly earlier
                threshold: 0,
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [priority, shouldLoad]);

    const handleLoad = useCallback(() => {
        setIsLoaded(true);
        onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
        setHasError(true);
        setIsLoaded(true);
    }, []);

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative overflow-hidden bg-titanium/5',
                fill && 'w-full h-full',
                containerClassName
            )}
            onClick={onClick}
            style={{ contain: 'layout paint' }}
        >
            {/* Skeleton loader - only show until image loads */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 bg-gradient-to-br from-titanium/5 to-titanium/10 animate-pulse" />
            )}

            {/* Error state */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-titanium/5">
                    <svg className="w-8 h-8 text-titanium/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            {/* Render img tag always to prevent DOM insertions, but delay src */}
            <img
                src={shouldLoad ? src : undefined}
                alt={alt}
                width={width}
                height={height}
                className={cn(
                    'w-full h-full object-cover',
                    'transition-opacity duration-500 ease-out',
                    isLoaded ? 'opacity-100' : 'opacity-0',
                    className
                )}
                onLoad={handleLoad}
                onError={handleError}
                loading={priority ? 'eager' : undefined} // Don't use lazy, we do it manually to prevent unload!
                decoding="async"
            />
        </div>
    );
}

// Hook for modal image with progressive loading
export function useProgressiveImage(src: string | undefined) {
    const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) return;

        setIsLoading(true);
        setError(false);

        const img = new Image();

        img.onload = () => {
            setLoadedSrc(src);
            setIsLoading(false);
        };

        img.onerror = () => {
            setError(true);
            setIsLoading(false);
        };

        img.src = src;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    return { loadedSrc, isLoading, error };
}
