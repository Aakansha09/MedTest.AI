import React, { useMemo, useState, useRef } from 'react';
import { BulkUpdatePayload, JiraConfig, TestCase, TestCaseStatus, View } from '../types';
import { PlusIcon } from '../components/icons/PlusIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { DotsHorizontalIcon } from '../components/icons/DotsHorizontalIcon';
import { DocumentIcon } from '../components/icons/DocumentIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { BulkEditModal } from '../components/BulkEditModal';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { exportAsCSV, exportAsJSON } from '../utils/exportUtils';
import { JiraIcon } from '../components/icons/JiraIcon';
import { AzureDevOpsIcon } from '../components/icons/AzureDevOpsIcon';
import { PushToJiraModal } from '../components/PushToJiraModal';

interface GeneratedTestCasesProps {
  testCases: TestCase[];
  setActiveView: (view: View) => void;
  onBulkUpdate: (ids: Set<string>, payload: BulkUpdatePayload) => void;
  jiraConfig: JiraConfig | null;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-surface p-4 rounded-lg border border-border-color shadow-sm">
        <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            {icon}
        </div>
        <p className="text-3xl font-bold text-text-primary mt-2">{value}</p>
    </div>
);

const statusPillStyles: Record<TestCaseStatus, string> = {
  Active: 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-200',
  'Under Review': 'bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-200',
  Completed: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200',
  Draft: 'bg-gray-200 text-gray-700 ring-1 ring-inset ring-gray-300',
  Pending: 'bg-gray-200 text-gray-700 ring-1 ring-inset ring-gray-300',
};

const typePillStyles: Record<string, string> = {
    'Functional': 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200',
    'Security': 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200',
    'Performance': 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200',
    'Integration': 'bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-200',
    'Default': 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200'
};

