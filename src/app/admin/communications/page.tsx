'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input, Textarea, Badge, Modal } from '@/components/ui';
import { 
    Mail, 
    Send, 
    Users, 
    CheckCircle, 
    AlertCircle, 
    Loader2,
    Search,
    UserCheck,
    Eye,
    Clock,
    History,
    ChevronLeft,
    ChevronRight,
    Inbox
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { adminCommunicationsApi, type EmailHistoryItem } from '@/lib/adminApi';

interface User {
    id: string;
    name: string;
    email: string;
    status: string;
    joined: string;
    avatar_url?: string;
}

export default function AdminCommunicationsPage() {
    const [recipientType, setRecipientType] = useState<'all' | 'selected'>('all');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [showUserPicker, setShowUserPicker] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    const [subject, setSubject] = useState('');
    const [htmlBody, setHtmlBody] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<{
        totalRecipients: number;
        successCount: number;
        failedCount: number;
    } | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [error, setError] = useState('');

    // Scheduling
    const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduleSuccess, setScheduleSuccess] = useState<{
        message: string;
        scheduledFor: string;
    } | null>(null);

    // Email History
    const [emailHistory, setEmailHistory] = useState<EmailHistoryItem[]>([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [viewingEmail, setViewingEmail] = useState<EmailHistoryItem | null>(null);

    // Fetch email history
    const fetchHistory = useCallback(async (page = 1) => {
        setLoadingHistory(true);
        try {
            const data = await adminCommunicationsApi.getHistory({ page, limit: 10 });
            setEmailHistory(data.emails);
            setHistoryTotalPages(data.totalPages);
            setHistoryPage(data.page);
        } catch (err) {
            console.error('Failed to fetch email history:', err);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Fetch users when opening picker
    const fetchUsers = useCallback(async () => {
        if (users.length > 0) return; // Already loaded
        setLoadingUsers(true);
        try {
            const data = await adminCommunicationsApi.getUsers({ limit: 100 });
            setUsers(data.users);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoadingUsers(false);
        }
    }, [users.length]);

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const selectAllUsers = () => {
        setSelectedUsers(filteredUsers.map(u => u.id));
    };

    const deselectAllUsers = () => {
        setSelectedUsers([]);
    };

    const filteredUsers = users.filter(user => 
        userSearch === '' || 
        user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    const handleSend = async () => {
        if (!subject.trim()) {
            setError('Subject is required');
            return;
        }
        if (!htmlBody.trim()) {
            setError('Message body is required');
            return;
        }
        if (recipientType === 'selected' && selectedUsers.length === 0) {
            setError('Please select at least one recipient');
            return;
        }
        if (sendMode === 'schedule' && !scheduledDate) {
            setError('Please select a date and time for scheduling');
            return;
        }
        if (sendMode === 'schedule') {
            const scheduledDateTime = new Date(scheduledDate);
            if (scheduledDateTime <= new Date()) {
                setError('Scheduled time must be in the future');
                return;
            }
        }

        setError('');
        setScheduleSuccess(null);
        setSending(true);

        try {
            // Convert plain-text line breaks to HTML <br> so they render in the email
            const formattedBody = htmlBody.trim().replace(/\n/g, '<br>\n');

            const requestData: any = {
                recipientType,
                userIds: recipientType === 'selected' ? selectedUsers : undefined,
                subject: subject.trim(),
                htmlBody: formattedBody,
            };

            if (sendMode === 'schedule') {
                requestData.scheduledFor = scheduledDate;
            }

            const result = await adminCommunicationsApi.sendCommunication(requestData);

            // Check if it was scheduled
            if ('scheduled' in result && result.scheduled) {
                setScheduleSuccess({
                    message: result.message,
                    scheduledFor: result.scheduledFor,
                });
                setSubject('');
                setHtmlBody('');
                setSelectedUsers([]);
                setScheduledDate('');
                fetchHistory(1);
                return;
            }

            // Check if it was an immediate send (not scheduled)
            if ('totalRecipients' in result) {
                // Check if there was a domain verification error
                if (result.firstError && result.failedCount > 0) {
                    setError(result.firstError);
                    return;
                }

                setSendResult(result);
                setShowResultModal(true);
                
                // Reset form on success and refresh history
                if (result.failedCount === 0) {
                    setSubject('');
                    setHtmlBody('');
                    setSelectedUsers([]);
                    fetchHistory(1); // Refresh history to show the new email
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send emails');
        } finally {
            setSending(false);
        }
    };

    const handleCancelScheduled = async (id: string) => {
        try {
            await adminCommunicationsApi.cancelScheduledEmail(id);
            fetchHistory(historyPage);
        } catch (err: any) {
            setError(err.message || 'Failed to cancel scheduled email');
        }
    };

    const previewContent = `
        <div style="padding: 20px; background: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 32px; background: white; border-radius: 16px; border: 1px solid #e2e8f0;">
                <div style="font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 24px; text-align: center;">Nenge</div>
                <div style="color: #334155; line-height: 1.6;">
                    <p>Hi [User Name],</p>
                    ${htmlBody}
                </div>
                <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #94a3b8; text-align: center;">
                    Sent by <strong>Nenge</strong>
                </div>
            </div>
        </div>
    `;

    return (
        <div className="min-h-screen bg-ivory flex">
            <AdminSidebar />

            <main className="flex-1 p-4 lg:p-8 overflow-auto lg:pt-8 pt-20">
                <header className="mb-8">
                    <div className="flex items-center gap-3">
                        <Mail className="w-8 h-8 text-titanium" />
                        <div>
                            <h2 className="text-3xl font-black text-titanium tracking-tight">
                                Communications
                            </h2>
                            <p className="text-titanium/50 mt-1">
                                Send newsletters and emails to your users
                            </p>
                        </div>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 p-4 rounded-apple-sm bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div className="space-y-2">
                                {error.includes('Domain verification') ? (
                                    <>
                                        <p className="font-semibold">Domain Not Verified</p>
                                        <p>{error}</p>
                                        <div className="mt-2 p-3 bg-white/50 rounded text-xs space-y-1">
                                            <p className="font-medium">To fix this:</p>
                                            <ol className="list-decimal list-inside space-y-1 ml-1">
                                                <li>Go to <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-700">https://resend.com/domains</a></li>
                                                <li>Add your domain: <code className="bg-red-100 px-1 rounded">people.nenge.ng</code></li>
                                                <li>Add the DNS records (SPF and DKIM) to your DNS settings</li>
                                                <li>Wait for verification (usually takes a few minutes)</li>
                                            </ol>
                                            <p className="mt-2 pt-2 border-t border-red-200">
                                                <strong>Quick fix:</strong> Change FROM_EMAIL to <code className="bg-red-100 px-1 rounded">onboarding@resend.dev</code> in your .env file (testing only - can only send to your own email).
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <p>{error}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recipients Section */}
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-titanium flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Recipients
                            </h3>
                            <Badge variant={recipientType === 'all' ? 'default' : 'secondary'}>
                                {recipientType === 'all' ? 'All Active Users' : `${selectedUsers.length} Selected`}
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            {/* Recipient Type Selection */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setRecipientType('all')}
                                    className={`p-4 rounded-apple-sm border-2 text-left transition-all ${
                                        recipientType === 'all'
                                            ? 'border-titanium bg-titanium/5'
                                            : 'border-transparent bg-black/5 hover:bg-black/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <UserCheck className={`w-5 h-5 ${recipientType === 'all' ? 'text-titanium' : 'text-titanium/50'}`} />
                                        <span className={`font-semibold ${recipientType === 'all' ? 'text-titanium' : 'text-titanium/70'}`}>
                                            All Users
                                        </span>
                                    </div>
                                    <p className="text-xs text-titanium/50">
                                        Send to all active users
                                    </p>
                                </button>

                                <button
                                    onClick={() => {
                                        setRecipientType('selected');
                                        setShowUserPicker(true);
                                        fetchUsers();
                                    }}
                                    className={`p-4 rounded-apple-sm border-2 text-left transition-all ${
                                        recipientType === 'selected'
                                            ? 'border-titanium bg-titanium/5'
                                            : 'border-transparent bg-black/5 hover:bg-black/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className={`w-5 h-5 ${recipientType === 'selected' ? 'text-titanium' : 'text-titanium/50'}`} />
                                        <span className={`font-semibold ${recipientType === 'selected' ? 'text-titanium' : 'text-titanium/70'}`}>
                                            Select Users
                                        </span>
                                    </div>
                                    <p className="text-xs text-titanium/50">
                                        Choose specific recipients
                                    </p>
                                </button>
                            </div>

                            {/* Selected Users Summary */}
                            {recipientType === 'selected' && (
                                <div className="mt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-titanium">
                                            {selectedUsers.length} users selected
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setShowUserPicker(true);
                                                fetchUsers();
                                            }}
                                        >
                                            Manage Selection
                                        </Button>
                                    </div>
                                    {selectedUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                            {users
                                                .filter(u => selectedUsers.includes(u.id))
                                                .map(user => (
                                                    <Badge key={user.id} variant="secondary" className="text-xs">
                                                        {user.name}
                                                    </Badge>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Message Composition Section */}
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-titanium flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                                Compose Message
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                                className="gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 block mb-2">
                                    Subject
                                </label>
                                <Input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Enter email subject..."
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 block mb-2">
                                    Message Body
                                </label>
                                <Textarea
                                    value={htmlBody}
                                    onChange={(e) => setHtmlBody(e.target.value)}
                                    placeholder="Write your message here..."
                                    className="w-full min-h-[200px] text-sm"
                                />
                                <p className="text-xs text-titanium/40 mt-2">
                                    Line breaks will be preserved. You can also use HTML tags like &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Preview Section */}
                {showPreview && (
                    <Card className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-titanium">Preview</h3>
                            <span className="text-xs text-titanium/50">
                                This is how your email will look
                            </span>
                        </div>
                        <div 
                            className="rounded-apple-sm overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: previewContent }}
                        />
                    </Card>
                )}

                {/* Schedule/Send Controls */}
                <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-3">
                        {/* Send Mode Selection */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSendMode('now')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-apple-sm text-sm font-medium transition-all ${
                                    sendMode === 'now'
                                        ? 'bg-titanium text-white'
                                        : 'bg-black/5 text-titanium/70 hover:bg-black/10'
                                }`}
                            >
                                <Send className="w-4 h-4" />
                                Send Now
                            </button>
                            <button
                                onClick={() => setSendMode('schedule')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-apple-sm text-sm font-medium transition-all ${
                                    sendMode === 'schedule'
                                        ? 'bg-titanium text-white'
                                        : 'bg-black/5 text-titanium/70 hover:bg-black/10'
                                }`}
                            >
                                <Clock className="w-4 h-4" />
                                Schedule
                            </button>
                        </div>

                        {/* Schedule Date/Time Input */}
                        {sendMode === 'schedule' && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="datetime-local"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="w-auto"
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleSend}
                        disabled={sending}
                        className="h-14 px-8 text-lg"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {sendMode === 'schedule' ? 'Scheduling...' : 'Sending...'}
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />
                                {sendMode === 'schedule' 
                                    ? 'Schedule Email' 
                                    : `Send ${recipientType === 'all' ? 'to All Users' : `to ${selectedUsers.length} Users`}`
                                }
                            </>
                        )}
                    </Button>
                </div>

                {/* Schedule Success Message */}
                {scheduleSuccess && (
                    <div className="mt-4 p-4 rounded-apple-sm bg-green-50 border border-green-100 text-green-600 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            <div>
                                <p className="font-semibold">Email Scheduled Successfully!</p>
                                <p>{scheduleSuccess.message}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Email History Section */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <History className="w-6 h-6 text-titanium" />
                            <div>
                                <h2 className="text-2xl font-bold text-titanium">Email History</h2>
                                <p className="text-sm text-titanium/50">View all emails sent through this system</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchHistory(1)}
                            disabled={loadingHistory}
                        >
                            {loadingHistory ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Clock className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    {loadingHistory ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-titanium/40" />
                        </div>
                    ) : emailHistory.length === 0 ? (
                        <Card className="text-center py-12">
                            <Inbox className="w-12 h-12 text-titanium/30 mx-auto mb-4" />
                            <p className="text-titanium/50 font-medium">No emails sent yet</p>
                            <p className="text-sm text-titanium/40 mt-1">Emails you send will appear here</p>
                        </Card>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {emailHistory.map((email) => (
                                    <Card key={email.id} className="hover-lift">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Mail className="w-4 h-4 text-titanium/60" />
                                                    <h4 className="font-semibold text-titanium truncate">
                                                        {email.subject}
                                                    </h4>
                                                    {email.isTestDomain && (
                                                        <Badge variant="secondary" className="text-[10px]">TEST</Badge>
                                                    )}
                                                    <Badge 
                                                        variant={
                                                            email.status === 'scheduled' ? 'secondary' :
                                                            email.status === 'sent' ? 'default' :
                                                            email.status === 'sending' ? 'secondary' :
                                                            'destructive'
                                                        }
                                                        className="text-[10px] capitalize"
                                                    >
                                                        {email.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-titanium/60 mb-3">
                                                    {email.status === 'scheduled' && email.scheduledFor ? (
                                                        <span>Scheduled for {new Date(email.scheduledFor).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}</span>
                                                    ) : email.sentAt ? (
                                                        <span>Sent {new Date(email.sentAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}</span>
                                                    ) : (
                                                        <span>Created {new Date(email.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}</span>
                                                    )}
                                                    <span>by {email.sentBy}</span>
                                                    <span>from {email.fromEmail}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-3 h-3 text-titanium/40" />
                                                        <span className="text-sm text-titanium/70">
                                                            {email.recipientType === 'all' ? 'All Users' : 'Selected Users'}
                                                            ({email.recipientCount} total)
                                                        </span>
                                                    </div>
                                                    {email.status === 'sent' && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-sm font-medium text-green-600">
                                                                {email.successCount} sent
                                                            </span>
                                                            {email.failedCount > 0 && (
                                                                <span className="text-sm font-medium text-red-500">
                                                                    , {email.failedCount} failed
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {email.errorMessage && (
                                                    <p className="text-xs text-red-500 mt-2 bg-red-50 p-2 rounded">
                                                        {email.errorMessage}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                {email.status === 'scheduled' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelScheduled(email.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                                <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setViewingEmail(email)}
                                                className="ml-4"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination */}
                            {historyTotalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchHistory(historyPage - 1)}
                                        disabled={historyPage <= 1 || loadingHistory}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                    <span className="text-sm text-titanium/60">
                                        Page {historyPage} of {historyTotalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchHistory(historyPage + 1)}
                                        disabled={historyPage >= historyTotalPages || loadingHistory}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* User Picker Modal */}
                {showUserPicker && (
                    <Modal
                        isOpen={showUserPicker}
                        onClose={() => setShowUserPicker(false)}
                        title="Select Recipients"
                        className="max-w-3xl"
                    >
                        <div className="space-y-4">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-titanium/40" />
                                <Input
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                    placeholder="Search users by name or email..."
                                    className="pl-12"
                                />
                            </div>

                            {/* Bulk Actions */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={selectAllUsers}
                                    disabled={filteredUsers.length === 0}
                                >
                                    Select All ({filteredUsers.length})
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={deselectAllUsers}
                                    disabled={selectedUsers.length === 0}
                                >
                                    Deselect All
                                </Button>
                            </div>

                            {/* User List */}
                            <div className="border border-black/10 rounded-apple-sm max-h-[400px] overflow-y-auto">
                                {loadingUsers ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-titanium/40" />
                                    </div>
                                ) : filteredUsers.length === 0 ? (
                                    <div className="text-center py-12 text-titanium/50">
                                        No users found
                                    </div>
                                ) : (
                                    <div className="divide-y divide-black/5">
                                        {filteredUsers.map(user => (
                                            <label
                                                key={user.id}
                                                className="flex items-center gap-4 p-4 hover:bg-black/5 cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => toggleUserSelection(user.id)}
                                                    className="w-5 h-5 rounded border-black/20 text-titanium focus:ring-titanium"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-titanium">{user.name}</p>
                                                    <p className="text-sm text-titanium/50">{user.email}</p>
                                                </div>
                                                <Badge 
                                                    variant={user.status === 'active' ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    {user.status}
                                                </Badge>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-black/10">
                                <span className="text-sm text-titanium/70">
                                    {selectedUsers.length} users selected
                                </span>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowUserPicker(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => setShowUserPicker(false)}
                                        disabled={selectedUsers.length === 0}
                                    >
                                        Confirm Selection
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Result Modal */}
                <Modal
                    isOpen={showResultModal}
                    onClose={() => setShowResultModal(false)}
                    title={sendResult?.failedCount === 0 ? 'Success!' : 'Email Results'}
                    className="max-w-md"
                >
                    {sendResult && (
                        <div className="space-y-6">
                            <div className={`flex items-center justify-center w-16 h-16 rounded-full mx-auto ${
                                sendResult.failedCount === 0 ? 'bg-green-100' : 'bg-yellow-100'
                            }`}>
                                {sendResult.failedCount === 0 ? (
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                ) : (
                                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                                )}
                            </div>

                            <div className="text-center">
                                <p className="text-lg font-semibold text-titanium mb-2">
                                    {sendResult.failedCount === 0 
                                        ? 'Emails sent successfully!' 
                                        : 'Emails sent with some failures'}
                                </p>
                                <p className="text-sm text-titanium/60">
                                    {sendResult.totalRecipients} total recipients
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-apple-sm">
                                    <p className="text-2xl font-bold text-green-600">{sendResult.successCount}</p>
                                    <p className="text-xs text-green-700">Successful</p>
                                </div>
                                <div className={`text-center p-4 rounded-apple-sm ${
                                    sendResult.failedCount > 0 ? 'bg-red-50' : 'bg-gray-50'
                                }`}>
                                    <p className={`text-2xl font-bold ${
                                        sendResult.failedCount > 0 ? 'text-red-600' : 'text-gray-400'
                                    }`}>
                                        {sendResult.failedCount}
                                    </p>
                                    <p className={`text-xs ${
                                        sendResult.failedCount > 0 ? 'text-red-700' : 'text-gray-500'
                                    }`}>
                                        Failed
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={() => setShowResultModal(false)}
                                className="w-full"
                            >
                                Close
                            </Button>
                        </div>
                    )}
                </Modal>

                {/* View Email Modal */}
                {viewingEmail && (
                    <Modal
                        isOpen={!!viewingEmail}
                        onClose={() => setViewingEmail(null)}
                        title={viewingEmail.subject}
                        className="max-w-3xl"
                    >
                        <div className="space-y-6">
                            {/* Email Meta */}
                            <div className="bg-black/5 p-4 rounded-apple-sm space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-titanium/50">
                                        {viewingEmail.status === 'scheduled' ? 'Scheduled for:' : 'Sent:'}
                                    </span>
                                    <span className="text-titanium">
                                        {viewingEmail.sentAt 
                                            ? new Date(viewingEmail.sentAt).toLocaleString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : viewingEmail.scheduledFor
                                                ? new Date(viewingEmail.scheduledFor).toLocaleString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : 'Not sent yet'
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-titanium/50">By:</span>
                                    <span className="text-titanium">{viewingEmail.sentBy}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-titanium/50">From:</span>
                                    <span className="text-titanium">{viewingEmail.fromEmail}</span>
                                    {viewingEmail.isTestDomain && (
                                        <Badge variant="secondary" className="text-[10px]">TEST</Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-titanium/50">Recipients:</span>
                                    <span className="text-titanium">
                                        {viewingEmail.recipientType === 'all' ? 'All Active Users' : 'Selected Users'}
                                        ({viewingEmail.recipientCount} total)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-titanium/50">Results:</span>
                                    <span className="text-green-600 font-medium">{viewingEmail.successCount} sent</span>
                                    {viewingEmail.failedCount > 0 && (
                                        <span className="text-red-500 font-medium">, {viewingEmail.failedCount} failed</span>
                                    )}
                                </div>
                                {viewingEmail.errorMessage && (
                                    <div className="mt-2 p-3 bg-red-50 rounded text-sm text-red-600">
                                        {viewingEmail.errorMessage}
                                    </div>
                                )}
                            </div>

                            {/* Email Preview */}
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-titanium/40 mb-2">
                                    Message Preview
                                </h4>
                                <div 
                                    className="border border-black/10 rounded-apple-sm overflow-hidden bg-white"
                                    style={{ maxHeight: '400px', overflowY: 'auto' }}
                                >
                                    <div 
                                        dangerouslySetInnerHTML={{ __html: viewingEmail.htmlBody }}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={() => setViewingEmail(null)}
                                className="w-full"
                            >
                                Close
                            </Button>
                        </div>
                    </Modal>
                )}
            </main>
        </div>
    );
}