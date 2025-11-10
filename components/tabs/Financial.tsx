
import React, { useState, useEffect } from 'react';
import { dash_getFinancialsData, getAvatarUrl } from '../../services/supabaseService';
import type { FinancialsData, Donation, TopDonator } from '../../types';
import StatCard from '../StatCard';
import { DollarSignIcon, GiftIcon, ReceiptIcon, TrophyIcon } from '../icons/Icons';

const Financial: React.FC = () => {
    const [data, setData] = useState<FinancialsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<string>('30d');
    const timeframes = { '24h': '24 Hours', '7d': '7 Days', '30d': '30 Days', '1y': '1 Year', 'all': 'All Time' };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await dash_getFinancialsData(timeframe);
                setData(result);
            } catch (err: any) {
                if (err.name === 'FunctionsHttpError' && err.context?.status === 403) {
                    setError('Permission Denied: You must be a developer to view this data.');
                } else {
                    setError('An error occurred while fetching financial data. Please check the console.');
                }
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [timeframe]);

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
                <h2 className="text-2xl font-bold">Financials</h2>
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

const TopDonatorCard: React.FC<{ donator: TopDonator }> = ({ donator }) => (
    <div className="bg-surface p-6 rounded-xl text-center shadow-lg h-full flex flex-col justify-center items-center">
        <div className="flex justify-center items-center text-primary mb-3">
            <TrophyIcon />
            <h4 className="font-semibold ml-2">Top Donator</h4>
        </div>
        <img src={getAvatarUrl(donator.avatarId)} alt={donator.name} className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-primary"/>
        <p className="font-bold text-text-primary text-xl">{donator.name}</p>
        <p className="text-lg text-value-green font-semibold">£{donator.totalAmount.toLocaleString()}</p>
    </div>
);

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
                {donations.map((donation) => (
                    <tr key={donation.id} className="border-b border-border last:border-b-0 hover:bg-border/50">
                        <td className="px-4 py-4 font-medium text-text-primary whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                                <img src={getAvatarUrl(donation.user.avatarId)} alt={donation.user.name} className="w-8 h-8 rounded-full" />
                                <span>{donation.user.name}</span>
                            </div>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">{donation.date}</td>
                        <td className="px-4 py-4 text-value-green text-right font-mono">+ £{donation.amount.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default Financial;