'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-api';
import { UserCircle, ShieldCheck, Bell, Menu, X, Home, Calendar, Grid3X3, User, LayoutDashboard } from 'lucide-react';
import { useGetEventAccessRequestsQuery } from '@/lib/api';
import { Button } from './ui';
import { useState, useEffect } from 'react';

const Navigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, isAuthenticated } = useAuth();
    const { data: requestsData } = useGetEventAccessRequestsQuery(undefined, {
        skip: !isAuthenticated,
        pollingInterval: 30000 // Poll every 30s for new requests
    });
    const router = useRouter();
    const pendingCount = requestsData?.count || 0;

    // Prevent scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMenuOpen]);

    const navLinks = [
        ...(isAuthenticated ? [{ name: 'Home', href: '/', icon: Home }] : []),
        ...(isAuthenticated ? [{ name: 'Events', href: '/events', icon: LayoutDashboard }] : []),
        ...(isAuthenticated ? [{ name: 'Collections', href: '/collections', icon: Grid3X3 }] : []),
        ...(isAuthenticated ? [{ name: 'Profile', href: '/profile', icon: User }] : [])
    ];

    return (
        <>
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[50] w-full max-w-4xl px-4 flex justify-center">
                <div className="bg-white/95 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4 w-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center group">
                        <Image src="/logo-black.png" alt="Nenge Logo" width={130} height={52} className="h-9 w-auto object-contain" priority />
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isEvents = link.href === '/events';
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="relative px-4 py-2 text-sm font-semibold text-titanium/60 hover:text-titanium rounded-full hover:bg-black/5 transition-all duration-200 cursor-pointer"
                                >
                                    {link.name}
                                    {isEvents && pendingCount > 0 && (
                                        <span className="absolute -top-1 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full">
                                            {pendingCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                        {isAuthenticated ? (
                            <button
                                onClick={() => router.push('/profile')}
                                className="ml-2 w-9 h-9 rounded-full bg-titanium/5 flex items-center justify-center hover:bg-titanium/10 transition-colors cursor-pointer"
                                aria-label="Profile"
                            >
                                <UserCircle className="w-5 h-5 text-titanium/50" />
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/auth')}
                                className="ml-2 px-5 py-2 rounded-full bg-titanium text-white text-sm font-bold hover:bg-titanium/90 transition-colors cursor-pointer"
                            >
                                Get Started
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-titanium cursor-pointer"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </nav>

            {/* Full-Screen Menu Overlay (Mobile Only) */}
            <div className={`md:hidden fixed inset-0 z-[45] transition-all duration-500 ease-apple ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-white/95 backdrop-blur-3xl" />

                <div className="relative h-full flex flex-col justify-center px-12 space-y-8">
                    {navLinks.map((link, idx) => {
                        const Icon = link.icon;
                        const isEvents = link.href === '/events';

                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-6 group transition-all duration-500 transform ${isMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}`}
                                style={{ transitionDelay: `${idx * 100}ms` }}
                            >
                                <div className="w-14 h-14 rounded-apple-md bg-titanium/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                    <Icon className="w-7 h-7 text-titanium" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black text-titanium tracking-tighter uppercase relative">
                                        {link.name}
                                        {isEvents && pendingCount > 0 && (
                                            <span className="absolute -top-2 -right-6 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                                                {pendingCount}
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-xs font-bold tracking-[0.2em] text-titanium/30 uppercase mt-1">Discover more</span>
                                </div>
                            </Link>
                        );
                    })}

                    <div className={`pt-12 border-t border-black/5 transition-all duration-500 delay-500 ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <UserCircle className="w-10 h-10 text-titanium/20" />
                                <div>
                                    <p className="text-sm font-bold text-titanium">{user?.username}</p>
                                    <button
                                        onClick={() => { router.push('/profile'); setIsMenuOpen(false); }}
                                        className="text-xs font-bold text-titanium/40 uppercase tracking-widest hover:text-titanium transition-colors"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="default"
                                size="lg"
                                className="w-full text-lg h-16 rounded-full"
                                onClick={() => { router.push('/auth'); setIsMenuOpen(false); }}
                            >
                                Get Started
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Navigation;
