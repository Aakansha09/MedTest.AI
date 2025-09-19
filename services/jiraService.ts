import { JiraConfig, JiraProject, JiraIssue, TestCase } from '../types';

const callJiraApi = async (config: JiraConfig, endpoint: string, options: RequestInit = {}) => {
    if (!config.url || !config.email || !config.token) {
        throw new Error("Jira configuration is incomplete.");
    }

    // Direct API call to user-provided URL. This requires the user's browser/network to handle CORS,
    // for example by using a browser extension for local development. A production setup would use a backend proxy.
    const fullUrl = `${config.url.replace(/\/$/, '')}${endpoint}`;

    const headers = new Headers({
        'Authorization': `Basic ${btoa(`${config.email}:${config.token}`)}`,
        'Accept': 'application/json',
        ...options.headers,
    });
    
    if (options.body) {
        headers.set('Content-Type', 'application/json');
    }

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers,
        });

        if (!response.ok) {
            // Add specific handling for 404 errors
            if (response.status === 404) {
                throw new Error(`Jira API Error (404 - Not Found): The API endpoint was not found. Please double-check that your Jira Instance URL is correct and does not include any extra paths (e.g., use 'https://company.atlassian.net', not 'https://company.atlassian.net/browse').`);
            }
            
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            const errorMessage = errorData?.errorMessages?.join(', ') || errorData?.message || 'An unknown error occurred';
            throw new Error(`Jira API Error (${response.status}): ${errorMessage}`);
        }

        if (response.status === 204 || response.status === 201) {
            return response.json().catch(() => null); // Handle successful but empty responses
        }
        
        return response.json();
    } catch (error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            const corsError = new Error("Direct connection to the Jira API from the browser was blocked by a security policy (CORS). This is an expected limitation for purely client-side applications.");
            (corsError as any).isCorsError = true;
            throw corsError;
        }
        // Re-throw other errors, including the ones we constructed from bad HTTP responses
        throw error;
    }
};

export const verifyConnection = async (config: JiraConfig) => {
    return callJiraApi(config, '/rest/api/3/myself');
};

export const getProjects = async (config: JiraConfig): Promise<JiraProject[]> => {
    const data = await callJiraApi(config, '/rest/api/3/project/search?maxResults=100');
    return data.values.map((p: any) => ({ id: p.id, key: p.key, name: p.name }));
};

export const getIssuesForProject = async (config: JiraConfig, projectKey: string): Promise<JiraIssue[]> => {
    const jql = `project = "${projectKey}" ORDER BY created DESC`;
    const data = await callJiraApi(config, `/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=summary,description,issuetype`);
    return data.issues;
};


const formatTestCaseToAdf = (testCase: TestCase) => {
    return {
        version: 1,
        type: "doc",
        content: [
            {
                type: "paragraph",
                content: [{ type: "text", text: testCase.description }]
            },
            {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Details" }]
            },
            {
                type: "bulletList",
                content: [
                    { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: `Requirement ID: ${testCase.requirementId}`}] }]},
                    { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: `Priority: ${testCase.priority}`}] }]},
                    { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: `Compliance: ${testCase.compliance.join(', ')}`}] }]},
                ]
            },
            {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Steps" }]
            },
            {
                type: "orderedList",
                content: testCase.steps.map(step => ({
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: step }] }]
                }))
            },
            {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Expected Outcome" }]
            },
            {
                type: "panel",
                attrs: { panelType: "info" },
                content: [
                    {
                        type: "paragraph",
                        content: [{ type: "text", text: testCase.expectedOutcome }]
                    }
                ]
            }
        ]
    };
};

export const createIssue = async (config: JiraConfig, projectId: string, issueTypeName: string, testCase: TestCase) => {
    const body = {
        fields: {
            project: {
                id: projectId
            },
            summary: testCase.title,
            description: formatTestCaseToAdf(testCase),
            issuetype: {
                name: issueTypeName
            },
            labels: testCase.tags,
        }
    };

    return callJiraApi(config, '/rest/api/3/issue', {
        method: 'POST',
        body: JSON.stringify(body),
    });
};