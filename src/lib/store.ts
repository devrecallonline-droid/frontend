import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { apiSlice } from './api';

export interface User {
    id: string;
    username: string;
    email: string;
    created_at?: string;
    [key: string]: unknown;
}

interface AuthState {
    user: User | null;
    loading: boolean;
}

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        loading: false,
    } as AuthState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
        },
        loginSuccess: (state, action: PayloadAction<User>) => {
            state.loading = false;
            state.user = action.payload;
        },
        logout: (state) => {
            state.user = null;
            if (typeof window !== 'undefined') {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        },
    },
});

export const { loginStart, loginSuccess, logout } = authSlice.actions;

interface UIState {
    alerts: Array<{ id: string; type: 'success' | 'error' | 'info' | 'warning'; message: string }>;
}

const uiSlice = createSlice({
    name: 'ui',
    initialState: {
        alerts: [],
    } as UIState,
    reducers: {
        addAlert: (state, action: PayloadAction<{ type: 'success' | 'error' | 'info' | 'warning'; message: string }>) => {
            const id = Date.now().toString();
            state.alerts.push({ ...action.payload, id });
        },
        removeAlert: (state, action: PayloadAction<string>) => {
            state.alerts = state.alerts.filter((alert) => alert.id !== action.payload);
        },
        clearAlerts: (state) => {
            state.alerts = [];
        },
    },
});

export const { addAlert, removeAlert, clearAlerts } = uiSlice.actions;

export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        auth: authSlice.reducer,
        ui: uiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
