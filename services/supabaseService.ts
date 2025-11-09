
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
                 // Map avg_price from DB to price for the UI
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
        // Best practice to select only the columns needed.
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, email, avatar_url, level, is_banned, created_at, updated_at, country_code, is_beta_tester, is_developer, is_team_member, has_donated, reviews');
        
        if (error) throw error;
        
        return (data as any[] || []).map(p => ({
            id: p.id,
            name: p.username,
            email: p.email, // Assuming the view/RLS policy provides this from auth.users
            avatarUrl: p.avatar_url,
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
        // Use the 'get_top_pubs' RPC as it's more direct and efficient.
        const { data, error } = await supabase.rpc('get_top_pubs', {
            time_period: 'all'
        });

        if (error) throw error;

        // Map the snake_case results from the RPC to the camelCase Pub type.
        return ((data as any[]) || []).map(p => ({
            id: p.id,
            name: p.name,
            location: p.address, // Map 'address' from RPC to 'location'
            averageScore: p.avg_quality ?? 0, // Map 'avg_quality' to 'averageScore'
            totalRatings: p.rating_count ?? 0, // Map 'rating_count' to 'totalRatings'
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
                avatarUrl: r.avatar_url,
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
