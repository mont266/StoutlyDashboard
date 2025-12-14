import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { NamedValueDataPoint } from '../../types';

interface EngagementDonutChartProps {
    data: NamedValueDataPoint[];
}

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#A78BFA'];

const EngagementDonutChart: React.FC<EngagementDonutChartProps> = ({ data }) => {
    // Custom formatter for the tooltip to display data as a percentage.
    const tooltipFormatter = (value: number, name: string, props: any) => {
        // The 'percent' property is automatically calculated by Recharts for Pie components.
        // It's a value between 0 and 1.
        if (props && props.payload && typeof props.payload.percent === 'number') {
            const percentValue = (props.payload.percent * 100).toFixed(2);
            return [`${percentValue}%`, name];
        }

        // Fallback for cases where percent might not be available, displays the raw value.
        return [value, name];
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
                        color: '#FDEED4',
                    }}
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '14px', color: '#9CA3AF' }} />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default EngagementDonutChart;
