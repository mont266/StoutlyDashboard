import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TimeSeriesDataPoint } from '../../types';

interface CombinedChartProps {
    ratingsData: TimeSeriesDataPoint[];
    checkinsData: TimeSeriesDataPoint[];
}

export default function CombinedRatingsCheckinsChart({ ratingsData, checkinsData }: CombinedChartProps) {
    const [showRatings, setShowRatings] = useState(true);
    const [showCheckins, setShowCheckins] = useState(true);

    const combinedData = useMemo(() => {
        const dateMap = new Map<string, { date: string; ratings: number; checkins: number }>();
        
        ratingsData.forEach(p => {
            dateMap.set(p.date, { date: p.date, ratings: p.value, checkins: 0 });
        });
        
        checkinsData.forEach(p => {
            if (dateMap.has(p.date)) {
                dateMap.get(p.date)!.checkins = p.value;
            } else {
                dateMap.set(p.date, { date: p.date, ratings: 0, checkins: p.value });
            }
        });

        // Sort by date ascending (assuming the string format is sortable 'YYYY-MM-DD' or comparable)
        return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [ratingsData, checkinsData]);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-end gap-3 mb-2 px-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-text-secondary select-none">
                    <input 
                        type="checkbox" 
                        checked={showRatings}
                        onChange={(e) => setShowRatings(e.target.checked)}
                        className="accent-[#F59E0B] cursor-pointer"
                    />
                    <span className="text-[#F59E0B]">Ratings</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-medium text-text-secondary select-none">
                    <input 
                        type="checkbox" 
                        checked={showCheckins}
                        onChange={(e) => setShowCheckins(e.target.checked)}
                        className="accent-[#8B5CF6] cursor-pointer"
                    />
                    <span className="text-[#8B5CF6]">Check-ins</span>
                </label>
            </div>
            
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={combinedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorRatings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1F2937',
                                borderColor: '#374151',
                                color: '#FFFFFF',
                            }}
                            cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}
                            labelStyle={{ color: '#9CA3AF' }}
                        />
                        {showRatings && (
                            <Area type="monotone" dataKey="ratings" stroke="#F59E0B" fillOpacity={1} fill="url(#colorRatings)" strokeWidth={2} name="Ratings" />
                        )}
                        {showCheckins && (
                            <Area type="monotone" dataKey="checkins" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorCheckins)" strokeWidth={2} name="Check-ins" />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
