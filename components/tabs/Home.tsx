

import React, { useState, useEffect, useCallback } from 'react';
import CountriesRatedModal from '../CountriesRatedModal';
import { dash_getHomeData, dash_getStripeFinancials, dash_getFinancialSummary, formatCurrency } from '../../services/supabaseService';
import type { DashHomeData } from '../../services/dashContracts';
import StatCard from '../StatCard';
import SimpleLineChart from '../charts/SimpleLineChart';
// FIX: Import ArrowUpRightIcon and ArrowDownRightIcon.
import { UsersIcon, ActivityIcon, StarIcon, ImageIcon, MessageSquareIcon, BuildingIcon, DollarSignIcon, GiftIcon, TrendingUpIcon, TrendingDownIcon, RefreshCwIcon, ArrowUpRightIcon, ArrowDownRightIcon, GlobeIcon, MapIcon, MaximizeIcon, XIcon } from '../icons/Icons';

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
    const [isCountriesModalOpen, setCountriesModalOpen] = useState(false);
    const [expandedChart, setExpandedChart] = useState<'users' | 'ratings' | 'crawls' | 'checkins' | null>(null);
    
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => <div key={i} className="bg-surface rounded-xl h-28"></div>)}
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
            <li className="flex justify-between items-center py-3 border-b border-border/50 last:border-none last:pb-0">
                <span className="text-sm text-text-secondary">{label}</span>
                <div className="flex items-center space-x-3">
                    {change !== undefined && (
                        <span className={`flex items-center text-xs font-semibold ${changeColor}`}>
                            {isPositive ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
                            {change.toFixed(1)}%
                        </span>
                    )}
                    <span className="text-sm font-semibold text-text-primary">{value}</span>
                </div>
            </li>
        );
    }
    
    const ratingsPerUser = data && data.kpis.totalUsers > 0 ? (data.kpis.totalRatings / data.kpis.totalUsers) : 0;

    const renderExpandedChart = () => {
        if (!expandedChart || !data) return null;

        let title = '';
        let chartData: any[] = [];
        let color = '';

        if (expandedChart === 'users') {
            title = `User Growth (${timeframes[timeframe as keyof typeof timeframes]})`;
            chartData = data.charts.newUsersOverTime;
            color = "#3B82F6";
        } else if (expandedChart === 'ratings') {
            title = `Ratings Trend (${timeframes[timeframe as keyof typeof timeframes]})`;
            chartData = data.charts.newRatingsOverTime;
            color = "#F59E0B";
        } else if (expandedChart === 'crawls') {
            title = `Pub Crawls (${timeframes[timeframe as keyof typeof timeframes]})`;
            chartData = data.charts.pubCrawlsOverTime;
            color = "#10B981";
        } else if (expandedChart === 'checkins') {
            title = `Pub Check-ins (${timeframes[timeframe as keyof typeof timeframes]})`;
            chartData = data.charts.pubCheckinsOverTime || [];
            color = "#8B5CF6";
        }

        return (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 sm:p-8"
                onClick={() => setExpandedChart(null)}
            >
                <div 
                    className="bg-surface w-full h-full max-w-7xl max-h-[90vh] rounded-2xl shadow-2xl border border-border/50 flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-6 border-b border-border/50">
                        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
                        <div className="flex items-center gap-4">
                            <div className="bg-background p-1.5 rounded-xl shadow-sm border border-border/50 hidden sm:flex space-x-1">
                                {(Object.keys(timeframes) as (keyof typeof timeframes)[]).map(t => (
                                    <button
                                        key={t}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTimeframe(t);
                                        }}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 shrink-0 ${
                                            timeframe === t 
                                                ? 'bg-primary text-background shadow-md' 
                                                : 'text-text-secondary hover:bg-border/50 hover:text-text-primary'
                                        }`}
                                    >
                                        {timeframes[t]}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setExpandedChart(null)}
                                className="p-2 rounded-full hover:bg-border/50 text-text-secondary hover:text-text-primary transition-colors"
                            >
                                <XIcon />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 p-6 min-h-0">
                        <SimpleLineChart data={chartData} color={color} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <section>
            {renderExpandedChart()}
            <CountriesRatedModal 
                isOpen={isCountriesModalOpen} 
                onClose={() => setCountriesModalOpen(false)} 
                data={data?.tables.avgPintPriceByCountry ?? []} 
            />
             <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                    <h2 className="text-3xl font-bold text-text-primary tracking-tight">Dashboard</h2>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="text-text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-2 rounded-full hover:bg-border/50"
                        aria-label="Refresh data"
                    >
                        <RefreshCwIcon className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="bg-surface p-1.5 rounded-xl shadow-sm border border-border/50 flex space-x-1 flex-wrap">
                    {(Object.keys(timeframes) as (keyof typeof timeframes)[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 shrink-0 ${
                                timeframe === t 
                                    ? 'bg-primary text-background shadow-md' 
                                    : 'text-text-secondary hover:bg-border/50 hover:text-text-primary'
                            }`}
                        >
                            {timeframes[t]}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="text-red-500 bg-red-900/20 p-4 rounded-xl border border-red-500/20 mb-6">{error}</div>}
            
            {loading ? renderMainLoading() : data && (
                <div className="space-y-8">
                    {/* --- Top Level KPIs --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Users" value={data.kpis.totalUsers.toLocaleString()} icon={<UsersIcon />} />
                        <StatCard title="Active Users" value={data.kpis.activeUsers.toLocaleString()} change={data.kpis.activeUsersChange} icon={<ActivityIcon />} />
                        <StatCard title="Total Ratings" value={data.kpis.totalRatings.toLocaleString()} icon={<StarIcon />} />
                        {financialLoading ? (
                            <div className="bg-surface p-5 rounded-xl shadow-lg flex flex-col justify-center animate-pulse border border-border/50">
                                <div className="h-4 bg-border rounded w-1/2"></div>
                                <div className="h-8 bg-border rounded w-3/4 mt-2"></div>
                            </div>
                        ) : financialSummary && (
                            <StatCard title="All-Time Profit" value={formatGbp(financialSummary.profit)} icon={financialSummary.profit >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />} />
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* --- Main Column --- */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-surface p-6 rounded-xl shadow-lg border border-border/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-text-primary">User Growth</h3>
                                        <p className="text-sm text-text-secondary mt-1">New users over {timeframes[timeframe as keyof typeof timeframes].toLowerCase()}</p>
                                    </div>
                                    <button 
                                        onClick={() => setExpandedChart('users')}
                                        className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-border/50 transition-colors"
                                        title="Full Screen"
                                    >
                                        <MaximizeIcon />
                                    </button>
                                </div>
                                <div className="h-80">
                                    <SimpleLineChart data={data.charts.newUsersOverTime} color="#3B82F6" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-surface p-6 rounded-xl shadow-lg border border-border/50">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-text-primary">Ratings Trend</h3>
                                            <p className="text-sm text-text-secondary mt-1">New ratings submitted</p>
                                        </div>
                                        <button 
                                            onClick={() => setExpandedChart('ratings')}
                                            className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-border/50 transition-colors"
                                            title="Full Screen"
                                        >
                                            <MaximizeIcon />
                                        </button>
                                    </div>
                                    <div className="h-64">
                                        <SimpleLineChart data={data.charts.newRatingsOverTime} color="#F59E0B" />
                                    </div>
                                </div>
                                <div className="bg-surface p-6 rounded-xl shadow-lg border border-border/50">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-text-primary">Pub Crawls</h3>
                                            <p className="text-sm text-text-secondary mt-1">New crawls created</p>
                                        </div>
                                        <button 
                                            onClick={() => setExpandedChart('crawls')}
                                            className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-border/50 transition-colors"
                                            title="Full Screen"
                                        >
                                            <MaximizeIcon />
                                        </button>
                                    </div>
                                    <div className="h-64">
                                        <SimpleLineChart data={data.charts.pubCrawlsOverTime} color="#10B981" />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Check-ins Chart (Full Width) */}
                            <div className="bg-surface p-6 rounded-xl shadow-lg border border-border/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-text-primary">Pub Check-ins</h3>
                                        <p className="text-sm text-text-secondary mt-1">Check-ins over {timeframes[timeframe as keyof typeof timeframes].toLowerCase()}</p>
                                    </div>
                                    <button 
                                        onClick={() => setExpandedChart('checkins')}
                                        className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-border/50 transition-colors"
                                        title="Full Screen"
                                    >
                                        <MaximizeIcon />
                                    </button>
                                </div>
                                <div className="h-64">
                                    <SimpleLineChart data={data.charts.pubCheckinsOverTime || []} color="#8B5CF6" />
                                </div>
                            </div>
                        </div>

                        {/* --- Sidebar Column --- */}
                        <div className="lg:col-span-1 space-y-6">
                             {/* Check-ins & Pints Mini-cards */}
                             <div className="bg-surface rounded-xl shadow-lg border border-border/50 p-6">
                                <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center">
                                    <MapIcon />
                                    <span className="ml-2">Check-ins & Pints</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-background rounded-xl p-4 border border-border/50 flex flex-col justify-center items-center text-center">
                                        <p className="text-2xl font-bold text-text-primary">{data.kpis.totalCheckins?.toLocaleString() || '0'}</p>
                                        <p className="text-xs text-text-secondary mt-1">Total Check-ins</p>
                                    </div>
                                    <div className="bg-background rounded-xl p-4 border border-border/50 flex flex-col justify-center items-center text-center">
                                        <p className="text-2xl font-bold text-text-primary">{data.kpis.totalPintsDrank?.toLocaleString() || '0'}</p>
                                        <p className="text-xs text-text-secondary mt-1">Check-in Pints</p>
                                    </div>
                                    <div className="bg-background rounded-xl p-4 border border-border/50 col-span-2 flex flex-col justify-center items-center text-center">
                                        <p className="text-2xl font-bold text-text-primary">{((data.kpis.totalPintsDrank || 0) + (data.kpis.totalRatings || 0)).toLocaleString()}</p>
                                        <p className="text-xs text-text-secondary mt-1">Total Pints Drank (Check-ins + Ratings)</p>
                                    </div>
                                </div>
                            </div>

                             {/* Platform Content Mini-cards */}
                             <div className="bg-surface rounded-xl shadow-lg border border-border/50 p-6">
                                <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center">
                                    <BuildingIcon />
                                    <span className="ml-2">Platform Content</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-background rounded-xl p-4 border border-border/50 flex flex-col justify-center items-center text-center">
                                        <p className="text-2xl font-bold text-text-primary">{data.kpis.totalPubs.toLocaleString()}</p>
                                        <p className="text-xs text-text-secondary mt-1">Total Pubs</p>
                                    </div>
                                    <div className="bg-background rounded-xl p-4 border border-border/50 flex flex-col justify-center items-center text-center">
                                        <p className="text-2xl font-bold text-text-primary">{data.kpis.totalPubCrawls?.toLocaleString() || '0'}</p>
                                        <p className="text-xs text-text-secondary mt-1">Pub Crawls</p>
                                    </div>
                                    <div 
                                        className="bg-background rounded-xl p-4 border border-border/50 col-span-2 flex justify-between items-center cursor-pointer hover:border-primary/50 transition-colors group"
                                        onClick={() => setCountriesModalOpen(true)}
                                    >
                                        <div>
                                            <p className="text-2xl font-bold text-text-primary group-hover:text-primary transition-colors">{(data.tables.avgPintPriceByCountry?.length ?? 0).toLocaleString()}</p>
                                            <p className="text-xs text-text-secondary mt-1">Countries Rated</p>
                                        </div>
                                        <div className="bg-primary/10 p-3 rounded-full text-primary group-hover:scale-110 transition-transform">
                                            <GlobeIcon />
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Engagement</h3>
                                <ul className="space-y-1">
                                    <SecondaryStatItem label={`New Users`} value={data.kpis.newUsers.toLocaleString()} change={data.kpis.newUsersChange} />
                                    <SecondaryStatItem label={`New Ratings`} value={data.kpis.newRatings.toLocaleString()} change={data.kpis.newRatingsChange} />
                                    <SecondaryStatItem label="Ratings per User" value={ratingsPerUser.toFixed(1)} />
                                    <SecondaryStatItem label="Images Uploaded" value={data.kpis.totalUploadedImages.toLocaleString()} />
                                    <SecondaryStatItem label="Total Comments" value={data.kpis.totalComments.toLocaleString()} />
                                    <SecondaryStatItem label="Public Maps" value={data.kpis.publicMapsCount?.toLocaleString() || '0'} />
                                </ul>
                            </div>

                            {/* Financials Overview */}
                            <div className="bg-surface rounded-xl shadow-lg border border-border/50 p-6">
                                <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center">
                                    <DollarSignIcon />
                                    <span className="ml-2">Financials</span>
                                </h3>
                                {financialLoading ? (
                                    <div className="space-y-4 animate-pulse">
                                        <div className="h-10 bg-border rounded w-full"></div>
                                        <div className="h-10 bg-border rounded w-full"></div>
                                        <div className="h-10 bg-border rounded w-full"></div>
                                    </div>
                                ) : financialSummary ? (
                                    <ul className="space-y-1">
                                        <SecondaryStatItem label="Total Donations" value={formatGbp(financialSummary.totalDonationsAllTime)} />
                                        <SecondaryStatItem label="Total Spent" value={formatGbp(financialSummary.totalSpendAllTime)} isChurn />
                                        <SecondaryStatItem label="Monthly Spend" value={`${formatGbp(financialSummary.currentMonthlySpend)}/mo`} isChurn />
                                    </ul>
                                ) : (
                                    <p className="text-sm text-text-secondary">Financial data unavailable.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Home;