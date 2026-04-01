'use client';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUI } from '@/hooks/use-api'
import Navigation from '@/components/Navigation'
import { AlertCircle, ShieldCheck, LogOut, Settings, Trash2, UserCheck, Lock, HardDrive } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import {
    useOptOutMutation,
    useGetFollowersQuery,
    useGetFollowingQuery,
    useUnfollowUserMutation,
    useGetStorageUsageQuery,
    type User
} from '@/lib/api'
import { Users, UserMinus } from 'lucide-react'

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true)
    }, [])

    const [profileSettings, setProfileSettings] = useState({
        default_event_privacy: true,
        auto_delete_days: 7,
        email_notifications: true,
        search_visibility: true
    })

    // Redirect to auth if not authenticated
    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push('/auth')
        }
    }, [isAuthenticated, router, mounted])

    const handleOptOut = async () => {
        if (confirm('⚠️ Are you absolutely sure you want to delete all face data?\n\nThis cannot be undone.')) {
            try {
                await optOutMutation(undefined).unwrap()
                addAlert({
                    type: 'success',
                    message: '✅ All face data deleted successfully'
                })
            } catch (error) {
                addAlert({
                    type: 'error',
                    message: 'Failed to delete data'
                })
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
            const offset = 100; // Account for the navigation header
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

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
                <div className="flex flex-col lg:flex-row gap-[clamp(2rem,5vw,4rem)]">
                    {/* macOS Style Sidebar */}
                    <aside className="lg:w-80 space-y-6 lg:space-y-12 animate-slide-up">
                        <div className="bg-white/40 glass border-white/60 rounded-apple-lg p-4 sm:p-10 text-center lg:text-center flex lg:flex-col items-center gap-4 lg:gap-0 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-titanium/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative flex-shrink-0 h-16 w-16 lg:h-24 lg:w-24 bg-titanium/5 border border-black/5 rounded-full items-center justify-center text-titanium text-2xl lg:text-4xl font-black tracking-tighter shadow-premium lg:mb-6">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left lg:text-center overflow-hidden">
                                <h1 className="text-xl lg:text-2xl font-black text-titanium tracking-tight truncate">{user?.username}</h1>
                                <p className="text-[10px] lg:text-xs text-titanium/40 mt-0.5 lg:mt-1 font-bold uppercase tracking-widest truncate">{user?.email}</p>
                            </div>
                        </div>

                        <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible no-scrollbar pb-2 lg:pb-0 px-2 lg:px-0">
                            <button
                                onClick={() => scrollToSection('details')}
                                className="whitespace-nowrap flex items-center space-x-3 lg:space-x-4 px-5 lg:px-8 py-3 lg:py-5 rounded-apple-md bg-white/60 glass text-titanium font-bold transition-all shadow-premium"
                            >
                                <Settings className="w-4 h-4 lg:w-5 lg:h-5 opacity-40" />
                                <span className="text-xs lg:text-base">Your Details</span>
                            </button>
                            <button
                                onClick={() => scrollToSection('connections')}
                                className="whitespace-nowrap flex items-center space-x-3 lg:space-x-4 px-5 lg:px-8 py-3 lg:py-5 rounded-apple-md text-titanium/40 hover:bg-white/20 hover:text-titanium font-bold transition-all group"
                            >
                                <Users className="w-4 h-4 lg:w-5 lg:h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xs lg:text-base">Connections</span>
                            </button>
                            <button
                                onClick={() => router.push('/event-access-requests')}
                                className="whitespace-nowrap flex items-center space-x-3 lg:space-x-4 px-5 lg:px-8 py-3 lg:py-5 rounded-apple-md text-titanium/40 hover:bg-white/20 hover:text-titanium font-bold transition-all group"
                            >
                                <Lock className="w-4 h-4 lg:w-5 lg:h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xs lg:text-base">Event Access Requests</span>
                            </button>
                            <button
                                onClick={() => scrollToSection('privacy')}
                                className="whitespace-nowrap flex items-center space-x-3 lg:space-x-4 px-5 lg:px-8 py-3 lg:py-5 rounded-apple-md text-titanium/40 hover:bg-white/20 hover:text-titanium font-bold transition-all group"
                            >
                                <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xs lg:text-base">Peace of Mind</span>
                            </button>
                            <button
                                onClick={() => scrollToSection('protection')}
                                className="whitespace-nowrap flex items-center space-x-3 lg:space-x-4 px-5 lg:px-8 py-3 lg:py-5 rounded-apple-md text-titanium/40 hover:bg-white/20 hover:text-titanium font-bold transition-all group"
                            >
                                <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                                <span className="text-xs lg:text-base">Data Protection</span>
                            </button>
                        </nav>

                        <div className="pt-8 space-y-3">
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                className="w-full h-12 border-black/5 hover:bg-black/5 text-titanium font-bold"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                End Session
                            </Button>
                            <Button
                                onClick={handleOptOut}
                                variant="ghost"
                                className="w-full h-10 text-red-600/40 hover:text-red-600 hover:bg-red-500/5 text-xs font-black uppercase tracking-widest"
                            >
                                <Trash2 className="w-3 h-3 mr-2" />
                                Clear Memories
                            </Button>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 space-y-[clamp(3rem,8vw,5rem)] animate-slide-up [animation-delay:100ms]">
                        {/* Details Section */}
                        <div id="details" className="space-y-6 lg:space-y-8">
                            <h2 className="text-2xl lg:text-3xl font-black text-titanium tracking-tighter">Your Details</h2>
                            <Card className="bg-white/40 glass border-white/60 p-0 space-y-10">
                                <div className="p-6 lg:p-12 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-titanium/30">Display Identity</label>
                                            <div className="h-12 flex items-center px-6 bg-titanium/5 rounded-full text-titanium font-bold border border-black/5">
                                                {user?.username}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-titanium/30">Contact Point</label>
                                            <div className="h-12 flex items-center px-6 bg-titanium/5 rounded-full text-titanium font-bold border border-black/5">
                                                {user?.email}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-titanium/30">Member Since</label>
                                            <div className="h-12 flex items-center px-6 bg-titanium/5 rounded-full text-titanium font-bold border border-black/5 opacity-50">
                                                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Storage Quota Section */}
                        <div id="storage" className="space-y-6 lg:space-y-8 mt-12">
                            <h2 className="text-2xl lg:text-3xl font-black text-titanium tracking-tighter">Storage Quota</h2>
                            <Card className="bg-white/40 glass border-white/60 p-0">
                                <div className="p-6 lg:p-12 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-titanium/5 rounded-xl flex items-center justify-center text-titanium">
                                            <HardDrive className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-titanium tracking-tight">Free Memory</h3>
                                            <p className="text-sm text-titanium/40 font-medium">1,000 MB (1GB) lifetime limit</p>
                                        </div>
                                    </div>

                                    {storageLoading ? (
                                        <div className="h-8 bg-black/5 rounded-full animate-pulse w-full"></div>
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
                                            {/* Progress Bar Container */}
                                            <div className="h-4 w-full bg-titanium/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${(storageData?.usage_percentage || 0) > 90 ? 'bg-red-500' :
                                                            (storageData?.usage_percentage || 0) > 75 ? 'bg-amber-500' : 'bg-green-500'
                                                        }`}
                                                    style={{ width: `${storageData?.usage_percentage || 0}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-titanium/40 font-medium text-right">
                                                {(storageData?.usage_percentage || 0).toFixed(1)}% Full
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Followers/Following Section */}
                        <div id="connections" className="space-y-6 lg:space-y-8">
                            <h2 className="text-2xl lg:text-3xl font-black text-titanium tracking-tighter">Connections</h2>
                            <Card className="bg-white/40 glass border-white/60 p-0">
                                <div className="p-6 lg:p-12">
                                    {/* Tabs */}
                                    <div className="flex gap-4 mb-8">
                                        <button
                                            onClick={() => setActiveTab('followers')}
                                            className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'followers'
                                                    ? 'bg-titanium text-ivory'
                                                    : 'bg-titanium/5 text-titanium hover:bg-titanium/10'
                                                }`}
                                        >
                                            Followers ({followersData?.count || 0})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('following')}
                                            className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === 'following'
                                                    ? 'bg-titanium text-ivory'
                                                    : 'bg-titanium/5 text-titanium hover:bg-titanium/10'
                                                }`}
                                        >
                                            Following ({followingData?.count || 0})
                                        </button>
                                    </div>

                                    {/* Followers List */}
                                    {activeTab === 'followers' && (
                                        <div className="space-y-3">
                                            {followersLoading ? (
                                                <p className="text-titanium/40 text-center py-8">Loading followers...</p>
                                            ) : followersData?.followers && followersData.followers.length > 0 ? (
                                                followersData.followers.map((follower: User) => (
                                                    <div
                                                        key={follower.id}
                                                        className="flex items-center justify-between p-4 bg-titanium/5 rounded-xl"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-titanium/10 rounded-full flex items-center justify-center text-titanium font-black">
                                                                {follower.username?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-titanium">{follower.username}</p>
                                                                <p className="text-xs text-titanium/40">
                                                                    Following since {follower.followed_at ? new Date(follower.followed_at).toLocaleDateString() : 'Unknown'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-titanium/40 text-center py-8">No followers yet</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Following List */}
                                    {activeTab === 'following' && (
                                        <div className="space-y-3">
                                            {followingLoading ? (
                                                <p className="text-titanium/40 text-center py-8">Loading following...</p>
                                            ) : followingData?.following && followingData.following.length > 0 ? (
                                                followingData.following.map((following: User) => (
                                                    <div
                                                        key={following.id}
                                                        className="flex items-center justify-between p-4 bg-titanium/5 rounded-xl"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-titanium/10 rounded-full flex items-center justify-center text-titanium font-black">
                                                                {following.username?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-titanium">{following.username}</p>
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
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                            title="Unfollow"
                                                        >
                                                            <UserMinus className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-titanium/40 text-center py-8">Not following anyone yet</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Privacy Section */}
                        <div id="privacy" className="space-y-6 lg:space-y-8">
                            <h2 className="text-2xl lg:text-3xl font-black text-titanium tracking-tighter">Peace of Mind</h2>
                            <Card className="bg-white/40 glass border-white/60 p-0 space-y-12">
                                <div className="p-6 lg:p-12 space-y-12">
                                    <div className="flex items-center justify-between group hover:bg-white/40 p-6 rounded-apple-lg transition-all">
                                        <div>
                                            <p className="font-black text-titanium text-lg tracking-tight">Default Privacy</p>
                                            <p className="text-sm text-titanium/40 font-medium mt-1">Automatically set all new gatherings to private</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={profileSettings.default_event_privacy}
                                            onChange={(e) => setProfileSettings(prev => ({ ...prev, default_event_privacy: e.target.checked }))}
                                            className="h-6 w-12 appearance-none bg-titanium/10 rounded-full checked:bg-titanium relative cursor-pointer before:content-[''] before:absolute before:top-1 before:left-1 before:h-4 before:w-4 before:bg-white before:rounded-full before:transition-all checked:before:left-7"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-6 rounded-apple-lg">
                                        <div>
                                            <p className="font-black text-titanium text-lg tracking-tight">Purposeful Forgetting</p>
                                            <p className="text-sm text-titanium/40 font-medium mt-1">How long should we remember your face data?</p>
                                        </div>
                                        <select
                                            value={profileSettings.auto_delete_days}
                                            onChange={(e) => setProfileSettings(prev => ({ ...prev, auto_delete_days: parseInt(e.target.value) }))}
                                            className="bg-white/50 glass border-black/5 rounded-full px-6 py-3 text-sm font-bold text-titanium focus:outline-none"
                                        >
                                            <option value="1">24 Hours</option>
                                            <option value="7">7 Days</option>
                                            <option value="30">30 Days</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="flex items-center justify-between p-6 rounded-apple-lg bg-titanium/5 border border-black/5">
                                            <div>
                                                <p className="font-black text-titanium tracking-tight">Notifications</p>
                                                <p className="text-xs text-titanium/40 font-medium mt-0.5">Alerts for mentions</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={profileSettings.email_notifications}
                                                onChange={(e) => setProfileSettings(prev => ({ ...prev, email_notifications: e.target.checked }))}
                                                className="h-5 w-5 rounded-full border-black/10 text-titanium focus:ring-black"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-6 rounded-apple-lg bg-titanium/5 border border-black/5">
                                            <div>
                                                <p className="font-black text-titanium tracking-tight">Searchable</p>
                                                <p className="text-xs text-titanium/40 font-medium mt-0.5">Let others find you</p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={profileSettings.search_visibility}
                                                onChange={(e) => setProfileSettings(prev => ({ ...prev, search_visibility: e.target.checked }))}
                                                className="h-5 w-5 rounded-full border-black/10 text-titanium focus:ring-black"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Protection Banner */}
                        <div id="protection" className="bg-black text-ivory rounded-apple-lg p-8 lg:p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="max-w-md">
                                    <h3 className="text-3xl font-black tracking-tighter mb-4 italic">Safety First.</h3>
                                    <p className="text-ivory/60 text-sm font-medium leading-relaxed">
                                        Your biometric identity is never sold, never shared, and never stored permanently. You are always in control of your memory.
                                    </p>
                                </div>
                                <ShieldCheck className="w-20 h-20 opacity-20 group-hover:scale-110 group-hover:opacity-40 transition-all duration-700" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default ProfilePage
