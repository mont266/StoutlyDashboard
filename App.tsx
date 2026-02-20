import React, { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, checkUserAuthorization } from './services/supabaseService';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { StoutlyLogo } from './components/icons/Icons';

// This is the root component of the application.
const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [refreshKey, setRefreshKey] = useState(Date.now());

    // Centralized handler for processing session updates to avoid duplicate logic.
    // Wrapped in useCallback for stable identity in useEffect dependencies.
    const handleSessionState = useCallback(async (session: Session | null) => {
        setSession(session);
        if (session) {
            const authorized = await checkUserAuthorization(session.user.id);
            setIsAuthorized(authorized);
        } else {
            setIsAuthorized(false);
        }
        setAuthLoading(false); // Always mark authentication as complete.
    }, []);
    
    // Effect for handling authentication state: initial check and ongoing subscription.
    useEffect(() => {
        // Check initial session state when the component first mounts.
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleSessionState(session);
        }).catch((error) => {
            console.error("Error fetching initial session:", error);
            handleSessionState(null); // Treat an error as being logged out.
        });

        // Listen for all subsequent auth events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED).
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            handleSessionState(session);
            // Additionally, if a token refresh happens, it's a good signal to refresh data.
            if (_event === 'TOKEN_REFRESHED') {
                setRefreshKey(Date.now());
            }
        });

        // Cleanup subscription on component unmount to prevent memory leaks.
        return () => {
            subscription.unsubscribe();
        };
    }, [handleSessionState]);

    // Effect for refreshing data when the browser tab becomes visible again.
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // This tells the Supabase client to check the session state. If the token is
                // expired, it will attempt a refresh, which `onAuthStateChange` will handle.
                supabase.auth.getSession();
                
                // Forcing a refresh key update ensures that components listening
                // to this key will re-fetch their data, solving the stale data issue.
                setRefreshKey(Date.now());
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);


    const handleLogout = async () => {
        // After signOut, the onAuthStateChange listener will automatically handle
        // updating the UI state, providing a single source of truth.
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error.message);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-text-primary">
                <StoutlyLogo className="h-16 w-16 mb-4 animate-pulse" />
                <h1 className="text-2xl font-bold">Stoutly Analytics</h1>
                <p className="text-text-secondary">Authenticating...</p>
            </div>
        );
    }

    if (!session) {
        return <Login />;
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
                <StoutlyLogo className="h-16 w-16 mb-4" />
                <h1 className="text-2xl font-bold text-warning-red mb-2">Access Denied</h1>
                <p className="text-text-secondary max-w-sm mb-6">
                    Your account does not have the necessary permissions to access this analytics dashboard. Please contact an administrator if you believe this is an error.
                </p>
                <button
                    onClick={handleLogout}
                    className="bg-primary text-background font-semibold px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Logout
                </button>
            </div>
        );
    }

    return <Dashboard onLogout={handleLogout} refreshKey={refreshKey} />;
};

export default App;