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

export type View = 'dashboard' | 'generate' | 'review' | 'processing' | 'test-cases' | 'integrations' | 'reports' | 'traceability' | 'settings' | 'help' | 'improve' | 'duplicates' | 'impact-analysis';

export interface AIAnalysis {
  summary: string;
  testCaseCategories: string[];
  estimatedTestCases: string;
}

export interface RequirementsData {
  text: string;
  source: 'Document Upload' | 'Manual Entry' | 'Jira' | 'API Spec';
  fileName?: string;
}

export interface GenerationProgress {
    step: number;
    progress: number;
    message: string;
}

export type ReportStatus = 'Completed' | 'Failed' | 'Processing' | 'Pending';
export type ReportType = 'Compliance Summary' | 'Priority Distribution' | 'Source Analysis' | 'Type Breakdown' | 'Performance Report' | 'Security Audit' | 'Coverage Report' | 'Executive Summary' | 'Custom';


export interface Report {
  id: string;
  name: string;
  subtitle: ReportType;
  tags: string[];
  date: string;
  scope: string;
  status: ReportStatus;
  testCaseCount: number;
  fileSize: string;
  fileType: 'PDF' | 'CSV';
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

export interface JiraConfig {
    url: string;
    email: string;
    token: string;
    connected: boolean;
}

export interface JiraProject {
    id: string;
    key: string;
    name: string;
}

export interface JiraIssue {
    id: string;
    key: string;
    fields: {
        summary: string;
        description: any; // Atlassian Document Format
        issuetype: {
            name: string;
        }
    };
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text?: string;
  type?: 'text' | 'chart' | 'report_selection' | 'format_selection' | 'category_selection';
  chartData?: Record<string, number>;
  reports?: { id: string; name: string }[];
  reportId?: string;
  categories?: string[];
}

export interface DuplicatePairResponse {
  id: string;
  testCase1Id: string;
  testCase2Id: string;
  similarity: number;
  rationale: string;
}

export interface DuplicatePairViewData {
  id: string;
  testCase1: TestCase;
  testCase2: TestCase;
  similarity: number;
  rationale: string;
}

export type RecommendedPriority = 'P0' | 'P1' | 'P2';
export type ImpactSuggestion = 'Run as-is' | 'Review recommended' | 'Update required' | 'Potentially obsolete';

export interface ImpactAnalysisResponse {
  testCaseId: string;
  rationale: string;
  recommendedPriority: RecommendedPriority;
  suggestion: ImpactSuggestion;
}

export interface ImpactAnalysisResult {
  testCase: TestCase;
  rationale: string;
  recommendedPriority: RecommendedPriority;
  suggestion: ImpactSuggestion;
}
