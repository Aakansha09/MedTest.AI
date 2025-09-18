import React, { useState, useRef } from 'react';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { SearchIcon } from '../icons/SearchIcon';
import { BellIcon } from '../icons/BellIcon';
import { LogoutIcon } from '../icons/LogoutIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { WarningIcon } from '../icons/WarningIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { XCircleIcon } from '../icons/XCircleIcon';
import { LinkIcon } from '../icons/LinkIcon';
import { ProcessingState, View } from '../../types';
import { LoaderIcon } from '../icons/LoaderIcon';

const notifications = [
    {
        type: 'success',
        title: 'New Test Cases Generated',
        description: 'REQ-001: User Authentication completed',
        time: '5m',
        category: 'Test Case',
    },
    {
        type: 'warning',
        title: 'Compliance Review Required',
        description: 'HIPAA audit trail needs verification',
        time: '12m',
        category: 'Compliance',
    },
    {
        type: 'info',
        title: 'Test Case Review Completed',
        description: 'Dr. Johnson approved 8 test cases',
        time: '1h',
        category: 'Review',
    },
    {
        type: 'error',
        title: 'Traceability Gap Detected',
        description: 'REQ-003: Missing test case coverage',
        time: '2h',
        category: 'Traceability',
    }
];

const iconMap = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
    warning: <WarningIcon className="w-6 h-6 text-amber-500" />,
    info: <InfoIcon className="w-6 h-6 text-blue-500" />,
    error: <XCircleIcon className="w-6 h-6 text-red-500" />,
};


const NotificationsPanel: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const panelRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(panelRef, onClose);

    return (
        <div ref={panelRef} className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-surface rounded-lg shadow-lg border border-border-color z-50">
            <div className="p-4 border-b border-border-color flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>
                <button className="text-sm text-primary hover:underline">Mark all read</button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.map((note, index) => (
                    <div key={index} className="p-4 border-b border-border-color flex items-start gap-4 hover:bg-gray-50">
                        <div className="flex-shrink-0 mt-1">
                            {iconMap[note.type as keyof typeof iconMap]}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-text-primary text-sm">{note.title}</p>
                            <p className="text-sm text-text-secondary">{note.description}</p>
                            <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
                                <span className="flex items-center gap-1">
                                    <LinkIcon className="w-3 h-3"/>
                                    {note.category}
                                </span>
                                <span>{note.time}</span>
                            </div>
                        </div>
                         <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                    </div>
                ))}
            </div>
            <div className="p-3 bg-background rounded-b-lg text-center">
                <button className="text-sm font-medium text-primary hover:underline">View all notifications</button>
            </div>
        </div>
    );
}

interface HeaderProps {
    onLogout: () => void;
    processingState: ProcessingState;
    setActiveView: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, processingState, setActiveView }) => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const isGenerating = [
        ProcessingState.UPLOADING,
        ProcessingState.PARSING,
        ProcessingState.ANALYZING,
        ProcessingState.GENERATING,
    ].includes(processingState);


  return (
    <header className="bg-surface border-b border-border-color">
      <div className="px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
            {isGenerating && (
                <button 
                    onClick={() => setActiveView('processing')}
                    className="flex items-center px-3 py-1.5 bg-primary-light text-primary text-sm font-medium rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                    <LoaderIcon className="w-4 h-4 mr-2" />
                    Generation in progress...
                </button>
            )}
            <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input type="text" placeholder="Search test cases, requirements..." className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"/>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            <div className="relative">
                <button onClick={() => setNotificationsOpen(o => !o)} className="p-2 rounded-full hover:bg-gray-100 text-text-secondary relative">
                    <BellIcon className="h-6 w-6"/>
                    <span className="absolute top-1 right-1.5 flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-surface"></span>
                    </span>
                </button>
                {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}
            </div>
            <button onClick={onLogout} className="p-2 rounded-full hover:bg-gray-100 text-text-secondary" aria-label="Logout">
                <LogoutIcon className="h-6 w-6"/>
            </button>
        </div>
      </div>
    </header>
  );
};
