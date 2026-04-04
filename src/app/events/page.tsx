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
    Bell
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

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 sm:pt-32 pb-20">
                <header className="mb-12 lg:mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8 animate-slide-up">
                    <div>
                        <Badge variant="secondary" className="mb-4">
                            <Activity className="w-3 h-3 mr-2" />
                            Live System Status
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-titanium tracking-tighter leading-[0.9]">
                            Your <span className="opacity-30">Gatherings.</span><br />
                            Shared Memories.
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative group flex-1 lg:flex-none">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-titanium/30 group-focus-within:text-titanium transition-colors" />
                            <Input
                                placeholder="Filter events..."
                                className="pl-11 w-full lg:w-[260px] h-14 bg-white/40 border-black/5"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleCreateEvent} disabled={isCreating} size="icon" className="h-14 w-14 rounded-full shrink-0">
                            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
                        </Button>
                    </div>
                </header>
                
                {requestsData && requestsData.count > 0 && (
                    <section className="mb-12 animate-slide-up">
                         <Card className="bg-red-500/5 border-red-500/10 p-6 flex items-center justify-between group cursor-pointer hover:bg-red-500/10 transition-colors"
                               onClick={() => router.push('/event-access-requests')}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-red-500/20">
                                    <Bell className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-titanium tracking-tight">Access Requests</h3>
                                    <p className="text-titanium/50 font-medium">{requestsData.count} {requestsData.count === 1 ? 'guest is' : 'guests are'} waiting to enter your private vaults.</p>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                className="border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-full font-bold"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
                        {filteredEvents.map((event) => (
                            <Card
                                key={event.id}
                                className="group hover:scale-[1.02] transition-all duration-500 cursor-pointer border-white/40 relative overflow-hidden"
                                onClick={() => router.push(`/events/${event.id}`)}
                            >
                                {/* <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-6 h-6 text-titanium/30" />
                                </div> */}

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <Badge className="bg-titanium/5 text-titanium">
                                            {event.owner_id === user?.id ? 'Managed' : 'Joined'}
                                        </Badge>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const url = `${window.location.origin}/events/${event.id}`;
                                                    navigator.clipboard.writeText(url);
                                                    addAlert({ type: 'success', message: 'Invite link copied to clipboard!' });
                                                }}
                                                className="p-2 hover:bg-titanium/5 rounded-full transition-colors text-titanium/20 hover:text-titanium"
                                                title="Share Event"
                                            >
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                            {event.owner_id === user?.id && (!event.photo_count || event.photo_count === 0) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/upload/${event.id}`);
                                                    }}
                                                    className="p-2 bg-titanium/5 hover:bg-titanium text-titanium/40 hover:text-ivory rounded-full transition-all"
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
                                                                // Optimistically hide the event immediately
                                                                setDeletedEventIds(prev => [...prev, event.id]);

                                                                await deleteEvent(event.id).unwrap();
                                                                addAlert({ type: 'success', message: 'Gathering deleted successfully' });
                                                            } catch (err) {
                                                                // If it fails, bring it back (optional, but good UX)
                                                                setDeletedEventIds(prev => prev.filter(id => id !== event.id));
                                                                addAlert({ type: 'error', message: 'Failed to delete gathering' });
                                                            }
                                                        }
                                                    }}
                                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-all"
                                                    title="Delete Gathering"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-titanium mb-2 tracking-tight line-clamp-1">{event.title}</h3>
                                        <p className="text-sm text-titanium/50 font-medium line-clamp-2 leading-relaxed">
                                            {event.description || 'No description shared for this gathering.'}
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-black/5 grid grid-cols-2 gap-4">
                                        <div className="flex items-center space-x-2 text-titanium/40">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-tight">
                                                {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBD'}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-titanium/40">
                                            <MapPin className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-tight truncate">
                                                {event.location || 'Virtual'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 text-titanium/20 group-hover:text-titanium/40 transition-colors pt-2">
                                        <ImageIcon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                            {event.photo_count || 0} {event.photo_count === 1 ? 'Memory' : 'Memories'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-40 text-center bg-white/40 glass rounded-apple-xl border-dashed border-2 border-black/5 animate-slide-up">
                        <div className="w-20 h-20 bg-titanium/5 rounded-apple-lg flex items-center justify-center mx-auto mb-8">
                            <ImageIcon className="w-10 h-10 text-titanium opacity-10" />
                        </div>
                        <h3 className="text-2xl font-black text-titanium mb-4 italic tracking-tight">No Gatherings Yet</h3>
                        <p className="text-titanium/40 font-medium mb-12 max-w-xs mx-auto">Host your first event and help your friends find their favorite moments.</p>
                        <Button onClick={handleCreateEvent}>Host an Event</Button>
                    </div>
                )}
            </main>

            <CreateEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => refetch()}
            />
        </div>
    );
};

export default EventsPage;
