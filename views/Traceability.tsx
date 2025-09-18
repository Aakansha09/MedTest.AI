import React, { useMemo, useState, useEffect } from 'react';
import { TestCase, View, RequirementTraceability, RequirementStatus, Requirement, TestCasePriority } from '../types';
import { LinkIcon } from '../components/icons/LinkIcon';
import { InfoIcon } from '../components/icons/InfoIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { FileIcon } from '../components/icons/FileIcon';
import { WarningIcon } from '../components/icons/WarningIcon';
import { DonutChart } from '../components/DonutChart';
import { SearchIcon } from '../components/icons/SearchIcon';
import { exportTraceabilityMatrixCSV } from '../utils/exportUtils';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { ExternalLinkIcon } from '../components/icons/ExternalLinkIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-surface p-6 rounded-lg border border-border-color">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-md font-medium text-text-secondary">{title}</p>
                <p className="text-4xl font-bold text-text-primary mt-2">{value}</p>
            </div>
            <div className="text-text-secondary">
                {icon}
            </div>
        </div>
    </div>
);

const statusPillStyles: Record<RequirementStatus, string> = {
    'Covered': 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200',
    'Partial': 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200',
    'Not Covered': 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-200',
};

const priorityPillStyles: Record<TestCasePriority, string> = {
    'Critical': 'bg-red-100 text-red-800',
    'High': 'bg-orange-100 text-orange-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-gray-100 text-gray-800',
};

const modulePillStyles: Record<string, string> = {
    'Authentication': 'bg-blue-100 text-blue-800',
    'Data Security': 'bg-indigo-100 text-indigo-800',
    'Compliance': 'bg-rose-100 text-rose-800',
    'API Gateway': 'bg-purple-100 text-purple-800',
    'Patient Portal': 'bg-cyan-100 text-cyan-800',
    'Security': 'bg-rose-100 text-rose-800',
    'Default': 'bg-gray-100 text-gray-800',
}

interface TraceabilityProps {
  requirements: Requirement[];
  testCases: TestCase[];
  setActiveView: (view: View) => void;
  selectedTestCases: TestCase[] | null;
  onClearSelection: () => void;
}

