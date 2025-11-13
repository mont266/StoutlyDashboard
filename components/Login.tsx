import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { StoutlyLogo } from './icons/Icons';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            // FIX: Reverted to `signInWithPassword` which is the correct method for Supabase JS v2.
            // The previous use of `signIn` is for v1 and can lead to inconsistent session handling
            // when mixed with v2 methods like `onAuthStateChange`.
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                setError(error.message);
            }
            // onAuthStateChange in App.tsx will handle the redirect
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm mx-auto">
                <div className="text-center mb-8">
                    <StoutlyLogo className="h-16 w-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-text-primary">Stoutly Analytics</h1>
                    <p className="text-text-secondary mt-1">Sign in to your account.</p>
                </div>
                
                <form onSubmit={handleLogin} className="bg-surface p-8 rounded-xl shadow-lg space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="you@stoutly.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-3 focus:ring-primary focus:border-primary transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                    
                    {error && (
                        <p className="text-sm text-warning-red bg-warning-red/10 p-3 rounded-lg text-center">
                            {error}
                        </p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-background bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
