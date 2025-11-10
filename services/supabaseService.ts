import { createClient } from '@supabase/supabase-js';
import type { HomeData, User, Pub, ContentAnalytics, FinancialsData, UTMStat, Rating, Comment, UploadedImage, GA4Data, HomeKpis, UserKpis } from '../types';
import type { DashHomeData, DashUsersData, DashPubsData, DashContentInitialData } from './dashContracts';


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
export const getAvatarUrl = (avatarData: string): string => {
    if (!avatarData) {
        return ''; // Return empty string for null/empty data to trigger UI fallbacks.
    }

    // The avatar_id can be a raw UUID, or a JSON string.
    // The JSON can either be an object (for Dicebear/new uploads) or a string (for legacy UUIDs stored as JSON).
    try {
        const parsed = JSON.parse(avatarData);
        
        // Case 1: It's a structured object for Dicebear or a new uploaded image.
        if (parsed && typeof parsed === 'object') {
            if (parsed.type === 'dicebear' && parsed.style && parsed.seed) {
                return `https://api.dicebear.com/8.x/${parsed.style}/svg?seed=${encodeURIComponent(parsed.seed)}`;
            }
            if (parsed.type === 'uploaded' && parsed.url) {
                return parsed.url;
            }
        }

        // Case 2: It's a JSON-encoded string, e.g., '"legacy-uuid-123"'.
        // `parsed` will be the string "legacy-uuid-123".
        if (typeof parsed === 'string' && parsed.length > 0) {
            return `${supabaseUrl}/storage/v1/object/public/avatars/${parsed}`;
        }

        // It was valid JSON but not a recognized format.
        return '';

    } catch (error) {
        // Case 3: It's not valid JSON, so it must be a raw legacy ID string.
        return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarData}`;
    }
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
    // Do not wrap and re-throw a generic error.
    // Let the original error propagate so UI components can inspect it
    // for details like HTTP status codes for more specific error handling.
}

// --- LIVE API CALLS (NEW CONSOLIDATED DASHBOARD FUNCTIONS) ---

// --- HOME TAB ---
export const dash_getHomeData = async (timeframe: string): Promise<DashHomeData> => {
    try {
        // This will be a single RPC call to the new, consolidated function
        const { data, error } = await supabase
            .rpc('dash_get_home_data', { time_period: timeframe })
            .single();
        
        if (error) throw error;
        
        // The data should already match the DashHomeData contract perfectly.
        // We just need to format the date for the chart display.
        return {
            ...data,
            charts: {
                newUsersOverTime: data.charts.newUsersOverTime.map((row: any) => ({
                    ...row,
                    date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                })),
                newRatingsOverTime: data.charts.newRatingsOverTime.map((row: any) => ({
                    ...row,
                    date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                })),
            }
        };
    } catch (error) {
        handleSupabaseError(error, 'Home Dashboard (New)');
        throw error;
    }
};

// --- USERS TAB ---
export const dash_getUsersData = async (): Promise<DashUsersData> => {
    try {
        const { data, error } = await supabase.rpc('dash_get_users_data').single();
        if (error) throw error;
        // The RPC will return an object matching the DashUsersData contract.
        return data;
    } catch (error) {
        handleSupabaseError(error, 'Users Data (New)');
        throw error;
    }
};

// --- PUBS TAB ---
export const dash_getPubsData = async (): Promise<DashPubsData> => {
    try {
        const { data, error } = await supabase.rpc('dash_get_pubs_data').single();
        if (error) throw error;
        // The RPC will return an object matching the DashPubsData contract.
        return data;
    } catch (error) {
        handleSupabaseError(error, 'Pubs Data (New)');
        throw error;
    }
};


// --- DEPRECATED/OLD FUNCTIONS (To be removed after refactor) ---

// --- HOME TAB (OLD) ---
/*
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
        
        const rawKpis = kpisResult.data as any;

        const newUsersFromChart = chartsData.newUsersOverTime.reduce((sum, current) => sum + current.value, 0);
        const newRatingsFromChart = chartsData.newRatingsOverTime.reduce((sum, current) => sum + current.value, 0);

        const mappedKpis: HomeKpis = {
            totalUsers: rawKpis.total_users ?? 0,
            newUsers: newUsersFromChart,
            newUsersChange: rawKpis.new_users_change ?? 0,
            activeUsers: rawKpis.active_users ?? 0,
            activeUsersChange: rawKpis.active_users_change ?? 0,
            totalRatings: rawKpis.total_ratings ?? 0,
            newRatings: newRatingsFromChart,
            newRatingsChange: rawKpis.new_ratings_change ?? 0,
            totalPubs: rawKpis.total_pubs ?? 0,
            totalUploadedImages: rawKpis.total_uploaded_images ?? 0,
            totalComments: rawKpis.total_comments ?? 0,
        };

        return {
            kpis: mappedKpis,
            charts: chartsData,
            tables: {
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
*/

// --- FINANCIALS TAB ---
// This already uses a single endpoint, which is good. Renaming to `dash_` for consistency.
export const dash_getFinancialsData = async (timeframe: string): Promise<FinancialsData> => {
    try {
        const { data, error } = await supabase.functions.invoke('dash-get-financial-stats', {
            body: { time_period: timeframe },
        });

        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'Financials Data');
        throw error;
    }
};

// --- USERS TAB (OLD) ---
/*
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
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_id, level, is_banned, created_at, updated_at, country_code, is_beta_tester, is_developer, is_team_member, has_donated, reviews');
        
        if (error) throw error;
        
        return (data as any[] || []).map(p => ({
            id: p.id,
            name: p.username,
            avatarId: p.avatar_id,
            level: p.level,
            banStatus: p.is_banned ? 'Banned' : 'Active',
            signupDate: p.created_at,
            lastActive: p.updated_at,
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
        const { data, error } = await supabase.rpc('get_users_logged_in_today');
        if (error) throw error;
        
        return (data as any[] || []).map(p => ({
            id: p.id,
            name: p.username,
            avatarId: p.avatar_id,
            level: p.level,
            banStatus: p.is_banned ? 'Banned' : 'Active',
            signupDate: p.created_at,
            lastActive: p.updated_at,
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
        const { data, error } = await supabase.rpc('get_utm_stats');
        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'UTM Stats');
        throw error;
    }
};
*/
// The individual user fetch functions will be replaced by the single dash_getUsersData call.

// --- CONTENT TAB ---
// The initial load can be consolidated. Paginated loads will remain separate for now.
export const dash_getContentInitialData = async (ratingsPageSize: number, commentsPageSize: number, imagesPageSize: number): Promise<DashContentInitialData> => {
     try {
        const { data, error } = await supabase.rpc('dash_get_content_initial_feeds', {
            ratings_page_size: ratingsPageSize,
            comments_page_size: commentsPageSize,
            images_page_size: imagesPageSize,
        }).single();

        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'Initial Content Feeds (New)');
        throw error;
    }
}


// These will be refactored to call new, simpler `dash_` functions.
export const getRatingsData = async (pageNumber: number, pageSize: number): Promise<Rating[]> => {
    try {
        const { data: ratingsData, error } = await supabase
            .rpc('get_community_feed', {
                page_size: pageSize, 
                page_number: pageNumber, 
                sort_by: 'latest', 
                time_period: 'All'
            });
            
        if (error) throw error;
        if (!ratingsData) return [];

        return (ratingsData as any[]).map(r => {
            const subScores = [r.atmosphere, r.quality, r.price].filter(s => typeof s === 'number');
            const calculatedScore = subScores.length > 0 ? subScores.reduce((a, b) => a + b, 0) / subScores.length : 0;
            const score = (r.overall && r.overall > 0) ? r.overall : calculatedScore;

            return {
                id: r.rating_id,
                pubName: r.pub_name,
                score: score,
                atmosphere: r.atmosphere,
                quality: r.quality,
                price: r.price,
                timestamp: new Date(r.created_at).toLocaleString(),
                user: {
                    name: r.username || 'Anonymous User',
                    avatarId: r.avatar_id,
                },
                message: r.message,
            };
        });
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
        return ((data as any[]) || []).map(c => ({
            id: c.comment_id,
            text: c.content,
            timestamp: new Date(c.created_at).toLocaleString(),
            user: {
                name: c.username,
                avatarId: c.avatar_id,
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
        return ((data as any[]) || []).map(i => ({
            id: i.image_id,
            imageUrl: i.image_url,
            timestamp: new Date(i.created_at).toLocaleString(),
            user: {
                name: i.username,
                avatarId: i.avatar_id,
            }
        }));
    } catch (error) {
        handleSupabaseError(error, 'Images Data');
        throw error;
    }
};

// --- GA4 TAB ---
// This also uses a single endpoint. Renaming for consistency.
export const dash_getGA4Data = async (timeframe: string): Promise<GA4Data> => {
    try {
        const { data, error } = await supabase.functions.invoke('dash-get-ga4-stats', {
            body: { time_period: timeframe },
        });

        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'GA4 Analytics Data');
        throw error;
    }
};
