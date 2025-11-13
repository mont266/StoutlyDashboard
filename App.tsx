import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, checkUserAuthorization } from './services/supabaseService';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { StoutlyLogo } from './components/icons/Icons';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [authChecked, setAuthChecked] = useState<boolean>(false);

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session) {
                const authorized = await checkUserAuthorization(session.user.id);
                setIsAuthorized(authorized);
            }
            setLoading(false);
            setAuthChecked(true);
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            if (session) {
                setLoading(true);
                const authorized = await checkUserAuthorization(session.user.id);
                setIsAuthorized(authorized);
                setLoading(false);
            } else {
                setIsAuthorized(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setIsAuthorized(false);
    };

    if (loading || !authChecked) {
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

    return <Dashboard onLogout={handleLogout} />;
};

export default App;
