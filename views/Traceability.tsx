import React, { useMemo, useState, useEffect } from 'react';
import { TestCase, View, RequirementTraceability, RequirementStatus, Requirement, TestCasePriority } from '../types';
import { LinkIcon } from '../components/icons/LinkIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { FileIcon } from '../components/icons/FileIcon';
import { WarningIcon } from '../components/icons/WarningIcon';
import { DonutChart } from '../components/DonutChart';
import { SearchIcon } from '../components/icons/SearchIcon';
import { exportTraceabilityMatrixCSV } from '../utils/exportUtils';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { TraceabilityMatrix } from '../components/TraceabilityMatrix';

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
          <TraceabilityMatrix 
            data={filteredTraceabilityData}
            expandedRows={expandedRows}
            toggleRow={toggleRow}
            setActiveView={setActiveView}
          />
        </div>
    </div>
  );
};
