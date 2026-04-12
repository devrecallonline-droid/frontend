'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { Shield, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { adminAuthApi, setAdminTokens, setAdminUser, getAdminToken } from '@/lib/adminApi';

const AdminLoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [mounted, setMounted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        // Redirect if already logged in
        const token = getAdminToken();
        if (token) {
            adminAuthApi.me()
                .then(() => router.push('/admin/dashboard'))
                .catch(() => {}); // Token invalid, stay on login
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await adminAuthApi.login(formData.email, formData.password);
            setAdminTokens(data.accessToken, data.refreshToken);
            setAdminUser(data.admin);
            router.push('/admin/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
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
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-400/5 rounded-full blur-[100px]"></div>
                </div>

                <Card className="w-full max-w-md animate-slide-up relative z-10 border-white/40 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="inline-flex h-20 w-20 bg-titanium rounded-apple-lg items-center justify-center text-white mb-6 premium-shadow">
                            <Shield className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl font-black text-titanium mb-3 tracking-tighter shrink-0">
                            Admin Portal
                        </h1>
                        <p className="text-titanium/50 font-medium">
                            Secure access for administrators
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-apple-sm bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 flex items-center ml-1">
                                <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                                Admin Email
                            </label>
                            <Input
                                name="email"
                                type="email"
                                placeholder="admin@nenge.ng"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                autoComplete="email"
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
                                    autoComplete="current-password"
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
                                    <span>Sign In to Admin</span>
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-black/5 text-center">
                        <p className="text-titanium/40 text-sm font-medium">
                            Protected area. Authorized personnel only.
                        </p>
                    </div>
                </Card>
            </main>
        </div>
    );
};

export default AdminLoginPage;