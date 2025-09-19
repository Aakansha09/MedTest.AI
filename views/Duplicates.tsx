import React, { useState, useEffect } from 'react';
import { TestCase } from '../types';
import { detectDuplicateTestCases } from '../services/geminiService';
import { DuplicatePairResponse, DuplicatePairViewData } from '../types';
import { LoaderIcon } from '../components/icons/LoaderIcon';
import { CopyIcon } from '../components/icons/CopyIcon';
import { XIcon } from '../components/icons/XIcon';
import { CheckIcon } from '../components/icons/CheckIcon';

interface DuplicatesProps {
    testCases: TestCase[];
    setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>;
}

const DuplicatePairCard: React.FC<{
    pair: DuplicatePairViewData,
    onDismiss: (pairId: string) => void,
    onMerge: (idToKeep: string, idToRemove: string) => void
}> = ({ pair, onDismiss, onMerge }) => (
    <div className="bg-surface border border-border-color rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-border-color flex justify-between items-center">
            <div>
                <h3 className="font-semibold text-text-primary">Potential Duplicate Found</h3>
                <p className="text-sm text-text-secondary">Similarity Score: <span className="font-bold text-primary">{pair.similarity}%</span></p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onDismiss(pair.id)} className="p-2 text-sm font-medium text-text-secondary hover:bg-gray-200 rounded-md">Dismiss</button>
                <button onClick={() => onMerge(pair.testCase1.id, pair.testCase2.id)} className="px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md">Merge</button>
            </div>
        </div>
        <div className="p-4 bg-amber-50 text-amber-800 text-sm">
            <strong>AI Rationale:</strong> {pair.rationale}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-color">
            {[pair.testCase1, pair.testCase2].map(tc => (
                <div key={tc.id} className="p-4 bg-surface">
                    <h4 className="font-bold text-text-primary">{tc.title}</h4>
                    <p className="text-xs text-text-secondary font-mono mb-2">{tc.id}</p>
                    <p className="text-sm text-text-secondary mb-3">{tc.description}</p>
                    <div className="text-xs space-y-1">
                        {tc.steps.map((step, i) => <p key={i}>{step}</p>)}
                    </div>
                </div>
            ))}
        </div>
    </div>
);


export const Duplicates: React.FC<DuplicatesProps> = ({ testCases, setTestCases }) => {
    const [duplicates, setDuplicates] = useState<DuplicatePairViewData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const findDuplicates = async () => {
            if (testCases.length < 2) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const results: DuplicatePairResponse[] = await detectDuplicateTestCases(testCases);
                const testCaseMap = new Map(testCases.map(tc => [tc.id, tc]));
                
                const viewData = results
                    .map(res => {
                        const tc1 = testCaseMap.get(res.testCase1Id);
                        const tc2 = testCaseMap.get(res.testCase2Id);
                        if (tc1 && tc2) {
                            return { id: res.id, testCase1: tc1, testCase2: tc2, similarity: res.similarity, rationale: res.rationale };
                        }
                        return null;
                    })
                    .filter((item): item is DuplicatePairViewData => item !== null);

                setDuplicates(viewData);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        findDuplicates();
    }, [testCases]);
    
    const handleDismiss = (pairId: string) => {
        setDuplicates(prev => prev.filter(p => p.id !== pairId));
    };

    const handleMerge = (idToKeep: string, idToRemove: string) => {
        // Here we just remove the second test case for simplicity
        setTestCases(prev => prev.filter(tc => tc.id !== idToRemove));
        // And dismiss the card
        handleDismiss(`${idToKeep}-${idToRemove}`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Detect Duplicate Test Cases</h1>
                <p className="mt-1 text-text-secondary">Review and resolve potential duplicate test cases identified by AI to streamline your test suites.</p>
            </div>
            
            {isLoading && (
                <div className="text-center py-20">
                    <LoaderIcon className="w-12 h-12 mx-auto text-primary mb-4" />
                    <h2 className="text-lg font-semibold text-text-primary">Analyzing Repository...</h2>
                    <p className="text-text-secondary">AI is scanning for similar test cases. This may take a moment.</p>
                </div>
            )}

            {!isLoading && error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-md">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {!isLoading && !error && duplicates.length === 0 && (
                <div className="text-center py-20 bg-surface border border-border-color rounded-lg">
                    <CheckIcon className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <h2 className="text-lg font-semibold text-text-primary">No Duplicates Found</h2>
                    <p className="text-text-secondary">Our AI analysis didn't find any significant duplicates in your repository.</p>
                </div>
            )}

            {!isLoading && !error && duplicates.length > 0 && (
                <div className="space-y-6">
                    {duplicates.map(pair => (
                        <DuplicatePairCard 
                            key={pair.id} 
                            pair={pair} 
                            onDismiss={handleDismiss}
                            onMerge={handleMerge}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
