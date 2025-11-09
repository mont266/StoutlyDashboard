// FIX: Add missing types to import
import type { HomeData, TimeSeriesDataPoint, User, Pub, ContentAnalytics, FinancialsData, Donation, TopDonator, UTMStat, Rating, Comment, UploadedImage, PintPriceByCountry, GA4Data, GA4ReportItem, NamedValueDataPoint } from '../types';

// --- MOCK DATA GENERATION ---

export const LAUNCH_DATE = new Date('2023-08-01');

export const getDaysSinceLaunch = (): number => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - LAUNCH_DATE.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const generateTimeSeriesData = (days: number, maxVal: number, startVal: number = maxVal / 2): TimeSeriesDataPoint[] => {
    const data: TimeSeriesDataPoint[] = [];
    let currentValue = startVal;
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        currentValue += (Math.random() - 0.45) * (maxVal / 10);
        if (currentValue < 0) currentValue = 0;
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.floor(currentValue),
        });
    }
    return data;
};

// --- HOME TAB DATA ---
const mockPintPrices: PintPriceByCountry[] = [
    { country: 'United Kingdom', flag: '🇬🇧', price: 4.50 },
    { country: 'Ireland', flag: '🇮🇪', price: 5.20 },
    { country: 'United States', flag: '🇺🇸', price: 6.50 },
    { country: 'Germany', flag: '🇩🇪', price: 4.80 },
    { country: 'Australia', flag: '🇦🇺', price: 7.10 },
];

const getMockHomeData = (timeframe: string): HomeData => {
    const days = { '24h': 1, '7d': 7, '30d': 30, '6m': 180, '1y': 365, 'All': getDaysSinceLaunch() }[timeframe] || 30;
    return {
        kpis: {
            totalUsers: 1253,
            newUsers: 105 + Math.floor(Math.random() * 50),
            newUsersChange: (Math.random() - 0.2) * 30,
            activeUsers: 842 + Math.floor(Math.random() * 200),
            activeUsersChange: (Math.random() - 0.3) * 15,
            totalRatings: 15843,
            newRatings: 234 + Math.floor(Math.random() * 80),
            newRatingsChange: (Math.random() - 0.1) * 25,
            totalPubsWithRatings: 119,
            totalUploadedImages: 3402,
            totalComments: 5231,
        },
        charts: {
            newUsersOverTime: generateTimeSeriesData(days, 20),
            newRatingsOverTime: generateTimeSeriesData(days, 50, 30),
        },
        tables: {
            avgPintPriceByCountry: mockPintPrices,
        }
    };
};

// --- FINANCIALS TAB DATA ---
const mockTopDonator: TopDonator = { name: 'Greg Jennings', avatarUrl: 'https://i.pravatar.cc/150?u=greg', totalAmount: 245.50 };
const mockRecentDonations: Donation[] = [
    { id: 'don_1', user: { name: 'Alice Johnson', avatarUrl: 'https://i.pravatar.cc/150?u=alice' }, amount: 20.00, date: '2023-10-26' },
    { id: 'don_2', user: { name: 'Bob Williams', avatarUrl: 'https://i.pravatar.cc/150?u=bob' }, amount: 5.00, date: '2023-10-26' },
    { id: 'don_3', user: { name: 'Fiona Garcia', avatarUrl: 'https://i.pravatar.cc/150?u=fiona' }, amount: 50.00, date: '2023-10-25' },
    { id: 'don_4', user: { name: 'Diana Miller', avatarUrl: 'https://i.pravatar.cc/150?u=diana' }, amount: 10.00, date: '2023-10-25' },
];

const getMockFinancialsData = (timeframe: string): FinancialsData => ({
    grossDonations: 4850.75,
    grossDonationsChange: 12.5,
    stripeFees: 194.03,
    stripeFeesChange: -2.1,
    netDonations: 4656.72,
    netDonationsChange: 13.1,
    totalDonations: 243,
    totalDonationsChange: 8.9,
    topDonator: mockTopDonator,
    recentDonations: mockRecentDonations,
});

