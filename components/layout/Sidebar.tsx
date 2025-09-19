import React from 'react';
import { View, ProcessingState } from '../../types';
import { TestCasesIcon } from '../icons/TestCasesIcon';
import { IntegrationsIcon } from '../icons/IntegrationsIcon';
import { ReportsIcon } from '../icons/ReportsIcon';
import { TraceabilityIcon } from '../icons/TraceabilityIcon';
import { SettingsIcon } from '../icons/SettingsIcon';
import { HelpIcon } from '../icons/HelpIcon';
import { UserIcon } from '../icons/UserIcon';
import { ChevronDoubleLeftIcon } from '../icons/ChevronDoubleLeftIcon';
import { DashboardIcon } from '../icons/DashboardIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { LoaderIcon } from '../icons/LoaderIcon';
import { LogoIcon } from '../icons/LogoIcon';

interface NavItemProps {
  view: View;
  activeView: View;
  setActiveView: (view: View) => void;
  isCollapsed: boolean;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  isGenerating?: boolean;
  processingView?: View;
}

const NavItem: React.FC<NavItemProps> = ({
  view,
  activeView,
  setActiveView,
  isCollapsed,
  icon,
  label,
  badge,
  isGenerating,
  processingView,
}) => {
  const isActive = activeView === view || (isGenerating && activeView === processingView);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isGenerating && processingView) {
      setActiveView(processingView);
    } else {
      setActiveView(view);
    }
  };

  return (
    <li>
      <a
        href="#"
        onClick={handleClick}
        className={`flex items-center p-2.5 my-1 text-sm font-medium rounded-md transition-colors ${
          isActive ? 'bg-gray-100 text-text-primary' : 'text-text-secondary hover:bg-gray-100'
        } ${isCollapsed ? 'justify-center' : ''}`}
      >
        {icon}
        {!isCollapsed && <span className="ml-3 flex-1 whitespace-nowrap">{label}</span>}
        {badge && !isCollapsed && (
          <span className="inline-flex items-center justify-center px-2 ml-3 text-xs font-medium text-gray-800 bg-gray-200 rounded-full">
            {badge}
          </span>
        )}
      </a>
    </li>
  );
};


export const Sidebar: React.FC<{
  activeView: View;
  setActiveView: (view: View) => void;
  isCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  processingState: ProcessingState;
}> = ({ activeView, setActiveView, isCollapsed, setIsSidebarCollapsed, processingState }) => {
  const isGenerating = [
    ProcessingState.UPLOADING,
    ProcessingState.PARSING,
    ProcessingState.ANALYZING,
    ProcessingState.GENERATING,
  ].includes(processingState);

  return (
    <aside className={`transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`} aria-label="Sidebar">
      <div className="relative flex flex-col h-full px-3 py-4 overflow-y-auto bg-sidebar border-r border-border-color">
        <div className={`flex items-center mb-5 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center ${isCollapsed ? 'hidden' : ''}`}>
                 <LogoIcon className="w-8 h-8" />
                <span className="self-center text-xl font-bold whitespace-nowrap ml-2 text-text-primary">MedTest AI</span>
            </div>
            <button 
                onClick={() => setIsSidebarCollapsed(!isCollapsed)} 
                className={`p-1.5 rounded-md hover:bg-gray-100 text-text-secondary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${isCollapsed ? 'mx-auto' : ''}`}
            >
                <ChevronDoubleLeftIcon className={`w-6 h-6 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>
        </div>

        <ul className="space-y-1 flex-1">
          <NavItem view="dashboard" activeView={activeView} setActiveView={setActiveView} isCollapsed={isCollapsed} icon={<DashboardIcon className="w-6 h-6"/>} label="Dashboard" />
          <NavItem 
            view="test-cases" 
            activeView={activeView} 
            setActiveView={setActiveView} 
            isCollapsed={isCollapsed} 
            icon={isGenerating ? <LoaderIcon className="w-6 h-6 text-primary"/> : <PencilIcon className="w-6 h-6"/>} 
            label="Generated Test Cases"
            isGenerating={isGenerating}
            processingView="processing"
          />
          <NavItem view="integrations" activeView={activeView} setActiveView={setActiveView} isCollapsed={isCollapsed} icon={<IntegrationsIcon className="w-6 h-6"/>} label="Integrations" badge={3}/>
          <NavItem view="reports" activeView={activeView} setActiveView={setActiveView} isCollapsed={isCollapsed} icon={<ReportsIcon className="w-6 h-6"/>} label="Reports" />
          <NavItem view="traceability" activeView={activeView} setActiveView={setActiveView} isCollapsed={isCollapsed} icon={<TraceabilityIcon className="w-6 h-6"/>} label="Traceability" />
        </ul>

        {!isCollapsed && (
             <div className="p-4 mb-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-text-primary">Quick Stats</h3>
                <div className="mt-3 space-y-2 text-sm text-text-secondary">
                    <div className="flex justify-between"><span>Active Projects</span><span className="font-semibold text-text-primary">8</span></div>
                    <div className="flex justify-between"><span>Test Cases</span><span className="font-semibold text-text-primary">124</span></div>
                    <div className="flex justify-between"><span>Coverage</span><span className="font-semibold text-text-primary">94%</span></div>
                </div>
            </div>
        )}

        <div className="pt-2">
            <ul className="pt-4 mt-4 space-y-1 border-t border-border-color">
               <NavItem view="settings" activeView={activeView} setActiveView={setActiveView} isCollapsed={isCollapsed} icon={<SettingsIcon className="w-6 h-6"/>} label="Settings" />
               <NavItem view="help" activeView={activeView} setActiveView={setActiveView} isCollapsed={isCollapsed} icon={<HelpIcon className="w-6 h-6"/>} label="Help & Support" />
            </ul>
        </div>
      </div>
    </aside>
  );
};
