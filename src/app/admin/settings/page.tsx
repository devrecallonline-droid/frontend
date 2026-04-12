'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Badge, Input } from '@/components/ui';
import { 
    Save,
    Bell,
    Shield,
    Mail,
    Globe,
    Palette,
    Database,
    Key,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Loader2
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { adminSettingsApi, adminAuthApi, type StorageStats } from '@/lib/adminApi';

const AdminSettingsPage = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await adminSettingsApi.get();
                setSettings(data);
            } catch (error) {
                console.error('Settings fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (activeTab === 'database') {
            adminSettingsApi.getStorage()
                .then(data => setStorageStats(data))
                .catch(err => console.error('Storage stats error:', err));
        }
    }, [activeTab]);

    const handleSave = async () => {
        try {
            const updated = await adminSettingsApi.update(settings) as Record<string, any>;
            setSettings(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Settings save error:', error);
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }

        try {
            await adminAuthApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            setPasswordSuccess('Password changed successfully');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            setPasswordError(error.message || 'Failed to change password');
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'database', label: 'Database', icon: Database },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-ivory flex">
                <AdminSidebar />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-titanium/40" />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ivory flex">
            <AdminSidebar />
            
            <main className="flex-1 p-4 lg:p-8 overflow-auto lg:pt-8 pt-20">
                <header className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-titanium tracking-tight">
                                Settings
                            </h2>
                            <p className="text-titanium/50 mt-1">
                                Configure your admin dashboard preferences
                            </p>
                        </div>
                        <Button 
                            className="gap-2"
                            onClick={handleSave}
                            disabled={saved}
                        >
                            {saved ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Settings Navigation */}
                    <div className="lg:w-64 flex-shrink-0">
                        <Card noPadding>
                            <nav className="p-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-apple-sm text-sm font-medium transition-all text-left ${
                                                activeTab === tab.id
                                                    ? 'bg-titanium text-white'
                                                    : 'text-titanium/70 hover:bg-black/5 hover:text-titanium'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </Card>
                    </div>

                    {/* Settings Content */}
                    <div className="flex-1">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <Card>
                                    <h3 className="text-lg font-bold text-titanium mb-6">Site Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-titanium mb-2">Site Name</label>
                                            <Input
                                                value={settings.siteName || ''}
                                                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-titanium mb-2">Site Description</label>
                                            <textarea 
                                                className="w-full min-h-[100px] rounded-2xl border border-black/5 bg-white/50 glass px-6 py-4 text-sm text-titanium focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
                                                value={settings.siteDescription || ''}
                                                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-titanium mb-2">Support Email</label>
                                            <Input
                                                value={settings.supportEmail || ''}
                                                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                                type="email"
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <Card>
                                    <h3 className="text-lg font-bold text-titanium mb-6">Email Notifications</h3>
                                    <div className="space-y-4">
                                        {[
                                            { key: 'newUser', label: 'New user registrations', desc: 'Get notified when a new user signs up' },
                                            { key: 'newEvent', label: 'New events created', desc: 'Get notified when users create new events' },
                                            { key: 'systemReports', label: 'System reports', desc: 'Receive daily/weekly system reports' },
                                            { key: 'securityAlerts', label: 'Security alerts', desc: 'Get notified of suspicious activities' },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
                                                <div>
                                                    <p className="font-medium text-titanium">{item.label}</p>
                                                    <p className="text-xs text-titanium/50">{item.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={settings.notifications?.[item.key] ?? true}
                                                        onChange={(e) => setSettings({
                                                            ...settings,
                                                            notifications: { ...settings.notifications, [item.key]: e.target.checked }
                                                        })}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-titanium"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <Card>
                                    <h3 className="text-lg font-bold text-titanium mb-6">Change Password</h3>
                                    {passwordError && (
                                        <div className="mb-4 p-3 rounded-apple-sm bg-red-50 border border-red-100 text-red-600 text-sm">
                                            {passwordError}
                                        </div>
                                    )}
                                    {passwordSuccess && (
                                        <div className="mb-4 p-3 rounded-apple-sm bg-green-50 border border-green-100 text-green-600 text-sm">
                                            {passwordSuccess}
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-titanium mb-2">Current Password</label>
                                            <Input
                                                type="password"
                                                placeholder="Enter current password"
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-titanium mb-2">New Password</label>
                                            <Input
                                                type="password"
                                                placeholder="Enter new password"
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-titanium mb-2">Confirm New Password</label>
                                            <Input
                                                type="password"
                                                placeholder="Confirm new password"
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                        <Button className="gap-2" onClick={handlePasswordChange}>
                                            <Key className="w-4 h-4" />
                                            Update Password
                                        </Button>
                                    </div>
                                </Card>

                                <Card>
                                    <h3 className="text-lg font-bold text-titanium mb-6">Session Management</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between py-3 border-b border-black/5">
                                            <div>
                                                <p className="font-medium text-titanium">Current Session</p>
                                                <p className="text-xs text-titanium/50">Active now</p>
                                            </div>
                                            <Badge variant="secondary">Active</Badge>
                                        </div>
                                        <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700">
                                            <AlertTriangle className="w-4 h-4" />
                                            Log Out All Other Sessions
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <Card>
                                    <h3 className="text-lg font-bold text-titanium mb-6">Theme</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {['light', 'dark', 'system'].map((theme) => (
                                            <button
                                                key={theme}
                                                onClick={() => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, theme }
                                                })}
                                                className={`p-6 rounded-apple-lg border-2 transition-all ${
                                                    settings.appearance?.theme === theme 
                                                        ? 'border-titanium bg-titanium/5' 
                                                        : 'border-black/10 hover:border-black/20'
                                                }`}
                                            >
                                                <div className={`w-full h-20 rounded-lg mb-3 ${
                                                    theme === 'light' ? 'bg-white border border-black/10' :
                                                    theme === 'dark' ? 'bg-titanium' :
                                                    'bg-gradient-to-r from-white to-titanium'
                                                }`} />
                                                <p className="font-medium text-titanium capitalize">{theme}</p>
                                            </button>
                                        ))}
                                    </div>
                                </Card>

                                <Card>
                                    <h3 className="text-lg font-bold text-titanium mb-6">Dashboard Layout</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-titanium mb-2">Items per page</label>
                                            <select
                                                className="w-full h-12 px-4 rounded-full border border-black/5 bg-white/50 glass text-sm text-titanium focus:outline-none focus:ring-2 focus:ring-black/10"
                                                value={settings.appearance?.itemsPerPage || 10}
                                                onChange={(e) => setSettings({
                                                    ...settings,
                                                    appearance: { ...settings.appearance, itemsPerPage: parseInt(e.target.value) }
                                                })}
                                            >
                                                <option>10</option>
                                                <option>25</option>
                                                <option>50</option>
                                                <option>100</option>
                                            </select>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'database' && (
                            <div className="space-y-6">
                                <Card>
                                    <h3 className="text-lg font-bold text-titanium mb-6">Storage</h3>
                                    {storageStats ? (
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-titanium/70">Storage Used</span>
                                                    <span className="font-medium text-titanium">{storageStats.usagePercent}%</span>
                                                </div>
                                                <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-titanium rounded-full" style={{ width: `${storageStats.usagePercent}%` }} />
                                                </div>
                                                <p className="text-xs text-titanium/50 mt-2">
                                                    {storageStats.totalSizeGB} GB of {storageStats.maxStorageGB} GB used ({storageStats.totalPhotos.toLocaleString()} photos)
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-titanium/40" />
                                        </div>
                                    )}
                                </Card>

                                <Card className="border-red-200">
                                    <h3 className="text-lg font-bold text-red-600 mb-6">Danger Zone</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-titanium">Clear All Data</p>
                                                <p className="text-xs text-titanium/50">This action cannot be undone</p>
                                            </div>
                                            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                Clear Data
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminSettingsPage;