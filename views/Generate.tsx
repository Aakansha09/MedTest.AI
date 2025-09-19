import React, { useState } from 'react';
import { JiraConfig, ProcessingState, RequirementsData, View } from '../types';
import { LockIcon } from '../components/icons/LockIcon';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { RobotIcon } from '../components/icons/RobotIcon';
import { UserIcon } from '../components/icons/UserIcon';
import { JiraIcon } from '../components/icons/JiraIcon';
import { JiraImportTab } from '../components/JiraImportTab';
import { FileUpload } from '../components/FileUpload';
import { UploadIcon } from '../components/icons/UploadIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { ApiIcon } from '../components/icons/ApiIcon';

type Tab = 'upload' | 'jira' | 'manual' | 'api';

interface GenerateProps {
    onStartGeneration: (data: { files?: File[], text?: string, source: RequirementsData['source'] }) => void;
    processingState: ProcessingState;
    error: string | null;
    jiraConfig: JiraConfig | null;
    setActiveView: (view: View) => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode; }> = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-semibold transition-colors duration-200
            ${active 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-text-secondary hover:text-text-primary'}`}
    >
        {icon}
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

const exampleApiSpec = `openapi: 3.0.0
info:
  title: Simple Patient API
  version: 1.0.0
paths:
  /patients:
    get:
      summary: Returns a list of patients.
      responses:
        '200':
          description: A JSON array of patient objects.
`;

export const Generate: React.FC<GenerateProps> = ({ onStartGeneration, processingState, error, jiraConfig, setActiveView }) => {
    const [activeTab, setActiveTab] = useState<Tab>('upload');
    const [manualText, setManualText] = useState('');
    const [jiraText, setJiraText] = useState('');
    const [apiSpecText, setApiSpecText] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const isProcessing = processingState !== ProcessingState.IDLE && processingState !== ProcessingState.COMPLETE;
    
    const handleSubmit = () => {
        if (isProcessing) return;
        if (activeTab === 'upload' && selectedFiles.length > 0) {
            onStartGeneration({ files: selectedFiles, source: 'Document Upload' });
        } else if (activeTab === 'manual' && manualText.trim()) {
            onStartGeneration({ text: manualText, source: 'Manual Entry' });
        } else if (activeTab === 'jira' && jiraText.trim()) {
            onStartGeneration({ text: jiraText, source: 'Jira' });
        } else if (activeTab === 'api' && apiSpecText.trim()) {
            onStartGeneration({ text: apiSpecText, source: 'API Spec' });
        }
    };

    const isGenerateDisabled = isProcessing ||
        (activeTab === 'upload' && selectedFiles.length === 0) ||
        (activeTab === 'manual' && !manualText.trim()) ||
        (activeTab === 'jira' && !jiraText.trim()) ||
        (activeTab === 'api' && !apiSpecText.trim());

    const renderTabContent = () => {
        switch (activeTab) {
            case 'upload':
                return (
                     <FileUpload 
                        onFilesSelected={setSelectedFiles}
                        processing={isProcessing}
                     />
                );
            case 'jira':
                 if (!jiraConfig?.connected) {
                    return (
                        <div className="p-6 text-center">
                            <JiraIcon className="w-12 h-12 mx-auto text-text-secondary" />
                            <h3 className="mt-4 text-lg font-semibold text-text-primary">Jira integration not connected</h3>
                            <p className="mt-1 text-sm text-text-secondary max-w-xs mx-auto">Connect to Jira first to import tickets from your projects.</p>
                            <button
                                type="button"
                                onClick={() => setActiveView('integrations')}
                                className="mt-6 px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-hover"
                            >
                                Connect Jira
                            </button>
                        </div>
                    );
                }
                return <JiraImportTab config={jiraConfig} onTextExtracted={setJiraText} />;
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
            case 'api':
                return (
                    <div className="p-2">
                        <h3 className="text-lg font-semibold text-text-primary">Paste API Specification</h3>
                        <p className="mt-1 text-sm text-text-secondary">Paste your OpenAPI (v3) or Swagger (v2) specification in JSON or YAML format.</p>
                        <textarea
                            value={apiSpecText}
                            onChange={(e) => setApiSpecText(e.target.value)}
                            rows={10}
                            disabled={isProcessing}
                            className="mt-4 bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-3.5 disabled:opacity-50 font-mono"
                            placeholder={exampleApiSpec}
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
                        <nav className="-mb-px flex justify-center space-x-2 sm:space-x-8" aria-label="Tabs">
                            <TabButton active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} icon={<UploadIcon className="w-5 h-5"/>}>Upload Document</TabButton>
                            <TabButton active={activeTab === 'jira'} onClick={() => setActiveTab('jira')} icon={<JiraIcon className="w-5 h-5"/>}>From Jira</TabButton>
                            <TabButton active={activeTab === 'manual'} onClick={() => setActiveTab('manual')} icon={<PencilIcon className="w-5 h-5"/>}>Manual Entry</TabButton>
                             <TabButton active={activeTab === 'api'} onClick={() => setActiveTab('api')} icon={<ApiIcon className="w-5 h-5"/>}>From API Spec</TabButton>
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
        </div>
    );
};