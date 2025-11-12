import React, { useState, useEffect } from 'react';
import { dash_getOutgoingsData } from '../../services/supabaseService';
import type { DashOutgoingsData } from '../../services/dashContracts';
import StatCard from '../StatCard';
import { DollarSignIcon, TrendingDownIcon } from '../icons/Icons';

const Outgoings: React.FC = () => {
    const [data, setData] = useState<DashOutgoingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await dash_getOutgoingsData();
                setData(result);
            } catch (err) {
                setError('Failed to fetch outgoings data. Please ensure the database function is deployed.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const renderLoading = () => (
        <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface rounded-xl h-28"></div>
                <div className="bg-surface rounded-xl h-28"></div>
            </div>
            <div className="bg-surface rounded-xl h-96"></div>
            <div className="bg-surface rounded-xl h-96"></div>
        </div>
    );

    if (loading) return <section>{renderLoading()}</section>;
    if (error) return <div className="text-warning-red bg-warning-red/10 border border-warning-red/30 p-4 rounded-lg text-center">{error}</div>;
    if (!data) return <p>No outgoings data available.</p>;

    return (
        <section>
            <h2 className="text-2xl font-bold mb-6">Project Outgoings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard 
                    title="Total Spend To Date" 
                    value={`£${data.kpis.totalSpend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    icon={<DollarSignIcon />} 
                    isChurn 
                />
                <StatCard 
                    title="Current Monthly Cost" 
                    value={`£${data.kpis.monthlyCost.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                    icon={<TrendingDownIcon />} 
                    isChurn 
                />
            </div>

            <div className="space-y-8">
                {/* Subscriptions Table */}
                <div className="bg-surface rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">Monthly Subscriptions</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-text-secondary">
                            <thead className="text-xs text-text-secondary uppercase bg-background">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Service</th>
                                    <th scope="col" className="px-6 py-3 hidden md:table-cell">Category</th>
                                    <th scope="col" className="px-6 py-3 hidden lg:table-cell">Start Date</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3 text-right">Monthly Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.tables.subscriptions.map(sub => (
                                    <tr key={sub.id} className="border-b border-border hover:bg-border/50">
                                        <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">{sub.name}</td>
                                        <td className="px-6 py-4 hidden md:table-cell">{sub.category || 'N/A'}</td>
                                        <td className="px-6 py-4 hidden lg:table-cell">{formatDate(sub.start_date)}</td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${sub.status === 'Active' ? 'bg-value-green/20 text-value-green' : 'bg-gray-500/20 text-gray-400'}`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-warning-red text-right font-mono">- £{sub.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Manual Outgoings Table */}
                <div className="bg-surface rounded-xl shadow-lg">
                    <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">Manual Outgoings</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-text-secondary">
                            <thead className="text-xs text-text-secondary uppercase bg-background">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Item/Service</th>
                                    <th scope="col" className="px-6 py-3 hidden md:table-cell">Category</th>
                                    <th scope="col" className="px-6 py-3 hidden lg:table-cell">Purchase Date</th>
                                    <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.tables.manualOutgoings.map(item => (
                                    <tr key={item.id} className="border-b border-border hover:bg-border/50">
                                        <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">{item.name}</td>
                                        <td className="px-6 py-4 hidden md:table-cell">{item.category || 'N/A'}</td>
                                        <td className="px-6 py-4 hidden lg:table-cell">{formatDate(item.purchase_date)}</td>
                                        <td className="px-6 py-4 text-warning-red text-right font-mono">- £{item.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Outgoings;
