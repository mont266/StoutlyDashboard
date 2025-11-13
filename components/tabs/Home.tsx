import React, { useState, useEffect } from 'react';
import { dash_getHomeData, dash_getStripeFinancials, dash_getFinancialSummary, formatCurrency } from '../../services/supabaseService';
import type { DashHomeData } from '../../services/dashContracts';
import StatCard from '../StatCard';
import SimpleLineChart from '../charts/SimpleLineChart';
import { UsersIcon, ActivityIcon, StarIcon, ImageIcon, MessageSquareIcon, BuildingIcon, DollarSignIcon, GiftIcon, TrendingUpIcon, TrendingDownIcon } from '../icons/Icons';

interface FinancialSummary {
    totalSpendAllTime: number;
    totalDonationsAllTime: number;

    profit: number;
    currentMonthlySpend: number;
}

const Home: React.FC = () => {
    const [data, setData] = useState<DashHomeData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<string>('30d');
    
    const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
    const [financialLoading, setFinancialLoading] = useState<boolean>(true);

    const timeframes = { '24h': '24 Hours', '7d': '7 Days', '30d': '30 Days', '6m': '6 Months', '1y': '1 Year', 'All': 'All Time' };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await dash_getHomeData(timeframe);
                setData(result);
            } catch (err)
 {
                setError('Failed to fetch dashboard data. The new dash_ function may not be deployed yet.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeframe]);

    useEffect(() => {
        const fetchFinancials = async () => {
            setFinancialLoading(true);
            try {
                const [outgoingsSummary, stripeData] = await Promise.all([
                    dash_getFinancialSummary(),
                    dash_getStripeFinancials('all')
                ]);
                
                const profit = stripeData.grossDonations - outgoingsSummary.totalSpendAllTime;

                setFinancialSummary({
                    totalSpendAllTime: outgoingsSummary.totalSpendAllTime,
                    totalDonationsAllTime: stripeData.grossDonations,
                    profit: profit,
                    currentMonthlySpend: outgoingsSummary.currentMonthlySpend
                });

            } catch (err) {
                console.error("Failed to fetch financial summary:", err);
            } finally {
                setFinancialLoading(false);
            }
        };

        fetchFinancials();
    }, []);

    const renderMainLoading = () => (
        <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => <div key={i} className="bg-surface rounded-xl h-28"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-surface rounded-xl h-80"></div>
                 <div className="bg-surface rounded-xl h-80"></div>
            </div>
            <div className="bg-surface rounded-xl h-96"></div>
        </div>
    );
    
    const formatGbp = (value: number) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <section>
             <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <div className="bg-surface p-1 rounded-lg flex space-x-1 flex-wrap">
                    {(Object.keys(timeframes) as (keyof typeof timeframes)[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 shrink-0 ${
                                timeframe === t ? 'bg-primary text-background' : 'text-text-secondary hover:bg-border'
                            }`}
                        >
                            {timeframes[t]}
                        </button>
                    ))}
                </div>
            </div>

            {financialLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 animate-pulse">
                    {[...Array(4)].map((_, i) => <div key={i} className="bg-surface rounded-xl h-28"></div>)}
                </div>
            ) : financialSummary && (
                <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 text-text-primary">Financial Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatCard title="Total Donations (All Time)" value={formatGbp(financialSummary.totalDonationsAllTime)} icon={<GiftIcon />} />
                        <StatCard title="Total Spent (All Time)" value={formatGbp(financialSummary.totalSpendAllTime)} icon={<DollarSignIcon />} isChurn />
                        <StatCard title="Profit (All Time)" value={formatGbp(financialSummary.profit)} icon={<TrendingUpIcon />} change={financialSummary.profit} />
                        <StatCard title="Current Monthly Spend" value={formatGbp(financialSummary.currentMonthlySpend)} icon={<TrendingDownIcon />} isChurn />
                    </div>
                </div>
            )}

            {error && <div className="text-red-500 bg-red-900/20 p-4 rounded-lg">{error}</div>}
            
            {loading ? renderMainLoading() : data && (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-text-primary">User & Engagement Metrics ({timeframes[timeframe as keyof typeof timeframes]})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        <StatCard title="Total Users" value={data.kpis.totalUsers.toLocaleString()} icon={<UsersIcon />} />
                        <StatCard title="New Users" value={data.kpis.newUsers.toLocaleString()} change={data.kpis.newUsersChange} icon={<ActivityIcon />} />
                        <StatCard title="Active Users" value={data.kpis.activeUsers.toLocaleString()} change={data.kpis.activeUsersChange} icon={<UsersIcon />} />
                        <StatCard title="Total Ratings" value={data.kpis.totalRatings.toLocaleString()} icon={<StarIcon />} />
                        <StatCard title="New Ratings" value={data.kpis.newRatings.toLocaleString()} change={data.kpis.newRatingsChange} icon={<StarIcon />} />
                        <StatCard title="Total Pubs" value={data.kpis.totalPubs.toLocaleString()} icon={<BuildingIcon />} />
                        <StatCard title="Uploaded Images" value={data.kpis.totalUploadedImages.toLocaleString()} icon={<ImageIcon />} />
                        <StatCard title="Total Comments" value={data.kpis.totalComments.toLocaleString()} icon={<MessageSquareIcon />} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-surface p-6 rounded-xl shadow-lg">
                            <h3 className="text-lg font-semibold text-text-primary mb-4">New Users</h3>
                            <div className="h-80">
                                <SimpleLineChart data={data.charts.newUsersOverTime} color="#3B82F6" />
                            </div>
                        </div>
                        <div className="bg-surface p-6 rounded-xl shadow-lg">
                            <h3 className="text-lg font-semibold text-text-primary mb-4">New Ratings</h3>
                            <div className="h-80">
                                <SimpleLineChart data={data.charts.newRatingsOverTime} color="#F59E0B" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">Average Pint Price by Country</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-text-secondary">
                                 <thead className="text-xs text-text-secondary uppercase bg-background">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Country</th>
                                        <th scope="col" className="px-6 py-3 text-center">Ratings</th>
                                        <th scope="col" className="px-6 py-3 text-right">Avg. Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.tables.avgPintPriceByCountry.map(item => (
                                        <tr key={item.country} className="border-b border-border last:border-b-0 hover:bg-border/50">
                                            <td className="px-6 py-3 font-medium text-text-primary">
                                                {item.country}
                                            </td>
                                            <td className="px-6 py-3 text-text-primary text-center">
                                                {item.ratingsCount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3 text-text-primary text-right font-mono">
                                                {formatCurrency(item.price, item.countryCode)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Home;