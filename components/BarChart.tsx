import React from 'react';

interface BarChartProps {
    data: Record<string, number>;
}

const COLORS = ['bg-indigo-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'];

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
    const entries = Object.entries(data);
    const maxValue = Math.max(...entries.map(([, value]) => value), 0);
    
    if (entries.length === 0) {
        return <div className="text-center text-text-secondary">No data to display.</div>;
    }

    return (
        <div className="space-y-4">
            {entries.map(([label, value], index) => (
                <div key={label} className="grid grid-cols-4 items-center gap-4 text-sm">
                    <div className="col-span-1 font-medium text-text-secondary truncate">{label}</div>
                    <div className="col-span-3 flex items-center">
                        <div className="w-full bg-gray-100 rounded-full h-6">
                            <div
                                className={`${COLORS[index % COLORS.length]} h-6 rounded-full flex items-center justify-end pr-2 text-white font-bold`}
                                style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`, minWidth: '24px' }}
                            >
                                {value}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
