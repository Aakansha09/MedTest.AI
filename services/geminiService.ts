import { GoogleGenAI, Type } from '@google/genai';
import { TestCase, AIAnalysis, Requirement, Report, DuplicatePairResponse, ImpactAnalysisResponse, View } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const callGemini = async (prompt: string, schema: any, model = 'gemini-2.5-flash') => {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
       throw new Error("The AI returned a malformed response. Please try again.");
    }
    throw new Error("The AI failed to process the request. Please check the API key and document content.");
  }
};


export const analyzeRequirements = async (documentContent: string): Promise<AIAnalysis> => {
  const analysisSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: "A concise, two-sentence summary of the requirements." },
      testCaseCategories: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "A list of applicable test case categories. Common values are Functional, Security, UI/UX, Negative, Performance, API."
      },
      estimatedTestCases: {
        type: Type.STRING,
        description: "An estimated range for the number of test cases to be generated (e.g., '18-24')."
      }
    },
    required: ["summary", "testCaseCategories", "estimatedTestCases"]
  };
  
  const prompt = `
    You are an expert QA analyst. Analyze the following software requirements or API specification and provide a high-level summary.
    1.  **Summary**: Write a brief, two-sentence summary of the core functionality described.
    2.  **Categories**: Identify the types of testing that would be relevant from this list: Functional, Security, UI/UX, Negative, Performance, API. If it is an API spec, 'API' must be included.
    3.  **Estimation**: Provide a realistic range for how many test cases could be generated (e.g., "10-15").

    Document Content:
    ---
    ${documentContent}
    ---
  `;
  
  return await callGemini(prompt, analysisSchema);
};

export const extractRequirements = async (documentContent: string): Promise<Omit<Requirement, 'source'>[]> => {
    const requirementSchema = {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "A unique identifier for the requirement, e.g., REQ-001." },
            description: { type: Type.STRING, description: "The full text of the requirement." },
            module: { type: Type.STRING, description: "A high-level module or feature area for the requirement (e.g., 'Authentication', 'Patient Portal', 'Security')." },
        },
        required: ["id", "description", "module"],
    };
    
    const requirementArraySchema = {
        type: Type.ARRAY,
        items: requirementSchema,
    };
    
    // Check if the content is likely an API spec
    const isApiSpec = documentContent.trim().match(/^(openapi|swagger|asyncapi|paths|components|servers|info):/im);

    let prompt: string;

    if (isApiSpec) {
        prompt = `
            You are a senior business analyst specializing in API design.
            Analyze the following API specification and extract each endpoint (a combination of a path and an HTTP method) as a distinct requirement.

            Instructions:
            1.  **Identify**: Find all paths and their associated HTTP methods (GET, POST, PUT, DELETE, etc.).
            2.  **ID Generation**: Assign a unique, sequential ID to each endpoint (e.g., REQ-API-001, REQ-API-002).
            3.  **Description**: Create a description in the format: "[METHOD] [path] - [summary/description]". For example, "GET /users/{id} - Retrieve a specific user".
            4.  **Module**: Categorize the endpoint into a module based on its primary path segment. For example, '/users/{id}' would be in the 'Users API' module.

            API Specification Content:
            ---
            ${documentContent}
            ---
        `;
    } else {
        prompt = `
            You are a senior business analyst specializing in medical software. 
            Analyze the following software requirements document and extract each distinct functional or non-functional requirement.

            Instructions:
            1.  **Identify**: Read through the document and identify individual, testable requirements.
            2.  **ID Generation**: Assign a unique, sequential ID to each requirement (e.g., REQ-001, REQ-002).
            3.  **Description**: Capture the full text of the requirement.
            4.  **Module**: Categorize the requirement into a high-level module like 'Authentication', 'Clinical', 'Security', or 'Integrations'.

            Requirements Document Content:
            ---
            ${documentContent}
            ---
        `;
    }

    const extractedRequirements = await callGemini(prompt, requirementArraySchema);
    if (!Array.isArray(extractedRequirements)) {
        throw new Error("AI response for requirements is not in the expected array format.");
    }
    return extractedRequirements as Omit<Requirement, 'source'>[];
};


