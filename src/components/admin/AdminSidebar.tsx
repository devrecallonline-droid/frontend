'use client';

import { useState } from 'react';
import { 
    LayoutDashboard, 
    Users, 
    Calendar, 
    Settings, 
    LogOut,
    Menu,
    X,
    BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { adminAuthApi, clearAdminTokens } from '@/lib/adminApi';

const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/admin/dashboard' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
    { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
    { id: 'events', label: 'Events', icon: Calendar, href: '/admin/events' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/admin/settings' },
];

export const AdminSidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const isActive = (href: string) => {
        if (href === '/admin/dashboard') {
            return pathname === '/admin/dashboard' || pathname === '/admin';
        }
        return pathname.startsWith(href);
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await adminAuthApi.logout();
        } catch {
            // Even if API fails, clear local state
        } finally {
            clearAdminTokens();
            router.push('/admin');
        }
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 glass border-b border-black/5 z-50 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-titanium rounded-lg flex items-center justify-center text-white">
                        <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-titanium">Admin</span>
                </div>
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                >
                    {mobileMenuOpen ? <X className="w-5 h-5 text-titanium" /> : <Menu className="w-5 h-5 text-titanium" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Desktop & Mobile */}
            <aside className={`
                fixed lg:sticky top-0 left-0 h-screen w-64 bg-white/50 glass border-r border-black/5 flex flex-col z-50
                transition-transform duration-300 lg:translate-x-0
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-black/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-titanium rounded-apple-sm flex items-center justify-center text-white">
                            <LayoutDashboard className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-titanium">Admin</h1>
                            <p className="text-[10px] text-titanium/50 uppercase tracking-wider">Dashboard</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-1">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <li key={item.id}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-apple-sm text-sm font-medium transition-all ${
                                            active
                                                ? 'bg-titanium text-white'
                                                : 'text-titanium/70 hover:bg-black/5 hover:text-titanium'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-black/5">
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-3 text-titanium/70 hover:text-titanium"
                        onClick={handleLogout}
                        disabled={loggingOut}
                    >
                        <LogOut className="w-4 h-4" />
                        {loggingOut ? 'Signing out...' : 'Sign Out'}
                    </Button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;