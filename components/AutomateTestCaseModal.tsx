import React, { useState, useEffect, useRef } from 'react';
import { TestCase } from '../types';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { automateTestCase } from '../services/geminiService';
import { XIcon } from './icons/XIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { CodeIcon } from './icons/CodeIcon';
import { CopyIcon } from './icons/CopyIcon';

interface AutomateTestCaseModalProps {
    testCase: TestCase;
    onClose: () => void;
}

export const AutomateTestCaseModal: React.FC<AutomateTestCaseModalProps> = ({ testCase, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(modalRef, onClose);

    const [script, setScript] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const generateScript = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await automateTestCase(testCase);
                setScript(result);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to generate script.');
            } finally {
                setIsLoading(false);
            }
        };
        generateScript();
    }, [testCase]);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div ref={modalRef} className="bg-surface rounded-lg shadow-xl w-full max-w-2xl transform transition-all" role="dialog">
                <div className="p-6 border-b border-border-color flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
                            <CodeIcon className="w-6 h-6" />
                            Codeless Automation Script
                        </h2>
                        <p className="text-sm text-text-secondary mt-1 font-mono">{testCase.id} - {testCase.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full hover:bg-gray-100" aria-label="Close">
                        <XIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="relative bg-gray-800 text-white font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto">
                        {isLoading && <div className="flex items-center justify-center h-full"><LoaderIcon className="w-8 h-8"/></div>}
                        {error && <div className="text-red-400">Error: {error}</div>}
                        {!isLoading && !error && <pre><code>{script}</code></pre>}
                        
                        <button 
                            onClick={handleCopy}
                            disabled={!script}
                            className="absolute top-3 right-3 flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-xs px-3 py-1.5 rounded-md transition-colors"
                        >
                            {copied ? <><CopyIcon className="w-4 h-4 text-green-400"/> Copied!</> : <><CopyIcon className="w-4 h-4"/> Copy</>}
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-border-color rounded-b-lg flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-white border border-border-color rounded-md hover:bg-gray-50">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
