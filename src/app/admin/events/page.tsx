'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Badge, Input } from '@/components/ui';
import { 
    Search,
    Filter,
    MoreVertical,
    Calendar,
    Users,
    Image as ImageIcon,
    Plus,
    Download,
    ChevronLeft,
    ChevronRight,
    Eye,
    Edit,
    Trash2,
    MapPin,
    Loader2
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { adminEventsApi, type AdminEvent, type EventStats } from '@/lib/adminApi';

const AdminEventsPage = () => {
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [eventStats, setEventStats] = useState<EventStats | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 6;

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const [eventsData, statsData] = await Promise.all([
                adminEventsApi.list({ search: searchQuery, status: selectedStatus, page: currentPage, limit: itemsPerPage }),
                adminEventsApi.getStats(),
            ]);
            setEvents(eventsData.events);
            setTotalPages(eventsData.totalPages);
            setTotal(eventsData.total);
            setEventStats(statsData);
        } catch (error) {
            console.error('Events fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedStatus, currentPage]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Debounce search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedStatus]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'completed': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (date: string | null) => {
        if (!date) return 'No date';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-ivory flex">
            <AdminSidebar />
            
            <main className="flex-1 p-4 lg:p-8 overflow-auto lg:pt-8 pt-20">
                <header className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-titanium tracking-tight">
                                Events
                            </h2>
                            <p className="text-titanium/50 mt-1">
                                Manage all events and their content
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="gap-2">
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-apple-sm flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-titanium/40">Total Events</p>
                                <p className="text-2xl font-black text-titanium">{eventStats?.totalEvents ?? '—'}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-apple-sm flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-titanium/40">Active</p>
                                <p className="text-2xl font-black text-titanium">{eventStats?.activeEvents ?? '—'}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-apple-sm flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-titanium/40">Total Photos</p>
                                <p className="text-2xl font-black text-titanium">{eventStats?.totalPhotos?.toLocaleString() ?? '—'}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-apple-sm flex items-center justify-center">
                                <Users className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-titanium/40">Total Guests</p>
                                <p className="text-2xl font-black text-titanium">{eventStats?.totalGuests?.toLocaleString() ?? '—'}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-titanium/40" />
                            <Input
                                placeholder="Search events by title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="h-12 px-4 rounded-full border border-black/5 bg-white/50 glass text-sm text-titanium focus:outline-none focus:ring-2 focus:ring-black/10"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                            </select>
                            <div className="flex rounded-full border border-black/5 bg-white/50 glass p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                        viewMode === 'grid' ? 'bg-titanium text-white' : 'text-titanium/70 hover:text-titanium'
                                    }`}
                                >
                                    Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                        viewMode === 'list' ? 'bg-titanium text-white' : 'text-titanium/70 hover:text-titanium'
                                    }`}
                                >
                                    List
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-titanium/40" />
                    </div>
                ) : events.length === 0 ? (
                    <Card className="text-center py-16">
                        <Calendar className="w-12 h-12 text-titanium/20 mx-auto mb-4" />
                        <p className="text-titanium/40 font-medium">No events found</p>
                    </Card>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {events.map((event) => (
                            <Card key={event.id} className="hover-lift group">
                                <div className="relative h-48 bg-gradient-to-br from-titanium/10 to-titanium/5 rounded-t-2xl overflow-hidden mb-4">
                                    {event.cover_image_url ? (
                                        <img 
                                            src={event.cover_image_url} 
                                            alt={event.title}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ImageIcon className="w-16 h-16 text-titanium/20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4">
                                        <Badge className={`${getStatusColor(event.status)} text-[10px] uppercase`}>
                                            {event.status}
                                        </Badge>
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="font-bold text-titanium text-lg line-clamp-1">{event.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-titanium/60">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(event.date)}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-titanium/60">
                                        <MapPin className="w-4 h-4" />
                                        {event.location}
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-black/5">
                                        <div className="flex gap-4 text-sm text-titanium/60">
                                            <span className="flex items-center gap-1">
                                                <ImageIcon className="w-4 h-4" />
                                                {event.photos}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {event.guests}
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                                                <Eye className="w-4 h-4 text-titanium/60" />
                                            </button>
                                            <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                                                <Edit className="w-4 h-4 text-titanium/60" />
                                            </button>
                                            <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4 text-titanium/60" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card noPadding className="mb-8">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-titanium/5 border-b border-black/5">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-titanium/60">Event</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-titanium/60">Date</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-titanium/60">Status</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-titanium/60">Photos</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-titanium/60">Guests</th>
                                        <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-titanium/60">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map((event) => (
                                        <tr key={event.id} className="border-b border-black/5 last:border-0 hover:bg-titanium/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-titanium/5 rounded-apple-sm overflow-hidden flex items-center justify-center shrink-0">
                                                        {event.cover_image_url ? (
                                                            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="w-4 h-4 text-titanium/40" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-titanium">{event.title}</p>
                                                        <p className="text-xs text-titanium/50">by {event.creator}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-titanium/70">{formatDate(event.date)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`${getStatusColor(event.status)} text-[10px] uppercase`}>
                                                    {event.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-titanium font-medium">{event.photos}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-titanium font-medium">{event.guests}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                                                        <Eye className="w-4 h-4 text-titanium/60" />
                                                    </button>
                                                    <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                                                        <Edit className="w-4 h-4 text-titanium/60" />
                                                    </button>
                                                    <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                                                        <MoreVertical className="w-4 h-4 text-titanium/60" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {!loading && events.length > 0 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-titanium/60">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} events
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminEventsPage;