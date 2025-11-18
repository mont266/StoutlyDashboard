import type { 
    HomeKpis, 
    TimeSeriesDataPoint, 
    PintPriceByCountry, 
    User, 
    UserKpis, 
    UTMStat, 
    Pub,
    Rating,
    Comment,
    UploadedImage
} from '../types';

/**
 * --- DATA CONTRACTS for new consolidated 'dash_' Supabase functions ---
 * These interfaces define the expected shape of the JSON object returned
 * by each new database function. This creates a clear "contract" between
 * the frontend and the backend.
 */


// --- Home Tab Contract ---
// To be returned by a new `dash_get_home_data(time_period)` function.
// This single object replaces three separate API calls and fixes the
// issue where new user/rating KPIs were calculated on the client.
export interface DashHomeData {
    kpis: HomeKpis;
    charts: {
        newUsersOverTime: TimeSeriesDataPoint[];
        newRatingsOverTime: TimeSeriesDataPoint[];
    };
    tables: {
        avgPintPriceByCountry: PintPriceByCountry[];
    };
}


// --- Users Tab Contract ---
// To be returned by a new `dash_get_users_data()` function.
// This single object replaces four separate API calls, dramatically
// improving load performance and simplifying the component's useEffect hook.
export interface DashUsersData {
    kpis: UserKpis;
    allUsers: User[];
    todayUsers: User[];
    utmStats: UTMStat[];
}


// --- Pubs Tab Contract ---
// To be returned by a new `dash_get_pubs_data()` function.
// This single object replaces two separate API calls and solves the
// N+1 query problem for the leaderboards by performing the JOIN in the database.
export interface DashPubsData {
    analytics: {
        totalPubs: number;
        averageOverallRating: number;
        totalRatingsSubmitted: number;
        pintPriceByCountry: PintPriceByCountry[];
    };
    leaderboards: {
        topRated: Pub[];
        mostReviewed: Pub[];
    };
}

// --- Content Tab Contract ---
// To be returned by a new `dash_get_content_initial_feeds()` function.
// This single object replaces three separate API calls on initial load
// for a faster, more efficient Content tab.
export interface DashContentInitialData {
    ratings: Rating[];
    comments: Comment[];
    images: UploadedImage[];
}

// --- Financial Summary Contract (NEW) ---
// For the home page top-level stats
export interface DashFinancialSummary {
    totalSpendAllTime: number;
    currentMonthlySpend: number;
}

// --- Outgoings Tab Contract ---
// To be returned by a new `dash_get_outgoings_data()` function.
export interface OutgoingKpis {
    totalSpend: number;
    monthlyCost: number;
    projectedAnnualCost: number;
}

export interface ManualOutgoing {
    id: string;
    name: string;
    description?: string;
    amount: number;
    currency: string;
    amount_gbp: number;
    purchase_date: string;
    category?: string;
}

export interface Subscription {
    id: string;
    name: string;
    description?: string;
    amount: number;
    currency: string;
    amount_gbp: number;
    start_date: string;
    end_date?: string;
    category?: string;
    status: 'Active' | 'Inactive' | 'Upcoming';
    billing_cycle: 'monthly' | 'yearly';
}

export interface NewOutgoingData {
    name: string;
    description?: string;
    amount: number;
    type: 'manual' | 'subscription';
    start_date: string; // Used as purchase_date for manual types
    category?: string;
    currency: 'GBP' | 'USD' | 'EUR';
    billing_cycle?: 'monthly' | 'yearly';
}

export interface ExpectedPayment {
    id: string;
    name: string;
    type: 'Subscription' | 'Manual';
    amount_gbp: number;
    currency: string;
    original_amount: number;
    due_date: string;
}

export interface DashOutgoingsData {
    kpis: OutgoingKpis;
    tables: {
        manualOutgoings: ManualOutgoing[];
        subscriptions: Subscription[];
    };
}