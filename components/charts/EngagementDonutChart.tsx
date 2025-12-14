import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { NamedValueDataPoint } from '../../types';

interface EngagementDonutChartProps {
    data: NamedValueDataPoint[];
}

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#A78BFA'];

const EngagementDonutChart: React.FC<EngagementDonutChartProps> = ({ data }) => {
    // Custom formatter for the tooltip to display data as a percentage.
    const tooltipFormatter = (value: number, name: string) => {
        // Manually calculate the total to ensure percentages are always correct.
        const total = data.reduce((acc, entry) => acc + (entry.value || 0), 0);
        if (total === 0) {
            return ['0.00%', name];
        }
        const percent = (value / total) * 100;
        // Return the formatted percentage string and the name for the tooltip.
        return [`${percent.toFixed(2)}%`, name];
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={tooltipFormatter}
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        borderColor: '#374151',
                        color: '#FFFFFF',
                    }}
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '14px', color: '#9CA3AF' }} />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default EngagementDonutChart;