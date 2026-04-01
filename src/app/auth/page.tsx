'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUI } from '@/hooks/use-api';
import { GoogleLogin } from '@react-oauth/google';
import Navigation from '@/components/Navigation';
import { Button, Card, Input } from '@/components/ui';
import { UserCircle, ShieldCheck, Mail, ArrowRight, Loader2, Lock, Eye, EyeOff } from 'lucide-react';

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
            router.push('/events');
        }
    }, [mounted, isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isLogin) {
                // Login uses email and password
                console.log('Submitting login form...');
                await login({ email: formData.email, password: formData.password });
            } else {
                // Register uses username, email, and password
                console.log('Submitting registration form...');
                await register(formData);
            }
        } catch (err: any) {
            console.error('Full auth error:', err);
            console.error('Auth error detail:', {
                status: err?.status,
                statusCode: err?.statusCode,
                data: err?.data,
                error: err?.error,
                message: err?.message,
                originalStatus: err?.originalStatus
            });
            const errorMsg = err?.data?.detail || err?.data?.message || err?.error || err?.message || 'Authentication failed. Please check your credentials.';
            addAlert({
                type: 'error',
                message: `❌ ${errorMsg}`
            });
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (credentialResponse.credential) {
            try {
                await googleLogin(credentialResponse.credential);
            } catch (err: any) {
                console.error('Google login error:', err);
                const errorMsg = err?.data?.detail || 'Google login failed';
                addAlert({
                    type: 'error',
                    message: `❌ ${errorMsg}`
                });
            }
        }
    };

    const handleGoogleError = () => {
        addAlert({
            type: 'error',
            message: '❌ Google sign-in was cancelled or failed'
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

            <main className="flex-1 flex items-center justify-center p-6 pt-32">
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px]"></div>
                </div>

                <Card className="w-full max-w-md animate-slide-up relative z-10 border-white/40 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="inline-flex h-20 w-20 bg-titanium rounded-apple-lg items-center justify-center text-white mb-6 premium-shadow">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl font-black text-titanium mb-3 tracking-tighter shrink-0">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-titanium/50 font-medium">
                            {isLogin
                                ? 'Sign in to your account'
                                : 'Get started with Remember'}
                        </p>
                    </div>

                    {/* Google Sign-In Button */}
                    <div className="mb-6">
                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                size="large"
                                width="100%"
                                theme="outline"
                                text={isLogin ? 'signin_with' : 'signup_with'}
                                shape="pill"
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-black/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-4 bg-white text-titanium/40 font-semibold uppercase tracking-wider">
                                or
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username field - only show for registration */}
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 flex items-center ml-1">
                                    <UserCircle className="w-3 h-3 mr-2" />
                                    Username
                                </label>
                                <Input
                                    name="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required={!isLogin}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 flex items-center ml-1">
                                <Mail className="w-3 h-3 mr-2" />
                                Email
                            </label>
                            <Input
                                name="email"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 flex items-center ml-1">
                                <Lock className="w-3 h-3 mr-2" />
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    className="pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-titanium/40 hover:text-titanium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/10 rounded-full"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-black/5 text-center">
                        <p className="text-titanium/40 text-sm font-medium mb-4">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                        </p>
                        <Button
                            variant="secondary"
                            onClick={() => setIsLogin(!isLogin)}
                            className="w-full h-12"
                        >
                            {isLogin ? 'Create Account' : 'Sign In'}
                        </Button>
                    </div>
                </Card>
            </main>
        </div>
    );
};

export default AuthPage;