export const Traceability: React.FC<TraceabilityProps> = ({ requirements, testCases, setActiveView, selectedTestCases, onClearSelection }) => {
    const [activeTab, setActiveTab] = useState<'full' | 'selection'>('full');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    
    const [searchTerm, setSearchTerm] = useState('');
    const [moduleFilter, setModuleFilter] = useState('All Modules');
    const [sourceFilter, setSourceFilter] = useState('All Sources');
    const [statusFilter, setStatusFilter] = useState<RequirementStatus | 'All Status'>('All Status');

    useEffect(() => {
        if (selectedTestCases && selectedTestCases.length > 0) {
            setActiveTab('selection');
        } else {
            setActiveTab('full');
        }
    }, [selectedTestCases]);

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedRows(newSet);
    };

    const { currentRequirements, currentTestCases } = useMemo(() => {
        const isSelectionMode = activeTab === 'selection' && selectedTestCases && selectedTestCases.length > 0;
        if (isSelectionMode) {
            const relevantReqIds = new Set(selectedTestCases.map(tc => tc.requirementId));
            return {
                currentRequirements: requirements.filter(r => relevantReqIds.has(r.id)),
                currentTestCases: selectedTestCases,
            };
        }
        return {
            currentRequirements: requirements,
            currentTestCases: testCases,
        };
    }, [activeTab, selectedTestCases, requirements, testCases]);

    const { traceabilityData, stats, chartData, allSources, allModules } = useMemo(() => {
        const testCasesByReqId = currentTestCases.reduce((acc, tc) => {
            if (!acc[tc.requirementId]) {
                acc[tc.requirementId] = [];
            }
            acc[tc.requirementId].push(tc);
            return acc;
        }, {} as Record<string, TestCase[]>);

        const data: RequirementTraceability[] = currentRequirements.map(req => {
            const linkedTestCases = testCasesByReqId[req.id] || [];
            let status: RequirementStatus = 'Not Covered';
            if (linkedTestCases.length > 1) {
                status = 'Covered';
            } else if (linkedTestCases.length === 1) {
                status = 'Partial';
            }

            const priorities: TestCasePriority[] = linkedTestCases.map(tc => tc.priority);
            let highestPriority: TestCasePriority = 'Low';
            if (priorities.includes('Critical')) highestPriority = 'Critical';
            else if (priorities.includes('High')) highestPriority = 'High';
            else if (priorities.includes('Medium')) highestPriority = 'Medium';
    
            const allComplianceTags = new Set(linkedTestCases.flatMap(tc => tc.compliance));

            return {
                id: req.id,
                description: req.description,
                linkedTestCases,
                status,
                source: req.source,
                module: req.module,
                priority: highestPriority,
                compliance: Array.from(allComplianceTags),
            };
        });
        
        const statusCounts = data.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {} as Record<RequirementStatus, number>);

        const coveredCount = statusCounts['Covered'] || 0;
        const partialCount = statusCounts['Partial'] || 0;
        const notCoveredCount = statusCounts['Not Covered'] || 0;
        const totalRequirements = data.length;
        const coverageRate = totalRequirements > 0 ? (((coveredCount * 1) + (partialCount * 0.5)) / totalRequirements) * 100 : 0;

        const calculatedStats = {
            totalRequirements,
            coverageRate: `${coverageRate.toFixed(0)}%`,
            linkedCases: currentTestCases.length,
            uncovered: notCoveredCount,
            fullyCovered: coveredCount,
            partiallyCovered: partialCount,
        };
        
        const calculatedChartData = [
            { name: 'Covered', value: coveredCount, color: '#10B981' },
            { name: 'Partial', value: partialCount, color: '#F59E0B' },
            { name: 'Not Covered', value: notCoveredCount, color: '#EF4444' },
        ].filter(item => item.value > 0);
        
        const sources = ['All Sources', ...Array.from(new Set(currentRequirements.map(req => req.source)))];
        const modules = ['All Modules', ...Array.from(new Set(data.map(d => d.module)))];

        return { traceabilityData: data, stats: calculatedStats, chartData: calculatedChartData, allSources: sources, allModules: modules };
    }, [currentRequirements, currentTestCases]);

    const filteredTraceabilityData = useMemo(() => {
        return traceabilityData.filter(item => {
            const searchMatch = searchTerm === '' || 
                item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.description.toLowerCase().includes(searchTerm.toLowerCase());
            const moduleMatch = moduleFilter === 'All Modules' || item.module === moduleFilter;
            const sourceMatch = sourceFilter === 'All Sources' || item.source === sourceFilter;
            const statusMatch = statusFilter === 'All Status' || item.status === statusFilter;
            return searchMatch && moduleMatch && sourceMatch && statusMatch;
        });
    }, [traceabilityData, searchTerm, moduleFilter, sourceFilter, statusFilter]);

    if (requirements.length === 0) {
        return (
            <div className="text-center py-12">
                <LinkIcon className="mx-auto h-12 w-12 text-text-secondary" />
                <h3 className="mt-2 text-lg font-medium text-text-primary">No Traceability Data</h3>
                <p className="mt-1 text-sm text-text-secondary">Generate test cases to build your traceability matrix.</p>
                 <button 
                    onClick={() => setActiveView('generate')}
                    className="mt-6 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Generate Cases
                </button>
            </div>
        )
    }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-text-primary">Traceability Matrix</h1>
            <p className="mt-2 text-text-secondary">View and manage the linkage between requirements and test cases for complete coverage.</p>
        </div>
         <div className="flex items-center gap-3">
             <button onClick={() => exportTraceabilityMatrixCSV(filteredTraceabilityData)} className="inline-flex items-center justify-center px-4 py-2 border border-border-color text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-gray-50">
                <DownloadIcon className="w-5 h-5 mr-2" />
                Download Matrix
            </button>
             <button 
                onClick={() => setActiveView('generate')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover">
                <PlusIcon className="w-5 h-5 mr-2" />
                Generate Additional Test Cases
            </button>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Requirements" value={stats.totalRequirements.toString()} icon={<FileIcon className="h-6 w-6 text-text-secondary"/>} />
          <StatCard title="Coverage Rate" value={stats.coverageRate} icon={<CheckCircleIcon className="h-6 w-6 text-text-secondary"/>} />
          <StatCard title="Linked Test Cases" value={stats.linkedCases.toString()} icon={<LinkIcon className="h-6 w-6 text-text-secondary"/>} />
          <StatCard title="Uncovered" value={stats.uncovered.toString()} icon={<WarningIcon className="h-6 w-6 text-red-500"/>} />
      </div>
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface border border-border-color rounded-lg p-6">
                <h2 className="text-lg font-semibold text-text-primary">Coverage Distribution</h2>
              <p className="text-sm text-text-secondary mb-4">Breakdown of requirement coverage status.</p>
              {chartData.length > 0 ? <DonutChart data={chartData} /> : <div className="h-full flex items-center justify-center text-center p-8 text-text-secondary bg-gray-50 rounded-lg">No data for this view.</div> }
          </div>
            <div className="bg-surface border border-border-color rounded-lg p-6 flex flex-col justify-center">
                <h2 className="text-lg font-semibold text-text-primary">Coverage Progress</h2>
              <p className="text-sm text-text-secondary mb-6">Track progress towards complete coverage.</p>
              <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-base font-medium text-text-primary">Overall Coverage</span>
                      <span className="text-sm font-medium text-text-primary">{stats.coverageRate}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-primary h-4 rounded-full" style={{width: stats.coverageRate}}></div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-4 text-left">
                      <div>
                          <p className="text-2xl font-bold text-green-600">{stats.fullyCovered}</p>
                          <p className="text-sm text-text-secondary">Fully Covered</p>
                      </div>
                      <div>
                          <p className="text-2xl font-bold text-amber-600">{stats.partiallyCovered}</p>
                          <p className="text-sm text-text-secondary">Partially Covered</p>
                      </div>
                      <div>
                          <p className="text-2xl font-bold text-red-600">{stats.uncovered}</p>
                          <p className="text-sm text-text-secondary">Not Covered</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

        <div className="bg-surface border border-border-color rounded-lg">
          <div className="p-4 border-b border-border-color">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon className="w-5 h-5 text-gray-400" /></div>
                      <input type="text" placeholder="Search requirements, descriptions, or IDs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5" />
                  </div>
                  <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                      {allModules.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                        {allSources.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                      <option value="All Status">All Status</option>
                      <option value="Covered">Covered</option>
                      <option value="Partial">Partial</option>
                      <option value="Not Covered">Not Covered</option>
                  </select>
              </div>
          </div>
          <p className="px-4 py-2 text-sm text-text-secondary">Showing {filteredTraceabilityData.length} of {traceabilityData.length} requirements</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-color">
              <thead className="bg-background">
                <tr>
                  <th scope="col" className="w-4"></th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Requirement</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Module</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Priority</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Coverage Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Test Cases</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Compliance</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border-color">
                {filteredTraceabilityData.map((req) => {
                  const isExpanded = expandedRows.has(req.id);
                  return (
                  <React.Fragment key={req.id}>
                    <tr onClick={() => toggleRow(req.id)} className="cursor-pointer hover:bg-gray-50">
                      <td className="px-2 py-4"><ChevronDownIcon className={`w-5 h-5 text-text-secondary transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></td>
                      <td className="px-4 py-4 whitespace-normal"><div className="text-sm font-semibold text-text-primary">{req.description}</div><div className="text-xs text-text-secondary font-mono">{req.id} &bull; {req.source}</div></td>
                      <td className="px-4 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded-full ${modulePillStyles[req.module] || modulePillStyles.Default}`}>{req.module}</span></td>
                      <td className="px-4 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityPillStyles[req.priority]}`}>{req.priority}</span></td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${statusPillStyles[req.status]}`}>
                            {req.status === 'Covered' ? <CheckCircleIcon className="w-4 h-4 mr-1.5" /> :
                             req.status === 'Partial' ? <WarningIcon className="w-4 h-4 mr-1.5" /> :
                             <XCircleIcon className="w-4 h-4 mr-1.5" />}
                            {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">{req.linkedTestCases.length} test cases</td>
                      <td className="px-4 py-4 whitespace-nowrap"><div className="flex flex-wrap gap-1">{req.compliance.map(c => <span key={c} className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 text-text-secondary">{c}</span>)}</div></td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-3"><button className="text-gray-400 hover:text-gray-600"><EyeIcon className="h-5 w-5"/></button><button className="text-gray-400 hover:text-gray-600"><ExternalLinkIcon className="h-5 w-5"/></button></div></td>
                    </tr>
                     {isExpanded && (
                        <tr className="bg-gray-50/75">
                            <td></td>
                            <td colSpan={7} className="px-4 py-5 border-t border-border-color">
                                <h4 className="text-sm font-medium text-text-primary mb-3">Test Cases:</h4>
                                {req.linkedTestCases.length > 0 ? (
                                    <div className="space-y-3">
                                        {req.linkedTestCases.map(tc => (
                                            <div key={tc.id} className="flex justify-between items-center p-3 bg-surface rounded-lg border border-border-color shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-status-green text-text-green">Passed</span>
                                                    <div>
                                                        <span className="text-sm font-medium text-text-primary">{tc.title}</span>
                                                        <span className="text-xs text-text-secondary ml-2 font-mono">({tc.id})</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${modulePillStyles[tc.tags[0]] || modulePillStyles.Default}`}>{tc.tags[0] || 'General'}</span>
                                                    <button className="text-text-secondary hover:text-text-primary">
                                                        <EyeIcon className="h-5 w-5"/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-text-secondary">
                                        No test cases linked to this requirement.
                                        <button onClick={(e) => { e.stopPropagation(); setActiveView('generate'); }} className="ml-2 font-semibold text-primary hover:underline">
                                            Generate test cases
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    )}
                  </React.Fragment>
                )})}
              </tbody>
            </table>
              {filteredTraceabilityData.length === 0 && (
                  <div className="text-center p-8 text-text-secondary">
                      No requirements match your filters.
                  </div>
              )}
          </div>
        </div>
    </div>
  );
};