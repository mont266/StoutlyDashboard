import React, { useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { XIcon, DownloadIcon, StoutlyPin } from './icons/Icons';
import { formatCurrency, CURRENCY_MAP } from '../services/supabaseService';
import type { PintPriceByCountry } from '../types';

const EXCHANGE_RATES_TO_GBP: Record<string, number> = {
    'GBP': 1.0,
    'EUR': 1.18,
    'USD': 1.25,
    'AUD': 1.9,
    'CAD': 1.7,
    'DKK': 8.8,
    'PLN': 5.0,
    'TRY': 40.0,
    'ILS': 4.7,
};

const getPriceInGBP = (price: number, countryCode: string) => {
    const currencyInfo = CURRENCY_MAP[countryCode.toUpperCase()] || { code: 'GBP' };
    const rate = EXCHANGE_RATES_TO_GBP[currencyInfo.code] || 1.0;
    return price / rate;
};

interface PintPriceInfographicModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: PintPriceByCountry[];
}

export default function PintPriceInfographicModal({ isOpen, onClose, data }: PintPriceInfographicModalProps) {
    const [generating, setGenerating] = useState(false);
    const [sortMode, setSortMode] = useState<'cheapest' | 'expensive'>('cheapest');
    const [excludedCountries, setExcludedCountries] = useState<Set<string>>(new Set());
    const graphicRef = useRef<HTMLDivElement>(null);

    const sortedData = useMemo(() => {
        let filtered = data.filter(item => !excludedCountries.has(item.country));
        
        return filtered.sort((a, b) => {
            const priceAGBP = getPriceInGBP(a.price, a.countryCode);
            const priceBGBP = getPriceInGBP(b.price, b.countryCode);
            return sortMode === 'cheapest' ? priceAGBP - priceBGBP : priceBGBP - priceAGBP;
        });
    }, [data, excludedCountries, sortMode]);

    const toggleCountry = (country: string) => {
        setExcludedCountries(prev => {
            const next = new Set(prev);
            if (next.has(country)) {
                next.delete(country);
            } else {
                next.add(country);
            }
            return next;
        });
    };

    const handleDownload = async () => {
        if (!graphicRef.current) return;
        setGenerating(true);
        
        const container = document.getElementById('pint-price-infographic-scale-wrapper');
        const previewArea = document.getElementById('pint-price-infographic-preview-area');
        const originalClassName = container ? container.className : '';
        const originalPreviewClassName = previewArea ? previewArea.className : '';
        if (container && previewArea) {
            container.className = "shadow-2xl ring-1 ring-white/10 rounded-2xl overflow-hidden origin-top-left transition-none z-50 fixed -left-[10000px] top-0 pointer-events-none";
            previewArea.className = originalPreviewClassName.replace("overflow-hidden", "overflow-visible");
        }

        try {
            await new Promise(r => setTimeout(r, 150));
            if (document.fonts) {
                await document.fonts.ready;
            }

            const canvas = await html2canvas(graphicRef.current, {
                scale: 4, 
                backgroundColor: '#111827',
                useCORS: true,
                logging: false,
                onclone: (doc) => {
                    const el = doc.getElementById('pint-price-infographic-scale-wrapper');
                    if (el) el.style.transform = 'none';
                }
            });
            const url = canvas.toDataURL('image/png', 1.0);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stoutly-average-pint-price-by-country.png`;
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border/50 rounded-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative max-h-[90vh]">
                
                {/* Controls Area */}
                <div className="w-full md:w-64 border-r border-border/50 p-6 flex flex-col gap-6 overflow-y-auto bg-surface-hover/30">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-text-primary">Infographic Generator</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="text-text-secondary text-sm">
                        Generates a graphic showing the average price of a pint of stout by country based on all Stoutly data.
                    </div>

                    <div className="flex-grow flex flex-col gap-4 overflow-hidden">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Sorting (Equivalent Value)</label>
                            <select 
                                value={sortMode} 
                                onChange={(e) => setSortMode(e.target.value as any)}
                                className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary appearance-none cursor-pointer"
                            >
                                <option value="cheapest">Cheapest First</option>
                                <option value="expensive">Most Expensive First</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2 overflow-y-auto pr-2 pb-2">
                            <label className="block text-sm font-medium text-text-secondary sticky top-0 bg-surface-hover/30 pt-2 pb-1 z-10">Include Countries</label>
                            {data.map(item => (
                                <label key={item.country} className="flex items-center gap-2 cursor-pointer group text-sm">
                                    <input 
                                        type="checkbox" 
                                        checked={!excludedCountries.has(item.country)}
                                        onChange={() => toggleCountry(item.country)}
                                        className="w-4 h-4 accent-primary bg-background border-border/50 rounded cursor-pointer"
                                    />
                                    <span className="text-text-primary group-hover:text-primary transition-colors truncate">
                                        {item.country}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleDownload}
                        disabled={generating || data.length === 0}
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
                <div id="pint-price-infographic-preview-area" className="flex-1 bg-[#0b1120] flex overflow-auto relative min-h-[400px]">
                    {sortedData.length > 0 ? (
                        <div className="w-full flex justify-center py-10">
                            {/* Scaled wrapper for preview */}
                            <div 
                                id="pint-price-infographic-scale-wrapper"
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
                                        Pint Prices
                                    </h1>
                                    <p className="text-lg font-medium text-[#D1D5DB] uppercase tracking-widest">Average by Country</p>
                                </div>

                                {/* List */}
                                <div className="flex-1 px-8 py-8 flex flex-col gap-4 relative z-10" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                                    {sortedData.map((item, index) => {
                                        return (
                                            <div key={item.countryCode} className="group flex items-center justify-between gap-3 bg-[#1e293b] shadow-md p-4 flex-1 rounded-xl border border-[#334155] relative min-h-[64px]">
                                                <div className="flex items-center gap-4 overflow-hidden flex-nowrap flex-1">
                                                    <div 
                                                        className="w-8 h-8 rounded-full bg-[#F59E0B] text-[#111827] font-black text-sm shrink-0"
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <span style={{ lineHeight: 1 }}>{index + 1}</span>
                                                    </div>
                                                    <div className="font-bold text-white truncate text-xl" style={{ lineHeight: 1.2 }}>
                                                        {item.country}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col items-end justify-center shrink-0">
                                                    <div className="font-black text-[#10B981] whitespace-nowrap text-2xl text-right" style={{ lineHeight: 1 }}>
                                                        {formatCurrency(item.price, item.countryCode)}
                                                    </div>
                                                    {(() => {
                                                        const currencyInfo = CURRENCY_MAP[item.countryCode.toUpperCase()] || { code: 'GBP' };
                                                        if (currencyInfo.code !== 'GBP') {
                                                            const priceInGBP = getPriceInGBP(item.price, item.countryCode);
                                                            return (
                                                                <div className="text-white/60 text-xs font-semibold mt-1.5" style={{ lineHeight: 1 }}>
                                                                    ({formatCurrency(priceInGBP, 'GB')})
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })()}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer */}
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
                            <div className="text-text-secondary mb-2 text-xl">No country price data available.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
