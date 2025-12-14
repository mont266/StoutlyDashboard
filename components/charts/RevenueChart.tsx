import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TimeSeriesDataPoint } from '../../types';

interface RevenueChartProps {
    data: TimeSeriesDataPoint[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `£${value}`} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        borderColor: '#374151',
                        color: '#FFFFFF',
                    }}
                    cursor={{fill: 'rgba(245, 158, 11, 0.1)'}}
                    formatter={(value: number) => [`£${value.toFixed(2)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="value" stroke="#F59E0B" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default RevenueChart;