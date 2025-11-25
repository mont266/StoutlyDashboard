

import { createClient } from '@supabase/supabase-js';
// FIX: `NewOutgoingData` is now part of the dash contracts, so it's removed from this import.
import type { HomeData, User, Pub, ContentAnalytics, FinancialsData, UTMStat, Rating, Comment, UploadedImage, GA4Data, HomeKpis, UserKpis, TimeSeriesDataPoint } from '../types';
// FIX: `NewOutgoingData` is now imported from here as it's part of the dash contract.
import type { DashHomeData, DashUsersData, DashPubsData, DashContentInitialData, DashOutgoingsData, NewOutgoingData, DashFinancialSummary } from './dashContracts';


// --- SUPABASE CLIENT SETUP ---

// Cast import.meta to any to resolve TypeScript error for Vite environment variables.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your Netlify environment.");
  // Throw an error to prevent the app from running without a database connection.
  throw new Error("Supabase client failed to initialize. Missing environment variables.");
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// --- AUTHORIZATION CHECK ---
export const checkUserAuthorization = async (userId: string): Promise<boolean> => {
    if (!userId) return false;
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('is_team_member, is_developer')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Authorization check error:', error);
            return false;
        }

        return data?.is_team_member || data?.is_developer || false;
    } catch (error) {
        console.error('Error in checkUserAuthorization:', error);
        return false;
    }
};


