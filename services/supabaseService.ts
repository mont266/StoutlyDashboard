
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

export const LAUNCH_DATE = new Date('2025-07-25');

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
            // FIX: Removed incorrect generic which was causing a parameter type error.
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
        // Cast RPC result data to `any` to allow dynamic property access.
        const rawKpis = kpisResult.data as any;
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
                 // FIX: Map avg_price from DB to price for the UI
                avgPintPriceByCountry: (tablesResult.data || []).map((v: any) => ({
                    country: v.country,
                    flag: v.flag,
                    price: v.avg_price ?? 0,
                }))
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
        // FIX: Add a default time_period parameter to the RPC call to resolve the "function not found" error (PGRST202).
        const { data: rawData, error } = await supabase.rpc('get_content_analytics', { time_period: 'All' }).single();
        if (error) throw error;

        // FIX: Map snake_case properties from the DB to camelCase for the UI
        const mappedData: ContentAnalytics = {
            totalPubs: (rawData as any).total_pubs ?? 0,
            averageOverallRating: (rawData as any).average_overall_rating ?? 0,
            totalRatingsSubmitted: (rawData as any).total_ratings_submitted ?? 0,
            pintPriceByCountry: ((rawData as any).pint_price_by_country || []).map((v: any) => ({
                country: v.country,
                flag: v.flag,
                price: v.avg_price ?? 0,
            })),
        };
        
        return mappedData;
    } catch (error) {
        handleSupabaseError(error, 'Content Analytics');
        throw error;
    }
};

export const getPubsLeaderboard = async (): Promise<Pub[]> => {
     try {
        // FIX: Add a default time_period parameter to the RPC call to resolve the "function not found" error (PGRST202).
        const { data, error } = await supabase.rpc('get_pubs_leaderboard', { time_period: 'All' });
        if (error) throw error;
        // FIX: Map snake_case properties from the DB to camelCase for UI consistency and type safety.
        return ((data as any[]) || []).map(p => ({
            id: p.pub_id,
            name: p.pub_name,
            location: p.pub_location,
            averageScore: p.average_score ?? 0,
            totalRatings: p.total_ratings ?? 0,
        }));
    } catch (error) {
        handleSupabaseError(error, 'Pubs Leaderboard');
        throw error;
    }
};

export const getRatingsData = async (): Promise<Rating[]> => {
    try {
        const { data, error } = await supabase
            .from('all_ratings_view')
            .select('*')
            // FIX: Corrected column name from 'timestamp' to 'created_at' to resolve the "column does not exist" error (42703).
            .order('created_at', { ascending: false })
            .limit(20);
            
        if (error) throw error;
        // FIX: Map the flat view data to the nested object structure expected by the Rating type for type safety.
        return ((data as any[]) || []).map(r => ({
            id: r.rating_id,
            pubName: r.pub_name,
            score: r.overall,
            timestamp: new Date(r.created_at).toLocaleString(),
            user: {
                name: r.username,
                avatarUrl: r.avatar_url,
            }
        }));
    } catch (error) {
        handleSupabaseError(error, 'Ratings Data');
        throw error;
    }
};

export const getCommentsData = async (pageNumber: number, pageSize: number): Promise<Comment[]> => {
     try {
        const { data, error } = await supabase
            .rpc('get_all_comments', { 
                page_number: pageNumber, 
                page_size: pageSize 
            });
            
        if (error) throw error;
        // The RPC likely returns flattened snake_case columns from a join. Map them to the nested camelCase structure.
        return ((data as any[]) || []).map(c => ({
            id: c.comment_id,
            text: c.content,
            timestamp: new Date(c.created_at).toLocaleString(),
            user: {
                name: c.username,
                avatarUrl: c.avatar_url,
            }
        }));
    } catch (error) {
        handleSupabaseError(error, 'Comments Data');
        throw error;
    }
};

export const getImagesData = async (pageNumber: number, pageSize: number): Promise<UploadedImage[]> => {
    try {
        const { data, error } = await supabase
            .rpc('get_all_images', { 
                page_number: pageNumber, 
                page_size: pageSize 
            });
            
        if (error) throw error;
        // The RPC likely returns flattened snake_case columns from a join. Map them to the nested camelCase structure.
        return ((data as any[]) || []).map(i => ({
            id: i.image_id,
            imageUrl: i.image_url,
            timestamp: new Date(i.created_at).toLocaleString(),
            user: {
                name: i.username,
                avatarUrl: i.avatar_url,
            }
        }));
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
