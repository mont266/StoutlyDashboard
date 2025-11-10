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
// This is for the *initial* load of the content tab.
// To be returned by `dash_get_content_initial_feeds()`.
// Subsequent "load more" actions will still require individual calls
// (e.g., `dash_get_ratings_page(page)`) for each feed.
export interface DashContentInitialData {
    ratings: {
        items: Rating[];
        hasMore: boolean;
    };
    comments: {
        items: Comment[];
        hasMore: boolean;
    };
    images: {
        items: UploadedImage[];
        hasMore: boolean;
    };
}
