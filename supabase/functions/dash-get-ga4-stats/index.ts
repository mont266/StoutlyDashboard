// supabase/functions/dash-get-ga4-stats/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// Replaced djwt and manual crypto with the robust 'jose' library for JWT signing.
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';


// Helper to create CORS headers for browser access from the dashboard
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definition for Deno's global object to satisfy TypeScript
declare const Deno: any;

// --- UTILITY FUNCTIONS ---

// Calculates the percentage change between two numbers
const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) {
        return current > 0 ? 100.0 : 0.0;
    }
    return ((current - previous) / previous) * 100;
};

// Formats a GA4 date string (YYYYMMDD) into a more readable format for charts
const formatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr || dateStr.length !== 8) return "Invalid Date";
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// --- AUTHENTICATION HELPER ---
// This function now uses the 'jose' library, which reliably handles parsing the
// PEM private key and creating the JWT, avoiding the "Unsupported key format" error.
const getAccessToken = async (credentials: { client_email: string, private_key: string }) => {
    // The 'jose' library handles PEM parsing internally, which is much more robust.
    const privateKey = await jose.importPKCS8(credentials.private_key, 'RS256');
    
    // Create the JWT using 'jose'
    const jwt = await new jose.SignJWT({
        scope: "https://www.googleapis.com/auth/analytics.readonly",
    })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(credentials.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setExpirationTime('1h')
    .sign(privateKey);
    
    // Exchange JWT for an access token
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to fetch access token:", errorBody);
        throw new Error(`Google Auth Error: ${response.statusText}`);
    }

    const { access_token } = await response.json();
    return access_token;
};


