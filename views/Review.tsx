import React, { useState, useEffect } from 'react';
import { RequirementsData, AIAnalysis, ProcessingState } from '../types';
import { analyzeRequirements } from '../services/geminiService';
import { LinkIcon } from '../components/icons/LinkIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';

interface ReviewProps {
    requirements: RequirementsData;
    onApprove: () => void;
    onGoBack: () => void;
    processingState: ProcessingState;
    error: string | null;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export const Review: React.FC<ReviewProps> = ({ requirements, onApprove, onGoBack, processingState, error }) => {
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(true);

    useEffect(() => {
        const getAnalysis = async () => {
            setIsAnalyzing(true);
            setAnalysisError(null);
            try {
                const result = await analyzeRequirements(requirements.text);
                setAnalysis(result);
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'Failed to analyze requirements.';
                setAnalysisError(errorMessage);
            } finally {
                setIsAnalyzing(false);
            }
        };
        getAnalysis();
    }, [requirements.text]);

    const isGenerating = processingState === ProcessingState.GENERATING;

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-text-primary">Review Requirements</h1>
            <p className="mt-2 text-text-secondary">Review the requirements and AI analysis before generating test cases.</p>
            
            {error && (
                <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                    <strong className="font-bold">Generation Error: </strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Original Requirements Card */}
                <div className="bg-surface border border-border-color rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-text-primary">Original Requirements</h2>
                    {requirements.fileName && <p className="text-sm text-text-secondary mt-1">Uploaded file: {requirements.fileName}</p>}
                    <div className="mt-4 prose prose-sm max-w-none text-text-secondary max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-sans">{requirements.text}</pre>
                    </div>
                </div>

                {/* AI Analysis Card */}
                <div className="bg-surface border border-border-color rounded-lg p-6">
                    <div className="flex justify-between items-center">
                         <h2 className="text-lg font-semibold text-text-primary">AI Analysis</h2>
                         <button className="px-3 py-1 text-xs font-medium rounded-full border border-border-color text-text-secondary bg-surface hover:bg-gray-50">Preview</button>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">AI-powered summary and test case estimation.</p>

                    {isAnalyzing ? <div className="h-64"><LoadingSpinner/></div> : analysisError ? (
                         <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-lg">
                            <h4 className="font-semibold">Analysis Failed</h4>
                            <p className="text-sm">{analysisError}</p>
                        </div>
                    ) : analysis && (
                        <div className="mt-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Summary</h3>
                                <p className="mt-2 text-sm text-text-primary">{analysis.summary}</p>
                            </div>
                             <div>
                                <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Test Case Categories</h3>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {analysis.testCaseCategories.map(cat => (
                                        <span key={cat} className="px-3 py-1 text-sm font-medium rounded-full bg-status-gray text-text-gray">{cat}</span>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Estimated Test Cases</h3>
                                <p className="mt-1 text-4xl font-bold text-text-primary">{analysis.estimatedTestCases}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 bg-gray-50 border border-border-color rounded-lg p-4 flex items-center">
                <div className="flex-shrink-0 bg-gray-200 h-10 w-10 rounded-lg flex items-center justify-center">
                    <LinkIcon className="h-5 w-5 text-text-secondary"/>
                </div>
                <div className="ml-4">
                    <h3 className="text-sm font-semibold text-text-primary">Automatic Traceability Matrix</h3>
                    <p className="text-sm text-text-secondary">A traceability matrix will be automatically generated, linking each requirement to its corresponding test cases. This ensures complete requirement coverage and easy tracking.</p>
                </div>
            </div>
            
            <div className="mt-8 flex justify-end items-center gap-4">
                <button 
                    onClick={onGoBack}
                    disabled={isGenerating}
                    className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-text-primary bg-white border border-border-color rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 disabled:opacity-50"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Go Back
                </button>
                 <button 
                    onClick={onApprove}
                    disabled={isGenerating || isAnalyzing || !!analysisError}
                    className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 focus:ring-4 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                        </>
                    ) : (
                         <>
                         <CheckIcon className="w-5 h-5 mr-2" />
                         Approve and Generate
                         </>
                    )}
                </button>
            </div>
        </div>
    );
};
