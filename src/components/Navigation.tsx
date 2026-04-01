'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-api';
import { UserCircle, ShieldCheck } from 'lucide-react';
import { Button } from './ui';

const Navigation = () => {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[40] w-full max-w-4xl px-4 flex justify-center">
            <div className="glass bg-white/80 border border-black/5 premium-shadow rounded-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4 w-full">
                {/* Logo */}
                <Link href="/" className="flex items-center group">
                    <span className="text-lg font-bold tracking-tight text-titanium">Remember</span>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar max-w-[40%] sm:max-w-none">
                    {[
                        { name: 'Home', href: '/' },
                        { name: 'Events', href: '/events' },
                        { name: 'Collections', href: '/collections' },
                        { name: 'Profile', href: '/profile' }
                    ].map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="px-3 sm:px-4 py-2 hover:bg-black/5 rounded-full text-xs sm:text-sm font-medium transition-colors text-titanium/60 hover:text-titanium whitespace-nowrap"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Auth / User Section */}
                <div className="flex items-center space-x-2">
                    {isAuthenticated ? (
                        <button
                            onClick={() => router.push('/profile')}
                            className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 hover:bg-black/5 rounded-full transition-all group shrink-0"
                        >
                            <UserCircle className="w-5 h-5 text-titanium/30 transition-colors group-hover:text-titanium" />
                            <span className="hidden sm:inline-block text-sm font-semibold text-titanium/80 group-hover:text-titanium truncate max-w-[100px]">
                                {user?.username}
                            </span>
                        </button>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => router.push('/auth')}
                        >
                            Sign In
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;
