// --- General ---
export interface TimeSeriesDataPoint {
    date: string;
    value: number;
}

export interface NamedValueDataPoint {
    name: string;
    value: number;
    // FIX: Add index signature to be compatible with Recharts components.
    [key: string]: any;
}

// --- Home Tab ---
export interface HomeKpis {
    totalUsers: number;
    newUsers: number;
    newUsersChange: number;
    activeUsers: number;
    activeUsersChange: number;
    totalRatings: number;
    newRatings: number;
    newRatingsChange: number;
    totalPubsWithRatings: number;
    totalUploadedImages: number;
    totalComments: number;
}

export interface PintPriceByCountry {
    country: string;
    flag: string;
    price: number;
}

export interface HomeData {
    kpis: HomeKpis;
    charts: {
        newUsersOverTime: TimeSeriesDataPoint[];
        newRatingsOverTime: TimeSeriesDataPoint[];
    };
    tables: {
        avgPintPriceByCountry: PintPriceByCountry[];
    };
}


// --- Users Tab ---
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  level: number;
  banStatus: 'Active' | 'Banned';
  signupDate: string;
  lastActive: string;
}

export interface UTMStat {
    source: string;
    count: number;
}

export interface UserKpis {
    totalUsers: number;
    activeToday: number;
}

// --- Content Tab ---
export interface ContentAnalytics {
    totalPubs: number;
    averageOverallRating: number;
    totalRatingsSubmitted: number;
    // FIX: Add missing property to support Pubs.tsx component
    pintPriceByCountry: PintPriceByCountry[];
}

export interface Pub {
  id: string;
  name: string;
  location: string;
  averageScore: number;
  totalRatings: number;
}

export interface Rating {
    id: string;
    user: { name: string; avatarUrl: string };
    pubName: string;
    score: number;
    atmosphere?: number;
    quality?: number;
    price?: number;
    timestamp: string;
}

export interface Comment {
    id: string;
    user: { name: string; avatarUrl: string };
    text: string;
    timestamp: string;
}

export interface UploadedImage {
    id: string;
    user: { name: string; avatarUrl: string };
    imageUrl: string;
    timestamp: string;
}


// --- Financials Tab ---
export interface TopDonator {
    name: string;
    avatarUrl: string;
    totalAmount: number;
}

export interface Donation {
    id: string;
    user: { name: string; avatarUrl: string };
    amount: number;
    date: string;
}

// FIX: Add missing Transaction type for RecentTransactions component
export interface Transaction {
    id: string;
    user: { name: string; email: string; };
    amount: number;
    status: 'Completed' | 'Pending' | 'Failed';
    date: string;
}

export interface FinancialsData {
    grossDonations: number;
    grossDonationsChange: number;
    stripeFees: number;
    stripeFeesChange: number;
    netDonations: number;
    netDonationsChange: number;
    totalDonations: number;
    totalDonationsChange: number;
    topDonator: TopDonator;
    recentDonations: Donation[];
}

// --- GA4 Tab ---
// FIX: Add missing GA4ReportItem type
export interface GA4ReportItem {
    name: string;
    value: number;
    // FIX: Add index signature to be compatible with Recharts components.
    [key: string]: any;
}

// FIX: Add missing GA4Data type
export interface GA4Data {
    kpis: {
        users: number;
        usersChange: number;
        sessions: number;
        sessionsChange: number;
        engagementRate: number;
        engagementRateChange: number;
        eventCount: number;
        eventCountChange: number;
    };
    charts: {
        usersOverTime: TimeSeriesDataPoint[];
        sessionsOverTime: TimeSeriesDataPoint[];
        deviceBreakdown: NamedValueDataPoint[];
    };
    tables: {
        topEvents: GA4ReportItem[];
        topPages: GA4ReportItem[];
        usersByCountry: GA4ReportItem[];
    };
}