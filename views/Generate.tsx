import React, { useState, useRef, useCallback } from 'react';
import { ProcessingState, RequirementsData } from '../types';
import { LockIcon } from '../components/icons/LockIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { RobotIcon } from '../components/icons/RobotIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { UserIcon } from '../components/icons/UserIcon';
import { FileTextIcon } from '../components/icons/FileTextIcon';
import { JiraIcon } from '../components/icons/JiraIcon';

type Tab = 'upload' | 'jira' | 'manual';

interface GenerateProps {
    onStartGeneration: (data: { files?: File[], text?: string, source: RequirementsData['source'] }) => void;
    processingState: ProcessingState;
    error: string | null;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 sm:px-6 py-3 text-sm font-semibold transition-colors duration-200
            ${active 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-text-secondary hover:text-text-primary'}`}
    >
        {children}
    </button>
);

const exampleText = `Example:
As a user, I want to log into the system so that I can access my dashboard.

Acceptance Criteria:
- User can enter username and password
- System validates credentials
- User is redirected to dashboard on successful login
- Error message shown for invalid credentials`;

export const Generate: React.FC<GenerateProps> = ({ onStartGeneration, processingState, error }) => {
    const [activeTab, setActiveTab] = useState<Tab>('upload');
    const [manualText, setManualText] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isProcessing = processingState !== ProcessingState.IDLE && processingState !== ProcessingState.COMPLETE;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length > 0) {
            setSelectedFiles(files);
        }
    };
    
    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
        if (files.length > 0) {
            setSelectedFiles(files);
        }
    }, []);
    
    const handleSubmit = () => {
        if (isProcessing) return;
        if (activeTab === 'upload' && selectedFiles.length > 0) {
            onStartGeneration({ files: selectedFiles, source: 'Document Upload' });
        } else if (activeTab === 'manual' && manualText.trim()) {
            onStartGeneration({ text: manualText, source: 'Manual Entry' });
        }
    };

    const isGenerateDisabled = isProcessing ||
        (activeTab === 'upload' && selectedFiles.length === 0) ||
        (activeTab === 'manual' && !manualText.trim()) ||
        (activeTab === 'jira');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'upload':
                return (
                     <div 
                        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary-light' : 'border-border-color bg-background'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <UploadIcon className="w-12 h-12 mx-auto text-text-secondary" />
                        <h3 className="mt-4 text-lg font-semibold text-text-primary">Upload requirements documents</h3>
                        <p className="mt-1 text-sm text-text-secondary">Supported formats: PDF, DOC, DOCX, TXT</p>
                        <p className="mt-4 text-sm text-text-secondary">or</p>
                        <button
                            type="button"
                            className="mt-4 px-4 py-2 text-sm font-medium rounded-md text-text-primary bg-surface border border-border-color hover:bg-gray-50"
                        >
                            Browse Files
                        </button>
                    </div>
                );
            case 'jira':
                return (
                    <div className="p-6 text-center">
                        <FileTextIcon className="w-12 h-12 mx-auto text-text-secondary" />
                        <h3 className="mt-4 text-lg font-semibold text-text-primary">Jira integration not connected</h3>
                        <p className="mt-1 text-sm text-text-secondary max-w-xs mx-auto">Connect to Jira first to import tickets from your projects.</p>
                        <button
                            type="button"
                            className="mt-6 px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover"
                        >
                            Connect Jira
                        </button>
                    </div>
                );
            case 'manual':
                return (
                    <div className="p-2">
                        <h3 className="text-lg font-semibold text-text-primary">Enter Requirements Manually</h3>
                        <p className="mt-1 text-sm text-text-secondary">Paste or type your requirements, user stories, or acceptance criteria.</p>
                        <textarea
                            value={manualText}
                            onChange={(e) => setManualText(e.target.value)}
                            rows={10}
                            disabled={isProcessing}
                            className="mt-4 bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-3.5 disabled:opacity-50"
                            placeholder={exampleText}
                        />
                    </div>
                );
        }
    };
    
    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Generate Test Cases</h1>
                    <p className="mt-1 text-text-secondary">Choose your preferred method to provide requirements for AI-powered test case generation.</p>
                </div>
                <div className="px-3 py-1 text-sm font-medium rounded-full bg-surface border border-border-color text-text-secondary">
                    Step <span className="font-semibold text-text-primary">1</span> of 5
                </div>
            </div>

            {error && (
                <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            )}

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 bg-surface rounded-2xl border border-border-color p-8 shadow-sm">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-light">
                            <RobotIcon className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-text-primary">What would you like to generate test cases from?</h2>
                        <p className="mt-1 text-text-secondary">Choose your preferred method to provide requirements for AI-powered test case generation.</p>
                    </div>

                    <div className="mt-8 border-b border-border-color">
                        <nav className="-mb-px flex justify-center space-x-4 sm:space-x-8" aria-label="Tabs">
                            <TabButton active={activeTab === 'upload'} onClick={() => setActiveTab('upload')}>Upload Document</TabButton>
                            <TabButton active={activeTab === 'jira'} onClick={() => setActiveTab('jira')}>From Jira</TabButton>
                            <TabButton active={activeTab === 'manual'} onClick={() => setActiveTab('manual')}>Manual Entry</TabButton>
                        </nav>
                    </div>

                    <div className="mt-8 min-h-[20rem] flex flex-col justify-center">
                       {renderTabContent()}
                    </div>
                     {activeTab === 'upload' && selectedFiles.length > 0 && (
                        <div className="mt-4 text-sm text-text-secondary">
                            <p className="font-medium text-text-primary">Selected Files:</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                {selectedFiles.map(file => <li key={file.name}>{file.name} ({Math.round(file.size / 1024)} KB)</li>)}
                            </ul>
                        </div>
                    )}


                    <div className="mt-8 pt-6 border-t border-border-color flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={isGenerateDisabled}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {processingState === ProcessingState.PARSING ? 'Parsing Document...' : 'Processing...'}
                                </>
                            ) : (
                                <>
                                <RobotIcon className="w-5 h-5 mr-3" />
                                Generate Test Cases
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="bg-surface border border-border-color rounded-2xl p-6 lg:sticky lg:top-8">
                    <h3 className="text-lg font-semibold text-text-primary">Compliance We Follow</h3>
                    <p className="text-sm text-text-secondary mt-1">Our platform adheres to healthcare and data protection standards.</p>
                    <ul className="mt-6 space-y-5">
                        <li className="flex items-start">
                            <ShieldCheckIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                            <div className="ml-3">
                                <h4 className="text-sm font-medium text-text-primary">ISO 13485</h4>
                                <p className="text-sm text-text-secondary">Medical devices QMS</p>
                            </div>
                        </li>
                         <li className="flex items-start">
                            <UserIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                            <div className="ml-3">
                                <h4 className="text-sm font-medium text-text-primary">HIPAA</h4>
                                <p className="text-sm text-text-secondary">Healthcare data privacy</p>
                            </div>
                        </li>
                         <li className="flex items-start">
                            <LockIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                            <div className="ml-3">
                                <h4 className="text-sm font-medium text-text-primary">GDPR</h4>
                                <p className="text-sm text-text-secondary">Data protection regulation</p>
                            </div>
                        </li>
                    </ul>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-status-gray text-text-gray">FDA</span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-status-gray text-text-gray">IEC 62304</span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-status-gray text-text-gray">CLIA</span>
                    </div>
                </div>
            </div>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,.xml,.doc,.docx" onChange={handleFileChange} className="hidden" />
        </div>
    );
};