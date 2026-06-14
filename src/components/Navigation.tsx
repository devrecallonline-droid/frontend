'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-api';
import { UserCircle, ShieldCheck, Menu, X } from 'lucide-react';
import { Button } from './ui';
import { useState } from 'react';

const Navigation = () => {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const linkClass = "px-3 sm:px-4 py-2 hover:bg-black/5 rounded-full text-xs sm:text-sm font-medium transition-colors text-titanium/60 hover:text-titanium whitespace-nowrap";

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
        ...(isAuthenticated
            ? [
                { name: 'Events', href: '/events' },
                { name: 'Collections', href: '/collections' },
                { name: 'Profile', href: '/profile' },
            ]
            : []),
    ];

    const handleNav = (href: string) => {
        setMobileOpen(false);
        router.push(href);
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-[40] flex justify-center sm:top-6">
                <div className="bg-white sm:border border-black/5 sm:shadow-lg sm:rounded-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4 w-full sm:max-w-4xl sm:mx-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center group">
                        <Image src="/logo-black.png" alt="Nenge Logo" width={100} height={40} className="h-7 w-auto object-contain" />
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden sm:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            <Link key={link.name} href={link.href} className={linkClass}>
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Auth / User Section */}
                    <div className="hidden sm:flex items-center space-x-2">
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
                            <Button variant="default" size="sm" onClick={() => router.push('/auth')}>
                                Sign In
                            </Button>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/5 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5 text-titanium/60" />
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[50] flex flex-col bg-white sm:hidden">
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-5 pt-6 pb-4">
                        <Image src="/logo-black.png" alt="Nenge Logo" width={100} height={40} className="h-7 w-auto object-contain" />
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5 text-titanium/60" />
                        </button>
                    </div>

                    {/* Links */}
                    <div className="flex-1 flex flex-col justify-center px-8 pb-12 space-y-1">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => handleNav(link.href)}
                                className="w-full text-left py-4 text-xl font-medium text-titanium/70 hover:text-titanium border-b border-black/5 last:border-b-0 transition-colors"
                            >
                                {link.name}
                            </button>
                        ))}
                    </div>

                    {/* Bottom auth */}
                    <div className="px-8 pb-10">
                        {isAuthenticated ? (
                            <button
                                onClick={() => handleNav('/profile')}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-titanium/80 font-semibold"
                            >
                                <UserCircle className="w-5 h-5" />
                                {user?.username || 'Profile'}
                            </button>
                        ) : (
                            <Button
                                variant="default"
                                className="w-full !h-14 text-base"
                                onClick={() => handleNav('/auth')}
                            >
                                Sign In
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Navigation;
