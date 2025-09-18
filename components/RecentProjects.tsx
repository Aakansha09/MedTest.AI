import React, { useMemo } from 'react';
// Fix: Removed unused ReportType import
import { Report } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';

interface RecentProjectsProps {
    reports: Report[];
}

// Utility to format date strings into relative time
const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
};

const statusStyles: { [key: string]: { pill: string, iconBg: string, iconColor: string } } = {
  completed: { pill: 'bg-green-100 text-green-800', iconBg: 'bg-green-100', iconColor: 'text-green-800' },
  approved: { pill: 'bg-blue-100 text-blue-800', iconBg: 'bg-green-100', iconColor: 'text-green-800' },
  'in progress': { pill: 'bg-indigo-100 text-indigo-800', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-800' },
  pending: { pill: 'bg-gray-200 text-gray-800', iconBg: 'bg-gray-200', iconColor: 'text-gray-800' },
};

const priorityStyles: { [key: string]: string } = {
  High: 'bg-orange-100 text-orange-800',
  Critical: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
};

// Fix: Changed function to derive priority from subtitle string instead of a non-existent 'type' property.
const getPriorityFromSubtitle = (subtitle: string): string => {
    const lowerSub = subtitle.toLowerCase();
    if (lowerSub.includes('security')) {
        return 'Critical';
    }
    if (lowerSub.includes('compliance')) {
        return 'High';
    }
    return 'Medium';
};


export const RecentProjects: React.FC<RecentProjectsProps> = ({ reports }) => {
    
    const processedProjects = useMemo(() => {
        return [...reports]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 4)
            .map(report => {
                const status = report.status.toLowerCase();
                const icon = (status === 'completed' || status === 'approved') ? 'completed' : 'pending';
                return {
                    id: report.id,
                    status,
                    icon,
                    title: report.name,
                    metadata: `${report.scope} · ${formatRelativeTime(report.date)}`,
                    // Fix: Used getPriorityFromSubtitle with report.subtitle
                    priority: getPriorityFromSubtitle(report.subtitle),
                };
            });
    }, [reports]);

    return (
        <div className="bg-surface border border-border-color rounded-lg p-6 h-full">
            <h2 className="text-lg font-semibold text-text-primary">Recent Projects</h2>
            <p className="text-sm text-text-secondary mt-1">Your latest test case generations and compliance checks.</p>
            <ul className="mt-4 space-y-4">
                {processedProjects.map((project) => (
                    <li key={project.id} className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${statusStyles[project.status]?.iconBg}`}>
                            {project.icon === 'completed' 
                                ? <CheckCircleIcon className={`w-5 h-5 ${statusStyles[project.status]?.iconColor}`}/> 
                                : <ClockIcon className={`w-5 h-5 ${statusStyles[project.status]?.iconColor}`}/>
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{project.title}</p>
                            <p className="text-sm text-text-secondary truncate">{project.metadata}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                             <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${priorityStyles[project.priority]}`}>{project.priority}</span>
                             <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${statusStyles[project.status]?.pill}`}>{project.status}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
