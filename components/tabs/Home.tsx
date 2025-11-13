

import React, { useState, useEffect, useCallback } from 'react';
import { dash_getHomeData, dash_getStripeFinancials, dash_getFinancialSummary, formatCurrency } from '../../services/supabaseService';
import type { DashHomeData } from '../../services/dashContracts';
import StatCard from '../StatCard';
import SimpleLineChart from '../charts/SimpleLineChart';
// FIX: Import ArrowUpRightIcon and ArrowDownRightIcon.
import { UsersIcon, ActivityIcon, StarIcon, ImageIcon, MessageSquareIcon, BuildingIcon, DollarSignIcon, GiftIcon, TrendingUpIcon, TrendingDownIcon, RefreshCwIcon, ArrowUpRightIcon, ArrowDownRightIcon } from '../icons/Icons';

interface FinancialSummary {
    totalSpendAllTime: number;
    totalDonationsAllTime: number;
    profit: number;
    currentMonthlySpend: number;
}

interface HomeProps {
    refreshKey: number;
}

const Home: React.FC<HomeProps> = ({ refreshKey }) => {
    const [data, setData] = useState<DashHomeData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<string>('30d');
    
    const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
    const [financialLoading, setFinancialLoading] = useState<boolean>(true);

    const timeframes = { '24h': '24 Hours', '7d': '7 Days', '30d': '30 Days', '6m': '6 Months', '1y': '1 Year', 'All': 'All Time' };

    const fetchData = useCallback(async () => {
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
    }, [timeframe]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

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
        <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-surface rounded-xl h-28"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface rounded-xl h-80"></div>
                    <div className="bg-surface rounded-xl h-80"></div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface rounded-xl h-96"></div>
                    <div className="bg-surface rounded-xl h-96"></div>
                </div>
            </div>
        </div>
    );
    
    const formatGbp = (value: number) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const SecondaryStatItem: React.FC<{ label: string; value: string; change?: number; isChurn?: boolean }> = ({ label, value, change, isChurn }) => {
        const isPositive = change !== undefined && change >= 0;
        const changeColor = (isChurn ? !isPositive : isPositive) ? 'text-value-green' : 'text-warning-red';

        return (
            <li className="flex justify-between items-center py-2 border-b border-border last:border-none">
                <span className="text-text-secondary">{label}</span>
                <div className="flex items-center space-x-2">
                    {change !== undefined && (
                        <span className={`flex items-center text-xs font-semibold ${changeColor}`}>
                            {change.toFixed(1)}%
                            {isPositive ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
                        </span>
                    )}
                    <span className="font-semibold text-text-primary">{value}</span>
                </div>
            </li>
        );
    }
    
    const ratingsPerUser = data && data.kpis.totalUsers > 0 ? (data.kpis.totalRatings / data.kpis.totalUsers) : 0;

    return (
        <section>
             <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold">Dashboard</h2>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="text-text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Refresh data"
                    >
                        <RefreshCwIcon className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
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

            {error && <div className="text-red-500 bg-red-900/20 p-4 rounded-lg">{error}</div>}
            
            {loading ? renderMainLoading() : data && (
                <div className="space-y-8">
                    {/* --- Top Level KPIs --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Users" value={data.kpis.totalUsers.toLocaleString()} icon={<UsersIcon />} />
                        <StatCard title="Active Users" value={data.kpis.activeUsers.toLocaleString()} change={data.kpis.activeUsersChange} icon={<ActivityIcon />} />
                        <StatCard title="Total Ratings" value={data.kpis.totalRatings.toLocaleString()} icon={<StarIcon />} />
                         {financialLoading ? (
                            <div className="bg-surface p-5 rounded-xl shadow-lg flex flex-col justify-center animate-pulse">
                                <div className="h-4 bg-border rounded w-1/2"></div>
                                <div className="h-8 bg-border rounded w-3/4 mt-2"></div>
                            </div>
                        ) : financialSummary && (
                            <StatCard title="All-Time Profit" value={formatGbp(financialSummary.profit)} icon={financialSummary.profit >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />} change={financialSummary.profit > 0 ? 100 : -100} />
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* --- Main Column --- */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-surface p-6 rounded-xl shadow-lg">
                                <h3 className="text-lg font-semibold text-text-primary mb-4">New Users ({timeframes[timeframe as keyof typeof timeframes]})</h3>
                                <div className="h-80">
                                    <SimpleLineChart data={data.charts.newUsersOverTime} color="#3B82F6" />
                                </div>
                            </div>
                            <div className="bg-surface p-6 rounded-xl shadow-lg">
                                <h3 className="text-lg font-semibold text-text-primary mb-4">New Ratings ({timeframes[timeframe as keyof typeof timeframes]})</h3>
                                <div className="h-80">
                                    <SimpleLineChart data={data.charts.newRatingsOverTime} color="#F59E0B" />
                                </div>
                            </div>
                        </div>

                        {/* --- Sidebar Column --- */}
                        <div className="lg:col-span-1 space-y-6">
                             <div className="bg-surface rounded-xl shadow-lg p-4">
                                <h3 className="text-lg font-semibold text-text-primary mb-2">More Stats</h3>
                                <ul className="text-sm">
                                    <SecondaryStatItem label={`New Users (${timeframes[timeframe as keyof typeof timeframes]})`} value={data.kpis.newUsers.toLocaleString()} change={data.kpis.newUsersChange} />
                                    <SecondaryStatItem label={`New Ratings (${timeframes[timeframe as keyof typeof timeframes]})`} value={data.kpis.newRatings.toLocaleString()} change={data.kpis.newRatingsChange} />
                                    <SecondaryStatItem label="Ratings per User" value={ratingsPerUser.toFixed(1)} />
                                    <SecondaryStatItem label="Total Pubs" value={data.kpis.totalPubs.toLocaleString()} />
                                    <SecondaryStatItem label="Images Uploaded" value={data.kpis.totalUploadedImages.toLocaleString()} />
                                    <SecondaryStatItem label="Total Comments" value={data.kpis.totalComments.toLocaleString()} />
                                     {financialLoading ? (
                                        <li className="h-8 mt-2 bg-border rounded w-full animate-pulse"></li>
                                    ) : financialSummary && (
                                        <>
                                            <SecondaryStatItem label="Total Donations" value={formatGbp(financialSummary.totalDonationsAllTime)} />
                                            <SecondaryStatItem label="Total Spent" value={formatGbp(financialSummary.totalSpendAllTime)} isChurn />
                                            <SecondaryStatItem label="Monthly Spend" value={`${formatGbp(financialSummary.currentMonthlySpend)}/mo`} isChurn />
                                        </>
                                    )}
                                </ul>
                            </div>
                            <div className="bg-surface rounded-xl shadow-lg">
                                <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">Average Pint Price</h3>
                                <div className="overflow-x-auto max-h-96">
                                    <table className="w-full text-sm text-left text-text-secondary">
                                        <thead className="text-xs text-text-secondary uppercase bg-background sticky top-0">
                                            <tr>
                                                <th scope="col" className="px-4 py-3">Country</th>
                                                <th scope="col" className="px-4 py-3 text-right">Avg. Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.tables.avgPintPriceByCountry.map(item => (
                                                <tr key={item.country} className="border-b border-border last:border-b-0 hover:bg-border/50">
                                                    <td className="px-4 py-3 font-medium text-text-primary">
                                                        {item.country}
                                                    </td>
                                                    <td className="px-4 py-3 text-text-primary text-right font-mono">
                                                        {formatCurrency(item.price, item.countryCode)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Home;