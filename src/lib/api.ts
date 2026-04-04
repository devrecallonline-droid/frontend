import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface Event {
    id: string;
    title: string;
    description?: string;
    event_type?: string;
    event_date?: string;
    location?: string;
    owner_id: string;
    owner_username?: string;
    photo_count?: number;
    face_count?: number;
    created_at?: string;
    is_private?: boolean;
    cluster_enabled?: boolean;
}

export interface Photo {
    id: string;
    event_id: string;
    filename: string;
    uploaded_at: string;
    url: string;
    processing_status: 'pending' | 'completed' | 'failed';
    similarity?: number;
    confidence?: 'very-high' | 'high' | 'medium' | 'low';
}

export interface CollectionPhoto {
    id: string;
    photo_id: string;
    url: string;
    filename?: string;
    similarity?: number;
    added_at?: string;
}

export interface Collection {
    id: string;
    event_id: string;
    name: string;
    event_title: string;
    photo_count: number;
    thumbnail_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CollectionDetails extends Collection {
    event_description?: string;
    event_date?: string;
    photos: CollectionPhoto[];
}

export interface User {
    id: string;
    username: string;
    email?: string;
    followed_at?: string;
}

export interface FollowCheck {
    is_following: boolean;
    status: 'pending' | 'approved' | 'rejected' | null;
    user_id: string;
}

const baseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
        }
        return headers;
    },
});