// --- USERS TAB DATA ---
const mockUsers: User[] = [
  { id: 'usr_1', name: 'Greg Jennings', email: 'greg@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=greg', level: 12, banStatus: 'Active', signupDate: '2023-09-15', lastActive: '2 hours ago' },
  { id: 'usr_2', name: 'Maria Rodriguez', email: 'maria@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=maria', level: 25, banStatus: 'Active', signupDate: '2023-08-01', lastActive: '1 day ago' },
  { id: 'usr_3', name: 'Sam Worthington', email: 'sam@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=sam', level: 5, banStatus: 'Active', signupDate: '2023-10-02', lastActive: '30 minutes ago' },
  { id: 'usr_4', name: 'Linda Chen', email: 'linda@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=linda', level: 18, banStatus: 'Banned', signupDate: '2023-07-22', lastActive: '5 hours ago' },
  { id: 'usr_5', name: 'David Kim', email: 'david@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=david', level: 2, banStatus: 'Active', signupDate: '2023-10-20', lastActive: '3 days ago' },
];

const mockUTMStats: UTMStat[] = [
    { source: 'google', count: 450 },
    { source: 'facebook', count: 280 },
    { source: 'instagram', count: 150 },
    { source: 'organic', count: 320 },
    { source: 'referral', count: 53 },
];

// --- CONTENT TAB DATA ---
const mockPubs: Pub[] = [
  { id: 'pub_1', name: 'The Prancing Pony', location: 'London', averageScore: 4.8, totalRatings: 1204 },
  { id: 'pub_2', name: 'The Green Dragon', location: 'Manchester', averageScore: 4.7, totalRatings: 987 },
  { id: 'pub_3', name: 'The King\'s Head', location: 'Bristol', averageScore: 4.6, totalRatings: 750 },
  { id: 'pub_4', name: 'The Queen Vic', location: 'Birmingham', averageScore: 4.5, totalRatings: 1502 },
  { id: 'pub_5', name: 'The Leaky Cauldron', location: 'Edinburgh', averageScore: 4.9, totalRatings: 2310 },
];

const mockContentAnalytics: ContentAnalytics = {
    totalPubs: 127,
    averageOverallRating: 4.3,
    totalRatingsSubmitted: 15843,
    // FIX: Add missing property to support Pubs.tsx component
    pintPriceByCountry: mockPintPrices,
};

const mockRatings: Rating[] = [
    { id: 'r_1', user: { name: 'Sam Worthington', avatarUrl: 'https://i.pravatar.cc/150?u=sam' }, pubName: 'The Prancing Pony', score: 5, timestamp: '2 hours ago' },
    { id: 'r_2', user: { name: 'Greg Jennings', avatarUrl: 'https://i.pravatar.cc/150?u=greg' }, pubName: 'The Green Dragon', score: 4, timestamp: '5 hours ago' },
    { id: 'r_3', user: { name: 'Fiona Garcia', avatarUrl: 'https://i.pravatar.cc/150?u=fiona' }, pubName: 'The Leaky Cauldron', score: 5, timestamp: '1 day ago' },
];

const mockComments: Comment[] = [
    { id: 'c_1', user: { name: 'Maria Rodriguez', avatarUrl: 'https://i.pravatar.cc/150?u=maria' }, text: 'Best pint I\'ve had in ages!', timestamp: 'Just now' },
    { id: 'c_2', user: { name: 'David Kim', avatarUrl: 'https://i.pravatar.cc/150?u=david' }, text: 'A bit crowded but great atmosphere.', timestamp: '15 minutes ago' },
];

const mockImages: UploadedImage[] = Array.from({ length: 12 }, (_, i) => ({
    id: `img_${i}`,
    user: { name: mockUsers[i % mockUsers.length].name, avatarUrl: mockUsers[i % mockUsers.length].avatarUrl },
    imageUrl: `https://picsum.photos/seed/${i}/400/300`,
    timestamp: `${i + 1} days ago`,
}));