// --- MAIN SERVER FUNCTION ---

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log('[GA4 Function] Invoked.');
        // --- 1. INITIALIZE & VALIDATE ---
        const { time_period } = await req.json();
        console.log(`[GA4 Function] Received request for time_period: ${time_period}`);

        const GA4_PROPERTY_ID = Deno.env.get('GA4_PROPERTY_ID');
        const GOOGLE_SERVICE_ACCOUNT_KEY = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');

        if (!GA4_PROPERTY_ID) throw new Error("Secret GA4_PROPERTY_ID is not set.");
        if (!GOOGLE_SERVICE_ACCOUNT_KEY) throw new Error("Secret GOOGLE_SERVICE_ACCOUNT_KEY is not set.");
        
        let credentials;
        try {
            credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_KEY);
        } catch (e) {
            console.error('[GA4 Function] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', e.message);
            throw new Error('The GOOGLE_SERVICE_ACCOUNT_KEY secret is not valid JSON.');
        }

        // --- 2. AUTHENTICATE ---
        const accessToken = await getAccessToken(credentials);
        console.log('[GA4 Function] Access token obtained.');

        // --- 3. DEFINE DATE RANGES ---
        const now = new Date();
        let days = 30; // Default to 30 days
        if (time_period === '7d') days = 7;
        if (time_period === '90d') days = 90;
        
        const endDate = 'today';
        const startDateCurrent = new Date(new Date().setDate(now.getDate() - (days - 1))).toISOString().split('T')[0];
        
        const previousEndDate = new Date(new Date(startDateCurrent).setDate(new Date(startDateCurrent).getDate() - 1)).toISOString().split('T')[0];
        const previousStartDate = new Date(new Date(previousEndDate).setDate(new Date(previousEndDate).getDate() - (days - 1))).toISOString().split('T')[0];
        console.log(`[GA4 Function] Current period: ${startDateCurrent} to ${endDate}. Previous period: ${previousStartDate} to ${previousEndDate}`);

        // --- 4. RUN BATCH REPORT ---
        const apiResponse = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:batchRunReports`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                // The GA4 API is limited to 5 requests per batch call.
                // The "Top Pages" report was removed to meet this limit.
                requests: [
                    // 0: Main KPIs
                    {
                        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'engagementRate' }, { name: 'eventCount' }],
                        dateRanges: [
                            { startDate: startDateCurrent, endDate: 'today' },
                            { startDate: previousStartDate, endDate: previousEndDate },
                        ],
                    },
                    // 1: Users/Sessions over time
                    {
                        dimensions: [{ name: 'date' }],
                        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
                        dateRanges: [{ startDate: startDateCurrent, endDate: 'today' }],
                        orderBys: [{ dimension: { orderType: 'ALPHANUMERIC', dimensionName: 'date' }, desc: false }],
                    },
                    // 2: Device Breakdown
                    {
                        dimensions: [{ name: 'deviceCategory' }],
                        metrics: [{ name: 'activeUsers' }],
                        dateRanges: [{ startDate: startDateCurrent, endDate: 'today' }],
                        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
                    },
                    // 3: Top Events
                    {
                        dimensions: [{ name: 'eventName' }],
                        metrics: [{ name: 'eventCount' }],
                        dateRanges: [{ startDate: startDateCurrent, endDate: 'today' }],
                        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
                        limit: 10,
                    },
                    // 4: Users by Country (previously index 5)
                    {
                        dimensions: [{ name: 'country' }],
                        metrics: [{ name: 'activeUsers' }],
                        dateRanges: [{ startDate: startDateCurrent, endDate: 'today' }],
                        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
                        limit: 10,
                    },
                ],
            }),
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error("GA4 API Error:", errorBody);
            throw new Error(`GA4 API request failed: ${apiResponse.statusText}`);
        }

        const response = await apiResponse.json();
        console.log('[GA4 Function] Batch report executed successfully.');

        // --- 5. PROCESS REPORT DATA (SAFELY) ---

        const kpiReport = response.reports?.[0];
        const currentKpis = kpiReport?.rows?.[0]?.metricValues;
        const previousKpis = kpiReport?.rows?.[1]?.metricValues;

        const kpis = {
            users: parseInt(currentKpis?.[0]?.value ?? '0'),
            sessions: parseInt(currentKpis?.[1]?.value ?? '0'),
            engagementRate: parseFloat(currentKpis?.[2]?.value ?? '0') * 100,
            eventCount: parseInt(currentKpis?.[3]?.value ?? '0'),
            usersChange: calculateChange(parseInt(currentKpis?.[0]?.value ?? '0'), parseInt(previousKpis?.[0]?.value ?? '0')),
            sessionsChange: calculateChange(parseInt(currentKpis?.[1]?.value ?? '0'), parseInt(previousKpis?.[1]?.value ?? '0')),
            engagementRateChange: calculateChange(parseFloat(currentKpis?.[2]?.value ?? '0'), parseFloat(previousKpis?.[2]?.value ?? '0')),
            eventCountChange: calculateChange(parseInt(currentKpis?.[3]?.value ?? '0'), parseInt(previousKpis?.[3]?.value ?? '0')),
        };

        const processReport = (reportIndex: number) => {
            const report = response.reports?.[reportIndex];
            if (!report || !report.rows) return [];
            return report.rows.map(row => ({
                name: row.dimensionValues?.[0]?.value ?? 'Unknown',
                value: parseInt(row.metricValues?.[0]?.value ?? '0'),
            })).filter(item => item.name !== '(not set)');
        };

        const processTimeSeries = (reportIndex: number, metricIndex: number) => {
            const report = response.reports?.[reportIndex];
            if (!report || !report.rows) return [];
            return report.rows.map(row => ({
                date: formatDate(row.dimensionValues?.[0]?.value),
                value: parseInt(row.metricValues?.[metricIndex]?.value ?? '0'),
            }));
        };
        
        const finalData = {
            kpis,
            charts: {
                usersOverTime: processTimeSeries(1, 0),
                sessionsOverTime: processTimeSeries(1, 1),
                deviceBreakdown: processReport(2),
            },
            tables: {
                topEvents: processReport(3),
                topPages: [], // Removed report, return empty array
                usersByCountry: processReport(4), // Index updated from 5 to 4
            }
        };
        console.log('[GA4 Function] Data processed. Sending response.');

        // --- 6. RETURN RESPONSE ---
        return new Response(JSON.stringify(finalData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('[GA4 Function] Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
