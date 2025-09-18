import React from 'react';
import { GenerationProgress } from '../types';
import { RobotIcon } from '../components/icons/RobotIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';

interface ProcessingProps {
    progress: GenerationProgress | null;
}

const steps = [
  'Analyzing Requirements',
  'Extracting Requirements',
  'Generating Test Cases',
  'Building Traceability',
  'Preparing Reports',
];

const StepItem: React.FC<{
    label: string;
    status: 'Completed' | 'Processing' | 'Pending';
}> = ({ label, status }) => {
    
    const getIcon = () => {
        switch(status) {
            case 'Completed': return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
            case 'Processing': return <SparklesIcon className="w-6 h-6 text-primary animate-pulse" />;
            case 'Pending': return <div className="w-6 h-6 flex items-center justify-center"><div className="w-3 h-3 border-2 border-gray-300 rounded-full"></div></div>;
        }
    };
    
    const getStatusPill = () => {
         switch(status) {
            case 'Completed': return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-status-green text-text-green">Completed</span>;
            case 'Processing': return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-800 text-white">Processing...</span>;
            case 'Pending': return <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-status-gray text-text-gray">Pending</span>;
        }
    };

    const getDescription = () => {
        switch(label) {
            case 'Analyzing Requirements': return 'Parsing and understanding requirement structure.';
            case 'Extracting Requirements': return 'Identifying and isolating individual requirements.';
            case 'Generating Test Cases': return 'Creating comprehensive test scenarios using AI.';
            case 'Building Traceability': return 'Linking test cases back to source requirements.';
            case 'Preparing Reports': return 'Finalizing outputs and compiling data.';
            default: return 'Waiting for previous steps to complete.';
        }
    }

    return (
        <div className={`p-4 rounded-lg border flex items-center justify-between transition-all duration-300 ${status === 'Processing' ? 'bg-surface border-primary shadow-lg' : 'bg-gray-50 border-border-color'}`}>
            <div className="flex items-center gap-4">
                {getIcon()}
                <div>
                    <h3 className={`font-semibold ${status === 'Processing' ? 'text-primary' : 'text-text-primary'}`}>{label}</h3>
                    <p className="text-sm text-text-secondary">{getDescription()}</p>
                </div>
            </div>
            {getStatusPill()}
        </div>
    );
}

export const Processing: React.FC<ProcessingProps> = ({ progress }) => {
    if (!progress) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <RobotIcon className="w-20 h-20 text-text-secondary mb-4" />
                <h1 className="text-3xl font-bold text-text-primary mb-2">Preparing Generation</h1>
                <p className="text-text-secondary max-w-md">Please wait while we initialize the AI analysis process. This may take a few moments.</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-3xl mx-auto text-center">
            <RobotIcon className="w-16 h-16 text-primary mb-4 inline-block" />
            <h1 className="text-3xl font-bold text-text-primary">AI is Generating Your Test Cases</h1>
            <p className="mt-2 text-text-secondary max-w-lg mx-auto">Please wait while our AI analyzes your requirements and creates comprehensive test cases. This may take a few moments.</p>
            
            <div className="mt-8 text-left space-y-6">
                <div className="w-full">
                    <div className="flex justify-between mb-1">
                        <span className="text-base font-medium text-text-secondary">Progress</span>
                        <span className="text-sm font-medium text-text-secondary">{progress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{width: `${progress.progress}%`}}></div>
                    </div>
                </div>

                <div className="space-y-3">
                    {steps.map((label, index) => (
                        <StepItem 
                            key={label} 
                            label={label} 
                            status={progress.step > index ? 'Completed' : progress.step === index ? 'Processing' : 'Pending'} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