export const GeneratedTestCases: React.FC<GeneratedTestCasesProps> = ({ testCases, setActiveView, onBulkUpdate, jiraConfig }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<TestCaseStatus | 'All Status'>('All Status');
    const [typeFilter, setTypeFilter] = useState('All Types');
    const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPushToJiraModalOpen, setIsPushToJiraModalOpen] = useState(false);
    const [bulkActionType, setBulkActionType] = useState<'status' | 'priority' | 'tags' | null>(null);
    const bulkActionsRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(bulkActionsRef, () => setIsBulkActionsOpen(false));
    
    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(exportRef, () => setIsExportOpen(false));


    const allTypes = useMemo(() => ['All Types', ...Array.from(new Set(testCases.flatMap(tc => tc.tags)))], [testCases]);

    const filteredTestCases = useMemo(() => {
        return testCases.filter(tc => {
            const searchMatch = searchTerm === '' || 
                                tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                tc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                tc.source.toLowerCase().includes(searchTerm.toLowerCase());
            const typeMatch = typeFilter === 'All Types' || tc.tags.includes(typeFilter);
            const statusMatch = statusFilter === 'All Status' || tc.status === statusFilter;
            return searchMatch && typeMatch && statusMatch;
        });
    }, [testCases, searchTerm, typeFilter, statusFilter]);
    
    const stats = useMemo(() => {
        return {
            total: testCases.length,
            active: testCases.filter(tc => tc.status === 'Active').length,
            completed: testCases.filter(tc => tc.status === 'Completed').length,
            underReview: testCases.filter(tc => tc.status === 'Under Review').length,
        };
    }, [testCases]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredTestCases.map(tc => tc.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedIds(newSelection);
    };
    
    const handleOpenBulkEditModal = (action: 'status' | 'priority' | 'tags') => {
        setBulkActionType(action);
        setIsModalOpen(true);
        setIsBulkActionsOpen(false);
    };

    const handleConfirmBulkUpdate = (payload: BulkUpdatePayload) => {
        onBulkUpdate(selectedIds, payload);
        setIsModalOpen(false);
        setBulkActionType(null);
        setSelectedIds(new Set()); // Clear selection after update
    };
    
    const handleExport = (format: 'csv' | 'json') => {
        const selectedTestCases = testCases.filter(tc => selectedIds.has(tc.id));
        if (selectedTestCases.length === 0) {
            alert("Please select at least one test case to export.");
            return;
        }
        if (format === 'csv') {
            exportAsCSV(selectedTestCases);
        } else {
            exportAsJSON(selectedTestCases);
        }
        setIsExportOpen(false);
    };

    const handlePushToJira = () => {
        if (!jiraConfig?.connected) {
            alert("Please connect to Jira in the Integrations page first.");
            setActiveView('integrations');
            return;
        }
        setIsPushToJiraModalOpen(true);
        setIsExportOpen(false);
    };


  return (
    <>
    {isModalOpen && bulkActionType && (
        <BulkEditModal 
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirmBulkUpdate}
            selectedCount={selectedIds.size}
            actionType={bulkActionType}
        />
    )}
    {isPushToJiraModalOpen && jiraConfig && (
        <PushToJiraModal
            onClose={() => setIsPushToJiraModalOpen(false)}
            config={jiraConfig}
            testCasesToPush={testCases.filter(tc => selectedIds.has(tc.id))}
            onComplete={() => {
                setIsPushToJiraModalOpen(false);
                setSelectedIds(new Set());
            }}
        />
    )}
    <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Generated Test Cases</h1>
                <p className="mt-1 text-text-secondary">Manage and review all your AI-generated test cases.</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative" ref={exportRef}>
                    <button
                        onClick={() => setIsExportOpen(prev => !prev)}
                        disabled={selectedIds.size === 0}
                        className="inline-flex items-center justify-center px-4 py-2 border border-border-color text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Export Selected ({selectedIds.size})
                        <ChevronDownIcon className="w-4 h-4 ml-2" />
                    </button>
                    {isExportOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-surface rounded-md shadow-lg border border-border-color z-10">
                            <ul className="py-1">
                                <li className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Download</li>
                                <li><button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100 flex items-center">Download as CSV</button></li>
                                <li><button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100 flex items-center">Download as JSON</button></li>
                                <li className="border-t border-border-color my-1"></li>
                                <li className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase">Push to Integration</li>
                                <li><button onClick={handlePushToJira} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100 flex items-center"><JiraIcon className="w-4 h-4 mr-2" /> Push to Jira</button></li>
                                <li><button onClick={() => alert('Pushing to Azure DevOps... (simulation)')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100 flex items-center"><AzureDevOpsIcon className="w-4 h-4 mr-2" /> Push to Azure DevOps</button></li>
                            </ul>
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => setActiveView('generate')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Generate New Cases
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Cases" value={stats.total} icon={<DocumentIcon className="w-5 h-5 text-gray-400"/>} />
            <StatCard title="Active" value={stats.active} icon={<DocumentIcon className="w-5 h-5 text-green-500"/>} />
            <StatCard title="Completed" value={stats.completed} icon={<DocumentIcon className="w-5 h-5 text-blue-500"/>} />
            <StatCard title="Under Review" value={stats.underReview} icon={<DocumentIcon className="w-5 h-5 text-yellow-500"/>} />
        </div>
        
        <div className="bg-surface border border-border-color rounded-lg shadow-sm">
            <div className="p-4 border-b border-border-color flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-grow sm:flex-grow-0">
                    <div className="relative" ref={bulkActionsRef}>
                        <button
                            onClick={() => setIsBulkActionsOpen(prev => !prev)}
                            disabled={selectedIds.size === 0}
                            className="inline-flex items-center justify-center px-4 py-2.5 border border-border-color text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PencilIcon className="w-4 h-4 mr-2" />
                            Bulk Actions ({selectedIds.size})
                            <ChevronDownIcon className="w-4 h-4 ml-2" />
                        </button>
                        {isBulkActionsOpen && (
                            <div className="absolute top-full mt-2 w-48 bg-surface rounded-md shadow-lg border border-border-color z-10">
                                <ul className="py-1">
                                    <li><button onClick={() => handleOpenBulkEditModal('status')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100">Change Status</button></li>
                                    <li><button onClick={() => handleOpenBulkEditModal('priority')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100">Change Priority</button></li>
                                    <li><button onClick={() => handleOpenBulkEditModal('tags')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-gray-100">Update Tags</button></li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="relative w-full sm:w-64 md:w-80">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon className="w-5 h-5 text-gray-400" /></div>
                        <input type="text" placeholder="Search test cases..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"/>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                        <option value="All Status">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Completed">Completed</option>
                        <option value="Draft">Draft</option>
                    </select>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                       {allTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-color">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={filteredTestCases.length > 0 && selectedIds.size === filteredTestCases.length} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Test Case</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Source</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Compliance</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-border-color">
                        {filteredTestCases.map((tc, index) => (
                            <tr key={tc.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-100`}>
                                <td className="p-4"><input type="checkbox" checked={selectedIds.has(tc.id)} onChange={() => handleSelectOne(tc.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /></td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-text-primary">{tc.title}</div>
                                    <div className="text-sm text-text-secondary">{tc.id}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${typePillStyles[tc.tags[0]] || typePillStyles.Default}`}>{tc.tags[0]}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${statusPillStyles[tc.status]}`}>{tc.status}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{tc.source}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-wrap gap-1">
                                        {tc.compliance.map(c => <span key={c} className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 text-text-secondary ring-1 ring-inset ring-gray-200">{c}</span>)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-gray-400 hover:text-gray-600"><DotsHorizontalIcon className="h-5 w-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredTestCases.length === 0 && <div className="text-center p-8 text-text-secondary">No test cases found.</div>}
            </div>
        </div>
    </div>
    </>
  );
};