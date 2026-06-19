'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUI } from '@/hooks/use-api';
import { GoogleLogin } from '@react-oauth/google';
import Navigation from '@/components/Navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login, register, googleLogin, isAuthenticated, loading } = useAuth();
    const { addAlert } = useUI();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && isAuthenticated) {
            const urlParams = new URLSearchParams(window.location.search);
            const returnUrl = urlParams.get('returnUrl');

            if (returnUrl && returnUrl.startsWith('/')) {
                router.push(returnUrl);
            } else {
                router.push('/events');
            }
        }
    }, [mounted, isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isLogin) {
                await login({ email: formData.email, password: formData.password });
            } else {
                await register(formData);
            }
        } catch (err: any) {
            const errorMsg = err?.data?.detail || err?.data?.message || err?.error || err?.message || 'Authentication failed. Please check your credentials.';
            addAlert({
                type: 'error',
                message: errorMsg
            });
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (credentialResponse.credential) {
            try {
                await googleLogin(credentialResponse.credential);
            } catch (err: any) {
                const errorMsg = err?.data?.detail || 'Google login failed';
                addAlert({
                    type: 'error',
                    message: errorMsg
                });
            }
        }
    };

    const handleGoogleError = () => {
        addAlert({
            type: 'error',
            message: 'Google sign-in was cancelled or failed'
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-ivory flex flex-col">
            <Navigation />

            <main className="flex-1 flex items-center justify-center px-6">
                <div className="w-full max-w-sm py-24">
                    <div className="mb-10">
                        <h1 className="text-3xl sm:text-4xl font-black text-titanium tracking-tighter mb-3">
                            {isLogin ? 'Welcome back' : 'Create account'}
                        </h1>
                        <p className="text-titanium/45 text-base font-medium">
                            {isLogin
                                ? 'Sign in to your account to continue.'
                                : 'Get started with Nenge.'}
                        </p>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                size="large"
                                width="384"
                                theme="outline"
                                text={isLogin ? 'signin_with' : 'signup_with'}
                                shape="pill"
                            />
                        </div>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-black/8" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-4 bg-ivory text-titanium/30 font-semibold uppercase tracking-wider">
                                or
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div>
                                <input
                                    name="username"
                                    type="text"
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required={!isLogin}
                                    className="w-full h-12 px-4 bg-white border border-black/8 rounded-lg text-sm text-titanium placeholder:text-titanium/25 font-medium focus:outline-none focus:border-titanium/30 focus:ring-0 transition-colors"
                                />
                            </div>
                        )}

                        <div>
                            <input
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                className="w-full h-12 px-4 bg-white border border-black/8 rounded-lg text-sm text-titanium placeholder:text-titanium/25 font-medium focus:outline-none focus:border-titanium/30 focus:ring-0 transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                className="w-full h-12 px-4 pr-12 bg-white border border-black/8 rounded-lg text-sm text-titanium placeholder:text-titanium/25 font-medium focus:outline-none focus:border-titanium/30 focus:ring-0 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-titanium/25 hover:text-titanium/50 transition-colors focus:outline-none"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-lg bg-titanium text-ivory text-sm font-semibold tracking-tight hover:bg-black transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-titanium/35 text-sm font-medium">
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-titanium/60 hover:text-titanium underline-offset-2 hover:underline font-semibold transition-colors"
                            >
                                {isLogin ? 'Create one.' : 'Sign in.'}
                            </button>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AuthPage;
