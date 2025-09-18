import { GoogleGenAI, Type } from '@google/genai';
import { TestCase, AIAnalysis, Requirement } from '../types';

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
        description: "A list of applicable test case categories. Common values are Functional, Security, UI/UX, Negative, Performance."
      },
      estimatedTestCases: {
        type: Type.STRING,
        description: "An estimated range for the number of test cases to be generated (e.g., '18-24')."
      }
    },
    required: ["summary", "testCaseCategories", "estimatedTestCases"]
  };
  
  const prompt = `
    You are an expert QA analyst. Analyze the following software requirements and provide a high-level summary.
    1.  **Summary**: Write a brief, two-sentence summary of the core functionality described.
    2.  **Categories**: Identify the types of testing that would be relevant from this list: Functional, Security, UI/UX, Negative, Performance.
    3.  **Estimation**: Provide a realistic range for how many test cases could be generated (e.g., "10-15").

    Requirements Document Content:
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

    const prompt = `
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
      title: { type: Type.STRING, description: "A short, descriptive title for the test case (e.g., 'User Authentication - Valid Credentials')." },
      description: { type: Type.STRING, description: "A one-sentence summary explaining what this test case verifies." },
      requirementId: { type: Type.STRING, description: "The requirement ID this test case covers, e.g., REQ-01." },
      tags: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "A list of relevant tags like 'Functional', 'Security', 'UI/UX', 'Authentication', 'Performance'."
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

  const prompt = `
    You are an expert QA engineer specializing in medical software validation for a company called HealthTest AI.
    First, review this list of extracted requirements:
    --- (Requirements List) ---
    ${requirementsString}
    ---
    
    Now, based on the full requirements document provided below, generate a comprehensive list of structured test cases.
    For each requirement found in the text, create multiple test cases covering positive, negative, and edge-case scenarios.

    Instructions:
    1.  **Requirement ID**: YOU MUST link each test case to one of the requirement IDs from the list provided above (e.g., ${requirements.length > 0 ? requirements[0].id : 'REQ-001'}). THIS IS CRITICAL for traceability.
    2.  **ID Generation**: Create a unique ID for each test case that includes the requirement ID (e.g., TC-${requirements.length > 0 ? requirements[0].id : 'REQ-001'}-001).
    3.  **Title**: Write a short, descriptive title for the test case.
    4.  **Tags**: Classify each test case with multiple relevant tags (e.g., 'Functional', 'Security', 'Authentication').
    5.  **Priority**: Assign a priority ('Critical', 'High', 'Medium', 'Low') based on the requirement's importance.
    6.  **Status**: Set the initial status for all generated test cases to 'Draft'.
    7.  **Source**: Set the source for all test cases to '${source}'.
    8.  **Compliance**: Analyze the text and identify relevant medical/privacy compliance standards like HIPAA, GDPR, FDA, CLIA, SOC2. List them.
    9.  **Gherkin Syntax**: Format the 'steps' using Gherkin syntax (Given, When, Then).
    10. **Traceability**: Ensure each test case is detailed, unambiguous, and directly traceable to a requirement from the provided list.

    Requirements Document Content:
    ---
    ${documentContent}
    ---
  `;

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