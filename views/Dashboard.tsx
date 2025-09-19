import React from 'react';
import { View, Report } from '../types';
import { UploadIcon } from '../components/icons/UploadIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { HeartPulseIcon } from '../components/icons/HeartPulseIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { DocumentIcon } from '../components/icons/DocumentIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { StethoscopeIcon } from '../components/icons/StethoscopeIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { RecentProjects } from '../components/RecentProjects';
import { CrosshairsIcon } from '../components/icons/CrosshairsIcon';
import { MagicWandIcon } from '../components/icons/MagicWandIcon';


interface DashboardProps {
  setActiveView: (view: View) => void;
  reports: Report[];
}

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
}> = ({ title, value, icon, change }) => (
    <div className="bg-surface p-6 rounded-lg border border-border-color h-full">
        <div className="flex justify-between items-start">
            <p className="text-md font-medium text-text-secondary">{title}</p>
            <div className="text-text-secondary">
                {icon}
            </div>
        </div>
        <div className="mt-4">
            <p className="text-4xl font-bold text-text-primary">{value}</p>
             {change && (
                <p className="mt-1 text-sm text-text-secondary">{change}</p>
            )}
        </div>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ setActiveView, reports }) => {
  return (
    <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Welcome back, Dr. Evans</h1>
                <p className="mt-2 text-text-secondary">Here's your healthcare testing overview for today.</p>
            </div>
            <div className="flex items-center px-3 py-1.5 bg-status-green text-text-green text-sm font-medium rounded-full border border-green-200">
                <HeartPulseIcon className="w-5 h-5 mr-2"/>
                System Healthy
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Test Cases Generated" 
                value="124" 
                icon={<PencilIcon className="h-6 w-6 text-text-secondary" />} 
                change="+12% from last month"
            />
            <StatCard 
                title="Healthcare Projects" 
                value="8"
                icon={<StethoscopeIcon className="h-6 w-6 text-text-secondary" />}
                change="+2 since last week"
            />
            <StatCard 
                title="Compliance Coverage" 
                value="94%" 
                icon={<ShieldCheckIcon className="h-6 w-6 text-text-secondary" />} 
                change="+5% from last audit" 
            />
            <StatCard 
                title="Active Users" 
                value="23" 
                icon={<UsersIcon className="h-6 w-6 text-text-secondary" />} 
                change="+3 new users" 
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Column 1: Impact Analysis Feature Card */}
            <div className="bg-surface border border-border-color rounded-xl p-6 flex flex-col shadow-sm">
                <div className="flex items-center gap-3">
                     <div className="bg-primary-light p-3 rounded-lg">
                        <CrosshairsIcon className="w-6 h-6 text-primary"/>
                    </div>
                    <h2 className="text-xl font-bold text-text-primary">Test Impact Analysis</h2>
                </div>
                 <p className="mt-3 text-text-secondary">
                    Automatically identify which tests are impacted by your latest code changes. Our AI suggests a prioritized test plan to save you time.
                </p>
                 <div className="mt-4 w-full p-3 bg-background rounded-lg flex items-center gap-3 border border-border-color">
                    <div className="bg-primary-light p-2 rounded-lg">
                        <MagicWandIcon className="w-5 h-5 text-primary"/>
                    </div>
                    <div>
                        <h3 className="font-semibold text-text-primary text-sm">Now with Auto-Heal!</h3>
                        <p className="text-xs text-text-secondary">Let AI automatically fix broken tests for you.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setActiveView('impact-analysis')}
                    className="mt-6 w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary-hover transition-colors"
                >
                    Start Analysis
                </button>
            </div>

            {/* Column 2: Quick Actions and Recent Projects */}
            <div className="flex flex-col gap-8">
                <div className="bg-surface border border-border-color rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-text-primary mb-1">Quick Actions</h2>
                    <p className="text-sm text-text-secondary mb-4">Start your testing workflow.</p>
                    <div className="space-y-3">
                        <button onClick={() => setActiveView('generate')} className="w-full flex items-center justify-center p-4 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
                            <PlusIcon className="w-5 h-5 mr-3"/>
                            <span className="text-base font-medium">Generate Test Cases</span>
                        </button>
                         <button onClick={() => alert('Import from Epic not implemented.')} className="w-full flex items-center justify-center p-4 bg-gray-100 text-text-primary rounded-lg hover:bg-gray-200 transition-colors">
                            <DocumentIcon className="w-5 h-5 mr-3"/>
                            <span className="text-base font-medium">Import from Epic</span>
                        </button>
                        <button onClick={() => setActiveView('generate')} className="w-full flex items-center justify-center p-4 bg-gray-100 text-text-primary rounded-lg hover:bg-gray-200 transition-colors">
                            <UploadIcon className="w-5 h-5 mr-3"/>
                            <span className="text-base font-medium">Upload Requirements</span>
                        </button>
                    </div>
                </div>
                <RecentProjects reports={reports} />
            </div>
        </div>
    </div>
  );
};