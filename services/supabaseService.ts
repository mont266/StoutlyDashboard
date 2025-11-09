

import { createClient } from '@supabase/supabase-js';
// FIX: Import GA4Data type to support the new getGA4Data function.
import type { HomeData, User, Pub, ContentAnalytics, FinancialsData, UTMStat, Rating, Comment, UploadedImage, GA4Data, HomeKpis } from '../types';

// --- SUPABASE CLIENT SETUP ---

// FIX: Cast import.meta to any to resolve TypeScript error for Vite environment variables.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your Netlify environment.");
  // Throw an error to prevent the app from running without a database connection.
  throw new Error("Supabase client failed to initialize. Missing environment variables.");
}

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);


// --- STATIC HELPERS ---

export const LAUNCH_DATE = new Date('2023-08-01');

export const getDaysSinceLaunch = (): number => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - LAUNCH_DATE.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Generic error handler for components to catch
const handleSupabaseError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    throw new Error(`Failed to fetch data for ${context}. Ensure Supabase is configured correctly and the user has permission.`);
}

// --- LIVE API CALLS ---

// --- HOME TAB ---
export const getHomeData = async (timeframe: string): Promise<HomeData> => {
    try {
        const [kpisResult, chartsRawResult, tablesResult] = await Promise.all([
            supabase.rpc('get_dashboard_stats', { time_period: timeframe }).single(),
            // FIX: Remove .single() to allow multiple rows for time-series data
            supabase.rpc('get_dashboard_timeseries', { time_period: timeframe }),
            supabase.rpc('get_price_stats_by_country')
        ]);

        if (kpisResult.error) throw kpisResult.error;
        if (chartsRawResult.error) throw chartsRawResult.error;
        if (tablesResult.error) throw tablesResult.error;
        
        // FIX: Transform the array of time-series rows into the structure the charts expect.
        // Assuming the RPC returns rows with `date`, `new_users`, and `new_ratings` columns.
        const chartsData = {
            newUsersOverTime: chartsRawResult.data.map((row: any) => ({
                date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: row.new_users ?? 0,
            })),
            newRatingsOverTime: chartsRawResult.data.map((row: any) => ({
                date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: row.new_ratings ?? 0,
            })),
        };
        
        // FIX: Map snake_case properties from the DB to camelCase for the UI
        const rawKpis = kpisResult.data;
        const mappedKpis: HomeKpis = {
            totalUsers: rawKpis.total_users ?? 0,
            newUsers: rawKpis.new_users ?? 0,
            newUsersChange: rawKpis.new_users_change ?? 0,
            activeUsers: rawKpis.active_users ?? 0,
            activeUsersChange: rawKpis.active_users_change ?? 0,
            totalRatings: rawKpis.total_ratings ?? 0,
            newRatings: rawKpis.new_ratings ?? 0,
            newRatingsChange: rawKpis.new_ratings_change ?? 0,
            totalPubsWithRatings: rawKpis.total_pubs_with_ratings ?? 0,
            totalUploadedImages: rawKpis.total_uploaded_images ?? 0,
            totalComments: rawKpis.total_comments ?? 0,
        };

        return {
            kpis: mappedKpis,
            charts: chartsData,
            tables: {
                avgPintPriceByCountry: tablesResult.data
            }
        };
    } catch (error) {
        handleSupabaseError(error, 'Home Dashboard');
        throw error;
    }
};

// --- FINANCIALS TAB ---
export const getFinancialsData = async (timeframe: string): Promise<FinancialsData> => {
    try {
        // Supabase Edge Functions are invoked this way
        const { data, error } = await supabase.functions.invoke('get-financial-stats', {
            body: { time_period: timeframe },
        });

        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'Financials Data');
        throw error;
    }
};

// --- USERS TAB ---
export const getAllUsers = async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data as User[];
    } catch (error) {
        handleSupabaseError(error, 'All Users');
        throw error;
    }
};

export const getOnlineUsers = async (): Promise<User[]> => {
    try {
        // As per spec, this needs a list of online users. Assuming an RPC.
        const { data, error } = await supabase.rpc('get_online_users');
        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'Online Users');
        throw error;
    }
};

export const getUsersToday = async (): Promise<User[]> => {
    try {
        // As per spec, calling the specific RPC
        const { data, error } = await supabase.rpc('get_users_logged_in_today');
        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'Users Logged In Today');
        throw error;
    }
};

export const getUTMStats = async (): Promise<UTMStat[]> => {
    try {
        // As per spec, calling the specific RPC
        const { data, error } = await supabase.rpc('get_utm_stats');
        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'UTM Stats');
        throw error;
    }
};


// --- CONTENT TAB ---
export const getContentAnalyticsData = async (): Promise<ContentAnalytics> => {
    try {
        // Assuming a single RPC for all overview stats on this page.
        const { data, error } = await supabase.rpc('get_content_analytics').single();
        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'Content Analytics');
        throw error;
    }
};

export const getPubsLeaderboard = async (): Promise<Pub[]> => {
     try {
        // Leaderboards are often calculated fields, so an RPC is appropriate.
        const { data, error } = await supabase.rpc('get_pubs_leaderboard');
        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'Pubs Leaderboard');
        throw error;
    }
};

export const getRatingsData = async (): Promise<Rating[]> => {
    try {
        // Per spec, using the `all_ratings_view`
        const { data, error } = await supabase
            .from('all_ratings_view')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(20); // Limiting to avoid fetching thousands of rows at once.
            
        if (error) throw error;
        return data as Rating[];
    } catch (error) {
        handleSupabaseError(error, 'Ratings Data');
        throw error;
    }
};

export const getCommentsData = async (): Promise<Comment[]> => {
     try {
        // Per spec, querying comments with joins. Supabase handles this via select.
        const { data, error } = await supabase
            .from('comments')
            .select('*, user:profiles(*)')
            .order('timestamp', { ascending: false })
            .limit(20); // Limiting to avoid fetching thousands of rows at once.
            
        if (error) throw error;
        return data as Comment[];
    } catch (error) {
        handleSupabaseError(error, 'Comments Data');
        throw error;
    }
};

export const getImagesData = async (): Promise<UploadedImage[]> => {
    try {
        // The component implements client-side pagination, so we fetch all.
        // Let's add a reasonable limit to prevent crashing the browser.
        const { data, error } = await supabase
            .from('images')
            .select('*, user:profiles(*)')
            .order('timestamp', { ascending: false })
            .limit(100); 
            
        if (error) throw error;
        return data as UploadedImage[];
    } catch (error) {
        handleSupabaseError(error, 'Images Data');
        throw error;
    }
};

// FIX: Add missing getGA4Data function to resolve import error in GA4.tsx
// --- GA4 TAB ---
export const getGA4Data = async (timeframe: string): Promise<GA4Data> => {
    try {
        // Supabase Edge Functions are invoked this way
        const { data, error } = await supabase.functions.invoke('get-ga4-stats', {
            body: { time_period: timeframe },
        });

        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'GA4 Analytics Data');
        throw error;
    }
};