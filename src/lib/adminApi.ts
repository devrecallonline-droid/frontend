/**
 * Admin API Client
 * 
 * Separate from the main RTK Query API, since admin auth uses
 * JWT stored in localStorage under 'admin_token'.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const ADMIN_BASE = `${API_BASE_URL}/admin`;

// ========================
// Token Management
// ========================
export const getAdminToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
};

export const getRefreshToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_refresh_token');
};

export const setAdminTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('admin_token', accessToken);
    localStorage.setItem('admin_refresh_token', refreshToken);
};

export const clearAdminTokens = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
};

export const getAdminUser = () => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('admin_user');
    return stored ? JSON.parse(stored) : null;
};

export const setAdminUser = (user: AdminUser) => {
    localStorage.setItem('admin_user', JSON.stringify(user));
};

// ========================
// Types
// ========================
export interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    last_login_at?: string;
    created_at?: string;
}

export interface DashboardStats {
    totalUsers: { value: number; change: string };
    activeEvents: { value: number; change: string };
    uploadsToday: { value: number; change: string };
    growthRate: { value: string; change: string };
}

export interface ActivityItem {
    type: string;
    description: string;
    timestamp: string;
}

export interface AdminEvent {
    id: string;
    title: string;
    description?: string;
    creator: string;
    date: string | null;
    status: string;
    photos: number;
    guests: number;
    location: string;
    cover_image_url: string | null;
    created_at: string;
}

export interface AdminEventListResponse {
    events: AdminEvent[];
    total: number;
    page: number;
    totalPages: number;
}

export interface EventStats {
    totalEvents: number;
    activeEvents: number;
    totalPhotos: number;
    totalGuests: number;
}

export interface AdminUserItem {
    id: string;
    name: string;
    email: string;
    status: string;
    joined: string;
    events: number;
    avatar_url?: string;
}

export interface AdminUserListResponse {
    users: AdminUserItem[];
    total: number;
    page: number;
    totalPages: number;
}

export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    adminCount: number;
    newThisMonth: number;
}

export interface StorageStats {
    totalSizeMB: string;
    totalSizeGB: string;
    maxStorageGB: number;
    usagePercent: string;
    totalPhotos: number;
}

export interface AnalyticsTimelineItem {
    date: string;
    uploads: number;
    faces: number;
}

export interface PostHogException {
    id: string;
    timestamp: string;
    distinct_id: string;
    type: string;
    message: string;
    url: string;
}

export interface PostHogRecording {
    id: string;
    viewed: boolean;
    duration: number;
    distinct_id: string;
    start_time: string;
}

export interface PostHogAggregate {
    name: string;
    count: number;
}

export interface LinearIssue {
    id: string;
    identifier: string;
    title: string;
    priority: number;
    state: string;
    url: string;
}

export interface AnalyticsData {
    totals: {
        totalPhotos: number;
        totalFacesDetected: number;
        usersFindingFaces: number;
        photosMatchedAndSaved: number;
    };
    timeline: AnalyticsTimelineItem[];
    recentExceptions: PostHogException[] | null;
    sessionRecordings: PostHogRecording[] | null;
    topPages: PostHogAggregate[] | null;
    devices: PostHogAggregate[] | null;
    locations: PostHogAggregate[] | null;
    linearIssues: LinearIssue[] | null;
}

// ========================
// Core Fetch Wrapper
// ========================
async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getAdminToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${ADMIN_BASE}${path}`, {
        ...options,
        headers,
    });

    // Handle token refresh on 401
    if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${ADMIN_BASE}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });

                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    setAdminTokens(data.accessToken, data.refreshToken);

                    // Retry original request with new token
                    headers['Authorization'] = `Bearer ${data.accessToken}`;
                    const retryRes = await fetch(`${ADMIN_BASE}${path}`, { ...options, headers });
                    if (!retryRes.ok) {
                        const err = await retryRes.json().catch(() => ({ detail: 'Request failed' }));
                        throw new Error(err.detail || 'Request failed');
                    }
                    return retryRes.json();
                }
            } catch {
                // Refresh failed, clear tokens
            }
        }

        clearAdminTokens();
        if (typeof window !== 'undefined') {
            window.location.href = '/admin';
        }
        throw new Error('Session expired');
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }

    return res.json();
}

// ========================
// Auth API
// ========================
export const adminAuthApi = {
    login: (email: string, password: string) =>
        adminFetch<{ accessToken: string; refreshToken: string; admin: AdminUser }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    me: () => adminFetch<AdminUser>('/auth/me'),

    logout: () => adminFetch<{ detail: string }>('/auth/logout', { method: 'POST' }),

    changePassword: (currentPassword: string, newPassword: string) =>
        adminFetch<{ detail: string }>('/auth/password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword }),
        }),
};

// ========================
// Dashboard API
// ========================
export const adminDashboardApi = {
    getStats: () => adminFetch<DashboardStats>('/dashboard/stats'),
    getRecentActivity: () => adminFetch<ActivityItem[]>('/dashboard/recent-activity'),
};

// ========================
// Events API
// ========================
export const adminEventsApi = {
    list: (params: { search?: string; status?: string; page?: number; limit?: number } = {}) => {
        const query = new URLSearchParams();
        if (params.search) query.set('search', params.search);
        if (params.status && params.status !== 'all') query.set('status', params.status);
        if (params.page) query.set('page', String(params.page));
        if (params.limit) query.set('limit', String(params.limit));
        return adminFetch<AdminEventListResponse>(`/events?${query.toString()}`);
    },
    getStats: () => adminFetch<EventStats>('/events/stats'),
    update: (id: string, data: Record<string, unknown>) =>
        adminFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
        adminFetch(`/events/${id}`, { method: 'DELETE' }),
};

// ========================
// Users API
// ========================
export const adminUsersApi = {
    list: (params: { search?: string; status?: string; page?: number; limit?: number } = {}) => {
        const query = new URLSearchParams();
        if (params.search) query.set('search', params.search);
        if (params.status && params.status !== 'all') query.set('status', params.status);
        if (params.page) query.set('page', String(params.page));
        if (params.limit) query.set('limit', String(params.limit));
        return adminFetch<AdminUserListResponse>(`/users?${query.toString()}`);
    },
    getStats: () => adminFetch<UserStats>('/users/stats'),
    updateStatus: (id: string, is_active: boolean) =>
        adminFetch(`/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ is_active }) }),
    delete: (id: string) =>
        adminFetch(`/users/${id}`, { method: 'DELETE' }),
};

// ========================
// Settings API
// ========================
export const adminSettingsApi = {
    get: () => adminFetch<Record<string, unknown>>('/settings'),
    update: (data: Record<string, unknown>) =>
        adminFetch('/settings', { method: 'PUT', body: JSON.stringify(data) }),
    getStorage: (): Promise<StorageStats> => adminFetch('/settings/storage'),
};

export const adminAnalyticsApi = {
    get: (): Promise<AnalyticsData> => adminFetch('/analytics'),
};
