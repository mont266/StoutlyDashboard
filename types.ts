// --- General ---
export interface TimeSeriesDataPoint {
    date: string;
    value: number;
}

export interface NamedValueDataPoint {
    name: string;
    value: number;
    // Add index signature to be compatible with Recharts components.
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
    totalPubs: number;
    totalUploadedImages: number;
    totalComments: number;
}

export interface PintPriceByCountry {
    country: string;
    price: number;
    pubsCount: number;
    priceRatingsCount: number;
    countryCode: string;
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
  avatarId: string;
  level: number;
  banStatus: 'Active' | 'Banned';
  signupDate: string;
  lastActive: string;
  countryCode?: string;
  isBetaTester?: boolean;
  isDeveloper?: boolean;
  isTeamMember?: boolean;
  hasDonated?: boolean;
  reviewsCount: number;
  signupUtmSource?: string | null;
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
    // Add missing property to support Pubs.tsx component
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
    id:string;
    pubId: string;
    user: { id: string; name: string; avatarId: string; countryCode?: string };
    pubName: string;
    pubCountryName?: string;
    pubCountryCode?: string;
    score: number;
    quality?: number;
    price?: number;
    timestamp: string;
    message?: string;
    imageUrl?: string;
    exactPrice?: number;
}

export interface Comment {
    id: string;
    user: { id: string; name: string; avatarId: string };
    text: string;
    timestamp: string;
}

export interface UploadedImage {
    id: string;
    user: { id: string; name: string; avatarId: string };
    imageUrl: string;
    timestamp: string;
}


// --- Financials Tab ---
export interface TopDonator {
    id?: string;
    username: string;
    avatar_id: string;
    totalAmount: number;
}

export interface Donation {
    id: string;
    user: { id?: string; username: string; avatar_id: string };
    amount: number;
    date: string;
}

// Add missing Transaction type for RecentTransactions component
export interface Transaction {
    id: string;
    user: { name: string; email: string; };
    amount: number;
    status: 'Completed' | 'Pending' | 'Failed';
    date: string;
}

export interface FinancialsData {
    grossDonations: number;
    stripeFees: number;
    netDonations: number;
    totalDonations: number;
    topDonator: TopDonator;
    recentDonations: Donation[];
}

// --- GA4 Tab ---
// Add missing GA4ReportItem type
export interface GA4ReportItem {
    name: string;
    value: number;
    // Add index signature to be compatible with Recharts components.
    [key: string]: any;
}

// Add missing GA4Data type
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