'use client';

import { Provider } from 'react-redux';
import { store, loginSuccess, type User } from '@/lib/store';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function AuthInitializer({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            if (user && user !== 'null' && user !== 'undefined') {
                try {
                    dispatch(loginSuccess(JSON.parse(user) as User));
                } catch (e) {
                    console.error('Failed to parse user from localStorage', e);
                    // Clear invalid data
                    localStorage.removeItem('user');
                }
            }
        }
    }, [dispatch]);

    return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <Provider store={store}>
                <AuthInitializer>{children}</AuthInitializer>
            </Provider>
        </GoogleOAuthProvider>
    );
}
