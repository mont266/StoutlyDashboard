import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TimeSeriesDataPoint } from '../../types';

interface SimpleLineChartProps {
    data: TimeSeriesDataPoint[];
    color: string;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, color }) => {
    const gradientId = `color-${color.replace('#', '')}`;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        borderColor: '#374151',
                        color: '#FDEED4',
                    }}
                    cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}
                    labelStyle={{ color: '#9CA3AF' }}
                />
                <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill={`url(#${gradientId})`} strokeWidth={2} name="Value" />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default SimpleLineChart;
