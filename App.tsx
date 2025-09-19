import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './views/Dashboard';
import { Generate } from './views/Generate';
import { Review } from './views/Review';
import { Processing } from './views/Processing';
import { GeneratedTestCases } from './views/GeneratedTestCases';
import { Integrations } from './views/Integrations';
import { Reports } from './views/Reports';
import { Traceability } from './views/Traceability';
import { Login } from './views/Login';
import { Improve } from './views/Improve';
import { Duplicates } from './views/Duplicates';
import { ImpactAnalysis } from './views/ImpactAnalysis';
import { extractRequirements, generateTestCases } from './services/geminiService';
import { BulkUpdatePayload, TestCase, ProcessingState, View, Report, RequirementsData, GenerationProgress, Requirement, JiraConfig } from './types';
import { extractTextFromFiles } from './utils/fileParser';
import { AIAssistant } from './components/AIAssistant';

const initialMockTestCases: TestCase[] = [
  {
    id: 'TC001',
    title: 'Patient Login Authentication',
    description: 'Verifies a patient can log in with valid credentials.',
    requirementId: 'REQ-AUTH-01',
    tags: ['Functional'],
    priority: 'Critical',
    status: 'Active',
    source: 'JIRA-4521',
    compliance: ['HIPAA', 'SOC2'],
    steps: ['Given the user is on the login page', 'When the user enters valid credentials for username and password', 'And the user clicks the login button', 'Then the user is redirected to their dashboard'],
    expectedOutcome: 'User should be successfully logged in and see their dashboard.',
    dateCreated: new Date('2024-05-20T10:00:00Z').toISOString(),
  },
  {
    id: 'TC002',
    title: 'Medical Data Encryption',
    description: 'Ensures patient medical data is encrypted at rest.',
    requirementId: 'REQ-SEC-03',
    tags: ['Security'],
    priority: 'Critical',
    status: 'Under Review',
    source: 'Azure-1234',
    compliance: ['HIPAA', 'GDPR'],
    steps: ['Given a system with patient data', 'When an administrator accesses the database directly', 'Then the patient data table should be encrypted using AES-256'],
    expectedOutcome: 'Data should be encrypted using AES-256.',
    dateCreated: new Date('2024-05-19T11:00:00Z').toISOString(),
  },
  {
    id: 'TC003',
    title: 'Prescription Lookup Performance',
    description: 'Tests the performance of the prescription lookup endpoint.',
    requirementId: 'REQ-PERF-02',
    tags: ['Performance'],
    priority: 'Medium',
    status: 'Completed',
    source: 'Manual Upload',
    compliance: ['DEA', 'FDA'],
    steps: ['Given the system is under normal load', 'When 100 concurrent requests are sent to /api/prescriptions', 'Then the average response time should be under 200ms'],
    expectedOutcome: 'Average response time should be under 200ms.',
    dateCreated: new Date('2024-05-18T14:30:00Z').toISOString(),
  },
  {
    id: 'TC004',
    title: 'Lab Result Integration',
    description: 'Verifies that lab results are correctly ingested from the integration partner.',
    requirementId: 'REQ-INT-05',
    tags: ['Integration'],
    priority: 'High',
    status: 'Active',
    source: 'JIRA-4522',
    compliance: ['CLIA', 'HIPAA'],
    steps: ['Given a new lab result is available from a partner system', 'When the integration service runs', 'Then the new lab result appears in the correct patient chart within 5 minutes'],
    expectedOutcome: 'Lab result appears correctly within 5 minutes.',
    dateCreated: new Date('2024-05-17T09:00:00Z').toISOString(),
  },
  {
    id: 'TC005',
    title: 'Emergency Access Override',
    description: 'Ensures that emergency access protocols function as expected.',
    requirementId: 'REQ-FUNC-11',
    tags: ['Functional'],
    priority: 'Critical',
    status: 'Draft',
    source: 'TestRail-789',
    compliance: ['HIPAA', 'Emergency'],
    steps: ['Given a clinician is logged out', 'When the clinician triggers the emergency access protocol', 'Then the system grants temporary access and logs the event for auditing'],
    expectedOutcome: 'Access is granted and the event is logged for auditing.',
    dateCreated: new Date('2024-05-16T16:00:00Z').toISOString(),
  },
  {
    id: 'TC006',
    title: 'Device Connectivity Validation',
    description: 'Tests the connection stability with a partnered medical device.',
    requirementId: 'REQ-INT-08',
    tags: ['Integration'],
    priority: 'Medium',
    status: 'Completed',
    source: 'Azure-1235',
    compliance: ['FDA', 'ISO13485'],
    steps: ['Given a partnered medical device is connected', 'When data is transferred continuously for 1 hour', 'Then the connection should remain stable with no data loss'],
    expectedOutcome: 'Connection remains stable with no data loss.',
    dateCreated: new Date('2024-05-15T12:00:00Z').toISOString(),
  },
   {
    id: 'TC007',
    title: 'Verify Patient Login',
    description: 'This test checks if a patient can successfully log in using correct credentials.',
    requirementId: 'REQ-AUTH-01',
    tags: ['Functional'],
    priority: 'Critical',
    status: 'Active',
    source: 'Manual Entry',
    compliance: ['HIPAA'],
    steps: ['Navigate to the login page.', 'Enter a valid username and password.', 'Click the "Sign In" button.'],
    expectedOutcome: 'The user is successfully logged in and redirected to their personal dashboard page.',
    dateCreated: new Date('2024-05-21T10:00:00Z').toISOString(),
  },
];


