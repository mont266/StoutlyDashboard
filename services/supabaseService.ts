

import { createClient } from '@supabase/supabase-js';
import type { HomeData, User, Pub, ContentAnalytics, FinancialsData, UTMStat, Rating, Comment, UploadedImage, GA4Data, HomeKpis, UserKpis } from '../types';

// --- SUPABASE CLIENT SETUP ---

// Cast import.meta to any to resolve TypeScript error for Vite environment variables.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your Netlify environment.");
  // Throw an error to prevent the app from running without a database connection.
  throw new Error("Supabase client failed to initialize. Missing environment variables.");
}

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// --- AVATAR URL HELPER ---
// FIX: Updated to handle JSON string from the database as well as plain IDs.
export const getAvatarUrl = (avatarData: string): string => {
    if (!avatarData) return '';

    // Stoutly stores avatar info in a JSON string in the `avatar_id` column.
    // We need to parse it to get the actual public URL.
    if (avatarData.startsWith('{') && avatarData.endsWith('}')) {
        try {
            const parsed = JSON.parse(avatarData);
            // The URL might be timestamped, which is fine.
            if (parsed && parsed.url) {
                return parsed.url;
            }
        } catch (e) {
            // It failed to parse, fall through to treat as a raw ID.
            console.warn("Could not parse avatarData JSON, falling back to ID:", avatarData);
        }
    }
    
    // Fallback for older data where this might just be an ID.
    return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarData}`;
};


// --- STATIC HELPERS ---

export const LAUNCH_DATE = new Date('2025-07-25');

export const getLaunchDuration = (): { years: number, months: number, days: number } => {
    const startDate = LAUNCH_DATE;
    const endDate = new Date();

    if (endDate < startDate) {
        return { years: 0, months: 0, days: 0 };
    }
    
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    if (days < 0) {
        months--;
        const daysInLastFullMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
        days += daysInLastFullMonth;
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    return { years, months, days };
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
            supabase.rpc('get_dashboard_timeseries', { time_period: timeframe }),
            supabase.rpc('get_price_stats_by_country')
        ]);

        if (kpisResult.error) throw kpisResult.error;
        if (chartsRawResult.error) throw chartsRawResult.error;
        if (tablesResult.error) throw tablesResult.error;
        
        // Transform the array of time-series rows into the structure the charts expect.
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
        
        // Map snake_case properties from the DB to camelCase for the UI
        // Cast RPC result data to `any` to allow dynamic property access.
        const rawKpis = kpisResult.data as any;
        const mappedKpis: HomeKpis = {
            totalUsers: rawKpis.total_users ?? 0,
            // FIX: Calculate new users from timeseries data for accuracy
            newUsers: chartsData.newUsersOverTime.reduce((sum, current) => sum + current.value, 0),
            newUsersChange: rawKpis.new_users_change ?? 0,
            activeUsers: rawKpis.active_users ?? 0,
            activeUsersChange: rawKpis.active_users_change ?? 0,
            totalRatings: rawKpis.total_ratings ?? 0,
             // FIX: Calculate new ratings from timeseries data for accuracy
            newRatings: chartsData.newRatingsOverTime.reduce((sum, current) => sum + current.value, 0),
            newRatingsChange: rawKpis.new_ratings_change ?? 0,
            // FIX: Use total_pubs instead of total_pubs_with_ratings
            totalPubs: rawKpis.total_pubs ?? 0,
            totalUploadedImages: rawKpis.total_uploaded_images ?? 0,
            totalComments: rawKpis.total_comments ?? 0,
        };

        return {
            kpis: mappedKpis,
            charts: chartsData,
            tables: {
                 // FIX: Use 'name' field for country name as 'country' might be null.
                avgPintPriceByCountry: (tablesResult.data || []).map((v: any) => ({
                    country: v.name,
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
        // Assuming edge function is also updated to return avatar_id
        return data;
    } catch (error) {
        handleSupabaseError(error, 'Financials Data');
        throw error;
    }
};

// --- USERS TAB ---
export const getUserKpis = async (): Promise<UserKpis> => {
    try {
        const { data, error } = await supabase
            .rpc('get_dashboard_stats', { time_period: '24h' })
            .single();

        if (error) throw error;
        
        const rawData = data as any;

        return {
            totalUsers: rawData.total_users ?? 0,
            activeToday: rawData.active_users ?? 0,
        };
    } catch (error) {
        handleSupabaseError(error, 'User KPIs');
        throw error;
    }
};

export const getAllUsers = async (): Promise<User[]> => {
    try {
        // FIX: Changed select from avatar_url to avatar_id
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_id, level, is_banned, created_at, updated_at, country_code, is_beta_tester, is_developer, is_team_member, has_donated, reviews');
        
        if (error) throw error;
        
        return (data as any[] || []).map(p => ({
            id: p.id,
            name: p.username,
            avatarId: p.avatar_id, // FIX: Mapped avatar_id
            level: p.level,
            banStatus: p.is_banned ? 'Banned' : 'Active',
            signupDate: new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            lastActive: new Date(p.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            countryCode: p.country_code,
            isBetaTester: p.is_beta_tester,
            isDeveloper: p.is_developer,
            isTeamMember: p.is_team_member,
            hasDonated: p.has_donated,
            reviewsCount: p.reviews || 0,
        }));
    } catch (error) {
        handleSupabaseError(error, 'All Users');
        throw error;
    }
};

export const getUsersToday = async (): Promise<User[]> => {
    try {
        // As per spec, calling the specific RPC
        const { data, error } = await supabase.rpc('get_users_logged_in_today');
        if (error) throw error;
        
        return (data as any[] || []).map(p => ({
            id: p.id,
            name: p.username,
            avatarId: p.avatar_id, // FIX: Mapped avatar_id from RPC result
            level: p.level,
            banStatus: p.is_banned ? 'Banned' : 'Active',
            signupDate: new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            lastActive: new Date(p.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            countryCode: p.country_code,
            isBetaTester: p.is_beta_tester,
            isDeveloper: p.is_developer,
            isTeamMember: p.is_team_member,
            hasDonated: p.has_donated,
            reviewsCount: p.reviews || 0,
        }));
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
        // Replace non-existent `get_content_analytics` with existing functions.
        const [statsResult, priceResult] = await Promise.all([
            supabase.rpc('get_dashboard_stats', { time_period: 'All' }).single(),
            supabase.rpc('get_price_stats_by_country')
        ]);

        if (statsResult.error) throw statsResult.error;
        if (priceResult.error) throw priceResult.error;
        
        const rawData = statsResult.data as any;

        // Map snake_case properties from the DB to camelCase for the UI
        const mappedData: ContentAnalytics = {
            totalPubs: rawData.total_pubs ?? 0,
            // No function provides average rating, so default to 0.
            averageOverallRating: 0,
            totalRatingsSubmitted: rawData.total_ratings ?? 0,
            pintPriceByCountry: (priceResult.data || []).map((v: any) => ({
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
        // FIX: Rewrote query to join pub_scores with the pubs table to get name and address.
        const { data, error } = await supabase
            .from('pub_scores')
            .select(`
                pub_id, 
                overall_score, 
                rating_count,
                pubs ( name, address )
            `)
            .order('overall_score', { ascending: false })
            .limit(10);

        if (error) throw error;

        // Map the results, accessing the joined 'pubs' data.
        return ((data as any[]) || []).map(p => ({
            id: p.pub_id,
            name: p.pubs?.name || 'Unknown Pub', // Safely access joined data
            location: p.pubs?.address || 'Unknown Location',
            averageScore: p.overall_score ?? 0,
            totalRatings: p.rating_count ?? 0,
        }));
    } catch (error) {
        handleSupabaseError(error, 'Pubs Leaderboard');
        throw error;
    }
};

export const getRatingsData = async (pageNumber: number, pageSize: number): Promise<Rating[]> => {
    try {
        const { data, error } = await supabase
            .rpc('get_community_feed', {
                page_size: pageSize, 
                page_number: pageNumber, 
                sort_by: 'latest', 
                time_period: 'All'
            })
            
        if (error) throw error;

        return ((data as any[]) || []).map(r => ({
            id: r.rating_id,
            pubName: r.pub_name,
            score: r.overall ?? 0,
            atmosphere: r.atmosphere,
            quality: r.quality,
            price: r.price,
            timestamp: new Date(r.created_at).toLocaleString(),
            user: {
                name: r.username || 'Anonymous User',
                avatarId: r.avatar_id, // FIX: Mapped avatar_id
            },
            message: r.message,
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
                avatarId: c.avatar_id, // FIX: Mapped avatar_id
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
                avatarId: i.avatar_id, // FIX: Mapped avatar_id
            }
        }));
    } catch (error) {
        handleSupabaseError(error, 'Images Data');
        throw error;
    }
};

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