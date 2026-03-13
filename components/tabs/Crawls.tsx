import React, { useState, useEffect, useCallback } from 'react';
import { dash_getCrawlsData } from '../../services/supabaseService';
import type { DashCrawlsData } from '../../services/dashContracts';
import { RefreshCwIcon, MapPinIcon, UserIcon, CalendarIcon, ChevronDownIcon, ChevronUpIcon } from '../icons/Icons';

interface CrawlsProps {
    refreshKey: number;
}

const Crawls: React.FC<CrawlsProps> = ({ refreshKey }) => {
    const [data, setData] = useState<DashCrawlsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedCrawlId, setExpandedCrawlId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const result = await dash_getCrawlsData();
            setData(result);
        } catch (error) {
            console.error("Failed to fetch crawls data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    const toggleExpand = (id: string) => {
        setExpandedCrawlId(expandedCrawlId === id ? null : id);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <section>
            <div className="flex items-center space-x-4 mb-6">
                <h2 className="text-2xl font-bold">Pub Crawls</h2>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="text-text-secondary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Refresh data"
                >
                    <RefreshCwIcon className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-surface rounded-xl p-6 shadow-lg animate-pulse">
                            <div className="h-6 bg-border rounded w-1/4 mb-4"></div>
                            <div className="h-4 bg-border rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-border rounded w-1/3"></div>
                        </div>
                    ))
                ) : !data || data.allCrawls.length === 0 ? (
                    <div className="bg-surface rounded-xl p-12 text-center shadow-lg">
                        <p className="text-text-secondary">No pub crawls found.</p>
                    </div>
                ) : (
                    data.allCrawls.map((crawl) => (
                        <div key={crawl.id} className="bg-surface rounded-xl shadow-lg overflow-hidden transition-all duration-200 border border-border/50 hover:border-primary/30">
                            <div 
                                className="p-6 cursor-pointer hover:bg-border/10 transition-colors"
                                onClick={() => toggleExpand(crawl.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-text-primary">{crawl.name || 'Unnamed Crawl'}</h3>
                                        <div className="flex items-center space-x-4 text-sm text-text-secondary">
                                            <div className="flex items-center">
                                                <UserIcon className="w-4 h-4 mr-1" />
                                                {crawl.userName || 'Anonymous'}
                                            </div>
                                            <div className="flex items-center">
                                                <CalendarIcon className="w-4 h-4 mr-1" />
                                                {formatDate(crawl.createdAt)}
                                            </div>
                                            <div className="flex items-center">
                                                <MapPinIcon className="w-4 h-4 mr-1" />
                                                {crawl.stopsCount} {crawl.stopsCount === 1 ? 'stop' : 'stops'}
                                            </div>
                                            {crawl.startLocation && (
                                                <div className="flex items-center text-primary/80">
                                                    <span className="font-medium mr-1">Start:</span>
                                                    {crawl.startLocation}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        {expandedCrawlId === crawl.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                    </div>
                                </div>
                            </div>

                            {expandedCrawlId === crawl.id && (
                                <div className="px-6 pb-6 pt-2 border-t border-border bg-background/30">
                                    <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Crawl Route</h4>
                                    <div className="relative">
                                        {/* Vertical Line */}
                                        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-primary/20"></div>
                                        
                                        <div className="space-y-6">
                                            {crawl.stops && crawl.stops.length > 0 ? (
                                                crawl.stops.map((stop, index) => (
                                                    <div key={stop.id} className="relative flex items-center pl-10">
                                                        {/* Dot */}
                                                        <div className="absolute left-0 w-6 h-6 rounded-full bg-surface border-2 border-primary flex items-center justify-center z-10">
                                                            <span className="text-[10px] font-bold text-primary">{index + 1}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-text-primary">{stop.pubName}</p>
                                                            <a 
                                                                href={`https://app.stoutly.co.uk/?pub_id=${stop.pubId}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-primary hover:underline"
                                                            >
                                                                View Pub Details
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-text-secondary pl-10">No stops recorded for this crawl.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default Crawls;
