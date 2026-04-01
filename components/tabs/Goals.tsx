import React, { useEffect, useState } from 'react';
import { dash_getHomeData, LAUNCH_DATE, getGoalsProgressData } from '../../services/supabaseService';
import type { DashHomeData } from '../../services/dashContracts';
import { CheckCircleIcon, CalendarIcon, TrendingUpIcon, AlertTriangleIcon, ClockIcon } from '../icons/Icons';

const DeadlineCountdown: React.FC<{ deadline: Date }> = ({ deadline }) => {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = deadline.getTime() - Date.now();
            
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                setTimeLeft(null);
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [deadline]);

    if (!timeLeft) return <span className="text-warning-red font-bold">Deadline Passed</span>;

    return (
        <div className="flex items-center gap-1.5 text-xs font-mono">
            <div className="flex flex-col items-center bg-border/50 px-1.5 py-0.5 rounded min-w-[2.5rem]">
                <span className="font-bold text-primary">{timeLeft.days}</span>
                <span className="text-[8px] uppercase opacity-60">Days</span>
            </div>
            <span className="opacity-40">:</span>
            <div className="flex flex-col items-center bg-border/50 px-1.5 py-0.5 rounded min-w-[2rem]">
                <span className="font-bold text-primary">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <span className="text-[8px] uppercase opacity-60">Hrs</span>
            </div>
            <span className="opacity-40">:</span>
            <div className="flex flex-col items-center bg-border/50 px-1.5 py-0.5 rounded min-w-[2rem]">
                <span className="font-bold text-primary">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <span className="text-[8px] uppercase opacity-60">Min</span>
            </div>
            <span className="opacity-40">:</span>
            <div className="flex flex-col items-center bg-border/50 px-1.5 py-0.5 rounded min-w-[2rem]">
                <span className="font-bold text-primary text-value-green">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <span className="text-[8px] uppercase opacity-60">Sec</span>
            </div>
        </div>
    );
};

const goalsByYear = [
    {
        year: 1,
        deadline: new Date(LAUNCH_DATE.getFullYear() + 1, LAUNCH_DATE.getMonth(), LAUNCH_DATE.getDate()),
        goals: [
            { name: 'Users', target: 10000 },
            { name: 'Ratings', target: 50000 },
            { name: 'Pubs', target: 5000 },
        ],
    },
    {
        year: 2,
        deadline: new Date(LAUNCH_DATE.getFullYear() + 2, LAUNCH_DATE.getMonth(), LAUNCH_DATE.getDate()),
        goals: [
            { name: 'Users', target: 50000 },
            { name: 'All-Time Profit', target: 0, format: 'currency' },
            { name: 'Ratings', target: 250000 },
            { name: 'Pubs', target: 25000 },
        ],
    },
    {
        year: 3,
        deadline: new Date(LAUNCH_DATE.getFullYear() + 3, LAUNCH_DATE.getMonth(), LAUNCH_DATE.getDate()),
        goals: [
            { name: 'Users', current: 0, target: 150000 },
            { name: 'Ratings', current: 0, target: 750000 },
            { name: 'Pubs', current: 0, target: 75000 },
        ],
    },
    {
        year: 4,
        deadline: new Date(LAUNCH_DATE.getFullYear() + 4, LAUNCH_DATE.getMonth(), LAUNCH_DATE.getDate()),
        goals: [
            { name: 'Users', current: 0, target: 450000 },
            { name: 'Ratings', current: 0, target: 2250000 },
            { name: 'Pubs', current: 0, target: 225000 },
        ],
    },
    {
        year: 5,
        deadline: new Date(LAUNCH_DATE.getFullYear() + 5, LAUNCH_DATE.getMonth(), LAUNCH_DATE.getDate()),
        goals: [
            { name: 'Users', current: 0, target: 750000 },
            { name: 'Ratings', current: 0, target: 5000000 },
            { name: 'Pubs', current: 0, target: 500000 },
        ],
    },
];