export const generateTestCases = async (
  documentContent: string,
  source: string,
  requirements: Requirement[],
): Promise<TestCase[]> => {
  const testCaseSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "A unique identifier for the test case, e.g., TC-MED-REQ01-001." },
      title: { type: Type.STRING, description: "A short, descriptive title for the test case (e.g., 'API - User Authentication - Valid Credentials')." },
      description: { type: Type.STRING, description: "A one-sentence summary explaining what this test case verifies." },
      requirementId: { type: Type.STRING, description: "The requirement ID this test case covers, e.g., REQ-01." },
      tags: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "A list of relevant tags. The first tag MUST be a primary testing type like 'Functional', 'Security', 'Performance', 'API', 'Integration', 'Usability', or 'Boundary'. For API-related tests, the first tag must be 'API'. Ensure a wide variety of primary tags are used where appropriate."
      },
      priority: {
        type: Type.STRING,
        enum: ['Critical', 'High', 'Medium', 'Low'],
        description: "The priority of the test case based on requirement importance and potential impact."
      },
      status: {
        type: Type.STRING,
        enum: ['Draft'],
        description: "The initial status of the test case. Always set to 'Draft'."
      },
      source: {
        type: Type.STRING,
        description: `The origin of the requirement. Set this to '${source}'.`
      },
      compliance: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of relevant compliance standards inferred from the text (e.g., HIPAA, GDPR, FDA)."
      },
      steps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of steps to execute the test, formatted in Gherkin syntax (e.g., 'Given...', 'When...', 'Then...')."
      },
      expectedOutcome: { type: Type.STRING, description: "The expected result after executing the steps." },
    },
    required: ["id", "title", "description", "requirementId", "tags", "priority", "status", "source", "compliance", "steps", "expectedOutcome"],
  };
  
   const testCaseArraySchema = {
    type: Type.ARRAY,
    items: testCaseSchema,
  };
  
  const requirementsString = requirements.map(r => `- ${r.id}: ${r.description}`).join('\n');
  let prompt: string;
  
  if (source === 'API Spec') {
    prompt = `
        You are an expert QA automation engineer specializing in API testing for a company called HealthTest AI.
        Based on the OpenAPI/Swagger specification provided below, generate a comprehensive list of structured test cases.
        For each endpoint listed in the requirements, create multiple test cases covering different scenarios.

        Instructions:
        1.  **Requirement ID**: YOU MUST link each test case to one of the requirement IDs from the list provided above (e.g., ${requirements.length > 0 ? requirements[0].id : 'REQ-API-001'}). Each ID represents an API endpoint. THIS IS CRITICAL.
        2.  **ID Generation**: Create a unique ID for each test case that includes a hint of the endpoint and a sequence number (e.g., TC-API-GET_USERS-001).
        3.  **Title**: Write a descriptive title reflecting the test's purpose (e.g., 'GET /users - Success - Retrieve all users').
        4.  **Tags**: The first tag MUST be 'API'. Add other relevant tags like 'Functional', 'Security', 'Performance', 'Negative', 'Authorization', 'Boundary'.
        5.  **Test Case Diversity**: For each endpoint, generate a diverse set of test cases:
            *   **Successful Requests (2xx)**: Test with valid inputs.
            *   **Invalid Input (4xx)**: Test for bad requests (e.g., wrong data types, missing required fields).
            *   **Authorization (401/403)**: Test for scenarios with missing or invalid authentication/authorization tokens.
            *   **Not Found (404)**: Test for requests to non-existent resources (e.g., GET /users/nonexistent_id).
            *   **Security**: Include at least one basic security test per endpoint where applicable (e.g., testing for SQL Injection in a query parameter).
        6.  **Gherkin Syntax**: Format the 'steps' using Gherkin syntax (Given, When, Then). Steps should describe setting up the request (headers, body, params), sending it, and asserting the response status code and body.
        7.  **Source**: Set the source for all test cases to '${source}'.
        8.  **Priority**: Assign priority based on the endpoint's importance. Happy path tests are often 'High', while edge cases might be 'Medium'.
        9.  **Status**: Set the initial status for all generated test cases to 'Draft'.

        Extracted API Endpoints (for Requirement ID mapping):
        ---
        ${requirementsString}
        ---

        API Specification Content:
        ---
        ${documentContent}
        ---
      `;
  } else {
    prompt = `
        You are an expert QA engineer specializing in medical software validation for a company called HealthTest AI.
        First, review this list of extracted requirements:
        --- (Requirements List) ---
        ${requirementsString}
        ---
        
        Now, based on the full requirements document provided below, generate a comprehensive list of structured test cases.
        For each requirement found in the text, create multiple test cases covering different testing types.

        Instructions:
        1.  **Requirement ID**: YOU MUST link each test case to one of the requirement IDs from the list provided above (e.g., ${requirements.length > 0 ? requirements[0].id : 'REQ-001'}). THIS IS CRITICAL for traceability.
        2.  **ID Generation**: Create a unique ID for each test case that includes the requirement ID (e.g., TC-${requirements.length > 0 ? requirements[0].id : 'REQ-001'}-001).
        3.  **Title**: Write a short, descriptive title that reflects its type (e.g., 'API Security - SQL Injection on Login').
        4.  **Tags**: YOU MUST accurately classify each test case. The first tag must be a primary testing type: 'Functional', 'Security', 'Performance', 'API', 'Integration', 'Usability', or 'Boundary'. If the test case is for an API endpoint, the primary tag MUST be 'API', and you can add other relevant tags like 'Functional' or 'Negative'. For example, a test for a non-existent API resource could be tagged ['API', 'Functional', 'Negative'].
        5.  **Priority**: Assign a priority ('Critical', 'High', 'Medium', 'Low') based on the requirement's importance. Security and critical functional tests are often 'Critical' or 'High'.
        6.  **Status**: Set the initial status for all generated test cases to 'Draft'.
        7.  **Source**: Set the source for all test cases to '${source}'.
        8.  **Compliance**: Analyze the text and identify relevant medical/privacy compliance standards like HIPAA, GDPR, FDA, CLIA, SOC2. List them.
        9.  **Gherkin Syntax**: Format the 'steps' using Gherkin syntax (Given, When, Then).
        10. **Traceability**: Ensure each test case is detailed, unambiguous, and directly traceable to a requirement from the provided list.
        11. **API Specifics**: If a requirement describes an API endpoint, generate a diverse set of test cases covering: valid requests (200 OK), invalid inputs (400 Bad Request), non-existent resources (404 Not Found), authentication/authorization errors (401/403), schema validation failures (422), and potential security vulnerabilities.
        12. **Diversity**: Generate a balanced set of test cases. Do not just create functional tests. Actively look for opportunities to create Security (e.g., injection, access control), Performance (e.g., load test scenario), and Boundary (e.g., testing limits) test cases.

        Requirements Document Content:
        ---
        ${documentContent}
        ---
      `;
  }

  const generatedFromAI = await callGemini(prompt, testCaseArraySchema);
  
  if (!Array.isArray(generatedFromAI)) {
      throw new Error("AI response is not in the expected array format.");
  }
    
  // Add dateCreated programmatically for accuracy
  const processedTestCases: TestCase[] = (generatedFromAI as Omit<TestCase, 'dateCreated'>[]).map(tc => ({
    ...tc,
    dateCreated: new Date().toISOString(),
  }));

  return processedTestCases;
};

