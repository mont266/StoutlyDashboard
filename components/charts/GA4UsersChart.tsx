import React from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TimeSeriesDataPoint } from '../../types';

interface GA4UsersChartProps {
    usersData: TimeSeriesDataPoint[];
    sessionsData: TimeSeriesDataPoint[];
}

const GA4UsersChart: React.FC<GA4UsersChartProps> = ({ usersData, sessionsData }) => {
    
    const combinedData = usersData.map((userPoint, index) => ({
        date: userPoint.date,
        users: userPoint.value,
        sessions: sessionsData[index]?.value || 0,
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                 <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9CA3AF' }} fontSize={12} tickLine={false} axisLine={false} />

                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        borderColor: '#374151',
                        color: '#FFFFFF',
                    }}
                    cursor={{fill: 'rgba(59, 130, 246, 0.1)'}}
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '14px', color: '#9CA3AF', paddingTop: '20px' }} />
                
                <Area yAxisId="left" type="monotone" dataKey="sessions" name="Sessions" stroke="#3B82F6" fillOpacity={1} fill="url(#colorSessions)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="users" name="Users" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

export default GA4UsersChart;