// --- GA4 TAB DATA ---
// FIX: Add missing mock data for GA4 tab
const getMockGA4Data = (timeframe: '7d' | '30d' | '90d'): GA4Data => {
    const days = { '7d': 7, '30d': 30, '90d': 90 }[timeframe];
    return {
        kpis: {
            users: 10250 + Math.floor(Math.random() * 1000),
            usersChange: (Math.random() - 0.4) * 10,
            sessions: 15320 + Math.floor(Math.random() * 1500),
            sessionsChange: (Math.random() - 0.3) * 12,
            engagementRate: 65.4 + (Math.random() - 0.5) * 5,
            engagementRateChange: (Math.random() - 0.5) * 4,
            eventCount: 120543 + Math.floor(Math.random() * 10000),
            eventCountChange: (Math.random() - 0.2) * 15,
        },
        charts: {
            usersOverTime: generateTimeSeriesData(days, 500, 300),
            sessionsOverTime: generateTimeSeriesData(days, 800, 500),
            deviceBreakdown: [
                { name: 'Desktop', value: 4500 },
                { name: 'Mobile', value: 5200 },
                { name: 'Tablet', value: 550 },
            ],
        },
        tables: {
            topEvents: [
                { name: 'page_view', value: 45000 },
                { name: 'session_start', value: 15320 },
                { name: 'view_item', value: 12000 },
                { name: 'add_to_cart', value: 8500 },
                { name: 'purchase', value: 3200 },
                { name: 'begin_checkout', value: 4500 },
                { name: 'user_engagement', value: 14000 },
            ].sort((a, b) => b.value - a.value).slice(0, 5),
            topPages: [
                { name: '/home', value: 18000 },
                { name: '/pubs/the-prancing-pony', value: 9500 },
                { name: '/users/greg-jennings', value: 7200 },
                { name: '/leaderboard', value: 5400 },
                { name: '/submit-rating', value: 4100 },
            ].sort((a, b) => b.value - a.value),
            usersByCountry: [
                { name: 'United Kingdom', value: 6200 },
                { name: 'United States', value: 2100 },
                { name: 'Ireland', value: 950 },
                { name: 'Germany', value: 500 },
                { name: 'Australia', value: 450 },
                { name: 'Canada', value: 300},
            ].sort((a, b) => b.value - a.value),
        },
    };
};

// --- MOCK API CALLS ---

const simulateApiCall = <T>(data: T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(data);
        }, 600);
    });
};

export const getHomeData = (timeframe: string): Promise<HomeData> => simulateApiCall(getMockHomeData(timeframe));
export const getFinancialsData = (timeframe: string): Promise<FinancialsData> => simulateApiCall(getMockFinancialsData(timeframe));
export const getAllUsers = (): Promise<User[]> => simulateApiCall(mockUsers);
export const getOnlineUsers = (): Promise<User[]> => simulateApiCall(mockUsers.slice(0, 2));
export const getUsersToday = (): Promise<User[]> => simulateApiCall(mockUsers.slice(2, 5));
export const getUTMStats = (): Promise<UTMStat[]> => simulateApiCall(mockUTMStats);
export const getContentAnalyticsData = (): Promise<ContentAnalytics> => simulateApiCall(mockContentAnalytics);
export const getPubsLeaderboard = (): Promise<Pub[]> => simulateApiCall(mockPubs);
export const getRatingsData = (): Promise<Rating[]> => simulateApiCall(mockRatings);
export const getCommentsData = (): Promise<Comment[]> => simulateApiCall(mockComments);
export const getImagesData = (): Promise<UploadedImage[]> => simulateApiCall(mockImages);
// FIX: Add missing export for getGA4Data
export const getGA4Data = (timeframe: '7d' | '30d' | '90d'): Promise<GA4Data> => simulateApiCall(getMockGA4Data(timeframe));
