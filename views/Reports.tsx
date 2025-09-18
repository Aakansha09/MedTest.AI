import React, { useMemo, useState } from 'react';
import { TestCase, Report, ReportStatus, TestCaseStatus } from '../types';
import { DonutChart } from '../components/DonutChart';
import { TestCasesIcon } from '../components/icons/TestCasesIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { GenerateReportModal } from '../components/GenerateReportModal';
import { ShieldCheckIcon } from '../components/icons/ShieldCheckIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { FlaskIcon } from '../components/icons/FlaskIcon';
import { BarChartIcon } from '../components/icons/BarChartIcon';
import { EyeIcon } from '../components/icons/EyeIcon';
import { RefreshIcon } from '../components/icons/RefreshIcon';


interface ReportsProps {
    testCases: TestCase[];
    reports: Report[];
    setReports: React.Dispatch<React.SetStateAction<Report[]>>;
}

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-surface p-6 rounded-lg border border-border-color">
        <div className="flex justify-between items-start">
            <div className="flex-shrink-0 mr-4 text-primary bg-primary-light p-3 rounded-lg">
                {icon}
            </div>
            <div>
                <p className="text-md font-medium text-text-secondary">{title}</p>
                <p className="text-3xl font-bold text-text-primary mt-1">{value}</p>
            </div>
        </div>
    </div>
);

const COMPLIANCE_COLORS: Record<string, string> = {
    'HIPAA': '#4F46E5',
    'SOC2': '#10B981',
    'FDA': '#A855F7',
    'GDPR': '#EF4444',
    'Other': '#F59E0B',
};

const statusPillStyles: Record<ReportStatus, string> = {
    'Completed': 'bg-status-green text-text-green ring-1 ring-inset ring-green-200',
    'Failed': 'bg-status-red text-text-red ring-1 ring-inset ring-red-200',
    'Processing': 'bg-status-yellow text-text-yellow ring-1 ring-inset ring-yellow-200',
    'Pending': 'bg-status-gray text-text-gray ring-1 ring-inset ring-gray-200',
};

const tagColors: Record<string, string> = {
  'HIPAA': 'bg-blue-100 text-blue-800',
  'SOC2': 'bg-green-100 text-green-800',
  'FDA': 'bg-purple-100 text-purple-800',
  'GDPR': 'bg-red-100 text-red-800',
  'HL7': 'bg-indigo-100 text-indigo-800',
  'FHIR': 'bg-cyan-100 text-cyan-800',
  'Default': 'bg-gray-100 text-gray-800'
};

const statusColors: Record<string, {dot: string, text: string}> = {
    Completed: { dot: 'bg-green-500', text: 'text-green-600'},
    Approved: { dot: 'bg-blue-500', text: 'text-blue-600'},
    Pending: { dot: 'bg-amber-500', text: 'text-amber-600'},
    "Re-run": { dot: 'bg-orange-500', text: 'text-orange-600'},
};


