



import React, { useState, useEffect, useCallback } from 'react';
import { dash_getStripeFinancials, getAvatarUrl } from '../../../services/supabaseService';
import type { FinancialsData, Donation, TopDonator } from '../../../types';
import StatCard from '../../StatCard';
import { DollarSignIcon, GiftIcon, ReceiptIcon, TrophyIcon, RefreshCwIcon } from '../../icons/Icons';

const PLACEHOLDER_AVATAR = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTYgMjF2LTJhNCA0IDAgMCAwLTQtNEg2YTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjxjaXJjbGUgY3g9IjkiIGN5PSI3IiByPSI0Ij48L2NpcmNsZT48L3N2Zz4=`;

interface DonationsProps {
    refreshKey: number;
}

const Donations: React.FC<DonationsProps> = ({ refreshKey }) => {
    const [data, setData] = useState<FinancialsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<string>('30d');
    const timeframes = { '24h': '24 Hours', '7d': '7 Days', '30d': '30 Days', '1y': '1 Year', 'all': 'All Time' };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await dash_getStripeFinancials(timeframe);
            setData(result);
        } catch (err: any) {
            setError('An error occurred while fetching financial data. Please check the console.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [timeframe]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    const renderSkeleton = () => (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-surface rounded-xl"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-48 bg-surface rounded-xl"></div>
                <div className="lg:col-span-2 h-96 bg-surface rounded-xl"></div>
            </div>
        </div>
    );

    if (loading) return <section>{renderSkeleton()}</section>;
    if (error) return <div className="text-warning-red bg-warning-red/10 border border-warning-red/30 p-4 rounded-lg text-center">{error}</div>;
    if (!data) return <p>No financial data available.</p>;

    return (
        <section>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold">Donations</h2>
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
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                                timeframe === t ? 'bg-primary text-background' : 'text-text-secondary hover:bg-border'
                            }`}
                        >
                            {timeframes[t]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Gross Donations" value={`£${data.grossDonations.toLocaleString()}`} icon={<DollarSignIcon />} />
                    <StatCard title="Stripe Fees" value={`£${data.stripeFees.toLocaleString()}`} icon={<ReceiptIcon />} isChurn />
                    <StatCard title="Net Donations" value={`£${data.netDonations.toLocaleString()}`} icon={<DollarSignIcon />} />
                    <StatCard title="Total Donations" value={data.totalDonations.toLocaleString()} icon={<GiftIcon />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <TopDonatorCard donator={data.topDonator} />
                    <div className="lg:col-span-2 bg-surface rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">Recent Donations</h3>
                        <RecentDonationsTable donations={data.recentDonations} />
                    </div>
                </div>
            </div>
        </section>
    );
};

const TopDonatorCard: React.FC<{ donator: TopDonator }> = ({ donator }) => {
    const isNA = donator.username === 'N/A';
    const avatarUrl = getAvatarUrl(donator.avatar_id);
    const avatarSrc = isNA ? PLACEHOLDER_AVATAR : (avatarUrl || PLACEHOLDER_AVATAR);

    return (
        <div className="bg-surface p-6 rounded-xl text-center shadow-lg h-full flex flex-col justify-center items-center">
            <div className="flex justify-center items-center text-primary mb-3">
                <TrophyIcon />
                <h4 className="font-semibold ml-2">Top Donator</h4>
            </div>
            <img 
                src={avatarSrc} 
                alt={donator.username} 
                className={`w-20 h-20 rounded-full mx-auto mb-3 border-2 ${isNA ? 'border-border' : 'border-primary'} bg-border object-cover`}
                onError={(e) => { e.currentTarget.src = PLACEHOLDER_AVATAR; }}
            />
            {isNA || !donator.id ? (
                <p className={`font-bold text-xl ${isNA ? 'text-text-secondary' : 'text-text-primary'}`}>{donator.username}</p>
            ) : (
                <a href={`https://app.stoutly.co.uk/?user_id=${donator.id}`} target="_blank" rel="noopener noreferrer" className={`font-bold text-xl hover:underline hover:text-primary transition-colors ${isNA ? 'text-text-secondary' : 'text-text-primary'}`}>{donator.username}</a>
            )}
            <p className="text-lg text-value-green font-semibold">£{donator.totalAmount.toLocaleString()}</p>
        </div>
    );
};

const RecentDonationsTable: React.FC<{ donations: Donation[] }> = ({ donations }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-secondary uppercase bg-background">
                <tr>
                    <th scope="col" className="px-4 py-3">User</th>
                    <th scope="col" className="px-4 py-3 hidden sm:table-cell">Date</th>
                    <th scope="col" className="px-4 py-3 text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                {donations.map((donation) => {
                    const isAnonymous = donation.user.username === 'Anonymous';
                    const avatarUrl = getAvatarUrl(donation.user.avatar_id);
                    const avatarSrc = isAnonymous ? PLACEHOLDER_AVATAR : (avatarUrl || PLACEHOLDER_AVATAR);

                    return (
                        <tr key={donation.id} className="border-b border-border last:border-b-0 hover:bg-border/50">
                            <td className="px-4 py-4 font-medium text-text-primary whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                    <img 
                                        src={avatarSrc} 
                                        alt={donation.user.username} 
                                        className="w-8 h-8 rounded-full bg-border object-cover"
                                        onError={(e) => { e.currentTarget.src = PLACEHOLDER_AVATAR; }}
                                    />
                                    {isAnonymous || !donation.user.id ? (
                                        <span>{donation.user.username}</span>
                                    ) : (
                                        <a href={`https://app.stoutly.co.uk/?user_id=${donation.user.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline transition-colors">{donation.user.username}</a>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-4 hidden sm:table-cell">{donation.date}</td>
                            <td className="px-4 py-4 text-value-green text-right font-mono">+ £{donation.amount.toFixed(2)}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

export default Donations;