export const improveTestCase = async (testCase: TestCase): Promise<TestCase> => {
  const testCaseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING }, description: { type: Type.STRING },
      steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      expectedOutcome: { type: Type.STRING },
      priority: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'] },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["title", "description", "steps", "expectedOutcome", "priority", "tags"]
  };

  const prompt = `
    You are a QA expert specializing in test case optimization.
    Analyze the following test case and improve it for better clarity, maintainability, and efficiency.

    Instructions:
    1.  **Clarity**: Rephrase steps and descriptions to be more concise and unambiguous.
    2.  **Parameterization**: Identify hardcoded values (e.g., usernames, specific data) and replace them with parameterized variables in curly braces (e.g., {username}, {patientId}).
    3.  **Best Practices**: Ensure Gherkin syntax (Given, When, Then) is used correctly and logically.
    4.  **Content Only**: Only modify the 'title', 'description', 'steps', 'expectedOutcome', 'priority', and 'tags'. Do not change any other fields.

    Original Test Case JSON:
    ---
    ${JSON.stringify({
      title: testCase.title,
      description: testCase.description,
      steps: testCase.steps,
      expectedOutcome: testCase.expectedOutcome,
      priority: testCase.priority,
      tags: testCase.tags,
    }, null, 2)}
    ---

    Return only the improved fields in a single JSON object.
  `;
  
  const improvedData = await callGemini(prompt, testCaseSchema);
  return { ...testCase, ...improvedData };
};

