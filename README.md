## MedTest AI: AI-Powered Medical Software Test Case Generation

MedTest AI is an intelligent, enterprise-grade web application designed to revolutionize the software validation process in the healthcare and medical device industries. It leverages the power of Google's Gemini API to automatically generate comprehensive, structured, and traceable test cases directly from requirement documents.

This platform significantly reduces manual effort, accelerates testing cycles, and enhances compliance by ensuring complete requirement coverage.

---

### ✨ Key Features

*   **AI-Powered Test Case Generation**: Upload requirement documents (PDF, TXT, DOCX), paste raw text, or connect to project management tools. Our AI analyzes the content and generates detailed test cases, including titles, descriptions, Gherkin-style steps, and expected outcomes.
*   **Automated Traceability Matrix**: Automatically generates and visualizes a traceability matrix, linking every requirement to its corresponding test cases. Instantly identify coverage gaps (`Covered`, `Partial`, `Not Covered`) to ensure compliance and validation readiness.
*   **Comprehensive Test Management**: A central dashboard to view, filter, and search all generated test cases. Features advanced capabilities like:
    *   **Bulk Actions**: Select multiple test cases to efficiently update their status, priority, or tags simultaneously.
*   **Insightful Dashboards & Reporting**:
    *   A main dashboard provides a high-level overview of key metrics like test coverage, compliance distribution, and generation statistics.
    *   A dedicated reports view offers visual breakdowns of test data through charts and sortable report lists.
*   **Asynchronous Process Handling**: Long-running generation tasks can be monitored via a detailed progress screen. A global header indicator allows users to navigate away and return to the in-progress task at any time.
*   **Integration-Ready**: Designed to connect with essential industry tools like Jira, Azure DevOps, and EHR/EMR systems (Epic, Cerner) to create a seamless workflow.
*   **Modern & Responsive UI**: A clean, professional, and intuitive user interface built with React and Tailwind CSS, ensuring a seamless experience across all devices.

### 🛠️ Tech Stack

*   **Frontend**: React, TypeScript
*   **AI Engine**: Google Gemini API (`@google/genai`)
*   **Styling**: Tailwind CSS
*   **State Management**: React Hooks (`useState`, `useEffect`, `useMemo`)
*   **Data Persistence**: Browser `localStorage` for session persistence of test cases, reports, and requirements.
*   **Utilities**: `pdf.js` for client-side document parsing.

### 🚀 Core Workflow

1.  **Provide Requirements**: The user uploads a document or pastes text in the **Generate** view.
2.  **AI Analysis & Review**: The application provides an AI-generated summary, identifies test categories, and estimates the number of test cases. The user reviews and approves this analysis.
3.  **Generation in Progress**: A visual progress screen shows the AI working through multiple steps: extracting requirements, generating test cases, and building the traceability matrix.
4.  **Manage & Analyze**: The user is directed to the results, where they can manage test cases in the **Generated Test Cases** view, analyze coverage in the **Traceability Matrix**, or review high-level data in the **Reports** view.
