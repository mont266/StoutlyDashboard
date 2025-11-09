import React from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import type { GA4ReportItem } from '../../types';

interface EventTreemapChartProps {
    data: GA4ReportItem[];
}

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#A78BFA', '#F472B6', '#60A5FA', '#34D399', '#FB923C', '#F87171'];

const CustomizedContent: React.FC<any> = ({ root, depth, x, y, width, height, index, name, value }) => {
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: COLORS[index % COLORS.length],
                    stroke: '#111827',
                    strokeWidth: 2,
                    strokeOpacity: 1,
                }}
            />
            {depth === 1 && width > 80 && height > 25 ? (
                <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#FDEED4" fontSize={14} fontWeight="bold" style={{ pointerEvents: 'none' }}>
                    {name}
                </text>
            ) : null}
        </g>
    );
};

const EventTreemapChart: React.FC<EventTreemapChartProps> = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <Treemap
                data={data}
                dataKey="value"
                aspectRatio={4 / 3}
                stroke="#fff"
                content={<CustomizedContent />}
                isAnimationActive={false}
            >
                 <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        borderColor: '#374151',
                        color: '#FDEED4',
                    }}
                    cursor={{fill: 'rgba(255, 255, 255, 0.1)'}}
                    formatter={(value: number, name: string) => [value.toLocaleString(), 'Count']}
                />
            </Treemap>
        </ResponsiveContainer>
    );
};

export default EventTreemapChart;