export const automateTestCase = async (testCase: TestCase): Promise<string> => {
  const schema = {
    type: Type.OBJECT,
    properties: {
      script: {
        type: Type.STRING,
        description: "The generated codeless test script as a single string, with each step on a new line."
      }
    },
    required: ["script"]
  };
  
  const prompt = `
    You are an expert in test automation. Convert the following manual test case into a simple, human-readable, codeless automation script.
    The script should represent actions a user would take. Use simple commands and assume selectors can be found for elements.

    Example format:
    // Test Case: ${testCase.id} - ${testCase.title}
    navigate to "/login"
    type "{username}" into input with selector "#email"
    type "{password}" into input with selector "#password"
    click element with selector "#login-button"
    wait for element with selector "#dashboard" to be visible
    assert element with selector "#welcome-message" contains text "Welcome"

    Manual Test Case:
    ---
    Title: ${testCase.title}
    Steps:
    ${testCase.steps.join('\n')}
    Expected Outcome: ${testCase.expectedOutcome}
    ---

    Generate the script now.
  `;
  
  const result = await callGemini(prompt, schema);
  return result.script;
};

export const detectDuplicateTestCases = async (testCases: TestCase[]): Promise<DuplicatePairResponse[]> => {
  const duplicatePairSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "A unique ID for the pair, formatted as 'TC1_ID-TC2_ID'." },
      testCase1Id: { type: Type.STRING, description: "The ID of the first test case in the duplicate pair." },
      testCase2Id: { type: Type.STRING, description: "The ID of the second test case in the duplicate pair." },
      similarity: { type: Type.NUMBER, description: "A percentage similarity score from 80 to 100." },
      rationale: { type: Type.STRING, description: "A brief, one-sentence explanation for why these are duplicates." }
    },
    required: ["id", "testCase1Id", "testCase2Id", "similarity", "rationale"]
  };
  
  const schema = { type: Type.ARRAY, items: duplicatePairSchema };

  const summarizedTestCases = testCases.map(tc => ({
    id: tc.id,
    title: tc.title,
    description: tc.description,
    steps: tc.steps.join('; '),
    outcome: tc.expectedOutcome
  }));
  
  const prompt = `
    You are an expert QA analyst tasked with identifying duplicate test cases to reduce redundancy.
    Analyze the following list of test cases. Identify pairs that are highly similar or functionally identical.

    Instructions:
    1.  **Compare**: Compare each test case against every other based on title, description, steps, and outcome.
    2.  **Identify Duplicates**: Find cases testing the same functionality, even if worded differently.
    3.  **Threshold**: Only return pairs with a similarity score of 80 or higher.
    4.  **Rationale**: Briefly explain why the pair is a duplicate.
    5.  **Format**: Return an array of objects. The test case with the lexicographically smaller ID must be 'testCase1Id'.

    List of Test Cases:
    ---
    ${JSON.stringify(summarizedTestCases, null, 2)}
    ---

    If no duplicates are found, you MUST return an empty array.
  `;
  
  const result = await callGemini(prompt, schema);
  if (!Array.isArray(result)) {
    console.error("AI did not return an array for duplicate detection.");
    return [];
  }
  return result as DuplicatePairResponse[];
};

export const analyzeTestImpact = async (changes: string, testCases: TestCase[]): Promise<ImpactAnalysisResponse[]> => {
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        testCaseId: { type: Type.STRING, description: "The ID of the impacted test case." },
        rationale: { type: Type.STRING, description: "A concise, one-sentence explanation for why this test is recommended." },
        recommendedPriority: { type: Type.STRING, enum: ["P0", "P1", "P2"], description: "The dynamic priority for this specific test run." },
        suggestion: { type: Type.STRING, enum: ["Run as-is", "Review recommended", "Update required", "Potentially obsolete"], description: "A brief suggestion for action on this test case based on the changes." }
      },
      required: ["testCaseId", "rationale", "recommendedPriority", "suggestion"]
    }
  };

  const summarizedTestCases = testCases.map(tc => ({
    id: tc.id,
    title: tc.title,
    description: tc.description,
  }));

  const prompt = `
    You are an expert QA lead responsible for creating an efficient regression test plan.
    Analyze the provided development changes (code diffs, commit messages, or Jira tickets) and determine the most critical subset of existing test cases to run.

    Your goal is to maximize confidence while minimizing testing time.

    Instructions:
    1.  **Analyze Changes**: Review the development changes provided below.
    2.  **Select Impacted Tests**: From the list of all available test cases, select only those that are directly or indirectly impacted by these changes.
    3.  **Provide Rationale**: For each selected test case, provide a concise rationale explaining *why* it should be included in the test plan.
    4.  **Assign Priority**: Assign a dynamic priority for this specific test run:
        *   'P0' (Must Run): For test cases covering critical functionality directly affected by the changes.
        *   'P1' (Should Run): For test cases covering related functionality or important integration points.
        *   'P2' (Optional): For lower-priority or less related tests that could be run if time permits.
    5.  **Suggest Action**: For each selected test case, provide a suggestion for what action to take. The suggestion MUST be one of: 'Run as-is', 'Review recommended', 'Update required', or 'Potentially obsolete'.
    6.  **Be Selective**: Only include test cases that are relevant. Do not include every test case. If no tests are impacted, return an empty array.

    Development Changes:
    ---
    ${changes}
    ---

    Available Test Cases:
    ---
    ${JSON.stringify(summarizedTestCases, null, 2)}
    ---

    Return your analysis as a JSON array of objects.
  `;

  const result = await callGemini(prompt, responseSchema);
  if (!Array.isArray(result)) {
    console.error("AI did not return an array for impact analysis.");
    return [];
  }
  return result as ImpactAnalysisResponse[];
};