const ProgressBar: React.FC<{ current: number; target: number; format?: string }> = ({ current, target, format }) => {
    // For breakeven (target 0), achieved if current >= 0
    const isAchieved = target === 0 ? current >= 0 : current >= target;
    
    // Calculate percentage. For breakeven, if negative we show 0%, if positive 100%
    let percentage = 0;
    if (target === 0) {
        percentage = current >= 0 ? 100 : 0;
    } else {
        percentage = Math.min((current / target) * 100, 100);
    }

    const formatValue = (value: number) => {
        if (format === 'currency') {
            return new Intl.NumberFormat('en-GB', { 
                style: 'currency', 
                currency: 'GBP',
                signDisplay: 'always' // Helpful for profit to see +/-
            }).format(value);
        }
        return new Intl.NumberFormat('en-GB').format(value);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-text-secondary">{formatValue(current)} / {formatValue(target)}</span>
                <span className={`text-sm font-medium ${isAchieved ? 'text-emerald-500' : 'text-text-secondary'}`}>
                    {percentage.toFixed(1)}%
                </span>
            </div>
            <div className="w-full bg-border rounded-full h-2.5">
                <div 
                    className={`${isAchieved ? 'bg-emerald-500' : 'bg-primary/60'} h-2.5 rounded-full transition-all duration-500`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const Goals: React.FC = () => {
    const [data, setData] = useState<DashHomeData | null>(null);
    const [progress, setProgress] = useState<{ totalUsers: number; totalRatings: number; totalPubs: number; allTimeProfit: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [clickedGoal, setClickedGoal] = useState<string | null>(null);

    const toggleClickedGoal = (goalKey: string) => {
        setClickedGoal(prev => prev === goalKey ? null : goalKey);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [homeResult, progressResult] = await Promise.all([
                    dash_getHomeData('30d'),
                    getGoalsProgressData()
                ]);
                setData(homeResult);
                setProgress(progressResult);
            } catch (error) {
                console.error("Failed to fetch goal data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getMetrics = (name: string) => {
        if (!data || !progress) return { current: 0, growth: 0 };
        switch (name) {
            case 'Users': 
                return { current: progress.totalUsers, growth: data.kpis.newUsers };
            case 'Ratings': 
                return { current: progress.totalRatings, growth: data.kpis.newRatings };
            case 'Pubs': 
                return { current: progress.totalPubs, growth: data.kpis.newPubs };
            case 'All-Time Profit':
                return { current: progress.allTimeProfit, growth: 0 }; // Prediction for profit is complex, keeping simple for now
            default: 
                return { current: 0, growth: 0 };
        }
    };

    const getPredictionDetails = (name: string, target: number, deadline: Date) => {
        const { current, growth } = getMetrics(name);
        
        // Achieved check
        if (target === 0) {
            if (current >= 0) return { status: 'achieved', shortfall: 0, projectedPercentage: 100 };
        } else {
            if (current >= target) return { status: 'achieved', shortfall: 0, projectedPercentage: 100 };
        }

        const daysRemaining = Math.max(0, (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        let projected = current;
        if (daysRemaining > 0 && growth > 0) {
            const dailyGrowth = growth / 30;
            projected = current + (dailyGrowth * daysRemaining);
        }

        if (target === 0 ? projected >= 0 : projected >= target) {
            return { status: 'on-track', shortfall: 0, projectedPercentage: 100 };
        } else {
            const pct = target === 0 ? 0 : Math.max(0, (projected / target) * 100);
            return { status: 'behind', shortfall: Math.ceil(target - projected), projectedPercentage: pct };
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
            {goalsByYear.map(({ year, deadline, goals }) => (
                <div key={year} className="bg-surface rounded-xl shadow-lg p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                        <h3 className="text-xl font-bold">Year {year}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex items-center gap-2 text-text-secondary text-sm bg-border/30 px-3 py-1.5 rounded-lg border border-border">
                                <CalendarIcon />
                                <span>Deadline: {deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-secondary text-sm bg-border/30 px-3 py-1.5 rounded-lg border border-border">
                                <ClockIcon className="w-4 h-4 text-primary" />
                                <DeadlineCountdown deadline={deadline} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {goals.map((goal) => {
                            const { current } = getMetrics(goal.name);
                            const currentValue = current || goal.current;
                            const prediction = getPredictionDetails(goal.name, goal.target, deadline);
                            const status = prediction.status;
                            const isAchieved = status === 'achieved';
                            const goalKey = `${year}-${goal.name}`;
                            const isClicked = clickedGoal === goalKey;

                            const formatValue = (value: number, format?: string) => {
                                if (format === 'currency') {
                                    return new Intl.NumberFormat('en-GB', { 
                                        style: 'currency', 
                                        currency: 'GBP',
                                        signDisplay: 'always'
                                    }).format(value);
                                }
                                return new Intl.NumberFormat('en-GB').format(value);
                            };

                            return (
                                <div key={goal.name} className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold">{goal.name}</h4>
                                            {isAchieved ? (
                                                <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded">
                                                    <CheckCircleIcon />
                                                    Achieved
                                                </div>
                                            ) : (
                                                <div 
                                                    className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                                        status === 'on-track' ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10 cursor-pointer'
                                                    }`}
                                                    title={status === 'behind' ? `Projected to miss target by ${formatValue(prediction.shortfall, goal.format)} (Finish at ${prediction.projectedPercentage?.toFixed(1)}%)` : undefined}
                                                    onClick={status === 'behind' ? () => toggleClickedGoal(goalKey) : undefined}
                                                >
                                                    {status === 'on-track' ? (
                                                        <>
                                                            <TrendingUpIcon />
                                                            On Track
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertTriangleIcon />
                                                            {isClicked ? `Miss by ${formatValue(prediction.shortfall, goal.format)} (${prediction.projectedPercentage?.toFixed(1)}%)` : 'Behind'}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
