'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUI } from '@/hooks/use-api';
import { useGetEventsQuery, useCreateEventMutation, useDeleteEventMutation, useGetEventAccessRequestsQuery } from '@/lib/api';
import Navigation from '@/components/Navigation';
import { Button, Badge } from '@/components/ui';
import {
    Calendar,
    MapPin,
    Plus,
    Search,
    Loader2,
    Image as ImageIcon,
    ArrowRight,
    Share2,
    Upload as UploadIcon,
    Trash2,
    Bell,
    Copy,
    Check
} from 'lucide-react';
import { CreateEventModal } from '@/components/CreateEventModal';

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

const RevealSection = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const { ref, revealed } = useReveal();
  return (
    <div ref={ref} className={`${className} transition-all duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
};

const EventsPage = () => {
    const { isAuthenticated, user } = useAuth();
    const { data: events, isLoading, refetch } = useGetEventsQuery();
    const { data: requestsData } = useGetEventAccessRequestsQuery(undefined, { skip: !isAuthenticated });
    const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
    const [deleteEvent] = useDeleteEventMutation();
    const router = useRouter();
    const { addAlert } = useUI();
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deletedEventIds, setDeletedEventIds] = useState<string[]>([]);
    const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.push('/auth');
        }
    }, [mounted, isAuthenticated, router]);

    const handleCreateEvent = () => {
        setIsModalOpen(true);
    };

    const filteredEvents = events?.filter(event =>
        !deletedEventIds.includes(event.id) && (
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-ivory flex flex-col">
            <Navigation />

            <main className="flex-1 max-w-7xl mx-auto w-full px-5 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-20">
                <header className="mb-10 sm:mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8">
                    <div>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-titanium tracking-tighter leading-[0.9]">
                            Your Events.<br />
                            <span className="text-titanium/30">Every moment, remembered.</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                        <div className="relative group flex-1 lg:flex-none">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-titanium/30 group-focus-within:text-titanium/50 transition-colors" />
                            <input
                                placeholder="Search events..."
                                className="pl-12 w-full lg:w-[280px] h-12 sm:h-14 rounded-full border border-titanium/[0.08] bg-transparent text-sm text-titanium font-medium placeholder:text-titanium/30 focus:outline-none focus:border-titanium/20 focus:bg-titanium/[0.02] transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleCreateEvent}
                            disabled={isCreating}
                            className="h-14 w-14 rounded-full bg-titanium text-ivory flex items-center justify-center hover:bg-black transition-all duration-300 active:scale-[0.97] shrink-0 cursor-pointer disabled:opacity-50"
                            aria-label="Create event"
                        >
                            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
                        </button>
                    </div>
                </header>

                {requestsData && requestsData.count > 0 && (
                    <RevealSection className="mb-10 sm:mb-12">
                        <div
                            className="border border-titanium/[0.08] rounded-[20px] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-titanium/[0.02] transition-all duration-300"
                            onClick={() => router.push('/event-access-requests')}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-titanium/[0.06] flex items-center justify-center shrink-0">
                                    <Bell className="w-5 h-5 text-titanium/50" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-black text-titanium tracking-tight mb-0.5">Access Requests</h3>
                                    <p className="text-[13px] sm:text-sm text-titanium/40 font-medium">{requestsData.count} pending {requestsData.count === 1 ? 'request' : 'requests'}</p>
                                </div>
                            </div>
                            <span className="text-titanium/30 text-sm font-bold hover:text-titanium/60 transition-colors shrink-0">
                                Review All
                            </span>
                        </div>
                    </RevealSection>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40">
                        <Loader2 className="w-10 h-10 text-titanium/20 animate-spin mb-6" />
                        <p className="text-titanium/30 font-bold uppercase tracking-widest text-xs">Loading...</p>
                    </div>
                ) : filteredEvents && filteredEvents.length > 0 ? (
                    <RevealSection>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                            {filteredEvents.map((event) => {
                                const hasCoverPhoto = !!event.cover_image_url;

                                return (
                                    <div
                                        key={event.id}
                                        className="group flex flex-col cursor-pointer border border-titanium/[0.08] rounded-[24px] overflow-hidden hover:border-titanium/[0.15] transition-all duration-300 bg-transparent"
                                        onClick={() => router.push(`/events/${event.id}`)}
                                    >
                                        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-titanium/[0.03] shrink-0">
                                            {hasCoverPhoto ? (
                                                <>
                                                    <img
                                                        src={event.cover_image_url || `https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80`}
                                                        alt={event.title}
                                                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon className="w-10 h-10 text-titanium/10" />
                                                </div>
                                            )}

                                            <div className="absolute top-4 left-4">
                                                <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-titanium/[0.08] text-titanium/60">
                                                    {event.owner_id === user?.id ? 'Host' : 'Guest'}
                                                </span>
                                            </div>

                                            <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        const url = `${window.location.origin}/events/${event.id}`;
                                                        try {
                                                            await navigator.clipboard.writeText(url);
                                                            setCopiedEventId(event.id);
                                                            setTimeout(() => setCopiedEventId(null), 2000);
                                                            addAlert({ type: 'success', message: 'Invite link copied to clipboard!' });
                                                        } catch (err) {
                                                            console.error('Error copying:', err);
                                                        }
                                                    }}
                                                    className={`p-2 rounded-full transition-all ${
                                                        copiedEventId === event.id
                                                            ? 'bg-titanium/10 text-titanium/60'
                                                            : 'bg-white/70 text-titanium/40 hover:text-titanium/60 hover:bg-white'
                                                    }`}
                                                    title="Copy Invite Link"
                                                >
                                                    {copiedEventId === event.id ? (
                                                        <Check className="w-4 h-4" />
                                                    ) : (
                                                        <Copy className="w-4 h-4" />
                                                    )}
                                                </button>
                                                {event.owner_id === user?.id && (!event.photo_count || event.photo_count === 0) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/upload/${event.id}`);
                                                        }}
                                                        className="p-2 rounded-full bg-white/70 text-titanium/40 hover:text-titanium/60 hover:bg-white transition-all"
                                                        title="Add Photos"
                                                    >
                                                        <UploadIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {event.owner_id === user?.id && (
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('Are you sure you want to delete this gathering? This action cannot be undone and will delete all photos.')) {
                                                                try {
                                                                    setDeletedEventIds(prev => [...prev, event.id]);
                                                                    await deleteEvent(event.id).unwrap();
                                                                    addAlert({ type: 'success', message: 'Gathering deleted successfully' });
                                                                } catch (err) {
                                                                    setDeletedEventIds(prev => prev.filter(id => id !== event.id));
                                                                    addAlert({ type: 'error', message: 'Failed to delete gathering' });
                                                                }
                                                            }
                                                        }}
                                                        className="p-2 rounded-full bg-red-500/10 text-red-500/60 hover:bg-red-500/20 hover:text-red-500 transition-all"
                                                        title="Delete Gathering"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 sm:p-5 flex-1 flex flex-col space-y-3">
                                            <div>
                                                <h3 className="text-lg sm:text-xl font-black text-titanium mb-1 tracking-tight line-clamp-1">{event.title}</h3>
                                                <p className="text-[13px] text-titanium/40 font-medium line-clamp-2 leading-relaxed">
                                                    {event.description || 'No description yet.'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-4 text-titanium/30 text-[11px] font-bold uppercase tracking-tight">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBD'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate max-w-[160px]">{event.location || 'Virtual'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </RevealSection>
                ) : (
                    <RevealSection>
                        <div className="py-24 sm:py-40 px-6 text-center border border-titanium/[0.06] rounded-[24px]">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-titanium/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
                                <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-titanium/10" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-titanium mb-3 sm:mb-4 tracking-tight">Nothing here yet</h3>
                            <p className="text-[13px] sm:text-sm text-titanium/40 font-medium mb-10 max-w-xs mx-auto leading-relaxed">
                                {searchTerm
                                    ? "No events match your search."
                                    : "Create your first event. Your memories will live here."}
                            </p>
                            <button
                                onClick={() => searchTerm ? setSearchTerm('') : handleCreateEvent()}
                                className="h-12 px-8 rounded-full bg-titanium text-ivory font-bold text-sm tracking-tight hover:bg-black transition-all duration-300 active:scale-[0.97] cursor-pointer"
                            >
                                {searchTerm ? 'Clear Search' : 'Create an Event'}
                            </button>
                        </div>
                    </RevealSection>
                )}
            </main>

            {/* Mobile FAB */}
            <button
                onClick={handleCreateEvent}
                disabled={isCreating}
                className="sm:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-titanium text-white flex items-center justify-center active:scale-90 transition-transform z-[60] cursor-pointer disabled:opacity-50"
                aria-label="Create event"
            >
                {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
            </button>

            <CreateEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => refetch()}
            />
        </div>
    );
};

export default EventsPage;
