import React, { useState, useEffect } from 'react';
import { getGA4Data } from '../../services/supabaseService';
import type { GA4Data, GA4ReportItem } from '../../types';
import StatCard from '../StatCard';
import GA4UsersChart from '../charts/GA4UsersChart';
import EngagementDonutChart from '../charts/EngagementDonutChart';
import { UsersIcon, ActivityIcon, PercentIcon, MousePointerClickIcon, FileTextIcon, GlobeIcon } from '../icons/Icons';
import EventTreemapChart from '../charts/EventTreemapChart';

const ReportTable: React.FC<{ title: string; data: GA4ReportItem[], icon: React.ReactNode }> = ({ title, data, icon }) => (
    <div className="bg-surface rounded-xl shadow-lg h-full">
        <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
        </h3>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-text-secondary">
                <tbody>
                    {data.map((item) => (
                        <tr key={item.name} className="border-b border-border last:border-b-0 hover:bg-border/50">
                            <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap overflow-hidden text-ellipsis" title={item.name}>
                                {item.name}
                            </td>
                            <td className="px-4 py-3 text-text-primary text-right font-semibold">
                                {item.value.toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);


const GA4: React.FC = () => {
    const [data, setData] = useState<GA4Data | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await getGA4Data(timeframe);
                setData(result);
            } catch (err) {
                setError('Failed to fetch GA4 analytics data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [timeframe]);

    const renderLoading = () => (
        <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-surface rounded-xl h-32"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-surface rounded-xl h-96"></div>
                    <div className="bg-surface rounded-xl h-80"></div>
                </div>
                <div className="space-y-6">
                    <div className="bg-surface rounded-xl h-96"></div>
                    <div className="bg-surface rounded-xl h-80"></div>
                </div>
            </div>
        </div>
    );

    return (
        <section>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">GA4 Analytics</h2>
                <div className="bg-surface p-1 rounded-lg flex space-x-1">
                    {(['7d', '30d', '90d'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                                timeframe === t ? 'bg-primary text-background' : 'text-text-secondary hover:bg-border'
                            }`}
                        >
                            {t === '7d' ? '7 Days' : t === '30d' ? '30 Days' : '90 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="text-red-500 bg-red-900/20 p-4 rounded-lg">{error}</div>}

            {loading ? renderLoading() : data && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Users" value={data.kpis.users.toLocaleString()} change={data.kpis.usersChange} icon={<UsersIcon />} />
                        <StatCard title="Sessions" value={data.kpis.sessions.toLocaleString()} change={data.kpis.sessionsChange} icon={<ActivityIcon />} />
                        <StatCard title="Engagement Rate" value={`${data.kpis.engagementRate.toFixed(1)}%`} change={data.kpis.engagementRateChange} icon={<PercentIcon />} />
                        <StatCard title="Event Count" value={data.kpis.eventCount.toLocaleString()} change={data.kpis.eventCountChange} icon={<MousePointerClickIcon />} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-text-primary flex items-center">
                                <MousePointerClickIcon />
                                <span className="ml-2">Feature Engagement Analysis</span>
                            </h3>
                            <div className="bg-surface p-4 rounded-xl shadow-lg">
                                <h4 className="text-lg font-semibold text-text-primary mb-2 px-2">Event Distribution</h4>
                                <div className="h-80">
                                    <EventTreemapChart data={data.tables.topEvents} />
                                </div>
                            </div>
                            <ReportTable title="Top Events by Count" data={data.tables.topEvents} icon={<MousePointerClickIcon />} />
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-text-primary flex items-center">
                                <UsersIcon />
                                <span className="ml-2">Audience & Traffic Overview</span>
                            </h3>
                            <div className="bg-surface p-6 rounded-xl shadow-lg">
                                <h4 className="text-lg font-semibold text-text-primary mb-4">Users and Sessions</h4>
                                <div className="h-80">
                                    <GA4UsersChart usersData={data.charts.usersOverTime} sessionsData={data.charts.sessionsOverTime} />
                                </div>
                            </div>
                            <ReportTable title="Top Pages by Pageviews" data={data.tables.topPages} icon={<FileTextIcon/>} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center">
                            <GlobeIcon />
                            <span className="ml-2">Audience Demographics</span>
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            <div className="bg-surface p-6 rounded-xl shadow-lg">
                                <h4 className="text-lg font-semibold text-text-primary mb-4">Device Breakdown</h4>
                                <div className="h-72">
                                    <EngagementDonutChart data={data.charts.deviceBreakdown} />
                                </div>
                            </div>
                            <ReportTable title="Users by Country" data={data.tables.usersByCountry} icon={<GlobeIcon />} />
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default GA4;