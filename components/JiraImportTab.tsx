import React, { useState, useEffect, useMemo } from 'react';
import { JiraConfig, JiraProject, JiraIssue } from '../types';
import { getProjects, getIssuesForProject } from '../services/jiraService';
import { LoaderIcon } from './icons/LoaderIcon';

interface JiraImportTabProps {
    config: JiraConfig;
    onTextExtracted: (text: string) => void;
}

// Function to convert Atlassian Document Format to plain text
const adfToPlainText = (adf: any): string => {
    if (!adf || !adf.content) return '';
    
    let text = '';
    const recurse = (nodes: any[]) => {
        nodes.forEach(node => {
            if (node.type === 'text') {
                text += node.text;
            }
            if (node.content) {
                recurse(node.content);
            }
            // Add newlines for block-level elements
            if (['paragraph', 'heading', 'listItem'].includes(node.type)) {
                text += '\n';
            }
        });
    };
    
    recurse(adf.content);
    return text;
};

export const JiraImportTab: React.FC<JiraImportTabProps> = ({ config, onTextExtracted }) => {
    const [projects, setProjects] = useState<JiraProject[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [issues, setIssues] = useState<JiraIssue[]>([]);
    const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingIssues, setLoadingIssues] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoadingProjects(true);
                setError(null);
                const fetchedProjects = await getProjects(config);
                setProjects(fetchedProjects);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch projects.');
            } finally {
                setLoadingProjects(false);
            }
        };
        fetchProjects();
    }, [config]);

    useEffect(() => {
        if (!selectedProject) {
            setIssues([]);
            return;
        }
        const fetchIssues = async () => {
            try {
                setLoadingIssues(true);
                setError(null);
                const fetchedIssues = await getIssuesForProject(config, selectedProject);
                setIssues(fetchedIssues);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch issues.');
            } finally {
                setLoadingIssues(false);
            }
        };
        fetchIssues();
    }, [selectedProject, config]);

    useEffect(() => {
        const selectedIssuesData = issues.filter(issue => selectedIssues.has(issue.id));
        const combinedText = selectedIssuesData.map(issue => 
            `Issue: ${issue.key}\nSummary: ${issue.fields.summary}\n\nDescription:\n${adfToPlainText(issue.fields.description)}`
        ).join('\n\n---\n\n');
        onTextExtracted(combinedText);
    }, [selectedIssues, issues, onTextExtracted]);

    const handleIssueSelection = (issueId: string) => {
        const newSelection = new Set(selectedIssues);
        if (newSelection.has(issueId)) {
            newSelection.delete(issueId);
        } else {
            newSelection.add(issueId);
        }
        setSelectedIssues(newSelection);
    };

    if (loadingProjects) {
        return <div className="flex items-center justify-center p-8"><LoaderIcon className="w-8 h-8 text-primary" /></div>;
    }

    if (error) {
        return <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="jira-project" className="block text-sm font-medium text-text-primary mb-1">Select Jira Project</label>
                <select
                    id="jira-project"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                >
                    <option value="">-- Select a project --</option>
                    {projects.map(p => <option key={p.id} value={p.key}>{p.name} ({p.key})</option>)}
                </select>
            </div>
            
            {loadingIssues ? (
                <div className="flex items-center justify-center p-8"><LoaderIcon className="w-8 h-8 text-primary" /></div>
            ) : issues.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-text-primary mb-2">Select Issues ({selectedIssues.size} selected)</h4>
                    <div className="max-h-64 overflow-y-auto border border-border-color rounded-lg bg-background p-2 space-y-2">
                        {issues.map(issue => (
                            <label key={issue.id} className="flex items-center p-2 rounded-md hover:bg-gray-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedIssues.has(issue.id)}
                                    onChange={() => handleIssueSelection(issue.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-text-primary">{issue.fields.summary}</p>
                                    <p className="text-xs text-text-secondary">{issue.key} &bull; {issue.fields.issuetype.name}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};