const baseQueryWithErrorHandling = async (args: any, api: any, extraOptions: any) => {
    const result = await baseQuery(args, api, extraOptions);
    if (result.error) {
        const error = result.error as any;
        
        // Suppress 401 errors (unauthorized) and 404 (not found) from the global logger
        // since they are expected and handled by specific components or auth redirects
        if (error.status === 401 || error.status === 404) return result;

        // Construct a clean, informative error log
        const errorInfo: Record<string, any> = {
            url: typeof args === 'string' ? args : (args.url || args),
            status: error.status || 'PARSING_ERROR',
            data: error.data || 'No response body',
        };

        if (error.error) errorInfo.error = error.error; // standard in FetchBaseQueryError for network errors
        if (error.message) errorInfo.message = error.message; // standard in SerializedError

        console.error('API Error:', JSON.stringify(errorInfo, null, 2));
    }
    return result;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithErrorHandling,
    tagTypes: ['Event', 'User', 'Collection', 'Follow', 'EventAccess', 'ShareLink'],
    endpoints: (builder) => ({
        // Auth endpoints
        login: builder.mutation({
            query: (credentials: { email: string; password: string }) => ({
                url: '/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        register: builder.mutation({
            query: (credentials: { username: string; email: string; password: string }) => ({
                url: '/register',
                method: 'POST',
                body: credentials,
            }),
        }),
        googleLogin: builder.mutation({
            query: (data: { credential: string }) => ({
                url: '/auth/google',
                method: 'POST',
                body: data,
            }),
        }),
        optOut: builder.mutation({
            query: () => ({
                url: '/users/opt-out',
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),

        // Events endpoints
        getEvents: builder.query<Event[], void>({
            query: () => '/events',
            transformResponse: (response: { events: Event[] }) => response.events || [],
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Event' as const, id })),
                        { type: 'Event', id: 'LIST' },
                    ]
                    : [{ type: 'Event', id: 'LIST' }],
        }),
        getEventTypes: builder.query<string[], void>({
            query: () => '/events/types',
            transformResponse: (response: { types: string[] }) => response.types || [],
        }),
        createEvent: builder.mutation<Event, Partial<Event>>({
            query: (eventData) => ({
                url: 'events',
                method: 'POST',
                body: eventData,
            }),
            invalidatesTags: ['Event'],
        }),
        deleteEvent: builder.mutation<{ status: string; event_id: string }, string>({
            query: (eventId) => ({
                url: `events/${eventId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Event'],
        }),
        updateEvent: builder.mutation<Event, { eventId: string; data: Partial<Event> }>({
            query: ({ eventId, data }) => ({
                url: `events/${eventId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { eventId }) => [
                { type: 'Event', id: eventId },
                { type: 'Event', id: 'LIST' }
            ],
        }),
        getStorageUsage: builder.query<{ status: string; usage_bytes: number; quota_bytes: number; usage_percentage: number }, void>({
            query: () => '/users/storage-usage',
        }),
        uploadPhotos: builder.mutation({
            query: ({ eventId, formData }: { eventId: string; formData: FormData }) => ({
                url: `/events/${eventId}/photos`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: (result, error, { eventId }) => [
                { type: 'Event', id: eventId },
                { type: 'Event', id: 'LIST' }
            ],
        }),
        getUploadUrls: builder.mutation<
            { uploads: Array<{ photoId: string; storageKey: string; filename: string; uploadUrl: string }> },
            { eventId: string; files: Array<{ name: string; type: string; size: number }> }
        >({
            query: ({ eventId, files }) => ({
                url: `/events/${eventId}/photos/upload-urls`,
                method: 'POST',
                body: { files },
            }),
        }),
        confirmUploads: builder.mutation<
            { status: string; event_id: string; files_uploaded: number; processing_started: boolean },
            { eventId: string; photos: Array<{ photoId: string; storageKey: string; filename: string; size: number; mimeType: string }> }
        >({
            query: ({ eventId, photos }) => ({
                url: `/events/${eventId}/photos/confirm-uploads`,
                method: 'POST',
                body: { photos },
            }),
            invalidatesTags: (result, error, { eventId }) => [
                { type: 'Event', id: eventId },
                { type: 'Event', id: 'LIST' }
            ],
        }),
        searchPhotos: builder.mutation<{ photos: Photo[], matches_found: number }, { eventId: string; formData: FormData }>({
            query: ({ eventId, formData }: { eventId: string; formData: FormData }) => ({
                url: `/events/${eventId}/search`,
                method: 'POST',
                body: formData,
            }),
        }),
        getEventPhotos: builder.query<{ photos: Photo[], hasMore: boolean, totalPhotos: number }, { eventId: string; page: number; limit: number }>({
            query: ({ eventId, page, limit }) => `/events/${eventId}/photos?page=${page}&limit=${limit}`,
            providesTags: (result, error, { eventId }) => [{ type: 'Event', id: eventId }],
            // Group cache entries by eventId so pages merge
            serializeQueryArgs: ({ queryArgs }) => {
                return queryArgs.eventId;
            },
            // Merge incoming data to the cache entry
            merge: (currentCache, newItems, { arg }) => {
                if (arg.page === 1) {
                    return newItems;
                }
                // Deduplicate by photo id
                const existingIds = new Set(currentCache.photos.map(p => p.id));
                const uniqueNew = newItems.photos.filter(p => !existingIds.has(p.id));
                currentCache.photos.push(...uniqueNew);
                currentCache.hasMore = newItems.hasMore;
                currentCache.totalPhotos = newItems.totalPhotos;
            },
            // Refetch when the page changes
            forceRefetch({ currentArg, previousArg }) {
                return currentArg?.page !== previousArg?.page;
            },
        }),
        getEventDetails: builder.query<Event, string>({
            query: (eventId) => `/events/${eventId}`,
            providesTags: (result, error, eventId) => [{ type: 'Event', id: eventId }],
        }),
        deletePhoto: builder.mutation<{ status: string; photo_id: string }, { eventId: string; photoId: string }>({
            query: ({ eventId, photoId }) => ({
                url: `/events/${eventId}/photos/${photoId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, { eventId }) => [
                { type: 'Event', id: eventId },
                { type: 'Event', id: 'LIST' }
            ],
        }),

        // Collection endpoints
        getCollections: builder.query<Collection[], void>({
            query: () => '/collections',
            transformResponse: (response: { collections: Collection[] }) => response.collections || [],
            providesTags: ['Collection'],
        }),
        getCollection: builder.query<CollectionDetails, string>({
            query: (collectionId) => `/collections/${collectionId}`,
            providesTags: (result, error, collectionId) => [{ type: 'Collection', id: collectionId }],
        }),
        createCollection: builder.mutation<
            { message: string; collection_id: string; photos_added: number },
            { event_id: string; name: string; photos: { photo_id: string; photo_url: string; photo_filename?: string; similarity_score?: number }[] }
        >({
            query: (collectionData) => ({
                url: '/collections',
                method: 'POST',
                body: collectionData,
            }),
            invalidatesTags: ['Collection'],
        }),
        deleteCollection: builder.mutation<{ message: string }, string>({
            query: (collectionId) => ({
                url: `/collections/${collectionId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Collection'],
        }),
        removePhotoFromCollection: builder.mutation<
            { message: string },
            { collectionId: string; photoId: string }
        >({
            query: ({ collectionId, photoId }) => ({
                url: `/collections/${collectionId}/photos/${photoId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Collection'],
        }),

        // Follow endpoints
        followUser: builder.mutation<
            { status: string; following: string; created_at: string },
            { user_id: string }
        >({
            query: (followData) => ({
                url: '/follow',
                method: 'POST',
                body: followData,
            }),
            invalidatesTags: ['Follow'],
        }),
        unfollowUser: builder.mutation<
            { status: string; unfollowed: string },
            string
        >({
            query: (userId) => ({
                url: `/follow/${userId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Follow'],
        }),
        getFollowers: builder.query<{ followers: User[]; count: number }, string>({
            query: (userId) => `/users/${userId}/followers`,
            providesTags: ['Follow'],
        }),
        getFollowing: builder.query<{ following: User[]; count: number }, string>({
            query: (userId) => `/users/${userId}/following`,
            providesTags: ['Follow'],
        }),
        checkIsFollowing: builder.query<FollowCheck, string>({
            query: (userId) => `/users/${userId}/is-following`,
            providesTags: ['Follow'],
        }),
        getFollowRequests: builder.query<{ requests: User[]; count: number }, void>({
            query: () => '/follow/requests',
            providesTags: ['Follow'],
        }),
        handleFollowRequest: builder.mutation<
            { status: string; action: string; message: string },
            { follower_id: string; action: 'approve' | 'reject' }
        >({
            query: (data) => ({
                url: '/follow/requests/action',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Follow'],
        }),

        // Event Access Request endpoints
        requestEventAccess: builder.mutation<
            { status: string; message: string; event_id?: string },
            string
        >({
            query: (eventId) => ({
                url: `/events/${eventId}/access-request`,
                method: 'POST',
            }),
            invalidatesTags: ['EventAccess'],
        }),
        getEventAccessStatus: builder.query<
            { has_access: boolean; status: string | null; event_id: string },
            string
        >({
            query: (eventId) => `/events/${eventId}/access-request/status`,
            providesTags: ['EventAccess'],
        }),
        getEventAccessRequests: builder.query<
            { requests: Array<{ id: string; user_id: string; username: string; event_id: string; event_title: string; status: string; requested_at: string }>; count: number },
            void
        >({
            query: () => '/events/access-requests',
            providesTags: ['EventAccess'],
        }),
        handleEventAccessRequest: builder.mutation<
            { status: string; action: string; message: string },
            { request_id: string; action: 'approve' | 'reject' }
        >({
            query: (data) => ({
                url: '/events/access-requests/action',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['EventAccess'],
        }),
        // Share Link endpoints
        createShareLink: builder.mutation<
            { status: string; share_link: { id: string; token: string; label: string | null; has_password: boolean; expires_at: string | null; download_count: number; is_active: boolean; created_at: string } },
            { eventId: string; label?: string; password?: string; expires_in_days?: number }
        >({
            query: ({ eventId, ...body }) => ({
                url: `/events/${eventId}/share-links`,
                method: 'POST',
                body,
            }),
            invalidatesTags: ['ShareLink'],
        }),
        getShareLinks: builder.query<
            { links: Array<{ id: string; token: string; label: string | null; has_password: boolean; expires_at: string | null; download_count: number; is_active: boolean; created_at: string }> },
            string
        >({
            query: (eventId) => `/events/${eventId}/share-links`,
            providesTags: ['ShareLink'],
        }),
        deleteShareLink: builder.mutation<{ status: string }, string>({
            query: (linkId) => ({
                url: `/share-links/${linkId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['ShareLink'],
        }),
    }),
});

export const {
    useLoginMutation,
    useRegisterMutation,
    useGoogleLoginMutation,
    useOptOutMutation,
    useGetEventsQuery,
    useGetEventTypesQuery,
    useCreateEventMutation,
    useDeleteEventMutation,
    useUpdateEventMutation,
    useGetStorageUsageQuery,
    useUploadPhotosMutation,
    useGetUploadUrlsMutation,
    useConfirmUploadsMutation,
    useSearchPhotosMutation,
    useGetEventPhotosQuery,
    useDeletePhotoMutation,
    useGetEventDetailsQuery,
    // Collection hooks
    useGetCollectionsQuery,
    useGetCollectionQuery,
    useCreateCollectionMutation,
    useDeleteCollectionMutation,
    useRemovePhotoFromCollectionMutation,
    // Follow hooks
    useFollowUserMutation,
    useUnfollowUserMutation,
    useGetFollowersQuery,
    useGetFollowingQuery,
    useCheckIsFollowingQuery,
    useGetFollowRequestsQuery,
    useHandleFollowRequestMutation,
    // Event Access hooks
    useRequestEventAccessMutation,
    useGetEventAccessStatusQuery,
    useGetEventAccessRequestsQuery,
    useHandleEventAccessRequestMutation,
    // Share Link hooks
    useCreateShareLinkMutation,
    useGetShareLinksQuery,
    useDeleteShareLinkMutation,
} = apiSlice;
