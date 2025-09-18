import React, { useState, useMemo, useRef } from 'react';
import { TestCase, TestCaseStatus } from '../types';
import { useSortableData } from '../hooks/useSortableData';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { SortIcon } from './icons/SortIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { DotsHorizontalIcon } from './icons/DotsHorizontalIcon';

const statusColors: Record<TestCaseStatus, string> = {
  Active: 'bg-status-green text-text-green',
  Completed: 'bg-status-blue text-text-blue',
  'Under Review': 'bg-status-yellow text-text-yellow',
  Draft: 'bg-status-gray text-text-gray',
  Pending: 'bg-status-yellow text-text-yellow',
};

const tagColors: Record<string, string> = {
  Functional: 'bg-status-blue text-text-blue',
  Security: 'bg-status-red text-text-red',
  Performance: 'bg-status-purple text-text-purple',
  Integration: 'bg-status-yellow text-text-yellow',
  'UI/UX': 'bg-pink-100 text-pink-800',
  Default: 'bg-status-gray text-text-gray',
};

const Pill: React.FC<{ text: string; className: string }> = ({ text, className }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${className}`}>
    {text}
  </span>
);

interface TestCaseTableProps {
  testCases: TestCase[];
}

export const TestCaseTable: React.FC<TestCaseTableProps> = ({ testCases }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestCaseStatus | 'All'>('All');
  const [tagFilter, setTagFilter] = useState<string | 'All'>('All');
  const { items, requestSort, sortConfig } = useSortableData(testCases);
  const allTags = useMemo(() => Array.from(new Set(testCases.flatMap(tc => tc.tags))), [testCases]);

  const filteredTestCases = useMemo(() => {
    return items.filter(tc => {
      const searchMatch =
        tc.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
        tc.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        tc.source.toLowerCase().includes(searchFilter.toLowerCase());
      const statusMatch = statusFilter === 'All' || tc.status === statusFilter;
      const tagMatch = tagFilter === 'All' || tc.tags.includes(tagFilter);
      return searchMatch && statusMatch && tagMatch;
    });
  }, [items, searchFilter, statusFilter, tagFilter]);

  const getSortDirection = (key: keyof TestCase) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction;
  };

  const SortableHeader = ({ tkey, label }: { tkey: keyof TestCase, label: string }) => (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider cursor-pointer"
      onClick={() => requestSort(tkey)}
    >
      <div className="flex items-center">
        {label}
        <SortIcon direction={getSortDirection(tkey)} />
      </div>
    </th>
  );

  return (
    <div className="bg-surface border border-border-color rounded-lg shadow-sm">
       {/* Filter Section */}
      <div className="p-4 border-b border-border-color flex items-center gap-4">
        <input
          type="text"
          placeholder="Search test cases..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full md:w-1/3 p-2.5"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-auto p-2.5">
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Under Review">Under Review</option>
            <option value="Completed">Completed</option>
            <option value="Draft">Draft</option>
        </select>
         <select value={tagFilter} onChange={e => setTagFilter(e.target.value as any)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-auto p-2.5">
            <option value="All">All Tags</option>
            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-color">
          <thead className="bg-background">
            <tr>
              <th scope="col" className="p-4"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /></th>
              <SortableHeader tkey="title" label="Test Case" />
              <SortableHeader tkey="tags" label="Tags" />
              <SortableHeader tkey="status" label="Status" />
              <SortableHeader tkey="source" label="Source" />
              <SortableHeader tkey="compliance" label="Compliance" />
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-color">
            {filteredTestCases.map((tc) => (
              <tr key={tc.id} className="hover:bg-gray-50">
                <td className="p-4"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /></td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text-primary">{tc.title}</div>
                    <div className="text-sm text-text-secondary">{tc.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {tc.tags.map(tag => <Pill key={tag} text={tag} className={tagColors[tag] || tagColors.Default} />)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap"><Pill text={tc.status} className={statusColors[tc.status]} /></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{tc.source}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {tc.compliance.map(c => <Pill key={c} text={c} className="bg-status-gray text-text-gray" />)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-gray-400 hover:text-gray-600"><DotsHorizontalIcon className="h-5 w-5"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTestCases.length === 0 && (
          <div className="text-center p-8 text-text-secondary">
            No test cases found.
          </div>
        )}
      </div>
    </div>
  );
};