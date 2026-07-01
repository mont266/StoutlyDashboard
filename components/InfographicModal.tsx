import React, { useState, useRef, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { XIcon, DownloadIcon, StoutlyPin } from './icons/Icons';
import { CURRENCY_MAP } from '../services/supabaseService';

interface PubMapData {
    id: string;
    name: string;
    lat: number;
    lng: number;
    area_identifier: string | null;
    country_code: string | null;
    ratings_count: number;
    avg_score: number | null;
    avg_quality: number | null;
    min_price: number | null;
    max_price: number | null;
}

interface InfographicModalProps {
    isOpen: boolean;
    onClose: () => void;
    allPubs: PubMapData[];
    initialCluster?: any; // The selected cluster object
}

type StatMode = 'Top Stoutly Score' | 'Top Rated Quality' | 'Top Rated' | 'Most Expensive' | 'Cheapest';

export default function InfographicModal({ isOpen, onClose, allPubs, initialCluster }: InfographicModalProps) {
    const [cityInput, setCityInput] = useState('');
    const [customTitle, setCustomTitle] = useState('');
    const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
    const [statMode, setStatMode] = useState<StatMode>('Top Stoutly Score');
    const [excludeSingleRatings, setExcludeSingleRatings] = useState(false);
    const [generating, setGenerating] = useState(false);
    const graphicRef = useRef<HTMLDivElement>(null);

    // If initialCluster is provided, use it to infer a city name or just use it as the data source
    const [clusterData, setClusterData] = useState<any>(initialCluster);

    useEffect(() => {
        if (isOpen) {
            setClusterData(initialCluster);
            setCustomTitle('');
            setExcludedIds(new Set());
            if (!initialCluster) {
                setCityInput('');
            }
        }
    }, [isOpen, initialCluster]);

    const availableCities = useMemo(() => {
        const cities = new Set<string>();
        allPubs.forEach(p => {
            if (p.area_identifier) cities.add(p.area_identifier.toLowerCase().trim());
        });
        return Array.from(cities).sort();
    }, [allPubs]);

    const top10 = useMemo(() => {
        let pool: PubMapData[] = [];
        
        if (clusterData) {
            pool = clusterData.pubs || [];
        } else if (cityInput.trim().length > 0) {
            const inputLower = cityInput.toLowerCase().trim();
            pool = allPubs.filter(p => (p.area_identifier || '').toLowerCase().includes(inputLower));
        }

        pool = pool.filter(p => !excludedIds.has(p.id));

        if (excludeSingleRatings) {
            pool = pool.filter(p => p.ratings_count > 1);
        }

        let sorted: PubMapData[] = [...pool];
        switch (statMode) {
            case 'Top Stoutly Score':
                sorted = sorted.filter(p => p.avg_score != null).sort((a, b) => b.avg_score! - a.avg_score!);
                break;
            case 'Top Rated Quality':
                sorted = sorted.filter(p => p.avg_quality != null).sort((a, b) => b.avg_quality! - a.avg_quality!);
                break;
            case 'Top Rated':
                sorted = sorted.filter(p => p.ratings_count > 0).sort((a, b) => b.ratings_count - a.ratings_count);
                break;
            case 'Most Expensive':
                sorted = sorted.filter(p => p.max_price != null).sort((a, b) => b.max_price! - a.max_price!);
                break;
            case 'Cheapest':
                sorted = sorted.filter(p => p.min_price != null).sort((a, b) => a.min_price! - b.min_price!);
                break;
        }

        // Deduplicate by name just in case
        const unique = [];
        const seen = new Set();
        for (const p of sorted) {
            if (!seen.has(p.name)) {
                seen.add(p.name);
                unique.push(p);
            }
        }

        return unique.slice(0, 10);
    }, [clusterData, cityInput, allPubs, statMode, excludedIds]);

    const clusterAvgPrice = useMemo(() => {
        if (!clusterData || !clusterData.pubs) return null;
        let sum = 0;
        let count = 0;
        clusterData.pubs.forEach((p: PubMapData) => {
            // Using min_price as it's typically the standard pint price in Stoutly's schema
            if (p.min_price != null) {
                sum += p.min_price;
                count++;
            }
        });
        return count > 0 ? sum / count : null;
    }, [clusterData]);

    const countryAvgPrice = useMemo(() => {
        if (!clusterData || !clusterData.pubs || clusterData.pubs.length === 0) return null;
        const code = clusterData.pubs[0].country_code;
        if (!code) return null;
        let sum = 0;
        let count = 0;
        allPubs.forEach((p: PubMapData) => {
            if (p.country_code === code && p.min_price != null) {
                sum += p.min_price;
                count++;
            }
        });
        return count > 0 ? sum / count : null;
    }, [clusterData, allPubs]);

    const clusterCurrency = useMemo(() => {
        if (!clusterData || !clusterData.pubs || clusterData.pubs.length === 0) return '£';
        const code = clusterData.pubs[0].country_code?.toUpperCase() || 'GB';
        return CURRENCY_MAP[code]?.symbol || '£';
    }, [clusterData]);

    const handleDownload = async () => {
        if (!graphicRef.current) return;
        setGenerating(true);
        
        // Temporarily remove scale transforms which break html2canvas
        const container = document.getElementById('infographic-scale-wrapper');
        const previewArea = document.getElementById('infographic-preview-area');
        const originalClassName = container ? container.className : '';
        const originalPreviewClassName = previewArea ? previewArea.className : '';
        if (container && previewArea) {
            container.className = "shadow-2xl ring-1 ring-white/10 rounded-2xl overflow-hidden origin-top-left transition-none z-50 fixed -left-[10000px] top-0 pointer-events-none";
            previewArea.className = originalPreviewClassName.replace("overflow-hidden", "overflow-visible");
        }

        try {
            // Give the browser a moment to apply the class and font rendering
            await new Promise(r => setTimeout(r, 150));
            // Ensure fonts are fully ready
            if (document.fonts) {
                await document.fonts.ready;
            }

            const canvas = await html2canvas(graphicRef.current, {
                scale: 4, // super high scale for very sharp text
                backgroundColor: '#111827',
                useCORS: true,
                logging: false,
                onclone: (doc) => {
                    const el = doc.getElementById('infographic-scale-wrapper');
                    if (el) el.style.transform = 'none';
                }
            });
            const url = canvas.toDataURL('image/png', 1.0);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stoutly-${statMode.replace(/ /g, '-').toLowerCase()}-${cityInput || 'cluster'}.png`;
            a.click();
        } catch (err) {
            console.error(err);
        } finally {
            if (container) {
                container.className = originalClassName;
            }
            if (previewArea) {
                previewArea.className = originalPreviewClassName;
            }
            setGenerating(false);
        }
    };

    if (!isOpen) return null;

    const displayTitle = customTitle.trim() !== '' ? customTitle : (clusterData ? (clusterData.title || `Area Cluster Top 10`) : (cityInput ? `${cityInput} Top 10` : "Top 10"));

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border/50 rounded-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative max-h-[90vh]">
                
                {/* Controls Area */}
                <div className="w-full md:w-80 border-r border-border/50 p-6 flex flex-col gap-6 overflow-y-auto bg-surface-hover/30">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-text-primary">Infographic Generator</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {!clusterData && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Search Area / City</label>
                            <input 
                                type="text" 
                                value={cityInput}
                                onChange={(e) => setCityInput(e.target.value)}
                                placeholder="e.g. London"
                                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-text-secondary/50"
                            />
                        </div>
                    )}

                    {clusterData && (
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm text-primary">
                            Using data from selected map cluster ({clusterData.pubs?.length || 0} pubs).
                            <button onClick={() => setClusterData(null)} className="ml-2 underline hover:text-white font-medium">Clear</button>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Graphic Title Override</label>
                        <input 
                            type="text" 
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="Optional custom title..."
                            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-text-secondary/50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Statistic</label>
                        <select 
                            value={statMode} 
                            onChange={(e) => setStatMode(e.target.value as StatMode)}
                            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary appearance-none cursor-pointer"
                        >
                            <option value="Top Stoutly Score">Top Stoutly Score</option>
                            <option value="Top Rated Quality">Top Rated Quality</option>
                            <option value="Top Rated">Most Rated</option>
                            <option value="Cheapest">Cheapest</option>
                            <option value="Most Expensive">Most Expensive</option>
                        </select>
                    </div>

                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10 mt-2">
                        <label className="text-sm font-medium text-text-secondary cursor-pointer" htmlFor="exclude-single-ratings">Exclude pubs with 1 rating</label>
                        <input 
                            id="exclude-single-ratings"
                            type="checkbox"
                            checked={excludeSingleRatings}
                            onChange={(e) => setExcludeSingleRatings(e.target.checked)}
                            className="w-4 h-4 accent-primary bg-background border-border/50 rounded cursor-pointer"
                        />
                    </div>

                    {excludedIds.size > 0 && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500 flex justify-between items-center mt-2">
                            <span>{excludedIds.size} pub(s) excluded</span>
                            <button onClick={() => setExcludedIds(new Set())} className="underline hover:text-red-400 font-medium">Reset</button>
                        </div>
                    )}

                    <div className="flex-grow"></div>

                    <button 
                        onClick={handleDownload}
                        disabled={top10.length === 0 || generating}
                        className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {generating ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
                                Generating...
                            </span>
                        ) : (
                            <>
                                <DownloadIcon className="w-5 h-5" /> Download Infographic
                            </>
                        )}
                    </button>
                </div>

                {/* Preview Area (The actual graphic) */}
                <div id="infographic-preview-area" className="flex-1 bg-[#0b1120] flex overflow-auto relative min-h-[400px]">
                    {top10.length > 0 ? (
                        <div className="w-full flex justify-center py-10">
                            {/* Scaled wrapper for preview */}
                            <div 
                                id="infographic-scale-wrapper"
                                className="shadow-2xl ring-1 ring-white/10 rounded-2xl overflow-hidden origin-top scale-[0.5] sm:scale-[0.6] md:scale-[0.7] xl:scale-[0.85]" 
                                style={{ width: '800px', flexShrink: 0, height: 'max-content' }}
                            >
                                {/* Infographic Canvas */}
                                <div 
                                    ref={graphicRef}
                                    className="w-[800px] bg-gradient-to-br from-[#111827] to-[#1e293b] text-[#FDEED4] relative flex flex-col"
                                >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                                <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
                                
                                {/* Header */}
                                <div className="px-8 pt-10 pb-6 text-center relative z-10 border-b border-[#374151]">
                                    <div className="flex justify-center mb-4 text-[#F59E0B]">
                                        <StoutlyPin className="w-14 h-14" />
                                    </div>
                                    <h1 className="text-3xl font-black uppercase tracking-wider mb-2 text-[#F59E0B]">
                                        {statMode}
                                    </h1>
                                    <p className="text-lg font-medium text-[#D1D5DB] uppercase tracking-widest">{displayTitle}</p>
                                    
                                    {clusterData && clusterAvgPrice != null && (
                                        <div className="mt-4 flex justify-center gap-4 flex-wrap">
                                            <div className="bg-[#1e293b]/80 border border-[#374151] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-sm">
                                                <span className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider">Avg Price in Area:</span>
                                                <span className="text-sm font-bold text-[#10B981]">{clusterCurrency}{clusterAvgPrice.toFixed(2)}</span>
                                            </div>
                                            {countryAvgPrice != null && (
                                                <div className="bg-[#1e293b]/80 border border-[#374151] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-sm">
                                                    <span className="text-sm font-semibold text-[#9CA3AF] uppercase tracking-wider">Country Avg:</span>
                                                    <span className="text-sm font-bold text-[#10B981]">{clusterCurrency}{countryAvgPrice.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* List */}
                                <div 
                                    className="flex-1 px-8 py-8 grid gap-x-6 gap-y-4 relative z-10"
                                    style={{ 
                                        gridTemplateColumns: '1fr 1fr', 
                                        gridTemplateRows: 'repeat(5, minmax(80px, auto))', 
                                        gridAutoFlow: 'column' 
                                    }}
                                >
                                    {top10.map((pub, index) => {
                                        const currency = CURRENCY_MAP[pub.country_code?.toUpperCase() || 'GB']?.symbol || '£';
                                        
                                        let extraDisplay = null;
                                        if (statMode === 'Top Stoutly Score') {
                                            const score = pub.avg_score != null ? Math.round(pub.avg_score) : 0;
                                            const radius = 16;
                                            const circumference = 2 * Math.PI * radius;
                                            const offset = circumference - (score / 100) * circumference;
                                            
                                            // Determine color based on score thresholds
                                            let scoreColor = "#6B7280"; // 0-44: Grey
                                            if (score >= 45 && score <= 64) scoreColor = "#EAB308"; // 45-64: Darker Yellow / Amber
                                            if (score >= 65 && score <= 79) scoreColor = "#22C55E"; // 65-79: Green
                                            if (score >= 80) scoreColor = "#FACC15"; // 80-100: Bright Yellow / Gold

                                            extraDisplay = pub.avg_score != null ? (
                                                <div className="relative flex items-center justify-center w-10 h-10 ml-2 shrink-0">
                                                    <svg width="40" height="40" viewBox="0 0 40 40" className="rotate-[-90deg]">
                                                        <circle cx="20" cy="20" r={radius} fill="transparent" stroke="#374151" strokeWidth="3" />
                                                        <circle cx="20" cy="20" r={radius} fill="transparent" stroke={scoreColor} strokeWidth="3" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center font-bold text-xs" style={{ lineHeight: 1, color: scoreColor }}>
                                                        {score}
                                                    </div>
                                                </div>
                                            ) : null;
                                        }

                                        let displayValue = '';
                                        if (statMode === 'Top Rated') displayValue = `${pub.ratings_count} ratings`;
                                        if (statMode === 'Top Rated Quality') displayValue = pub.avg_quality != null ? `${pub.avg_quality.toFixed(1)}/5` : 'N/A';
                                        if (statMode === 'Cheapest') displayValue = pub.min_price != null ? `${currency}${pub.min_price.toFixed(2)}` : 'N/A';
                                        if (statMode === 'Most Expensive') displayValue = pub.max_price != null ? `${currency}${pub.max_price.toFixed(2)}` : 'N/A';

                                        return (
                                            <div key={pub.id} className="group flex items-center justify-between gap-3 bg-[#1e293b] shadow-md p-4 rounded-xl border border-[#334155] relative h-[80px]">
                                                <div className="flex items-center gap-3 overflow-hidden flex-nowrap flex-1">
                                                    <div 
                                                        className="w-8 h-8 rounded-full bg-[#F59E0B] text-[#111827] font-black text-sm shrink-0"
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <span style={{ lineHeight: 1 }}>{index + 1}</span>
                                                    </div>
                                                    <div className="font-bold text-white truncate text-[15px]" style={{ lineHeight: 1.2 }}>
                                                        {pub.name}
                                                    </div>
                                                </div>
                                                
                                                <div className="font-black text-[#10B981] whitespace-nowrap text-[17px] text-right shrink-0 flex items-center" style={{ lineHeight: 1 }}>
                                                    {displayValue}
                                                    {extraDisplay}
                                                </div>
                                                
                                                {/* Exclude button (ignored by html2canvas) */}
                                                <button 
                                                    title="Exclude from infographic"
                                                    data-html2canvas-ignore="true"
                                                    onClick={() => {
                                                        const newExcluded = new Set(excludedIds);
                                                        newExcluded.add(pub.id);
                                                        setExcludedIds(newExcluded);
                                                    }}
                                                    className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 p-1.5 text-white/80 hover:text-red-400 bg-red-600/90 hover:bg-black rounded-full transition-all shadow-lg"
                                                >
                                                    <XIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer */}
                                {(statMode === 'Cheapest' || statMode === 'Most Expensive') && (
                                    <div className="absolute bottom-20 left-0 right-0 text-center z-10 opacity-50">
                                        <p className="text-[10px] font-medium text-white px-8">
                                            * Prices based on historical data since July 2025 and may have risen in the last {(() => {
                                                const start = new Date(2025, 6, 1);
                                                const now = new Date();
                                                return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
                                            })()} months.
                                        </p>
                                    </div>
                                )}
                                <div className="px-8 py-6 mt-auto flex items-center justify-center gap-4 relative z-10 opacity-70 bg-black/20 border-t border-white/10">
                                    <p className="font-bold tracking-widest text-xs uppercase" style={{ lineHeight: 1 }}>
                                        @stoutlyapp
                                    </p>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]/50"></span>
                                    <p className="font-bold tracking-widest text-xs uppercase text-[#F59E0B]" style={{ lineHeight: 1 }}>
                                        www.stoutly.co.uk
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    ) : (
                        <div className="text-center p-8 bg-surface border border-border/50 rounded-xl">
                            <div className="text-text-secondary mb-2 text-xl">No pubs found for this criteria.</div>
                            <p className="text-sm">Try entering a different city or selecting a different statistic.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
