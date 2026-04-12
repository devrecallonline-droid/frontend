'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Badge, Input } from '@/components/ui';
import { 
    Search,
    Filter,
    MoreVertical,
    Mail,
    Calendar,
    CheckCircle,
    XCircle,
    UserPlus,
    Download,
    ChevronLeft,
    ChevronRight,
    Shield,
    Loader2,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { adminUsersApi, type AdminUserItem, type UserStats } from '@/lib/adminApi';

const AdminUsersPage = () => {
    const [users, setUsers] = useState<AdminUserItem[]>([]);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const [usersData, statsData] = await Promise.all([
                adminUsersApi.list({ search: searchQuery, status: selectedStatus, page: currentPage, limit: itemsPerPage }),
                adminUsersApi.getStats(),
            ]);
            setUsers(usersData.users);
            setTotalPages(usersData.totalPages);
            setTotal(usersData.total);
            setUserStats(statsData);
        } catch (error) {
            console.error('Users fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedStatus, currentPage]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedStatus]);

    const handleToggleStatus = async (userId: string, currentStatus: string) => {
        const newActive = currentStatus !== 'active';
        try {
            await adminUsersApi.updateStatus(userId, newActive);
            fetchUsers();
        } catch (error) {
            console.error('Toggle status error:', error);
        }
    };

    const formatDate = (date: string) => {
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
                                Users
                            </h2>
                            <p className="text-titanium/50 mt-1">
                                Manage user accounts and permissions
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
                                <span className="text-2xl font-bold text-blue-600">{userStats?.totalUsers ?? '—'}</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-titanium/40">Total Users</p>
                                <p className="text-sm font-medium text-titanium">All time</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-apple-sm flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-titanium/40">Active</p>
                                <p className="text-sm font-medium text-titanium">{userStats?.activeUsers ?? '—'} users</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-apple-sm flex items-center justify-center">
                                <Shield className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-titanium/40">Admins</p>
                                <p className="text-sm font-medium text-titanium">{userStats?.adminCount ?? '—'} users</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-apple-sm flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-titanium/40">New This Month</p>
                                <p className="text-sm font-medium text-titanium">{userStats?.newThisMonth ?? '—'} users</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-titanium/40" />
                            <Input
                                placeholder="Search users by name or email..."
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
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </Card>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-titanium/40" />
                    </div>
                ) : (
                    <Card noPadding>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-titanium/5 border-b border-black/5">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-titanium/60">User</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-titanium/60">Status</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-titanium/60">Events</th>
                                        <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-titanium/60">Joined</th>
                                        <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-titanium/60">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-titanium/40 font-medium">
                                                No users found
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="border-b border-black/5 last:border-0 hover:bg-titanium/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-titanium/10 rounded-full flex items-center justify-center">
                                                            <span className="text-sm font-bold text-titanium">
                                                                {user.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-titanium">{user.name}</p>
                                                            <p className="text-xs text-titanium/50 flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {user.status === 'active' ? (
                                                            <>
                                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                <span className="text-sm text-titanium/70">Active</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                                                <span className="text-sm text-titanium/70">Inactive</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-titanium font-medium">{user.events}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-titanium/70">{formatDate(user.joined)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleToggleStatus(user.id, user.status)}
                                                        className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                                                        title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                                                    >
                                                        {user.status === 'active' ? (
                                                            <ToggleRight className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <ToggleLeft className="w-5 h-5 text-titanium/40" />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {users.length > 0 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-black/5">
                                <p className="text-sm text-titanium/60">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} users
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
                    </Card>
                )}
            </main>
        </div>
    );
};

export default AdminUsersPage;