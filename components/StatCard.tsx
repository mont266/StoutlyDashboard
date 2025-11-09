
import React from 'react';
import { ArrowUpRightIcon, ArrowDownRightIcon } from './icons/Icons';

interface StatCardProps {
    title: string;
    value: string;
    change?: number;
    icon: React.ReactNode;
    isChurn?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, isChurn = false }) => {
    const isPositive = change !== undefined && change >= 0;
    const changeColor = (isChurn ? !isPositive : isPositive) ? 'text-value-green' : 'text-warning-red';
    const bgColor = (isChurn ? !isPositive : isPositive) ? 'bg-value-green/20' : 'bg-warning-red/20';

    return (
        <div className="bg-surface p-5 rounded-xl shadow-lg flex flex-col justify-between transition-transform duration-200 hover:scale-105">
            <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-text-secondary">{title}</p>
                <div className="text-text-secondary">{icon}</div>
            </div>
            <div>
                <p className="text-3xl font-bold text-text-primary mt-2">{value}</p>
                {change !== undefined && (
                    <div className="flex items-center text-sm mt-1">
                        <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${bgColor} ${changeColor}`}>
                            {isPositive ? <ArrowUpRightIcon /> : <ArrowDownRightIcon />}
                            {change.toFixed(1)}%
                        </span>
                        <span className="text-text-secondary ml-2">vs last period</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;