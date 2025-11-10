

import React, { useState, useEffect } from 'react';
import { dash_getPubsData } from '../../services/supabaseService';
import type { Pub } from '../../types';
import type { DashPubsData } from '../../services/dashContracts';
import { StarIcon, BuildingIcon, HashIcon } from '../icons/Icons';
import StatCard from '../StatCard';

const Pubs: React.FC = () => {
    const [data, setData] = useState<DashPubsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // A single, consolidated call
                const result = await dash_getPubsData();
                setData(result);
            } catch (error) {
                console.error("Failed to fetch pub data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const PubTable: React.FC<{ title: string, data: Pub[], loading: boolean, isScoreOutOf100?: boolean }> = ({ title, data, loading, isScoreOutOf100 = false }) => (
        <div className="bg-surface rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-text-primary p-4 border-b border-border">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-secondary">
                    <thead className="text-xs text-text-secondary uppercase bg-background">
                        <tr>
                            <th scope="col" className="px-6 py-3">Pub</th>
                            <th scope="col" className="px-6 py-3 text-center">{isScoreOutOf100 ? 'Score (/100)' : 'Score'}</th>
                            <th scope="col" className="px-6 py-3 text-center">Ratings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse border-b border-border">
                                    <td className="px-6 py-4"><div className="h-4 bg-border rounded w-3/4"></div></td>
                                    <td className="px-6 py-4 text-center"><div className="h-4 bg-border rounded w-1/2 mx-auto"></div></td>
                                    <td className="px-6 py-4 text-center"><div className="h-4 bg-border rounded w-1/2 mx-auto"></div></td>
                                </tr>
                            ))
                        ) : (
                            data.map(pub => (
                                <tr key={pub.id} className="border-b border-border hover:bg-border/50">
                                    <td className="px-6 py-4 font-medium text-text-primary">
                                        <div className="flex flex-col">
                                            <span>{pub.name}</span>
                                            <span className="text-xs text-text-secondary">{pub.location}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-text-primary text-center font-semibold">
                                        {isScoreOutOf100 ? (
                                             <span className="flex items-center justify-center">
                                                {pub.averageScore.toFixed(0)}
                                             </span>
                                        ) : (
                                            <span className="flex items-center justify-center">
                                                <StarIcon />
                                                <span className="ml-1">{pub.averageScore.toFixed(1)}</span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-text-primary text-center">{pub.totalRatings.toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderAnalyticsSkeleton = () => (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-32 bg-surface rounded-xl"></div>
            <div className="h-32 bg-surface rounded-xl"></div>
            <div className="h-32 bg-surface rounded-xl"></div>
        </div>
    );

    return (
        <section>
            <h2 className="text-2xl font-bold mb-6">Pub Analytics</h2>
            
            <div className="mb-6">
                {loading || !data ? renderAnalyticsSkeleton() : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Pubs" value={data.analytics.totalPubs.toLocaleString()} icon={<BuildingIcon />} />
                        <StatCard title="Average Overall Rating" value={data.analytics.averageOverallRating.toFixed(2)} icon={<StarIcon />} />
                        <StatCard title="Total Ratings Submitted" value={data.analytics.totalRatingsSubmitted.toLocaleString()} icon={<HashIcon />} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <PubTable title="Top 10 Pub Scores" data={data?.leaderboards.topRated ?? []} loading={loading} isScoreOutOf100={true} />
                <PubTable title="Top 10 Most Reviewed Pubs" data={data?.leaderboards.mostReviewed ?? []} loading={loading} />
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
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-border">
                                        <td className="px-6 py-4"><div className="h-4 bg-border rounded w-3/4"></div></td>
                                        <td className="px-6 py-4 text-center"><div className="h-4 bg-border rounded w-1/4 mx-auto"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-4 bg-border rounded w-1/2 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : (
                                data?.analytics.pintPriceByCountry.map(item => (
                                    <tr key={item.country} className="border-b border-border hover:bg-border/50">
                                        <td className="px-6 py-3 font-medium text-text-primary">
                                            {item.country}
                                        </td>
                                        <td className="px-6 py-3 text-text-primary text-center">
                                            {item.ratingsCount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 text-text-primary text-right font-mono">
                                            £{item.price.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default Pubs;