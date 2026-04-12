'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUI } from '@/hooks/use-api';
import { useGetEventsQuery, useCreateEventMutation, useDeleteEventMutation, useGetEventAccessRequestsQuery } from '@/lib/api';
import Navigation from '@/components/Navigation';
import { Button, Card, Badge, Input } from '@/components/ui';
import {
    Calendar,
    MapPin,
    Plus,
    Search,
    Loader2,
    Image as ImageIcon,
    ChevronRight,
    Activity,
    Share2,
    Upload as UploadIcon,
    Trash2,
    Bell,
    Copy,
    Check
} from 'lucide-react';
import { CreateEventModal } from '@/components/CreateEventModal';

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
    // Local state to hide events immediately after deletion (optimistic UI)
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
                <header className="mb-10 sm:mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 animate-slide-up">
                    <div>
                        <Badge variant="secondary" className="mb-3 sm:mb-4">
                            <Activity className="w-3 h-3 mr-2" />
                            Live System Status
                        </Badge>
                        <h1 className="text-[32px] sm:text-5xl md:text-7xl font-black text-titanium tracking-tighter leading-[0.9]">
                            Your <span className="opacity-30">Gatherings.</span><br />
                            Shared Memories.
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                        <div className="relative group flex-1 lg:flex-none">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-titanium/40 group-focus-within:text-titanium transition-colors" />
                            <Input
                                placeholder="Search gatherings..."
                                className="pl-12 w-full lg:w-[280px] h-12 sm:h-14 bg-white/60 border-titanium/5 focus:bg-white hover:bg-white/80 transition-all rounded-full shadow-sm text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleCreateEvent} disabled={isCreating} className="hidden sm:flex h-14 w-14 rounded-full shrink-0 items-center justify-center p-0 hover:shadow-md transition-shadow">
                            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
                        </Button>
                    </div>
                </header>

                {requestsData && requestsData.count > 0 && (
                    <section className="mb-10 sm:mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <Card className="bg-red-500/[0.03] border-red-500/10 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group cursor-pointer hover:bg-red-500/[0.06] transition-all duration-300 rounded-[24px]"
                            onClick={() => router.push('/event-access-requests')}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 shrink-0 bg-red-500 rounded-[16px] flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(239,68,68,0.4)] relative">
                                    <Bell className="w-5 h-5 text-white animate-[ring_2s_ease-in-out_infinite]" />
                                    <div className="absolute inset-0 rounded-[16px] border border-red-500/20 animate-ping" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-black text-titanium tracking-tight mb-0.5">Access Requests</h3>
                                    <p className="text-[13px] sm:text-sm text-titanium/50 font-medium">{requestsData.count} {requestsData.count === 1 ? 'guest is' : 'guests are'} waiting to enter.</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 rounded-full font-bold h-10 px-6 transition-all shrink-0"
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    router.push('/event-access-requests');
                                }}
                            >
                                Review All
                            </Button>
                        </Card>
                    </section>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 animate-slide-up">
                        <Loader2 className="w-12 h-12 text-titanium animate-spin mb-6 opacity-20" />
                        <p className="text-titanium/40 font-bold uppercase tracking-widest text-xs">Opening Your Memories...</p>
                    </div>
                ) : filteredEvents && filteredEvents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        {filteredEvents.map((event) => {
                            const hasCoverPhoto = !!event.cover_image_url;
                            const buttonStyle = hasCoverPhoto
                                ? "bg-white/20 hover:bg-white/40 text-white border border-transparent"
                                : "bg-white/60 hover:bg-white backdrop-blur-md text-titanium/70 hover:text-titanium border border-white/80 shadow-sm";

                            return (
                                <Card
                                    key={event.id}
                                    className="group flex flex-col hover-lift cursor-pointer border-white/60 bg-white/40 backdrop-blur-md rounded-[24px] relative overflow-hidden transform-gpu"
                                    onClick={() => router.push(`/events/${event.id}`)}
                                >
                                    <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-titanium/5 shrink-0 rounded-t-[24px]">
                                        {hasCoverPhoto ? (
                                            <>
                                                <img
                                                    src={event.cover_image_url || `https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80`}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
                                            </>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-700 ease-out">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/60 blur-2xl rounded-full translate-x-10 -translate-y-10" />
                                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-titanium/5 blur-3xl rounded-full -translate-x-10 translate-y-10" />
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <div className="w-16 h-16 rounded-2xl bg-white/50 backdrop-blur-md shadow-sm border border-white/60 flex items-center justify-center group-hover:-translate-y-1 transition-transform duration-500">
                                                        <ImageIcon className="w-8 h-8 text-titanium/20" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute top-4 left-4">
                                            <Badge className={`backdrop-blur-sm font-black border-0 shadow-sm ${hasCoverPhoto ? 'bg-white/90 text-titanium' : 'bg-white/70 text-titanium'}`}>
                                                {event.owner_id === user?.id ? 'Managed' : 'Joined'}
                                            </Badge>
                                        </div>

                                        <div className="absolute top-4 right-4 flex items-center gap-1 sm:gap-2">
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
                                                className={`p-1.5 sm:p-2 backdrop-blur-md rounded-full transition-all ${copiedEventId === event.id
                                                        ? 'bg-green-500/80 text-white border-transparent shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                                                        : buttonStyle
                                                    }`}
                                                title="Copy Invite Link"
                                            >
                                                {copiedEventId === event.id ? (
                                                    <Check className="w-4 h-4 animate-in zoom-in duration-300" />
                                                ) : (
                                                    <Copy className="w-4 h-4 animate-in zoom-in duration-300" />
                                                )}
                                            </button>
                                            {event.owner_id === user?.id && (!event.photo_count || event.photo_count === 0) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/upload/${event.id}`);
                                                    }}
                                                    className={`p-1.5 sm:p-2 backdrop-blur-md rounded-full transition-all ${buttonStyle}`}
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
                                                    className="p-1.5 sm:p-2 bg-red-500/80 hover:bg-red-500 backdrop-blur-md text-white rounded-full transition-all"
                                                    title="Delete Gathering"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-2.5 sm:p-3 flex-1 flex flex-col space-y-2 sm:space-y-3">
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-black text-titanium mb-1 sm:mb-2 tracking-tight line-clamp-1">{event.title}</h3>
                                            <p className="text-[13px] sm:text-sm text-titanium/50 font-medium line-clamp-2 leading-relaxed">
                                                {event.description || 'No description shared for this gathering.'}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-black/5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mt-auto">
                                            <div className="flex items-center space-x-2.5 text-titanium/40">
                                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-tight">
                                                    {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBD'}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2.5 text-titanium/40">
                                                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-tight truncate max-w-[200px]">
                                                    {event.location || 'Virtual'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-black/5 pt-3">
                                            <div className="flex items-center space-x-2 text-titanium/20 group-hover:text-titanium/40 transition-colors">
                                                <ImageIcon className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                                    {event.photo_count || 0} {event.photo_count === 1 ? 'Memory' : 'Memories'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-24 sm:py-40 px-6 text-center bg-white/50 backdrop-blur-sm rounded-[32px] border border-titanium/[0.03] animate-slide-up shadow-sm" style={{ animationDelay: '0.2s' }}>
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-titanium/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 hover:scale-110 transition-transform duration-500">
                            <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-titanium opacity-20" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-titanium mb-3 sm:mb-4 tracking-tight">No events found</h3>
                        <p className="text-[13px] sm:text-sm text-titanium/40 font-medium mb-10 max-w-xs mx-auto leading-relaxed">
                            {searchTerm
                                ? "We couldn't find any events matching your search."
                                : "Host your first event and help your friends find their favorite moments."}
                        </p>
                        <Button
                            onClick={() => searchTerm ? setSearchTerm('') : handleCreateEvent()}
                            className="h-12 px-8 rounded-full font-bold shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] active:scale-95 transition-all"
                        >
                            {searchTerm ? 'Clear Search' : 'Host an Event'}
                        </Button>
                    </div>
                )}
            </main>

            {/* Mobile Floating Action Button */}
            <Button
                onClick={handleCreateEvent}
                disabled={isCreating}
                className="sm:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.2)] z-[60] flex items-center justify-center p-0 bg-titanium text-white active:scale-95 transition-transform"
            >
                {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
            </Button>

            <CreateEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => refetch()}
            />
        </div>
    );
};

export default EventsPage;
