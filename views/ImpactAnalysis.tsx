import React, { useState, useMemo } from 'react';
import { TestCase, ImpactAnalysisResult, RecommendedPriority, ImpactSuggestion } from '../types';
import { analyzeTestImpact, healTestCase } from '../services/geminiService';
import { LoaderIcon } from '../components/icons/LoaderIcon';
import { CrosshairsIcon } from '../components/icons/CrosshairsIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { JiraIcon } from '../components/icons/JiraIcon';
import { CodeIcon } from '../components/icons/CodeIcon';
import { GitHubIcon } from '../components/icons/GitHubIcon';
import { MagicWandIcon } from '../components/icons/MagicWandIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { BarChartIcon } from '../components/icons/BarChartIcon';

interface ImpactAnalysisProps {
    testCases: TestCase[];
    onUpdateTestCase: (updatedTestCase: TestCase) => void;
}

type InputType = 'manual' | 'jira' | 'github';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode; }> = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors duration-200
            ${active 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-text-secondary hover:text-text-primary'}`}
    >
        {icon}
        {children}
    </button>
);

const priorityStyles: Record<RecommendedPriority, string> = {
    'P0': 'bg-red-100 text-red-800 ring-red-200',
    'P1': 'bg-amber-100 text-amber-800 ring-amber-200',
    'P2': 'bg-blue-100 text-blue-800 ring-blue-200',
};

const suggestionStyles: Record<ImpactSuggestion, string> = {
    'Run as-is': 'bg-green-100 text-green-800 ring-green-200',
    'Review recommended': 'bg-yellow-100 text-yellow-800 ring-yellow-200',
    'Update required': 'bg-orange-100 text-orange-800 ring-orange-200',
    'Potentially obsolete': 'bg-gray-200 text-gray-800 ring-gray-300',
};

