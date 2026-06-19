'use client';

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUI } from '@/hooks/use-api'
import Navigation from '@/components/Navigation'
import { AlertCircle, ShieldCheck, LogOut, Settings, Trash2, Lock, HardDrive, Users, UserMinus } from 'lucide-react'
import {
    useOptOutMutation,
    useGetFollowersQuery,
    useGetFollowingQuery,
    useUnfollowUserMutation,
    useGetStorageUsageQuery,
    type User
} from '@/lib/api'
import Link from 'next/link'

const useReveal = (threshold = 0.08) => {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setRevealed(true); observer.unobserve(el); } },
      { threshold, rootMargin: '0px 0px 40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, revealed };
};

const RevealSection = ({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) => {
  const { ref, revealed } = useReveal();
  return (
    <div ref={ref} id={id} className={`${className} transition-all duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
};

const ProfilePage = () => {
    const [mounted, setMounted] = useState(false)
    const router = useRouter()
    const { user, isAuthenticated, logout } = useAuth()
    const { addAlert } = useUI()
    const [optOutMutation] = useOptOutMutation()
    const { data: followersData, isLoading: followersLoading } = useGetFollowersQuery(user?.id || '', {
        skip: !user?.id,
    })
    const { data: followingData, isLoading: followingLoading } = useGetFollowingQuery(user?.id || '', {
        skip: !user?.id,
    })
    const { data: storageData, isLoading: storageLoading } = useGetStorageUsageQuery(undefined, {
        skip: !user?.id,
    })
    const [unfollowUser] = useUnfollowUserMutation()
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers')

    useEffect(() => {
        setMounted(true)
    }, [])

    const [profileSettings, setProfileSettings] = useState({
        default_event_privacy: true,
        auto_delete_days: 7,
        email_notifications: true,
        search_visibility: true
    })

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push('/auth')
        }
    }, [isAuthenticated, router, mounted])

    const handleOptOut = async () => {
        if (confirm('⚠️ Are you absolutely sure you want to delete all face data?\n\nThis cannot be undone.')) {
            try {
                await optOutMutation(undefined).unwrap()
                addAlert({ type: 'success', message: 'All face data deleted successfully' })
            } catch (error) {
                addAlert({ type: 'error', message: 'Failed to delete data' })
                console.error('Opt-out failed:', error)
            }
        }
    }

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    if (!mounted) return null

    return (
        <div className="min-h-screen bg-ivory flex flex-col">
            <Navigation />

            <main className="flex-1 max-w-6xl mx-auto w-full px-5 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-20">
                <div className="flex flex-col lg:flex-row gap-[clamp(2rem,5vw,4rem)]">
                    {/* Sidebar */}
                    <aside className="lg:w-80 space-y-6 lg:space-y-12">
                        <div className="border border-titanium/[0.08] rounded-[24px] p-8 text-center">
                            <div className="w-20 h-20 mx-auto bg-titanium/[0.06] rounded-full flex items-center justify-center text-titanium text-3xl font-black tracking-tighter mb-4">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <h1 className="text-xl font-black text-titanium tracking-tight truncate">{user?.username}</h1>
                            <p className="text-xs text-titanium/40 font-bold uppercase tracking-widest truncate mt-1">{user?.email}</p>
                        </div>

                        <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0">
                            <button
                                onClick={() => scrollToSection('details')}
                                className="whitespace-nowrap flex items-center gap-3 px-5 py-3 rounded-full border border-titanium/[0.08] text-titanium font-bold text-sm transition-all hover:bg-titanium/[0.03]"
                            >
                                <Settings className="w-4 h-4 text-titanium/40" />
                                Your Details
                            </button>
                            <button
                                onClick={() => scrollToSection('connections')}
                                className="whitespace-nowrap flex items-center gap-3 px-5 py-3 rounded-full text-titanium/40 hover:text-titanium font-bold text-sm transition-all hover:bg-titanium/[0.02]"
                            >
                                <Users className="w-4 h-4 text-titanium/40" />
                                Connections
                            </button>
                            <button
                                onClick={() => router.push('/event-access-requests')}
                                className="whitespace-nowrap flex items-center gap-3 px-5 py-3 rounded-full text-titanium/40 hover:text-titanium font-bold text-sm transition-all hover:bg-titanium/[0.02]"
                            >
                                <Lock className="w-4 h-4 text-titanium/40" />
                                Event Access Requests
                            </button>
                            <button
                                onClick={() => scrollToSection('privacy')}
                                className="whitespace-nowrap flex items-center gap-3 px-5 py-3 rounded-full text-titanium/40 hover:text-titanium font-bold text-sm transition-all hover:bg-titanium/[0.02]"
                            >
                                <ShieldCheck className="w-4 h-4 text-titanium/40" />
                                Peace of Mind
                            </button>
                            <button
                                onClick={() => scrollToSection('protection')}
                                className="whitespace-nowrap flex items-center gap-3 px-5 py-3 rounded-full text-titanium/40 hover:text-titanium font-bold text-sm transition-all hover:bg-titanium/[0.02]"
                            >
                                <AlertCircle className="w-4 h-4 text-titanium/40" />
                                Data Protection
                            </button>
                        </nav>

                        <div className="pt-8 space-y-3">
                            <button
                                onClick={handleLogout}
                                className="w-full h-12 rounded-full border border-titanium/[0.08] text-titanium font-bold text-sm hover:bg-titanium/[0.03] transition-all cursor-pointer"
                            >
                                    <LogOut className="w-4 h-4 mr-2 inline" />
                                Sign Out
                            </button>
                            <button
                                onClick={handleOptOut}
                                className="w-full h-10 rounded-full text-red-500/40 hover:text-red-500 hover:bg-red-500/5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                                <Trash2 className="w-3 h-3 mr-2 inline" />
                                Clear Memories
                            </button>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 space-y-[clamp(3rem,8vw,5rem)]">
                        {/* Details Section */}
                        <RevealSection id="details">
                            <div className="space-y-6 lg:space-y-8">
                                <h2 className="text-2xl lg:text-3xl font-black text-titanium tracking-tighter">Your Details</h2>
                                <div className="border border-titanium/[0.08] rounded-[24px] p-6 lg:p-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-titanium/30">Your Name</label>
                                            <div className="h-12 flex items-center px-6 bg-titanium/[0.04] rounded-full text-titanium font-bold text-sm">
                                                {user?.username}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-titanium/30">Your Email</label>
                                            <div className="h-12 flex items-center px-6 bg-titanium/[0.04] rounded-full text-titanium font-bold text-sm">
                                                {user?.email}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-titanium/30">Member Since</label>
                                            <div className="h-12 flex items-center px-6 bg-titanium/[0.04] rounded-full text-titanium font-bold text-sm opacity-50">
                                                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </RevealSection>

                        {/* Storage Quota Section */}
                        <RevealSection>
                            <div id="storage" className="space-y-6 lg:space-y-8 mt-12">
                                <h2 className="text-2xl lg:text-3xl font-black text-titanium tracking-tighter">Your Space</h2>
                                <div className="border border-titanium/[0.08] rounded-[24px] p-6 lg:p-12">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-titanium/[0.06] rounded-xl flex items-center justify-center">
                                            <HardDrive className="w-6 h-6 text-titanium/50" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-titanium tracking-tight">Free Memory</h3>
                                            <p className="text-sm text-titanium/40 font-medium">1 GB of complimentary lifetime storage</p>
                                        </div>
                                    </div>

                                    {storageLoading ? (
                                        <div className="h-8 bg-titanium/[0.06] rounded-full animate-pulse w-full" />
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="text-titanium">
                                                    {storageData ? (storageData.usage_bytes / (1024 * 1024)).toFixed(1) : 0} MB Used
                                                </span>
                                                <span className="text-titanium/40">
                                                    {storageData ? (storageData.quota_bytes / (1024 * 1024)).toFixed(0) : 1000} MB Total
                                                </span>
                                            </div>
                                            <div className="h-3 w-full bg-titanium/[0.08] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 rounded-full ${
                                                        (storageData?.usage_percentage || 0) > 90 ? 'bg-red-500' :
                                                        (storageData?.usage_percentage || 0) > 75 ? 'bg-amber-500' : 'bg-titanium/40'
                                                    }`}
                                                    style={{ width: `${storageData?.usage_percentage || 0}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-titanium/40 font-medium text-right">
                                                {(storageData?.usage_percentage || 0).toFixed(1)}% Full
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </RevealSection>

                        {/* Followers/Following Section */}
                        <RevealSection>
                            <div id="connections" className="space-y-6 lg:space-y-8">
                                <h2 className="text-2xl lg:text-3xl font-black text-titanium tracking-tighter">Connections</h2>
                                <div className="border border-titanium/[0.08] rounded-[24px] p-6 lg:p-12">
                                    <div className="flex gap-4 mb-8">
                                        <button
                                            onClick={() => setActiveTab('followers')}
                                            className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                                                activeTab === 'followers'
                                                    ? 'bg-titanium text-ivory'
                                                    : 'bg-titanium/[0.06] text-titanium hover:bg-titanium/[0.1]'
                                            }`}
                                        >
                                            Followers ({followersData?.count || 0})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('following')}
                                            className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${
                                                activeTab === 'following'
                                                    ? 'bg-titanium text-ivory'
                                                    : 'bg-titanium/[0.06] text-titanium hover:bg-titanium/[0.1]'
                                            }`}
                                        >
                                            Following ({followingData?.count || 0})
                                        </button>
                                    </div>

                                    {activeTab === 'followers' && (
                                        <div className="space-y-2">
                                            {followersLoading ? (
                                                <p className="text-titanium/40 text-center py-8 text-sm">Loading followers...</p>
                                            ) : followersData?.followers && followersData.followers.length > 0 ? (
                                                followersData.followers.map((follower: User) => (
                                                    <div
                                                        key={follower.id}
                                                        className="flex items-center justify-between p-4 border border-titanium/[0.06] rounded-xl"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-titanium/[0.08] rounded-full flex items-center justify-center text-titanium font-black text-sm">
                                                                {follower.username?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-titanium text-sm">{follower.username}</p>
                                                                <p className="text-xs text-titanium/40">
                                                                    Following since {follower.followed_at ? new Date(follower.followed_at).toLocaleDateString() : 'Unknown'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-titanium/40 text-center py-8 text-sm">No followers yet</p>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'following' && (
                                        <div className="space-y-2">
                                            {followingLoading ? (
                                                <p className="text-titanium/40 text-center py-8 text-sm">Loading following...</p>
                                            ) : followingData?.following && followingData.following.length > 0 ? (
                                                followingData.following.map((following: User) => (
                                                    <div
                                                        key={following.id}
                                                        className="flex items-center justify-between p-4 border border-titanium/[0.06] rounded-xl"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-titanium/[0.08] rounded-full flex items-center justify-center text-titanium font-black text-sm">
                                                                {following.username?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-titanium text-sm">{following.username}</p>
                                                                <p className="text-xs text-titanium/40">
                                                                    Followed since {following.followed_at ? new Date(following.followed_at).toLocaleDateString() : 'Unknown'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await unfollowUser(following.id).unwrap()
                                                                    addAlert({ type: 'success', message: `Unfollowed ${following.username}` })
                                                                } catch (err) {
                                                                    addAlert({ type: 'error', message: 'Failed to unfollow' })
                                                                }
                                                            }}
                                                            className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/5 rounded-full transition-colors"
                                                            title="Unfollow"
                                                        >
                                                            <UserMinus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-titanium/40 text-center py-8 text-sm">Not following anyone yet</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </RevealSection>

                        {/* Privacy Section */}
                        <RevealSection>
                            <div id="privacy" className="space-y-6 lg:space-y-8">
                                <h2 className="text-2xl lg:text-3xl font-black text-titanium tracking-tighter">Peace of Mind</h2>
                                <div className="border border-titanium/[0.08] rounded-[24px] p-6 lg:p-12 space-y-10">
                                    <div className="flex items-center justify-between py-4">
                                        <div>
                                            <p className="font-black text-titanium text-lg tracking-tight">Default Privacy</p>
                                            <p className="text-sm text-titanium/40 font-medium mt-1">New moments are private by default</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={profileSettings.default_event_privacy}
                                            onChange={(e) => setProfileSettings(prev => ({ ...prev, default_event_privacy: e.target.checked }))}
                                            className="h-6 w-12 appearance-none bg-titanium/[0.1] rounded-full checked:bg-titanium relative cursor-pointer before:content-[''] before:absolute before:top-1 before:left-1 before:h-4 before:w-4 before:bg-white before:rounded-full before:transition-all checked:before:left-7"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-4">
                                        <div>
                                            <p className="font-black text-titanium text-lg tracking-tight">Purposeful Forgetting</p>
                                            <p className="text-sm text-titanium/40 font-medium mt-1">How long should we remember you?</p>
                                        </div>
                                        <select
                                            value={profileSettings.auto_delete_days}
                                            onChange={(e) => setProfileSettings(prev => ({ ...prev, auto_delete_days: parseInt(e.target.value) }))}
                                            className="border border-titanium/[0.08] rounded-full px-6 py-3 text-sm font-bold text-titanium focus:outline-none bg-transparent"
                                        >
                                            <option value="1">24 Hours</option>
                                            <option value="7">7 Days</option>
                                            <option value="30">30 Days</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center justify-between p-6 rounded-xl bg-titanium/[0.03] border border-titanium/[0.06]">
                                            <div>
                                                <p className="font-black text-titanium tracking-tight">Notifications</p>
                                                <p className="text-xs text-titanium/40 font-medium mt-0.5">Alerts for mentions</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={profileSettings.email_notifications}
                                                onChange={(e) => setProfileSettings(prev => ({ ...prev, email_notifications: e.target.checked }))}
                                                className="h-5 w-5 rounded-full border-titanium/10 text-titanium focus:ring-black"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-6 rounded-xl bg-titanium/[0.03] border border-titanium/[0.06]">
                                            <div>
                                                <p className="font-black text-titanium tracking-tight">Searchable</p>
                                                <p className="text-xs text-titanium/40 font-medium mt-0.5">Let others find you</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={profileSettings.search_visibility}
                                                onChange={(e) => setProfileSettings(prev => ({ ...prev, search_visibility: e.target.checked }))}
                                                className="h-5 w-5 rounded-full border-titanium/10 text-titanium focus:ring-black"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </RevealSection>

                        {/* Protection Banner */}
                        <RevealSection>
                            <div id="protection" className="bg-titanium text-ivory rounded-[24px] p-10 lg:p-14 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="max-w-md">
                                        <h3 className="text-3xl font-black tracking-tighter mb-4">Safety First.</h3>
                                        <p className="text-ivory/50 text-sm font-medium leading-relaxed">
                                            Your biometric identity is never sold, never shared, and never stored permanently. You are always in control of your memory.
                                        </p>
                                    </div>
                                    <ShieldCheck className="w-20 h-20 opacity-20 group-hover:scale-110 group-hover:opacity-40 transition-all duration-700" />
                                </div>
                            </div>
                        </RevealSection>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-black/5 py-10 sm:py-16 px-5 sm:px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold tracking-tight text-titanium">Nenge</span>
                        </div>
                        <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-[0.15em] text-titanium/30">
                            <Link href="/about" className="hover:text-titanium/60 transition-colors duration-200">About Us</Link>
                            <Link href="/privacy" className="hover:text-titanium/60 transition-colors duration-200">Privacy</Link>
                            <Link href="/terms" className="hover:text-titanium/60 transition-colors duration-200">Terms</Link>
                            <Link href="/contact" className="hover:text-titanium/60 transition-colors duration-200">Contact</Link>
                        </div>
                        <div className="flex items-center gap-5">
                            <a href="https://instagram.com/getnenge" target="_blank" rel="noopener noreferrer" className="text-titanium/20 hover:text-titanium/50 transition-colors duration-200" aria-label="Instagram">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                    <div className="border-t border-black/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-[11px] text-titanium/20 font-medium">
                            &copy; {new Date().getFullYear()} Nenge. All rights reserved.
                        </p>
                        <p className="text-[11px] text-titanium/20 font-medium">
                            Every Moment Deserves to Be Found
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default ProfilePage