export const healTestCase = async (
  testCase: TestCase,
  developmentChanges: string,
  impactRationale: string
): Promise<Partial<TestCase>> => {
  const schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "The updated test case title." },
      description: { type: Type.STRING, description: "The updated test case description." },
      steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "The updated, Gherkin-formatted steps." },
      expectedOutcome: { type: Type.STRING, description: "The updated expected outcome." },
    },
    // No fields are required, as the AI might not change all of them.
  };

  const prompt = `
    You are an expert QA engineer specializing in test case maintenance.
    A test case has been impacted by recent development changes. Your task is to "auto-heal" the test case by updating it to be consistent with the changes.

    Analyze the following information:
    1. The Original Test Case.
    2. The Development Changes that were made.
    3. The AI-generated Rationale for why this test case is impacted.

    Your goal is to rewrite the test case fields to reflect the new reality after the changes.
    - Modify the title, description, steps (in Gherkin), and expected outcome as needed.
    - Ensure the updated test case accurately validates the feature after the described changes.
    - If a value was parameterized (e.g., /api/users/{id}), keep it parameterized.

    ---
    ORIGINAL TEST CASE:
    ${JSON.stringify({
      title: testCase.title,
      description: testCase.description,
      steps: testCase.steps,
      expectedOutcome: testCase.expectedOutcome,
    }, null, 2)}
    ---
    DEVELOPMENT CHANGES:
    ${developmentChanges}
    ---
    IMPACT RATIONALE:
    ${impactRationale}
    ---

    Return a JSON object containing ONLY the fields that you have changed (title, description, steps, expectedOutcome). Do not return fields that remain the same. If no changes are needed, return an empty JSON object.
  `;

  return await callGemini(prompt, schema);
};

export const getAIAssistantResponse = async (
  prompt: string,
  testCases: TestCase[],
  reports: Report[],
): Promise<string> => {
    try {
        const testCasesContext = JSON.stringify(testCases.slice(0, 20).map(tc => ({ id: tc.id, title: tc.title, priority: tc.priority, status: tc.status, tags: tc.tags, compliance: tc.compliance })));
        const reportsContext = JSON.stringify(reports.map(r => ({ id: r.id, name: r.name, subtitle: r.subtitle, status: r.status, scope: r.scope })));
        
        const categories = Array.from(new Set(testCases.map(tc => tc.tags[0]).filter(Boolean)));

        const systemInstruction = `You are "MedTest AI Assistant", a friendly and helpful QA assistant.
        - Your purpose is to answer questions about the user's test cases and reports using the provided JSON data.
        - If the user asks for a 'test distribution', 'test breakdown by category', or similar, you MUST respond ONLY with a JSON string in the format: {"action": "show_test_distribution_by_category"}.
        - If the user asks to 'export a report', 'download a report' or similar, you MUST respond ONLY with a JSON string in the format: {"action": "request_category_selection", "categories": ${JSON.stringify(categories)}}.
        - If the user asks to 'analyze impact', 'run impact analysis', or similar, you MUST respond ONLY with a JSON string in the format: {"action": "navigate_to_impact_analysis"}.
        - If the user asks to 'find duplicates', 'check for duplicates', or similar, you MUST respond ONLY with a JSON string in the format: {"action": "navigate_to_duplicates"}.
        - For any other question, provide a concise, conversational answer.
        - If you don't know the answer or the data is not available, say so politely.
        - Current Date: ${new Date().toLocaleDateString()}`;

        const fullPrompt = `
            CONTEXT:
            Test Cases: ${testCasesContext}
            Reports: ${reportsContext}

            USER'S QUESTION:
            "${prompt}"
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
              systemInstruction,
            }
        });

        return response.text;
    } catch (error) {
        console.error("AI Assistant API call failed:", error);
        return "I'm sorry, I encountered an error while trying to process your request. Please try again later.";
    }
};