export const ImpactAnalysis: React.FC<ImpactAnalysisProps> = ({ testCases, onUpdateTestCase }) => {
    const [inputType, setInputType] = useState<InputType>('manual');
    const [changesText, setChangesText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ImpactAnalysisResult[] | null>(null);
    const [healingState, setHealingState] = useState<Record<string, 'healing' | 'healed'>>({});


    const handleAnalyze = async () => {
        if (!changesText.trim()) return;
        setIsLoading(true);
        setError(null);
        setResults(null);
        setHealingState({}); // Reset healing states on new analysis
        try {
            const analysis = await analyzeTestImpact(changesText, testCases);
            const testCaseMap = new Map(testCases.map(tc => [tc.id, tc]));
            
            const viewResults: ImpactAnalysisResult[] = analysis
                .map(res => {
                    const testCase = testCaseMap.get(res.testCaseId);
                    if (testCase) {
                        return {
                            testCase,
                            rationale: res.rationale,
                            recommendedPriority: res.recommendedPriority,
                            suggestion: res.suggestion,
                        };
                    }
                    return null;
                })
                .filter((item): item is ImpactAnalysisResult => item !== null)
                .sort((a, b) => {
                    const priorityA = parseInt(a.recommendedPriority.substring(1));
                    const priorityB = parseInt(b.recommendedPriority.substring(1));
                    return priorityA - priorityB;
                });

            setResults(viewResults);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleHealClick = async (result: ImpactAnalysisResult) => {
        setHealingState(prev => ({ ...prev, [result.testCase.id]: 'healing' }));
        try {
            const updatedFields = await healTestCase(result.testCase, changesText, result.rationale);
            const updatedTestCase = { ...result.testCase, ...updatedFields };
            onUpdateTestCase(updatedTestCase);
            setHealingState(prev => ({ ...prev, [result.testCase.id]: 'healed' }));
        } catch (e) {
            console.error("Auto-heal failed:", e);
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during auto-healing.";
            setError(`Failed to auto-heal ${result.testCase.id}: ${errorMessage}`);
            setHealingState(prev => {
                const newState = { ...prev };
                delete newState[result.testCase.id];
                return newState;
            });
        }
    };

    const placeholderText = useMemo(() => {
        if (inputType === 'manual') {
             return 'Paste code diffs, commit messages, or a summary of technical changes...\n\nExample:\n- Modified the user authentication service to use JWT.\n- Added a new endpoint /api/users/profile.\n- Refactored the database connection pool.';
        }
        if (inputType === 'jira') {
             return 'Paste Jira ticket summaries, keys, or user stories for the release...\n\nExample:\n[MED-123] As a doctor, I need to see patient allergies on the dashboard.\n[MED-125] Fix bug where prescription renewal fails for patients over 90.';
        }
        if (inputType === 'github') {
            return 'Paste a GitHub Pull Request URL...\n\nExample:\nhttps://github.com/your-org/your-repo/pull/123';
        }
        return '';
    }, [inputType]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Test Impact Analysis</h1>
                <p className="mt-1 text-text-secondary">Identify and prioritize which existing test cases to run based on recent changes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="bg-surface border border-border-color rounded-lg p-6 lg:col-span-2">
                     <div className="border-b border-border-color">
                        <nav className="-mb-px flex justify-start space-x-4" aria-label="Tabs">
                            <TabButton active={inputType === 'manual'} onClick={() => setInputType('manual')} icon={<CodeIcon className="w-5 h-5"/>}>Manual / Code Diff</TabButton>
                            <TabButton active={inputType === 'jira'} onClick={() => setInputType('jira')} icon={<JiraIcon className="w-5 h-5"/>}>From Jira Release</TabButton>
                            <TabButton active={inputType === 'github'} onClick={() => setInputType('github')} icon={<GitHubIcon className="w-5 h-5"/>}>From GitHub PR</TabButton>
                        </nav>
                    </div>
                    <div className="mt-6">
                        <label htmlFor="changes-input" className="block text-sm font-medium text-text-primary mb-2">
                            {inputType === 'manual' && 'Development Changes'}
                            {inputType === 'jira' && 'Jira Release Content'}
                            {inputType === 'github' && 'GitHub Pull Request URL'}
                        </label>
                        <textarea
                            id="changes-input"
                            value={changesText}
                            onChange={(e) => setChangesText(e.target.value)}
                            rows={10}
                            className="w-full bg-background border border-border-color rounded-md p-4 text-sm font-mono text-text-primary placeholder-text-secondary focus:ring-primary focus:border-primary"
                            placeholder={placeholderText}
                        />
                    </div>
                     <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || !changesText.trim()}
                            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-50"
                        >
                            {isLoading ? <LoaderIcon className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                            {isLoading ? 'Analyzing...' : 'Analyze Impact'}
                        </button>
                    </div>
                </div>

                <div className="bg-surface border border-border-color rounded-lg p-6 lg:sticky lg:top-8">
                  <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <CrosshairsIcon className="w-6 h-6 text-primary" />
                    How It Works
                  </h3>
                  <p className="text-sm text-text-secondary mt-2 mb-6">
                    Our AI analyzes your code changes to predict which tests are most likely to be affected, saving you valuable time.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 bg-primary-light h-8 w-8 rounded-lg flex items-center justify-center">
                        <SparklesIcon className="h-5 w-5 text-primary"/>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-text-primary">Analyze Changes</h4>
                        <p className="text-sm text-text-secondary">Provide code diffs, commit messages, or Jira tickets.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 bg-primary-light h-8 w-8 rounded-lg flex items-center justify-center">
                        <BarChartIcon className="h-5 w-5 text-primary"/>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-text-primary">Get a Prioritized Plan</h4>
                        <p className="text-sm text-text-secondary">Receive a P0, P1, P2 ranked list of tests to run.</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0 bg-primary-light h-8 w-8 rounded-lg flex items-center justify-center">
                        <MagicWandIcon className="h-5 w-5 text-primary"/>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-text-primary">Auto-Heal Broken Tests</h4>
                        <p className="text-sm text-text-secondary">Let AI automatically fix tests that are impacted by the changes.</p>
                      </div>
                    </li>
                  </ul>
                </div>
            </div>

            {error && <div className="p-4 bg-red-100 text-red-700 rounded-md"><strong>Error:</strong> {error}</div>}
            
            {isLoading && (
                <div className="text-center py-20">
                    <LoaderIcon className="w-12 h-12 mx-auto text-primary mb-4" />
                    <h2 className="text-lg font-semibold text-text-primary">Analyzing Changes...</h2>
                    <p className="text-text-secondary">AI is comparing your changes against the test repository to build a plan.</p>
                </div>
            )}

            {!isLoading && results && (
                 <div className="bg-surface border border-border-color rounded-lg">
                    <div className="p-4 border-b border-border-color">
                        <h2 className="text-lg font-semibold text-text-primary">Recommended Test Plan</h2>
                        <p className="text-sm text-text-secondary mt-1">AI has recommended the following {results.length} test cases to run for this change.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border-color">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Rec. Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Test Case</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">AI Suggestion</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">AI Rationale</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-border-color">
                                {results.map(result => {
                                    const currentHealingState = healingState[result.testCase.id];
                                    return (
                                        <tr key={result.testCase.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ring-1 ring-inset ${priorityStyles[result.recommendedPriority]}`}>
                                                    {result.recommendedPriority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-text-primary">{result.testCase.title}</div>
                                                <div className="text-sm text-text-secondary font-mono">{result.testCase.id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ring-1 ring-inset ${suggestionStyles[result.suggestion]}`}>
                                                    {result.suggestion}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-text-secondary max-w-md">{result.rationale}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {currentHealingState === 'healing' ? (
                                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                                        <LoaderIcon className="w-4 h-4" />
                                                        <span>Healing...</span>
                                                    </div>
                                                ) : currentHealingState === 'healed' ? (
                                                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                        <span>Healed</span>
                                                    </div>
                                                ) : (
                                                    result.suggestion === 'Update required' && (
                                                        <button onClick={() => handleHealClick(result)} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover disabled:opacity-50">
                                                            <MagicWandIcon className="w-4 h-4" />
                                                            Auto-Heal
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                 </div>
            )}
            
            {!isLoading && !results && !error && (
                 <div className="text-center py-16 bg-surface border-2 border-dashed border-border-color rounded-lg">
                    <CrosshairsIcon className="mx-auto h-12 w-12 text-text-secondary" />
                    <h3 className="mt-2 text-lg font-medium text-text-primary">Ready for Analysis</h3>
                    <p className="mt-1 text-sm text-text-secondary">Enter your changes above and click "Analyze Impact" to generate a test plan.</p>
                </div>
            )}
        </div>
    );
};
