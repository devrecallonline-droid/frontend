'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import { 
    ImageIcon, 
    ScanFace, 
    Users, 
    DownloadCloud,
    Loader2,
    AlertCircle,
    Terminal,
    Bug,
    CheckCircle2
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { adminAnalyticsApi, type AnalyticsData } from '@/lib/adminApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminAnalyticsPage = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const result = await adminAnalyticsApi.get();
                setData(result);
            } catch (error) {
                console.error('Analytics fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const statCards = data ? [
        {
            title: 'Total Images Uploaded',
            value: data.totals.totalPhotos.toLocaleString(),
            icon: ImageIcon,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            desc: 'Across all platform events'
        },
        {
            title: 'Total Faces Found',
            value: data.totals.totalFacesDetected.toLocaleString(),
            icon: ScanFace,
            color: 'text-purple-600',
            bg: 'bg-purple-100',
            desc: 'Indexed by ML worker'
        },
        {
            title: 'Users Found Faces',
            value: data.totals.usersFindingFaces.toLocaleString(),
            icon: Users,
            color: 'text-orange-600',
            bg: 'bg-orange-100',
            desc: 'Unique users matched'
        },
        {
            title: 'Pictures Collected',
            value: data.totals.photosMatchedAndSaved.toLocaleString(),
            icon: DownloadCloud,
            color: 'text-green-600',
            bg: 'bg-green-100',
            desc: 'Saved across collections'
        }
    ] : [];

    return (
        <div className="min-h-screen bg-ivory flex">
            <AdminSidebar />
            
            <main className="flex-1 p-4 lg:p-8 overflow-auto lg:pt-8 pt-20">
                <header className="mb-8">
                    <h2 className="text-3xl font-black text-titanium tracking-tight">
                        Platform Analytics
                    </h2>
                    <p className="text-titanium/50 mt-1">
                        Deep insights into system usage, ML processing, and user engagement
                    </p>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-titanium/40" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {statCards.map((stat, idx) => {
                                const Icon = stat.icon;
                                return (
                                    <Card key={idx} className="hover-lift flex flex-col justify-between h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`w-12 h-12 rounded-apple-sm flex items-center justify-center ${stat.bg}`}>
                                                <Icon className={`w-6 h-6 ${stat.color}`} />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 mb-1">
                                                {stat.title}
                                            </p>
                                            <p className="text-3xl font-black text-titanium">
                                                {stat.value}
                                            </p>
                                            <p className="text-xs font-medium text-titanium/50 mt-1">
                                                {stat.desc}
                                            </p>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        <Card className="min-h-[400px]">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-titanium">Activity Timeline (Last 30 Days)</h3>
                                <p className="text-sm text-titanium/50">Tracking daily photo uploads and face detections</p>
                            </div>
                            
                            {data && data.timeline.length > 0 ? (
                                <div className="w-full h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data.timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorFaces" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis 
                                                dataKey="date" 
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#000000', opacity: 0.5, fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis 
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#000000', opacity: 0.5, fontSize: 12 }}
                                            />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000000" opacity={0.05} />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(0,0,0,0.05)',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                                }} 
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="uploads" 
                                                name="Photos Uploaded"
                                                stroke="#2563eb" 
                                                strokeWidth={2}
                                                fillOpacity={1} 
                                                fill="url(#colorUploads)" 
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="faces" 
                                                name="Faces Detected"
                                                stroke="#9333ea" 
                                                strokeWidth={2}
                                                fillOpacity={1} 
                                                fill="url(#colorFaces)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-40 flex items-center justify-center text-titanium/40 text-sm font-medium">
                                    No data available for the selected period
                                </div>
                            )}
                        </Card>

                        {/* Recent Exceptions Table */}
                        <Card className="mt-8">
                            <div className="mb-6 flex justify-between items-end">
                                <div>
                                    <h3 className="text-lg font-bold text-titanium flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        System Exceptions (Crash Logs)
                                    </h3>
                                    <p className="text-sm text-titanium/50">Most recent unhandled errors</p>
                                </div>
                            </div>

                            {data?.recentExceptions === null ? (
                                <div className="p-8 border-2 border-dashed border-black/10 rounded-xl bg-titanium/5 text-center flex flex-col items-center">
                                    <Terminal className="w-8 h-8 text-titanium/40 mb-3" />
                                    <h4 className="font-bold text-titanium mb-1">PostHog REST API Not Configured</h4>
                                    <p className="text-sm text-titanium/60 max-w-md">
                                        Configure your Personal API Key & Project ID in the backend `.env` to unlock all Live PostHog Widgets.
                                    </p>
                                </div>
                            ) : (data?.recentExceptions && data.recentExceptions.length > 0) ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-titanium">
                                        <thead className="text-[10px] font-bold uppercase tracking-widest text-titanium/60 bg-titanium/5 border-b border-black/5">
                                            <tr>
                                                <th className="px-6 py-4">Time</th>
                                                <th className="px-6 py-4">Type</th>
                                                <th className="px-6 py-4 max-w-[300px]">Message</th>
                                                <th className="px-6 py-4">URL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.recentExceptions.map((err) => (
                                                <tr key={err.id} className="border-b border-black/5 hover:bg-titanium/5">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {new Date(err.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-red-600 font-mono text-xs">
                                                        {err.type}
                                                    </td>
                                                    <td className="px-6 py-4 max-w-[300px] truncate" title={err.message}>
                                                        {err.message}
                                                    </td>
                                                    <td className="px-6 py-4 text-titanium/60 text-xs truncate max-w-[200px]" title={err.url}>
                                                        {err.url}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="h-40 flex items-center justify-center text-titanium/40 text-sm font-medium">
                                    No exceptions captured recently! 🎉
                                </div>
                            )}
                        </Card>

                        {/* Top Pages, Devices, Locations Grid */}
                        {data?.topPages !== null && (
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="p-6">
                                    <h3 className="text-md font-bold text-titanium mb-4">Top Pages Visited</h3>
                                    <ul className="space-y-3">
                                        {data?.topPages?.map(item => (
                                            <li key={item.name} className="flex justify-between text-sm">
                                                <span className="text-titanium/70 truncate mr-2" title={item.name}>{item.name}</span>
                                                <span className="font-bold">{item.count}</span>
                                            </li>
                                        ))}
                                        {(!data?.topPages || data.topPages.length === 0) && <p className="text-sm text-titanium/40">No data</p>}
                                    </ul>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="text-md font-bold text-titanium mb-4">Top Devices</h3>
                                    <ul className="space-y-3">
                                        {data?.devices?.map(item => (
                                            <li key={item.name} className="flex justify-between text-sm">
                                                <span className="text-titanium/70 truncate mr-2" title={item.name}>{item.name === 'Unknown OS / Unknown Browser' ? 'Mobile App / Automated' : item.name}</span>
                                                <span className="font-bold">{item.count}</span>
                                            </li>
                                        ))}
                                        {(!data?.devices || data.devices.length === 0) && <p className="text-sm text-titanium/40">No data</p>}
                                    </ul>
                                </Card>

                                <Card className="p-6">
                                    <h3 className="text-md font-bold text-titanium mb-4">Top Locations</h3>
                                    <ul className="space-y-3">
                                        {data?.locations?.map(item => (
                                            <li key={item.name} className="flex justify-between text-sm">
                                                <span className="text-titanium/70 truncate mr-2">{item.name}</span>
                                                <span className="font-bold">{item.count}</span>
                                            </li>
                                        ))}
                                        {(!data?.locations || data.locations.length === 0) && <p className="text-sm text-titanium/40">No data</p>}
                                    </ul>
                                </Card>
                            </div>
                        )}

                        {/* Session Recordings Table */}
                        {data?.sessionRecordings !== null && (
                            <Card className="mt-8 mb-8">
                                <div className="mb-6 flex justify-between items-end">
                                    <div>
                                        <h3 className="text-lg font-bold text-titanium">Live Session Replays</h3>
                                        <p className="text-sm text-titanium/50">Recent user journey recordings</p>
                                    </div>
                                </div>
                                {data?.sessionRecordings && data.sessionRecordings.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-titanium">
                                            <thead className="text-[10px] font-bold uppercase tracking-widest text-titanium/60 bg-titanium/5 border-b border-black/5">
                                                <tr>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">Time</th>
                                                    <th className="px-6 py-4">Duration</th>
                                                    <th className="px-6 py-4">User Identity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.sessionRecordings.map((rec) => (
                                                    <tr key={rec.id} className="border-b border-black/5 hover:bg-titanium/5">
                                                        <td className="px-6 py-4">
                                                            {rec.viewed ? (
                                                                <span className="px-2 py-1 text-[10px] font-bold bg-titanium/10 rounded-full">VIEWED</span>
                                                            ) : (
                                                                <span className="px-2 py-1 text-[10px] font-bold bg-blue-500/10 text-blue-600 rounded-full">NEW</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {new Date(rec.start_time).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 font-mono text-xs">
                                                            {Math.floor(rec.duration)}s
                                                        </td>
                                                        <td className="px-6 py-4 text-titanium/60 text-xs truncate max-w-[200px]" title={rec.distinct_id}>
                                                            {rec.distinct_id}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="h-40 flex items-center justify-center text-titanium/40 text-sm font-medium">
                                        No recordings available.
                                    </div>
                                )}
                            </Card>
                        )}
                        
                        {/* Embedded Linear Issue Tracker */}
                        {data?.linearIssues !== undefined && (
                            <Card className="mt-8 mb-8">
                                <div className="mb-6 flex justify-between items-end">
                                    <div>
                                        <h3 className="text-lg font-bold text-titanium flex items-center gap-2">
                                            <Bug className="w-5 h-5 text-purple-500" />
                                            Linear Bug Tracker
                                        </h3>
                                        <p className="text-sm text-titanium/50">Active issues automatically synced from your workspace</p>
                                    </div>
                                    <a 
                                        href="https://linear.app" 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-xs font-bold text-purple-600 bg-purple-500/10 px-3 py-1.5 rounded-full hover:bg-purple-500/20 transition-colors"
                                    >
                                        Open Linear →
                                    </a>
                                </div>

                                {data?.linearIssues === null ? (
                                    <div className="p-8 border-2 border-dashed border-black/10 rounded-xl bg-titanium/5 text-center flex flex-col items-center">
                                        <Bug className="w-8 h-8 text-titanium/40 mb-3" />
                                        <h4 className="font-bold text-titanium mb-1">Linear API Not Configured</h4>
                                        <p className="text-sm text-titanium/60 max-w-md">
                                            To view and manage your Linear tickets directly in this dashboard, generate a <strong>Personal API Key</strong> in the Linear App and add it to your <code>backend/.env</code> file as <code>LINEAR_API_KEY</code>.
                                        </p>
                                    </div>
                                ) : (data?.linearIssues && data.linearIssues.length > 0) ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-titanium">
                                            <thead className="text-[10px] font-bold uppercase tracking-widest text-titanium/60 bg-titanium/5 border-b border-black/5">
                                                <tr>
                                                    <th className="px-6 py-4 w-24">Issue</th>
                                                    <th className="px-6 py-4">Title</th>
                                                    <th className="px-6 py-4 w-32">Status</th>
                                                    <th className="px-6 py-4 w-24">Priority</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.linearIssues.map((issue) => (
                                                    <tr key={issue.id} className="border-b border-black/5 hover:bg-titanium/5 group">
                                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-titanium/50">
                                                            <a href={issue.url} target="_blank" rel="noreferrer" className="hover:text-purple-600 transition-colors">
                                                                {issue.identifier}
                                                            </a>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium">
                                                            <a href={issue.url} target="_blank" rel="noreferrer" className="hover:text-purple-600 transition-colors">
                                                                {issue.title}
                                                            </a>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                                                                issue.state === 'Done' ? 'bg-green-500/10 text-green-600' :
                                                                issue.state === 'In Progress' ? 'bg-amber-500/10 text-amber-600' :
                                                                'bg-titanium/10 text-titanium/70'
                                                            }`}>
                                                                {issue.state}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-titanium/60 text-xs flex items-center gap-1">
                                                                {issue.priority === 1 ? '🔴 Urgent' : 
                                                                 issue.priority === 2 ? '🟠 High' : 
                                                                 issue.priority === 3 ? '🟡 Medium' : '⚪️ Low'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="h-40 flex flex-col items-center justify-center text-titanium/40 space-y-2">
                                        <CheckCircle2 className="w-8 h-8 text-green-500/30" />
                                        <p className="text-sm font-medium text-titanium/60">Inbox Zero! No active bugs found.</p>
                                    </div>
                                )}
                            </Card>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminAnalyticsPage;