export const Reports: React.FC<ReportsProps> = ({ testCases, reports, setReports }) => {
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    
    const [searchFilter, setSearchFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('30'); // 'all', '30', '90'
    const [typeFilter, setTypeFilter] = useState<string>('All Types');
    const [statusFilter, setStatusFilter] = useState<string>('All Status');
    
    const allReportTypes = useMemo(() => ['All Types', ...Array.from(new Set(reports.map(r => r.subtitle)))], [reports]);
    const allReportStatuses = ['All Status', ...Array.from(new Set(reports.map(r => r.status)))];

    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            const searchMatch = searchFilter === '' || 
                                report.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                                report.scope.toLowerCase().includes(searchFilter.toLowerCase());
            const typeMatch = typeFilter === 'All Types' || report.subtitle === typeFilter;
            const statusMatch = statusFilter === 'All Status' || report.status === statusFilter;
            let dateMatch = true;
            if (dateFilter !== 'all') {
                const reportDate = new Date(report.date);
                const daysAgo = parseInt(dateFilter);
                const pastDate = new Date();
                pastDate.setDate(new Date().getDate() - daysAgo);
                dateMatch = reportDate >= pastDate;
            }

            return searchMatch && typeMatch && dateMatch && statusMatch;
        });
    }, [reports, searchFilter, typeFilter, dateFilter, statusFilter]);


    const stats = useMemo(() => {
        const completed = testCases.filter(tc => tc.status === 'Completed').length;
        const uniqueStandards = new Set(testCases.flatMap(tc => tc.compliance));
        return {
            total: testCases.length,
            completed,
            standards: uniqueStandards.size,
        }
    }, [testCases]);
    
    const testCaseStatusOverview = useMemo(() => {
        const data: Record<string, number> = { Completed: 0, Approved: 0, Pending: 0, "Re-run": 0 };
        testCases.forEach(tc => {
            switch(tc.status) {
                case 'Completed': data.Completed++; break;
                case 'Active': data.Approved++; break; // Mapping Active to Approved
                case 'Pending':
                case 'Under Review': 
                case 'Draft':
                    data.Pending++; break;
            }
        });
        // Mock re-run for visuals
        data["Re-run"] = Math.floor(testCases.length / 20);
        return data;
    }, [testCases]);

    const complianceData = useMemo(() => {
        const distribution = testCases.reduce((acc, tc) => {
            if (tc.compliance.length === 0) {
                acc['Other'] = (acc['Other'] || 0) + 1;
            } else {
                tc.compliance.forEach(standard => {
                    const key = COMPLIANCE_COLORS[standard] ? standard : 'Other';
                    acc[key] = (acc[key] || 0) + 1;
                });
            }
            return acc;
        }, {} as Record<string, number>);

        if (Object.keys(distribution).length === 0) return [];
        
        return Object.entries(distribution).map(([name, value]) => ({
            name,
            value,
            color: COMPLIANCE_COLORS[name] || COMPLIANCE_COLORS['Other'],
        }));
    }, [testCases]);

    const lastGeneratedDate = useMemo(() => {
        if (reports.length === 0) return 'N/A';
        const sortedReports = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return new Date(sortedReports[0].date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }, [reports]);

    const handleCreateReport = (reportDetails: Omit<Report, 'id' | 'date' | 'status' | 'testCaseCount' | 'fileSize' | 'fileType'>) => {
        const newReport: Report = {
            ...reportDetails,
            id: `REP-${String(reports.length + 1).padStart(3, '0')}`,
            date: new Date().toISOString(),
            status: 'Processing',
            testCaseCount: 0,
            fileSize: 'Pending',
            fileType: 'PDF',
        };
        setReports(prev => [newReport, ...prev]);
    };

  return (
    <>
    {isGenerateModalOpen && <GenerateReportModal onClose={() => setIsGenerateModalOpen(false)} onCreateReport={handleCreateReport} />}
    <div className="space-y-8">
        <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Reports</h1>
                <p className="mt-2 text-text-secondary">Track and analyze your test case generation activities.</p>
            </div>
             <button onClick={() => setIsGenerateModalOpen(true)} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <PlusIcon className="w-5 h-5 mr-2" />
                Generate New Report
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Test Cases" value={stats.total.toString()} icon={<TestCasesIcon className="h-6 w-6"/>} />
            <StatCard title="Compliance Standards" value={stats.standards.toString()} icon={<ShieldCheckIcon className="h-6 w-6"/>} />
            <StatCard title="Completed Tests" value={stats.completed.toString()} icon={<CheckCircleIcon className="h-6 w-6"/>} />
            <StatCard title="Last Generated" value={lastGeneratedDate.split(' ')[1].replace(',', '')} icon={<ClockIcon className="h-6 w-6"/>} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface border border-border-color rounded-lg p-6">
                <div className="flex items-center gap-3 mb-1">
                    <FlaskIcon className="w-6 h-6 text-primary"/>
                    <h2 className="text-lg font-semibold text-text-primary">Test Cases by Compliance Standard</h2>
                </div>
                <p className="text-sm text-text-secondary mb-4">Distribution of test cases across compliance requirements.</p>
                {complianceData.length > 0 ? (
                    <DonutChart data={complianceData} />
                ) : (
                    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                        <p className="text-text-secondary">No compliance data available.</p>
                    </div>
                )}
            </div>
            <div className="bg-surface border border-border-color rounded-lg p-6">
                 <div className="flex items-center gap-3 mb-1">
                    <BarChartIcon className="w-6 h-6 text-primary"/>
                    <h2 className="text-lg font-semibold text-text-primary">Test Case Status Overview</h2>
                </div>
                <p className="text-sm text-text-secondary mb-6">Current status distribution of all test cases.</p>
                <div className="space-y-5">
                    {Object.entries(testCaseStatusOverview).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center">
                            <div className="flex items-center">
                                <span className={`w-3 h-3 rounded-full mr-3 ${statusColors[status]?.dot || 'bg-gray-400'}`}></span>
                                <span className="text-md text-text-primary">{status}</span>
                            </div>
                            <span className="text-md font-semibold text-text-primary">{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
        <div className="bg-surface border border-border-color rounded-lg">
            <div className="p-4 border-b border-border-color flex flex-wrap items-center gap-4">
                <div className="flex items-center flex-grow gap-4">
                    <button className="px-4 py-2 border border-border-color text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-gray-50">Select All</button>
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon className="w-5 h-5 text-gray-400" /></div>
                        <input type="text" placeholder="Search reports by name, type, or scope..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"/>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-sm text-text-secondary">Date Range:</span>
                    <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-auto p-2.5">
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="all">All Time</option>
                    </select>
                    <span className="text-sm text-text-secondary">Type:</span>
                     <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-auto p-2.5">
                        {allReportTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <span className="text-sm text-text-secondary">Status:</span>
                     <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-auto p-2.5">
                        {allReportStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
            </div>
            <p className="px-4 py-2 text-sm text-text-secondary">Showing {filteredReports.length} of {reports.length} reports</p>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-color">
                    <thead className="bg-background">
                        <tr>
                            <th scope="col" className="p-4 w-4"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /></th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Report Name / Type</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Date Generated</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Scope</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Test Cases</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                     <tbody className="bg-surface divide-y divide-border-color">
                       {filteredReports.map(report => (
                           <tr key={report.id} className="hover:bg-gray-50">
                               <td className="p-4"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" /></td>
                               <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-text-primary">{report.name}</div>
                                    <div className="text-sm text-text-secondary">{report.subtitle}</div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {report.tags.map(tag => <span key={tag} className={`px-2 py-0.5 text-xs font-medium rounded-md ${tagColors[tag] || tagColors.Default}`}>{tag}</span>)}
                                    </div>
                               </td>
                               <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                                 <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5"/>
                                    <span>{new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                 </div>
                               </td>
                               <td className="px-4 py-4 whitespace-normal text-sm text-text-primary max-w-xs">{report.scope}</td>
                               <td className="px-4 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${statusPillStyles[report.status]}`}>
                                        {report.status === 'Completed' ? <CheckCircleIcon className="w-4 h-4 mr-1.5" /> : null}
                                        {report.status}
                                    </span>
                               </td>
                               <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                                   <div>
                                       <div className="font-medium text-text-primary">{report.testCaseCount}</div>
                                       <div>{report.fileSize} &bull; {report.fileType}</div>
                                   </div>
                               </td>
                               <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                   <div className="flex items-center gap-4">
                                       <button className="text-gray-400 hover:text-gray-600"><EyeIcon className="h-5 w-5"/></button>
                                       <button className="text-gray-400 hover:text-gray-600"><DownloadIcon className="h-5 w-5"/></button>
                                       <button className="text-gray-400 hover:text-gray-600"><RefreshIcon className="h-5 w-5"/></button>
                                   </div>
                               </td>
                           </tr>
                       ))}
                    </tbody>
                </table>
                {filteredReports.length === 0 && (
                  <div className="text-center p-8 text-text-secondary">
                    No reports match your filters.
                  </div>
                )}
            </div>
        </div>
    </div>
    </>
  );
};