'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { adminAuthApi, getAdminToken } from '@/lib/adminApi';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Skip auth check on the login page itself
        if (pathname === '/admin') {
            setIsAuthed(true); // Let login page render
            return;
        }

        const token = getAdminToken();
        if (!token) {
            router.replace('/admin');
            return;
        }

        // Verify token is valid
        adminAuthApi.me()
            .then(() => setIsAuthed(true))
            .catch(() => {
                router.replace('/admin');
            });
    }, [pathname, router]);

    // Show nothing while checking auth
    if (isAuthed === null) {
        return (
            <div className="min-h-screen bg-ivory flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-titanium/20 border-t-titanium rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ivory">
            {children}
        </div>
    );
}