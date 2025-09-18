export type TestCaseStatus = 'Active' | 'Under Review' | 'Completed' | 'Draft' | 'Pending';
export type TestCasePriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface TestCase {
  id: string;
  title: string;
  description: string;
  requirementId: string;
  tags: string[];
  priority: TestCasePriority;
  status: TestCaseStatus;
  source: string;
  compliance: string[];
  steps: string[];
  expectedOutcome: string;
  dateCreated: string;
}

export enum ProcessingState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PARSING = 'PARSING',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

export type View = 'dashboard' | 'generate' | 'review' | 'processing' | 'test-cases' | 'integrations' | 'reports' | 'traceability' | 'settings' | 'help';

export interface AIAnalysis {
  summary: string;
  testCaseCategories: string[];
  estimatedTestCases: string;
}

export interface RequirementsData {
  text: string;
  source: 'Document Upload' | 'Manual Entry' | 'Jira';
  fileName?: string;
}

export interface GenerationProgress {
    step: number;
    progress: number;
    message: string;
}

export type ReportStatus = 'Completed' | 'Failed' | 'Processing' | 'Pending';
// Fix: Removed unused ReportType
// export type ReportType = 'Compliance' | 'Functional' | 'Security' | 'Validation';

export interface Report {
  id: string;
  name: string;
  subtitle: string;
  tags: string[];
  date: string;
  scope: string;
  status: ReportStatus;
  testCaseCount: number;
  fileSize: string;
  fileType: 'PDF' | 'CSV';
  // Fix: Added optional data property for report details and charts.
  data?: Record<string, number>;
}

export interface Requirement {
  id: string;
  description: string;
  module: string;
  source: string;
}

export type RequirementStatus = 'Covered' | 'Partial' | 'Not Covered';

export interface RequirementTraceability {
  id: string;
  description: string;
  linkedTestCases: TestCase[];
  status: RequirementStatus;
  source: string;
  module: string;
  priority: TestCasePriority;
  compliance: string[];
}

export interface BulkUpdatePayload {
  status?: TestCaseStatus;
  priority?: TestCasePriority;
  tags?: {
    mode: 'append' | 'overwrite';
    values: string[];
  };
}
