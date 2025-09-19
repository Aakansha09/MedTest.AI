import React from 'react';
import { TestCase, View, RequirementTraceability, RequirementStatus, TestCasePriority } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { WarningIcon } from './icons/WarningIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { EyeIcon } from './icons/EyeIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

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
};

interface TraceabilityMatrixProps {
  data: RequirementTraceability[];
  expandedRows: Set<string>;
  toggleRow: (id: string) => void;
  setActiveView: (view: View) => void;
}

export const TraceabilityMatrix: React.FC<TraceabilityMatrixProps> = ({ data, expandedRows, toggleRow, setActiveView }) => {
  return (
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
          {data.map((req) => {
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
      {data.length === 0 && (
        <div className="text-center p-8 text-text-secondary">
          No requirements match your filters.
        </div>
      )}
    </div>
  );
};
