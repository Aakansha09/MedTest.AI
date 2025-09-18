import React, { useState, useEffect } from 'react';

interface DonutChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

export const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Trigger animation shortly after component mounts
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div>
      <style>{`
        .donut-segment {
          transition: stroke-dashoffset 1.5s cubic-bezier(0.25, 1, 0.5, 1);
        }
      `}</style>
      <div className="relative w-full h-64 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#E5E7EB"
            strokeWidth="20"
          />
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const segmentLength = (percentage / 100) * circumference;
            const finalOffset = -accumulatedOffset;
            
            const angle = (accumulatedOffset + segmentLength / 2) / circumference * 360 - 90;
            const textX = 100 + (radius + 18) * Math.cos(angle * Math.PI / 180);
            const textY = 100 + (radius + 18) * Math.sin(angle * Math.PI / 180);

            accumulatedOffset += segmentLength;

            return (
              <g key={index}>
                <g transform="rotate(-90 100 100)">
                 <circle
                    className="donut-segment"
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="20"
                    strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                    strokeDashoffset={isMounted ? finalOffset : circumference}
                    strokeLinecap="round"
                />
                </g>
                <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-semibold fill-current text-text-secondary"
                    opacity={isMounted ? 1 : 0}
                    style={{ transition: 'opacity 1s ease 1s' }}
                  >
                   {`${percentage.toFixed(0)}%`}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-5xl font-bold text-text-primary">{total}</span>
            <span className="text-md text-text-secondary mt-1">Total Test Cases</span>
        </div>
      </div>
       <div className="mt-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {data.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></span>
                        <span className="text-text-secondary">{item.name}</span>
                    </div>
                    <span className="font-semibold text-text-primary">{item.value}</span>
                </div>
            ))}
        </div>
       </div>
    </div>
  );
};