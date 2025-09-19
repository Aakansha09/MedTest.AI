import React, { useState, useEffect } from 'react';
import { TestCase, View } from '../types';
import { improveTestCase } from '../services/geminiService';
import { ArrowLeftIcon } from '../components/icons/ArrowLeftIcon';
import { MagicWandIcon } from '../components/icons/MagicWandIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { LoaderIcon } from '../components/icons/LoaderIcon';

interface ImproveProps {
    testCase: TestCase | null;
    onTestCaseImproved: (updatedTC: TestCase) => void;
    setActiveView: (view: View) => void;
}

const formatTestCaseForDisplay = (tc: TestCase): string => {
    return `Title: ${tc.title}\nDescription: ${tc.description}\nPriority: ${tc.priority}\n\nSteps:\n${tc.steps.join('\n')}\n\nExpected Outcome:\n${tc.expectedOutcome}`;
};

export const Improve: React.FC<ImproveProps> = ({ testCase, onTestCaseImproved, setActiveView }) => {
    const [originalText, setOriginalText] = useState('');
    const [improvedText, setImprovedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (testCase) {
            setOriginalText(formatTestCaseForDisplay(testCase));
        }
    }, [testCase]);

    const handleImprove = async () => {
        if (!testCase) return;
        setIsLoading(true);
        setError(null);
        setImprovedText('');
        try {
            const improved = await improveTestCase(testCase);
            setImprovedText(formatTestCaseForDisplay(improved));
            // Automatically save the improved test case
            onTestCaseImproved(improved);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to improve test case.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!testCase) {
        return (
            <div className="text-center py-12">
                <MagicWandIcon className="mx-auto h-12 w-12 text-text-secondary" />
                <h3 className="mt-2 text-lg font-medium text-text-primary">Improve Test Case</h3>
                <p className="mt-1 text-sm text-text-secondary">Navigate from the 'Generated Test Cases' page and select 'Improve' on a test case to get started.</p>
                <button
                    onClick={() => setActiveView('test-cases')}
                    className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Test Cases
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <button onClick={() => setActiveView('test-cases')} className="flex items-center text-sm font-medium text-text-secondary hover:text-text-primary mb-4">
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back to Test Cases
                </button>
                <h1 className="text-3xl font-bold text-text-primary">Improve Test Case</h1>
                <p className="mt-1 text-text-secondary">Refactor an existing test case for better clarity, maintainability, and parameterization using AI.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface border border-border-color rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-text-primary">Original Test Case</h2>
                    <p className="text-sm text-text-secondary font-mono mb-4">{testCase.id}</p>
                    <textarea
                        readOnly
                        value={originalText}
                        className="w-full h-96 bg-background border-none rounded-md p-4 text-sm font-mono text-text-secondary"
                    />
                </div>
                <div className="bg-surface border border-border-color rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-primary" />
                        AI-Improved Version
                    </h2>
                    <p className="text-sm text-text-secondary mb-4">AI will focus on clarity and parameterization.</p>
                    <div className="w-full h-96 bg-background rounded-md p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <LoaderIcon className="w-8 h-8 text-primary" />
                            </div>
                        ) : error ? (
                            <div className="text-red-600">{error}</div>
                        ) : (
                            <textarea
                                readOnly
                                value={improvedText}
                                placeholder="Click 'Improve with AI' to see the result here..."
                                className="w-full h-full bg-transparent border-none text-sm font-mono text-text-primary placeholder-text-secondary"
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleImprove}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <LoaderIcon className="w-5 h-5 mr-3" />
                            Improving...
                        </>
                    ) : (
                        <>
                            <MagicWandIcon className="w-5 h-5 mr-3" />
                            Improve with AI
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