// --- AVATAR URL HELPER ---
export const getAvatarUrl = (avatarData: string): string => {
    // FIX: Also check for the literal string 'null' which may be stored in the DB.
    if (!avatarData || avatarData.trim() === 'null') {
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
        // FIX: Add check for the parsed string being 'null' (from a JSON value of "null").
        if (typeof parsed === 'string' && parsed.length > 0 && parsed !== 'null') {
            return `${supabaseUrl}/storage/v1/object/public/avatars/${parsed}`;
        }

        // It was valid JSON but not a recognized format.
        return '';

    } catch (error) {
        // Case 3: It's not valid JSON, so it must be a raw legacy ID string.
        // The check at the top handles the raw string 'null'.
        return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarData}`;
    }
};

// --- CURRENCY FORMATTING HELPER ---
interface CurrencyInfo {
    symbol: string;
    code: string;
}

const CURRENCY_MAP: Record<string, CurrencyInfo> = {
    // Existing Currencies (symbols corrected)
    'GB': { symbol: '£', code: 'GBP' },
    'IE': { symbol: '€', code: 'EUR' },
    'US': { symbol: '$', code: 'USD' },
    'DE': { symbol: '€', code: 'EUR' },
    'FR': { symbol: '€', code: 'EUR' },
    'ES': { symbol: '€', code: 'EUR' },
    'NL': { symbol: '€', code: 'EUR' },
    'AU': { symbol: '$', code: 'AUD' },
    'PT': { symbol: '€', code: 'EUR' },
    'DK': { symbol: 'kr', code: 'DKK' },
    'CA': { symbol: '$', code: 'CAD' },
    'PL': { symbol: 'zł', code: 'PLN' },
    'TR': { symbol: '₺', code: 'TRY' },
    'IT': { symbol: '€', code: 'EUR' },
    'IL': { symbol: '₪', code: 'ILS' },
    'AT': { symbol: '€', code: 'EUR' },
    'BE': { symbol: '€', code: 'EUR' },

    // Added Currencies
    'PE': { symbol: 'S/', code: 'PEN' },      // Peru - Sol
    'CZ': { symbol: 'Kč', code: 'CZK' },      // Czech Republic - Koruna
    'SE': { symbol: 'kr', code: 'SEK' },      // Sweden - Krona
    'NO': { symbol: 'kr', code: 'NOK' },      // Norway - Krone
    'CH': { symbol: 'CHF', code: 'CHF' },     // Switzerland - Franc
    'JP': { symbol: '¥', code: 'JPY' },       // Japan - Yen
    'NZ': { symbol: '$', code: 'NZD' },       // New Zealand - Dollar
    'BR': { symbol: 'R$', code: 'BRL' },     // Brazil - Real
    'IN': { symbol: '₹', code: 'INR' },       // India - Rupee
    'ZA': { symbol: 'R', code: 'ZAR' },       // South Africa - Rand
    'MX': { symbol: '$', code: 'MXN' },       // Mexico - Peso
    'HU': { symbol: 'Ft', code: 'HUF' },      // Hungary - Forint
    'RO': { symbol: 'lei', code: 'RON' },     // Romania - Leu
};

// Default to GBP if country code not found
const DEFAULT_CURRENCY: CurrencyInfo = { symbol: '£', code: 'GBP' };

export const formatCurrency = (price: number, countryCode?: string | null): string => {
    const currency = (countryCode && CURRENCY_MAP[countryCode.toUpperCase()]) ? CURRENCY_MAP[countryCode.toUpperCase()] : DEFAULT_CURRENCY;
    
    try {
        // Use Intl.NumberFormat for proper formatting based on the currency code
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    } catch (error) {
        // Fallback for unsupported currency codes, using the symbol
        console.warn(`Currency code ${currency.code} might not be supported. Falling back to symbol.`, error);
        return `${currency.symbol}${price.toFixed(2)}`;
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

const fillTimeSeriesData = (data: { date: string, value: number }[], startDate: Date, endDate: Date): TimeSeriesDataPoint[] => {
    if (!data) {
        data = [];
    }
    const dataMap = new Map(data.map(item => [new Date(item.date).toISOString().split('T')[0], item.value]));
    const filledData: TimeSeriesDataPoint[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        filledData.push({
            date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: dataMap.get(dateKey) || 0
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return filledData;
};

// --- LIVE API CALLS (NEW CONSOLIDATED DASHBOARD FUNCTIONS) ---

// --- HOME TAB ---
export const dash_getHomeData = async (timeframe: string): Promise<DashHomeData> => {
    try {
        // This will be a single RPC call to the new, consolidated function
        // FIX: Removed the incorrect generic type from the rpc() call. The generic is for the function name with generated types, not the return type. This resolves the downstream errors by inferring 'data' as 'any'.
        const { data, error } = await supabase
            .rpc('dash_get_home_data', { time_period: timeframe })
            .single();
        
        if (error) throw error;
        // FIX: Handle cases where no data is returned.
        if (!data) throw new Error("No data received from dash_get_home_data");
        
        // FIX: Cast `data` to `any` to allow property access and spreading, as its type is inferred as `unknown` without generated types.
        const responseData = data as any;

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        let startDate = new Date();
        
        if (timeframe === 'All') {
            const allRawDates = [
                ...(responseData.charts.newUsersOverTime || []).map((d: any) => new Date(d.date)),
                ...(responseData.charts.newRatingsOverTime || []).map((d: any) => new Date(d.date))
            ];
            startDate = allRawDates.length > 0 ? new Date(Math.min(...allRawDates.map((d: Date) => d.getTime()))) : new Date();
        } else if (timeframe === '24h') {
             startDate.setDate(endDate.getDate() - 1);
        } else {
            const timeValue = parseInt(timeframe.slice(0, -1));
            const timeUnit = timeframe.slice(-1);
            if (timeUnit === 'd') {
                startDate.setDate(endDate.getDate() - (timeValue - 1));
            } else if (timeUnit === 'm') {
                startDate.setMonth(endDate.getMonth() - timeValue);
            } else if (timeUnit === 'y') {
                startDate.setFullYear(endDate.getFullYear() - timeValue);
            }
        }
        startDate.setHours(0,0,0,0);

        return {
            ...responseData,
            charts: {
                newUsersOverTime: fillTimeSeriesData(responseData.charts.newUsersOverTime, startDate, endDate),
                newRatingsOverTime: fillTimeSeriesData(responseData.charts.newRatingsOverTime, startDate, endDate),
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
        // FIX: Removed incorrect generic type from rpc() call. This allows 'data' to be inferred as 'any' and fixes the type error.
        const { data, error } = await supabase.rpc('dash_get_users_data').single();
        if (error) throw error;
        if (!data) throw new Error("No data received from dash_get_users_data");
        // The RPC will return an object matching the DashUsersData contract.
        // FIX: Cast the returned data to the expected DashUsersData type to satisfy the function's return type promise.
        return data as DashUsersData;
    } catch (error) {
        handleSupabaseError(error, 'Users Data (New)');
        throw error;
    }
};

export const dash_getUsersByUtm = async (source: string): Promise<User[]> => {
    try {
        const { data, error } = await supabase.rpc('dash_get_users_by_utm', { utm_source_in: source });
        if (error) throw error;
        return (data as User[]) || [];
    } catch (error) {
        handleSupabaseError(error, `Users by UTM source: ${source}`);
        throw error;
    }
};


// --- PUBS TAB ---
export const dash_getPubsData = async (): Promise<DashPubsData> => {
    try {
        // FIX: Removed incorrect generic type from rpc() call. This allows 'data' to be inferred as 'any' and fixes the type error.
        const { data, error } = await supabase.rpc('dash_get_pubs_data').single();
        if (error) throw error;
        if (!data) throw new Error("No data received from dash_get_pubs_data");
        // The RPC will return an object matching the DashPubsData contract.
        // FIX: Cast the returned data to the expected DashPubsData type to satisfy the function's return type promise.
        return data as DashPubsData;
    } catch (error) {
        handleSupabaseError(error, 'Pubs Data (New)');
        throw error;
    }
};

// --- CONTENT TAB (NEW) ---
export const dash_getContentInitialData = async (): Promise<DashContentInitialData> => {
    try {
        const { data, error } = await supabase.rpc('dash_get_content_initial_feeds').single();
        if (error) throw error;
        if (!data) throw new Error("No data received from dash_get_content_initial_feeds");
        
        const rawData = data as any;

        return {
            ratings: (rawData.ratings || []).map((r: any) => {
                const subScores = [r.quality, r.price].filter(s => typeof s === 'number');
                const score = subScores.length > 0 ? subScores.reduce((a, b) => a + b, 0) / subScores.length : 0;

                return {
                    id: r.id,
                    pubId: r.pubId,
                    pubName: r.pubName || 'Unknown Pub',
                    score: score,
                    quality: r.quality,
                    price: r.price,
                    timestamp: new Date(r.created_at).toLocaleString(),
                    user: {
                        id: r.user?.id,
                        name: r.user?.name || 'Anonymous User',
                        avatarId: r.user?.avatarId || '',
                    },
                    message: r.message,
                };
            }),
            comments: (rawData.comments || []).map((c: any) => ({
                id: c.id,
                text: c.text,
                timestamp: new Date(c.timestamp).toLocaleString(),
                user: {
                    id: c.user?.id,
                    name: c.user?.name || 'Anonymous User',
                    avatarId: c.user?.avatarId || '',
                }
            })),
            images: (rawData.images || []).map((i: any) => ({
                id: i.id,
                imageUrl: i.imageUrl,
                timestamp: new Date(i.timestamp).toLocaleString(),
                user: {
                    id: i.user?.id,
                    name: i.user?.name || 'Anonymous User',
                    avatarId: i.user?.avatarId || '',
                }
            }))
        };
    } catch (error) {
        handleSupabaseError(error, 'Initial Content Feeds (New)');
        throw error;
    }
};


// --- FINANCIALS TAB ---
// This function now calls a dedicated Supabase function that securely fetches data from the Stripe API.
export const dash_getStripeFinancials = async (timeframe: string): Promise<FinancialsData> => {
    try {
        const { data, error } = await supabase.functions.invoke('dash-get-stripe-data', {
            body: { time_period: timeframe },
        });

        if (error) throw error;
        return data;
    } catch (error) {
        handleSupabaseError(error, 'Stripe Financials Data');
        throw error;
    }
};

// --- OUTGOINGS TAB ---
export const dash_getOutgoingsData = async (timeframe: string): Promise<DashOutgoingsData> => {
    try {
        const { data, error } = await supabase.rpc('dash_get_outgoings_data', { time_period: timeframe }).single();
        if (error) throw error;
        if (!data) throw new Error("No data received from dash_get_outgoings_data");
        return data as DashOutgoingsData;
    } catch (error) {
        handleSupabaseError(error, 'Outgoings Data');
        throw error;
    }
};

export const dash_getFinancialSummary = async (): Promise<DashFinancialSummary> => {
    try {
        const { data, error } = await supabase.rpc('dash_get_financial_summary').single();
        if (error) throw error;
        if (!data) throw new Error("No data received from dash_get_financial_summary");
        return data as DashFinancialSummary;
    } catch (error) {
        handleSupabaseError(error, 'Financial Summary Data');
        throw error;
    }
};

export const dash_addOutgoing = async (outgoingData: NewOutgoingData): Promise<void> => {
    try {
        const { error } = await supabase.rpc('dash_add_outgoing', {
            name_in: outgoingData.name,
            description_in: outgoingData.description || null,
            amount_in: outgoingData.amount,
            type_in: outgoingData.type,
            start_date_in: outgoingData.start_date,
            category_in: outgoingData.category || null,
            currency_in: outgoingData.currency,
            billing_cycle_in: outgoingData.billing_cycle || 'monthly'
        });
        if (error) throw error;
    } catch (error) {
        handleSupabaseError(error, 'Add Outgoing');
        throw error;
    }
};

export const dash_endSubscription = async (subscriptionId: string, endDate: string): Promise<void> => {
    try {
        const { error } = await supabase.rpc('dash_end_subscription', {
            subscription_id_in: subscriptionId,
            end_date_in: endDate
        });
        if (error) throw error;
    } catch (error) {
        handleSupabaseError(error, 'End Subscription');
        throw error;
    }
};

export interface EditOutgoingData {
    id: string;
    name: string;
    description: string;
    amount: number;
    purchase_date: string;
    category: string;
    currency: string;
}

export const dash_editOutgoing = async (outgoingData: EditOutgoingData): Promise<void> => {
    try {
        const { error } = await supabase.rpc('dash_edit_outgoing', {
            id_in: outgoingData.id,
            name_in: outgoingData.name,
            description_in: outgoingData.description || null,
            amount_in: outgoingData.amount,
            purchase_date_in: outgoingData.purchase_date,
            category_in: outgoingData.category || null,
            currency_in: outgoingData.currency
        });
        if (error) throw error;
    } catch (error) {
        handleSupabaseError(error, 'Edit Outgoing');
        throw error;
    }
};

export const dash_deleteOutgoing = async (outgoingId: string): Promise<void> => {
    try {
        const { error } = await supabase.rpc('dash_delete_outgoing', { id_in: outgoingId });
        if (error) throw error;
    } catch (error) {
        handleSupabaseError(error, 'Delete Outgoing');
        throw error;
    }
};


// --- DEPRECATED/OLD FUNCTIONS (To be removed after refactor) ---

// --- CONTENT TAB (OLD - for pagination) ---
// These will be refactored to call new, simpler `dash_` functions.
export const getRatingsData = async (pageNumber: number, pageSize: number): Promise<Rating[]> => {
    try {
        const from = (pageNumber - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data: ratingsData, error } = await supabase
            .from('ratings')
            .select(`
                id,
                created_at,
                message,
                quality,
                price,
                pubs ( id, name ),
                profiles!ratings_user_id_fkey ( id, username, avatar_id )
            `)
            .order('created_at', { ascending: false })
            .range(from, to);
            
        if (error) throw error;
        if (!ratingsData) return [];

        return (ratingsData as any[]).map(r => {
            const subScores = [r.quality, r.price].filter(s => typeof s === 'number');
            const score = subScores.length > 0 ? subScores.reduce((a, b) => a + b, 0) / subScores.length : 0;

            return {
                id: r.id,
                pubId: r.pubs?.id,
                pubName: r.pubs?.name || 'Unknown Pub',
                score: score,
                quality: r.quality,
                price: r.price,
                timestamp: new Date(r.created_at).toLocaleString(),
                user: {
                    id: r.profiles?.id,
                    name: r.profiles?.username || 'Anonymous User',
                    avatarId: r.profiles?.avatar_id || '',
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
        const from = (pageNumber - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
            .from('comments')
            .select(`
                id,
                content,
                created_at,
                profiles!comments_user_id_fkey ( id, username, avatar_id )
            `)
            .order('created_at', { ascending: false })
            .range(from, to);
            
        if (error) throw error;
        return ((data as any[]) || []).map(c => ({
            id: c.id,
            text: c.content,
            timestamp: new Date(c.created_at).toLocaleString(),
            user: {
                id: c.profiles?.id,
                name: c.profiles?.username || 'Anonymous User',
                avatarId: c.profiles?.avatar_id || '',
            }
        }));
    } catch (error) {
        handleSupabaseError(error, 'Comments Data');
        throw error;
    }
};

export const getImagesData = async (pageNumber: number, pageSize: number): Promise<UploadedImage[]> => {
    try {
        const from = (pageNumber - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error } = await supabase
            .from('ratings')
            .select(`
                id,
                image_url,
                created_at,
                profiles!ratings_user_id_fkey ( id, username, avatar_id )
            `)
            .not('image_url', 'is', null)
            .order('created_at', { ascending: false })
            .range(from, to);
            
        if (error) throw error;
        return ((data as any[]) || []).map(i => ({
            id: i.id,
            imageUrl: i.image_url,
            timestamp: new Date(i.created_at).toLocaleString(),
            user: {
                id: i.profiles?.id,
                name: i.profiles?.username || 'Anonymous User',
                avatarId: i.profiles?.avatar_id || '',
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