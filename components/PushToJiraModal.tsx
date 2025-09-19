import React, { useState, useEffect, useRef } from 'react';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { JiraConfig, JiraProject, TestCase } from '../types';
import { getProjects, createIssue } from '../services/jiraService';
import { XIcon } from './icons/XIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { JiraIcon } from './icons/JiraIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface PushToJiraModalProps {
    onClose: () => void;
    onComplete: () => void;
    config: JiraConfig;
    testCasesToPush: TestCase[];
}

type PushStatus = 'Idle' | 'InProgress' | 'Complete' | 'Error';

export const PushToJiraModal: React.FC<PushToJiraModalProps> = ({ onClose, onComplete, config, testCasesToPush }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(modalRef, onClose);

    const [projects, setProjects] = useState<JiraProject[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [issueType, setIssueType] = useState('Story');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pushStatus, setPushStatus] = useState<PushStatus>('Idle');
    const [pushProgress, setPushProgress] = useState(0);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                setError(null);
                const fetchedProjects = await getProjects(config);
                setProjects(fetchedProjects);
                if (fetchedProjects.length > 0) {
                    setSelectedProject(fetchedProjects[0].id);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch projects.');
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [config]);

    const handlePush = async () => {
        if (!selectedProject) {
            setError("Please select a project.");
            return;
        }
        setPushStatus('InProgress');
        setError(null);
        setPushProgress(0);

        for (let i = 0; i < testCasesToPush.length; i++) {
            try {
                await createIssue(config, selectedProject, issueType, testCasesToPush[i]);
                setPushProgress(((i + 1) / testCasesToPush.length) * 100);
            } catch (err) {
                setError(`Failed to create issue for ${testCasesToPush[i].id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
                setPushStatus('Error');
                return;
            }
        }
        setPushStatus('Complete');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div ref={modalRef} className="bg-surface rounded-lg shadow-xl w-full max-w-lg" role="dialog">
                <div className="p-4 border-b border-border-color flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2"><JiraIcon className="w-5 h-5"/> Push Test Cases to Jira</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <XIcon className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>
                
                {pushStatus === 'Idle' && (
                    <div className="p-6">
                        <p className="text-sm text-text-secondary mb-4">You are about to push <span className="font-bold text-text-primary">{testCasesToPush.length}</span> test case(s) to Jira.</p>
                        {loading ? (
                            <LoaderIcon className="w-6 h-6 mx-auto text-primary" />
                        ) : error ? (
                            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="jira-project" className="block text-sm font-medium text-text-primary mb-1">Target Project</label>
                                    <select id="jira-project" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.key})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="issue-type" className="block text-sm font-medium text-text-primary mb-1">Issue Type</label>
                                    <select id="issue-type" value={issueType} onChange={(e) => setIssueType(e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                                        <option>Story</option>
                                        <option>Task</option>
                                        <option>Bug</option>
                                        <option>Epic</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {(pushStatus === 'InProgress' || pushStatus === 'Complete' || pushStatus === 'Error') && (
                    <div className="p-6 text-center">
                        {pushStatus === 'InProgress' && <LoaderIcon className="w-10 h-10 mx-auto text-primary mb-4"/>}
                        {pushStatus === 'Complete' && <CheckCircleIcon className="w-10 h-10 mx-auto text-green-500 mb-4"/>}
                        <h3 className="text-lg font-semibold text-text-primary">
                            {pushStatus === 'InProgress' && 'Pushing to Jira...'}
                            {pushStatus === 'Complete' && 'Push Complete!'}
                            {pushStatus === 'Error' && 'An Error Occurred'}
                        </h3>
                        <p className="text-sm text-text-secondary mt-2">
                             {pushStatus === 'Complete' && `Successfully pushed ${testCasesToPush.length} test cases to Jira.`}
                             {pushStatus === 'Error' && error}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                            <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{width: `${pushProgress}%`}}></div>
                        </div>
                    </div>
                )}
                
                <div className="px-6 py-4 bg-gray-50 border-t border-border-color flex justify-end gap-3">
                    {pushStatus === 'Idle' && (
                        <>
                            <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-text-primary bg-white border border-border-color rounded-md hover:bg-gray-50">Cancel</button>
                            <button onClick={handlePush} disabled={loading || !selectedProject} type="button" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm disabled:opacity-50">Confirm Push</button>
                        </>
                    )}
                     {(pushStatus === 'Complete' || pushStatus === 'Error') && (
                         <button onClick={onComplete} type="button" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm">Close</button>
                    )}
                </div>
            </div>
        </div>
    );
};
