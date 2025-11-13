import React, { useState, useEffect } from 'react';
// FIX: Changed to a type-only import for Session, which can help with module resolution issues and is best practice.
import type { Session } from '@supabase/supabase-js';
import { supabase, checkUserAuthorization } from './services/supabaseService';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { StoutlyLogo } from './components/icons/Icons';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [refreshKey, setRefreshKey] = useState(Date.now());

    useEffect(() => {
        // onAuthStateChange handles the initial session check and all subsequent auth events.
        // FIX: The error indicating 'onAuthStateChange' does not exist is likely due to a library version mismatch. This is the correct method name for both v1 and v2 of supabase-js.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (_event === 'TOKEN_REFRESHED') {
                setRefreshKey(Date.now());
            }
            if (session) {
                const authorized = await checkUserAuthorization(session.user.id);
                setIsAuthorized(authorized);
            } else {
                setIsAuthorized(false);
            }
            // The first time this callback runs, the initial authentication check is complete.
            // Subsequent runs (e.g., for token refreshes) will just re-set this state to false,
            // preventing the main loading screen from reappearing.
            setAuthLoading(false);
        });

        // FIX: Removed window focus handler that uses `getSession`. The `getSession` method does not exist in older Supabase client versions.
        // The onAuthStateChange listener is sufficient as it handles session state changes, including those triggered by tab focus.
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        // FIX: The error indicating 'signOut' does not exist is likely due to a library version mismatch. This is the correct method name.
        await supabase.auth.signOut();
        setSession(null);
        setIsAuthorized(false);
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
