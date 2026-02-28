import React, { useEffect, useState } from 'react';
import { dash_getHomeData } from '../../services/supabaseService';
import type { DashHomeData } from '../../services/dashContracts';

const goalsByYear = [
    {
        year: 1,
        goals: [
            { name: 'Users', current: 0, target: 10000 },
            { name: 'Ratings', current: 0, target: 50000 },
            { name: 'Pubs', current: 0, target: 5000 },
        ],
    },
    {
        year: 2,
        goals: [
            { name: 'Users', current: 0, target: 50000 },
            { name: 'All-Time Profit', current: 0, target: 0, format: 'currency' },
            { name: 'Ratings', current: 0, target: 250000 },
            { name: 'Pubs', current: 0, target: 25000 },
        ],
    },
    {
        year: 3,
        goals: [
            { name: 'Users', current: 0, target: 150000 },
            { name: 'Ratings', current: 0, target: 750000 },
            { name: 'Pubs', current: 0, target: 75000 },
        ],
    },
    {
        year: 4,
        goals: [
            { name: 'Users', current: 0, target: 450000 },
            { name: 'Ratings', current: 0, target: 2250000 },
            { name: 'Pubs', current: 0, target: 225000 },
        ],
    },
    {
        year: 5,
        goals: [
            { name: 'Users', current: 0, target: 750000 },
            { name: 'Ratings', current: 0, target: 5000000 },
            { name: 'Pubs', current: 0, target: 500000 },
        ],
    },
];

const ProgressBar: React.FC<{ current: number; target: number; format?: string }> = ({ current, target, format }) => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

    const formatValue = (value: number) => {
        if (format === 'currency') {
            return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
        }
        return new Intl.NumberFormat('en-GB').format(value);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-text-secondary">{formatValue(current)} / {formatValue(target)}</span>
                <span className="text-sm font-medium text-text-secondary">{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const Goals: React.FC = () => {
    const [data, setData] = useState<DashHomeData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await dash_getHomeData('All');
                setData(result);
            } catch (error) {
                console.error("Failed to fetch goal data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getCurrentValue = (name: string) => {
        if (!data) return 0;
        switch (name) {
            case 'Users': return data.kpis.totalUsers;
            case 'Ratings': return data.kpis.totalRatings;
            case 'Pubs': return data.kpis.totalPubs;
            default: return 0;
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-surface rounded-xl shadow-lg p-6 h-64"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {goalsByYear.map(({ year, goals }) => (
                <div key={year} className="bg-surface rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-4">Year {year}</h3>
                    <div className="space-y-6">
                        {goals.map((goal) => {
                            const currentValue = getCurrentValue(goal.name) || goal.current;
                            return (
                                <div key={goal.name}>
                                    <h4 className="font-semibold mb-2">{goal.name}</h4>
                                    <ProgressBar current={currentValue} target={goal.target} format={goal.format} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Goals;
