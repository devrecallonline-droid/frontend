'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store';
import {
    useLoginMutation,
    useRegisterMutation,
    useGoogleLoginMutation,
    useGetEventsQuery,
    useCreateEventMutation
} from '@/lib/api';
import { logout, loginSuccess } from '@/lib/store';
import { addAlert } from '@/lib/store';

export const useAuth = () => {
    const dispatch = useDispatch();
    const { user, loading } = useSelector((state: RootState) => state.auth);
    const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
    const [registerMutation, { isLoading: isRegisterLoading }] = useRegisterMutation();
    const [googleLoginMutation, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();

    const handleLogin = async (credentials: { email: string; password: string }) => {
        try {
            console.log('Attempting login with:', { email: credentials.email });
            const result = await loginMutation(credentials).unwrap();
            console.log('Login successful:', result);
            dispatch(loginSuccess(result));
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(result));
                localStorage.setItem('token', result.id);
            }
            dispatch(addAlert({ type: 'success', message: `Welcome back, ${result.username}!` }));
            return result;
        } catch (error: any) {
            console.error('Login error details:', error);
            console.error('Error type:', typeof error);
            console.error('Error keys:', Object.keys(error || {}));
            console.error('Error status:', error?.status);
            console.error('Error data:', error?.data);
            
            // Handle different error structures from RTK Query
            let errorMessage = 'Login failed';
            if (error?.data?.detail) {
                errorMessage = error.data.detail;
            } else if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.error) {
                errorMessage = error.error;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.status === 'FETCH_ERROR') {
                errorMessage = 'Network error. Please check your connection or try again later.';
            } else if (error?.status === 'PARSING_ERROR') {
                errorMessage = 'Server error. Please try again later.';
            } else if (error?.status === 'TIMEOUT_ERROR') {
                errorMessage = 'Request timeout. Please try again.';
            } else if (error?.status) {
                errorMessage = `Server error (${error.status}). Please try again.`;
            }
            
            dispatch(addAlert({ type: 'error', message: errorMessage }));
            throw error;
        }
    };

    const handleRegister = async (credentials: { username: string; email: string; password: string }) => {
        try {
            const result = await registerMutation(credentials).unwrap();
            dispatch(loginSuccess(result));
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(result));
                localStorage.setItem('token', result.id);
            }
            dispatch(addAlert({ type: 'success', message: `Account created! Welcome, ${result.username}!` }));
            return result;
        } catch (error: any) {
            console.error('Registration error details:', error);
            
            // Handle different error structures from RTK Query
            let errorMessage = 'Registration failed';
            if (error?.data?.detail) {
                errorMessage = error.data.detail;
            } else if (error?.data?.message) {
                errorMessage = error.data.message;
            } else if (error?.error) {
                errorMessage = error.error;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.status === 'FETCH_ERROR') {
                errorMessage = 'Network error. Please check your connection or try again later.';
            } else if (error?.status === 'PARSING_ERROR') {
                errorMessage = 'Server error. Please try again later.';
            } else if (error?.status === 'TIMEOUT_ERROR') {
                errorMessage = 'Request timeout. Please try again.';
            } else if (error?.status) {
                errorMessage = `Server error (${error.status}). Please try again.`;
            }
            
            dispatch(addAlert({ type: 'error', message: errorMessage }));
            throw error;
        }
    };

    const handleGoogleLogin = async (credential: string) => {
        try {
            const result = await googleLoginMutation({ credential }).unwrap();
            dispatch(loginSuccess(result));
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(result));
                localStorage.setItem('token', result.id);
            }
            const msg = result.status === 'new'
                ? `Account created! Welcome, ${result.username}!`
                : `Welcome back, ${result.username}!`;
            dispatch(addAlert({ type: 'success', message: msg }));
            return result;
        } catch (error) {
            dispatch(addAlert({ type: 'error', message: 'Google login failed' }));
            throw error;
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
        dispatch(addAlert({ type: 'success', message: 'Logged out successfully' }));
    };

    return {
        user,
        isAuthenticated: !!user,
        loading: loading || isLoginLoading || isRegisterLoading || isGoogleLoading,
        login: handleLogin,
        register: handleRegister,
        googleLogin: handleGoogleLogin,
        logout: handleLogout,
    };
};

export const useEvents = () => {
    const { data: events = [], isLoading, error, refetch } = useGetEventsQuery(undefined);
    const [createEventMutation, { isLoading: isCreating }] = useCreateEventMutation();
    const dispatch = useDispatch();

    const createEvent = async (eventData: Record<string, unknown>) => {
        try {
            const result = await createEventMutation(eventData).unwrap();
            dispatch(addAlert({ type: 'success', message: `✅ Event "${result.title}" created successfully!` }));
            return result;
        } catch (err) {
            dispatch(addAlert({ type: 'error', message: '❌ Failed to create event' }));
            throw err;
        }
    };

    return {
        events,
        isLoading,
        error,
        refetch,
        createEvent,
        createEventLoading: isCreating,
    };
};

export const useUI = () => {
    const dispatch = useDispatch();
    const alerts = useSelector((state: RootState) => state.ui.alerts);

    return {
        alerts,
        addAlert: (alert: { type: 'success' | 'error' | 'info' | 'warning'; message: string }) => dispatch(addAlert(alert)),
        removeAlert: (id: string) => dispatch({ type: 'ui/removeAlert', payload: id }),
        clearAlerts: () => dispatch({ type: 'ui/clearAlerts' }),
    };
};
