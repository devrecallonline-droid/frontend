'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Badge } from '@/components/ui';
import { 
    Users, 
    Calendar, 
    TrendingUp,
    Activity,
    ChevronRight,
    Image as ImageIcon,
    Upload,
    UserPlus,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { adminDashboardApi, getAdminUser, type DashboardStats, type ActivityItem } from '@/lib/adminApi';

const AdminDashboardPage = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const adminUser = getAdminUser();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, activityData] = await Promise.all([
                    adminDashboardApi.getStats(),
                    adminDashboardApi.getRecentActivity(),
                ]);
                setStats(statsData);
                setActivities(activityData);
            } catch (error) {
                console.error('Dashboard fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'event_created': return Calendar;
            case 'user_registered': return UserPlus;
            case 'photo_uploaded': return Upload;
            default: return Activity;
        }
    };

    const getTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now.getTime() - time.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days ago`;
    };

    const statItems = stats ? [
        { label: 'Total Users', value: stats.totalUsers.value.toLocaleString(), change: stats.totalUsers.change, icon: Users },
        { label: 'Active Events', value: stats.activeEvents.value.toLocaleString(), change: stats.activeEvents.change, icon: Calendar },
        { label: 'Uploads Today', value: stats.uploadsToday.value.toLocaleString(), change: stats.uploadsToday.change, icon: ImageIcon },
        { label: 'Growth Rate', value: stats.growthRate.value, change: stats.growthRate.change, icon: TrendingUp },
    ] : [];

    return (
        <div className="min-h-screen bg-ivory flex">
            <AdminSidebar />

            <main className="flex-1 p-4 lg:p-8 overflow-auto lg:pt-8 pt-20">
                <header className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-titanium tracking-tight">
                                Dashboard Overview
                            </h2>
                            <p className="text-titanium/50 mt-1">
                                Welcome back, {adminUser?.name || 'Administrator'}
                            </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                            {adminUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </Badge>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-titanium/40" />
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {statItems.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <Card key={index} className="hover-lift">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 mb-1">
                                                    {stat.label}
                                                </p>
                                                <p className="text-3xl font-black text-titanium">
                                                    {stat.value}
                                                </p>
                                                <p className={`text-xs font-medium mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                                                    {stat.change} from last month
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 bg-titanium/5 rounded-apple-sm flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-titanium/60" />
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Content Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="min-h-[400px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-titanium">Recent Activity</h3>
                                    <span className="text-xs text-titanium/40">{activities.length} items</span>
                                </div>
                                <div className="space-y-4">
                                    {activities.length === 0 ? (
                                        <p className="text-sm text-titanium/40 text-center py-8">No recent activity</p>
                                    ) : (
                                        activities.map((activity, index) => {
                                            const Icon = getActivityIcon(activity.type);
                                            return (
                                                <div key={index} className="flex items-center gap-4 p-4 bg-titanium/5 rounded-apple-sm">
                                                    <div className="w-10 h-10 bg-titanium/10 rounded-full flex items-center justify-center shrink-0">
                                                        <Icon className="w-4 h-4 text-titanium/60" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-titanium truncate">
                                                            {activity.description}
                                                        </p>
                                                        <p className="text-xs text-titanium/50">
                                                            {getTimeAgo(activity.timestamp)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </Card>

                            <Card className="min-h-[400px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-titanium">Quick Actions</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Link href="/admin/users">
                                        <Button variant="outline" className="h-24 flex-col gap-2 w-full">
                                            <Users className="w-6 h-6" />
                                            <span className="text-xs">Manage Users</span>
                                        </Button>
                                    </Link>
                                    <Link href="/admin/events">
                                        <Button variant="outline" className="h-24 flex-col gap-2 w-full">
                                            <Calendar className="w-6 h-6" />
                                            <span className="text-xs">Manage Events</span>
                                        </Button>
                                    </Link>
                                    <Link href="/admin/settings">
                                        <Button variant="outline" className="h-24 flex-col gap-2 w-full">
                                            <Activity className="w-6 h-6" />
                                            <span className="text-xs">Settings</span>
                                        </Button>
                                    </Link>
                                    <Link href="/admin/settings">
                                        <Button variant="outline" className="h-24 flex-col gap-2 w-full">
                                            <TrendingUp className="w-6 h-6" />
                                            <span className="text-xs">Analytics</span>
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboardPage;