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
        let ignore = false;

        async function initializeSession() {
            // Use getSession() to fetch the current session.
            // This is more reliable for the initial load, especially on mobile
            // where onAuthStateChange might have timing issues or not fire immediately.
            const { data: { session: currentSession }, error } = await supabase.auth.getSession();

            if (error) {
                console.error("Error fetching session:", error.message);
            }

            // Check for the ignore flag to prevent state updates if the component unmounts
            // before the async operation completes.
            if (!ignore) {
                setSession(currentSession);
                if (currentSession) {
                    const authorized = await checkUserAuthorization(currentSession.user.id);
                    setIsAuthorized(authorized);
                } else {
                    setIsAuthorized(false);
                }
                setAuthLoading(false);
            }
        }

        initializeSession();

        // onAuthStateChange handles all subsequent auth events after the initial check.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!ignore) {
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
                // Also set loading to false here to handle sign-in/sign-out transitions.
                setAuthLoading(false);
            }
        });

        // The cleanup function will run when the component unmounts.
        return () => {
            ignore = true;
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
