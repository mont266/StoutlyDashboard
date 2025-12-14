
import React from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TimeSeriesDataPoint } from '../../types';

interface PerformanceChartProps {
    revenueData: TimeSeriesDataPoint[];
    signupsData: TimeSeriesDataPoint[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ revenueData, signupsData }) => {
    
    const combinedData = revenueData.map((revPoint, index) => ({
        date: revPoint.date,
        revenue: revPoint.value,
        signups: signupsData[index]?.value || 0,
    }));

    const tooltipFormatter = (value: number, name: string) => {
        if (name === 'Revenue') {
            return [`£${value.toFixed(2)}`, name];
        }
        if (name === 'Signups') {
            return [value, name];
        }
        return [value, name];
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                 <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `£${value}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        borderColor: '#374151',
                        color: '#FFFFFF',
                    }}
                    cursor={{fill: 'rgba(245, 158, 11, 0.1)'}}
                    formatter={tooltipFormatter}
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '14px', color: '#9CA3AF', paddingTop: '20px' }} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#F59E0B" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                <Bar yAxisId="right" dataKey="signups" name="Signups" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

export default PerformanceChart;