const initialMockReports: Report[] = [
    {
        id: 'REP-001',
        name: 'HIPAA Compliance Test Cases Report',
        subtitle: 'Compliance Summary',
        tags: ['HIPAA', 'SOC2'],
        date: '2024-01-20T00:00:00.000Z',
        scope: 'Authentication & Data Privacy Modules',
        status: 'Completed',
        testCaseCount: 45,
        fileSize: '2.4 MB',
        fileType: 'PDF',
        data: { 'HIPAA': 25, 'SOC2': 20 },
    },
    {
        id: 'REP-002',
        name: 'Weekly Test Generation Summary',
        subtitle: 'Executive Summary',
        tags: ['HIPAA', 'FDA', 'GDPR'],
        date: '2024-01-19T00:00:00.000Z',
        scope: 'All Active Projects',
        status: 'Completed',
        testCaseCount: 124,
        fileSize: '1.8 MB',
        fileType: 'CSV',
        data: { 'HIPAA': 50, 'FDA': 40, 'GDPR': 34 },
    },
    {
        id: 'REP-003',
        name: 'Security Test Cases Audit',
        subtitle: 'Security Audit',
        tags: ['HIPAA', 'SOC2'],
        date: '2024-01-18T00:00:00.000Z',
        scope: 'Patient Portal & API Endpoints',
        status: 'Failed',
        testCaseCount: 32,
        fileSize: '890 KB',
        fileType: 'PDF',
        data: { 'HIPAA': 18, 'SOC2': 14 },
    },
    {
        id: 'REP-004',
        name: 'Integration Test Coverage',
        subtitle: 'Coverage Report',
        tags: ['HL7', 'FHIR', 'HIPAA'],
        date: '2024-01-17T00:00:00.000Z',
        scope: 'EHR Integration Module',
        status: 'Completed',
        testCaseCount: 67,
        fileSize: '3.1 MB',
        fileType: 'PDF',
        data: { 'HL7': 30, 'FHIR': 25, 'HIPAA': 12 },
    },
    {
        id: 'REP-005',
        name: 'Monthly Compliance Dashboard',
        subtitle: 'Executive Summary',
        tags: ['HIPAA', 'FDA', 'GDPR', 'SOC2'],
        date: '2024-01-15T00:00:00.000Z',
        scope: 'Complete Platform',
        status: 'Processing',
        testCaseCount: 189,
        fileSize: 'Pending',
        fileType: 'PDF',
        data: {},
    },
    {
        id: 'REP-006',
        name: 'Q2 Test Case Priority Breakdown',
        subtitle: 'Priority Distribution',
        tags: ['Quarterly', 'Analysis'],
        date: new Date('2024-05-22T00:00:00.000Z').toISOString(),
        scope: 'All Modules',
        status: 'Completed',
        testCaseCount: 124,
        fileSize: '1.1 MB',
        fileType: 'PDF',
        data: { 'Critical': 3, 'High': 1, 'Medium': 2, 'Low': 0 },
    },
    {
        id: 'REP-007',
        name: 'Test Case Source Analysis',
        subtitle: 'Source Analysis',
        tags: ['Generation', 'Metrics'],
        date: new Date('2024-05-21T00:00:00.000Z').toISOString(),
        scope: 'All Generation Methods',
        status: 'Completed',
        testCaseCount: 7,
        fileSize: '980 KB',
        fileType: 'CSV',
        data: { 'JIRA-4521': 1, 'Azure-1234': 1, 'Manual Upload': 1, 'JIRA-4522': 1, 'TestRail-789': 1, 'Azure-1235': 1, 'Manual Entry': 1 },
    },
    {
        id: 'REP-008',
        name: 'Primary Test Type Breakdown',
        subtitle: 'Type Breakdown',
        tags: ['Functional', 'API', 'Security'],
        date: new Date('2024-05-20T00:00:00.000Z').toISOString(),
        scope: 'All Test Types',
        status: 'Completed',
        testCaseCount: 7,
        fileSize: '1.3 MB',
        fileType: 'PDF',
        data: { 'Functional': 3, 'Security': 1, 'Performance': 1, 'Integration': 2 },
    },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>(() => {
    try {
      const storedTestCases = window.localStorage.getItem('healthtest-testCases');
      return storedTestCases && JSON.parse(storedTestCases).length > 0 ? JSON.parse(storedTestCases) : initialMockTestCases;
    } catch (error) {
      console.error("Failed to parse test cases from localStorage", error);
      return initialMockTestCases;
    }
  });

  const [requirements, setRequirements] = useState<Requirement[]>(() => {
    try {
      const storedRequirements = window.localStorage.getItem('healthtest-requirements');
      return storedRequirements ? JSON.parse(storedRequirements) : [];
    } catch (error) {
      console.error("Failed to parse requirements from localStorage", error);
      return [];
    }
  });

  const [reports, setReports] = useState<Report[]>(() => {
    try {
      const storedReports = window.localStorage.getItem('healthtest-reports');
      return storedReports && JSON.parse(storedReports).length > 0 ? JSON.parse(storedReports) : initialMockReports;
    } catch (error) {
      console.error("Failed to parse reports from localStorage", error);
      return initialMockReports;
    }
  });
  
  const [jiraConfig, setJiraConfig] = useState<JiraConfig | null>(() => {
    try {
      const storedConfig = window.localStorage.getItem('healthtest-jiraConfig');
      return storedConfig ? JSON.parse(storedConfig) : null;
    } catch (error) {
      console.error("Failed to parse Jira config from localStorage", error);
      return null;
    }
  });

  const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [requirementsData, setRequirementsData] = useState<RequirementsData | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [selectedCasesForTraceability, setSelectedCasesForTraceability] = useState<TestCase[] | null>(null);
  const [testCaseToImprove, setTestCaseToImprove] = useState<TestCase | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem('healthtest-testCases', JSON.stringify(testCases));
    } catch (error) {
      console.error("Failed to save test cases to localStorage", error);
    }
  }, [testCases]);
  
  useEffect(() => {
    try {
      window.localStorage.setItem('healthtest-requirements', JSON.stringify(requirements));
    } catch (error) {
      console.error("Failed to save requirements to localStorage", error);
    }
  }, [requirements]);

  useEffect(() => {
    try {
      window.localStorage.setItem('healthtest-reports', JSON.stringify(reports));
    } catch (error) {
      console.error("Failed to save reports to localStorage", error);
    }
  }, [reports]);

  useEffect(() => {
    try {
      if (jiraConfig) {
        window.localStorage.setItem('healthtest-jiraConfig', JSON.stringify(jiraConfig));
      } else {
        window.localStorage.removeItem('healthtest-jiraConfig');
      }
    } catch (error) {
      console.error("Failed to save Jira config to localStorage", error);
    }
  }, [jiraConfig]);

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const handleSuccess = (generatedCases: TestCase[]) => {
      setTestCases(prevCases => [...prevCases, ...generatedCases]);
      setProcessingState(ProcessingState.COMPLETE);
      setRequirementsData(null); // Clear data after successful generation
      setGenerationProgress(null);
      setActiveView('test-cases'); // Switch view on success
  };
  
  const handleError = (e: unknown) => {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate test cases. ${errorMessage}`);
      setProcessingState(ProcessingState.ERROR);
      setGenerationProgress(null);
      // Let the user see the error on the current screen (review or processing)
  };

  const handleStartGeneration = useCallback(async (data: { files?: File[], text?: string, source: RequirementsData['source'] }) => {
    setError(null);
    setProcessingState(ProcessingState.UPLOADING); // Initial state
    try {
      let text = '';
      let fileName: string | undefined;

      if (data.files && data.files.length > 0) {
        setProcessingState(ProcessingState.PARSING);
        text = await extractTextFromFiles(data.files);
        fileName = data.files.length > 1 ? `${data.files.length} files` : data.files[0].name;
      } else if (data.text) {
        text = data.text;
      }

      if (!text.trim()) {
        throw new Error("Input text is empty.");
      }
      
      setRequirementsData({ text, source: data.source, fileName });
      setActiveView('review');
      setProcessingState(ProcessingState.IDLE); // Reset for the review step

    } catch (e) {
       handleError(e);
       setActiveView('generate'); // Go back to generate on parsing error
    }
  }, []);
  
  const runGenerationProcess = useCallback(async (requirements: RequirementsData) => {
    try {
        setGenerationProgress({ step: 0, message: 'Analyzing Requirements', progress: 0 });
        await new Promise(resolve => setTimeout(resolve, 200));
        setGenerationProgress({ step: 0, message: 'Analyzing Requirements', progress: 10 });

        setGenerationProgress(prev => ({ ...prev!, step: 1, message: 'Extracting Requirements', progress: 20 }));
        const extractedReqs = await extractRequirements(requirements.text);
        const newRequirements = extractedReqs.map(r => ({...r, source: requirements.source}));
        setGenerationProgress(prev => ({ ...prev!, progress: 40 }));
        
        await new Promise(resolve => setTimeout(resolve, 200));
        setGenerationProgress(prev => ({ ...prev!, step: 2, message: 'Generating Test Cases' }));
        const generatedCases = await generateTestCases(requirements.text, requirements.source, newRequirements);
        setGenerationProgress(prev => ({ ...prev!, progress: 70 }));
        
        await new Promise(resolve => setTimeout(resolve, 200));
        setGenerationProgress(prev => ({ ...prev!, step: 3, message: 'Building Traceability', progress: 90 }));

        await new Promise(resolve => setTimeout(resolve, 200));
        setGenerationProgress(prev => ({ ...prev!, step: 4, message: 'Preparing Reports', progress: 100 }));
        
        setRequirements(prev => [...prev, ...newRequirements]);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        handleSuccess(generatedCases);
        setActiveView('traceability'); // Override view to show results

    } catch (e) {
        handleError(e);
        setActiveView('review');
    }
  }, []);

  const handleApproveAndGenerate = useCallback(async () => {
    if (!requirementsData) return;
    setError(null);
    setProcessingState(ProcessingState.GENERATING);
    setActiveView('processing');
    
    // Use a timeout to ensure the UI updates before the heavy async process starts
    setTimeout(() => {
        runGenerationProcess(requirementsData);
    }, 100);

  }, [requirementsData, runGenerationProcess]);

  const handleBulkUpdate = useCallback((ids: Set<string>, payload: BulkUpdatePayload) => {
      setTestCases(prevTestCases =>
          prevTestCases.map(tc => {
              if (ids.has(tc.id)) {
                  let updatedTc = { ...tc };
                  if (payload.status) {
                      updatedTc.status = payload.status;
                  }
                  if (payload.priority) {
                      updatedTc.priority = payload.priority;
                  }
                  if (payload.tags) {
                      if (payload.tags.mode === 'overwrite') {
                          updatedTc.tags = payload.tags.values;
                      } else { // append
                          const newTags = new Set([...updatedTc.tags, ...payload.tags.values]);
                          updatedTc.tags = Array.from(newTags);
                      }
                  }
                  return updatedTc;
              }
              return tc;
          })
      );
  }, []);
  
  const handleUpdateTestCase = useCallback((updatedTestCase: TestCase) => {
    setTestCases(prevTestCases => 
      prevTestCases.map(tc => tc.id === updatedTestCase.id ? updatedTestCase : tc)
    );
  }, []);

  const clearTraceabilitySelection = useCallback(() => {
    setSelectedCasesForTraceability(null);
  }, []);
  
  const handleImproveTestCase = useCallback((updatedTestCase: TestCase) => {
    setTestCases(prev => prev.map(tc => tc.id === updatedTestCase.id ? updatedTestCase : tc));
    setTestCaseToImprove(null); // Clear the state after update
    setActiveView('test-cases'); // Go back to the list
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} reports={reports} />;
      case 'generate':
        return <Generate 
                  onStartGeneration={handleStartGeneration}
                  processingState={processingState}
                  error={error}
                  jiraConfig={jiraConfig}
                  setActiveView={setActiveView}
                />;
      case 'review':
        return requirementsData ? <Review 
                  requirements={requirementsData}
                  onApprove={handleApproveAndGenerate}
                  onGoBack={() => { 
                    setError(null); 
                    setProcessingState(ProcessingState.IDLE);
                    setActiveView('generate'); 
                  }}
                  processingState={processingState}
                  error={error}
               /> : <Generate 
                  onStartGeneration={handleStartGeneration}
                  processingState={processingState}
                  error="Requirement data is missing. Please start over."
                  jiraConfig={jiraConfig}
                  setActiveView={setActiveView}
                />;
      case 'processing':
          return <Processing progress={generationProgress} />;
      case 'test-cases':
        return <GeneratedTestCases 
                  testCases={testCases} 
                  setActiveView={setActiveView} 
                  onBulkUpdate={handleBulkUpdate}
                  onUpdateTestCase={handleUpdateTestCase}
                  jiraConfig={jiraConfig}
                  onImproveTestCase={(tc) => {
                      setTestCaseToImprove(tc);
                      setActiveView('improve');
                  }}
                />;
      case 'integrations':
        return <Integrations jiraConfig={jiraConfig} setJiraConfig={setJiraConfig} />;
      case 'reports':
        return <Reports 
                  testCases={testCases} 
                  requirements={requirements}
                  reports={reports} 
                  setReports={setReports} 
                />;
      case 'traceability':
        return <Traceability 
                  requirements={requirements} 
                  testCases={testCases} 
                  setActiveView={setActiveView}
                  selectedTestCases={selectedCasesForTraceability}
                  onClearSelection={clearTraceabilitySelection}/>;
      case 'improve':
        return <Improve 
                  testCase={testCaseToImprove}
                  onTestCaseImproved={handleImproveTestCase}
                  setActiveView={setActiveView}
                />;
      case 'duplicates':
        return <Duplicates testCases={testCases} setTestCases={setTestCases} />;
      case 'impact-analysis':
        return <ImpactAnalysis testCases={testCases} onUpdateTestCase={handleUpdateTestCase} />;
      default:
        return <Dashboard setActiveView={setActiveView} reports={reports}/>;
    }
  };
  
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-background text-text-primary">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isCollapsed={isSidebarCollapsed} 
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        processingState={processingState}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onLogout={handleLogout} 
          processingState={processingState} 
          setActiveView={setActiveView} 
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          {renderView()}
        </main>
      </div>
      <AIAssistant testCases={testCases} reports={reports} setActiveView={setActiveView} activeView={activeView} />
    </div>
  );
};

export default App;