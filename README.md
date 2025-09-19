# MedTest AI: AI-Powered Medical Software Test Case Generation

MedTest AI is an intelligent, enterprise-grade web application designed to revolutionize the software validation process in the healthcare and medical device industries. It leverages the power of Google's Gemini API to automatically generate comprehensive, structured, and traceable test cases directly from requirement documents.

This platform significantly reduces manual effort, accelerates testing cycles, and enhances compliance by ensuring complete requirement coverage.

---

### ✨ Key Features

*   **Multi-Source Requirement Ingestion**: Generate test cases from various sources, including:
    *   **Document Uploads** (PDF, TXT, DOCX)
    *   **Jira Integration** for importing user stories and requirements
    *   **Manual Text Entry** for quick, on-the-fly generation
    *   **API Specifications** (OpenAPI/Swagger)
*   **AI-Powered Test Case Generation**: Analyzes content to generate detailed test cases with titles, descriptions, Gherkin-style steps, priorities, and expected outcomes.
*   **Comprehensive Test Management**: A central dashboard to view, filter, and search all generated test cases, featuring advanced capabilities like bulk updates for status, priority, and tags.
*   **Automated Traceability Matrix**: Automatically generates and visualizes a traceability matrix, linking every requirement to its corresponding test cases. Instantly identify coverage gaps (`Covered`, `Partial`, `Not Covered`) to ensure compliance and validation readiness.
*   **Insightful Dashboards & Reporting**:
    *   A main dashboard provides a high-level overview of key metrics.
    *   A dedicated reports view offers visual breakdowns of test data (e.g., Compliance Distribution, Priority Breakdown) through charts and a sortable report list.
*   **Advanced AI Toolkit**:
    *   **Test Impact Analysis**: Determines which tests are affected by new code changes.
    *   **Duplicate Detection**: Scans the test repository to find and merge redundant test cases.
    *   **Test Case Improvement**: Refactors existing test cases for better clarity and parameterization.
*   **Asynchronous Process Handling**: Long-running generation tasks can be monitored via a detailed progress screen, with a global header indicator for easy access.
*   **Modern & Responsive UI**: A clean, professional, and intuitive user interface built with React and Tailwind CSS, ensuring a seamless experience across all devices.

### 🏗️ Architecture Overview

MedTest AI is architected as a client-centric Single-Page Application (SPA). All business logic, rendering, and API interactions occur directly within the user's browser, providing a fast and responsive user experience without the need for a dedicated backend server.

*   **Client-Side Processing**: Requirement documents are parsed directly in the browser using `pdf.js`.
*   **Direct API Communication**: The frontend communicates directly with the Google Gemini API to perform all AI-related tasks.
*   **Local Persistence**: All generated data, including test cases, requirements, and reports, is persisted in the browser's `localStorage` for session continuity.

```ascii
     +----------------------------------+
     |           User's Browser         |
     +----------------------------------+
           |          ^
           |          |
User interacts with  |  Renders UI
           |          |
           v          |
+-------------------------------------+
|          React Frontend App         |
|  (UI, State Management, Logic)      |
|-------------------------------------|
| - Document Parsing (pdf.js)         |<--+
| - Test Management & UI              |   |
| - API Service Calls                 |   |
+-------------------------------------+   |
      |             ^      |              |
      | (Request)   |      |              |
      |             |      +--------------+ Stores/Retrieves
      v             |      | (Response)   | Data
+-------------------+----+ |            +-----------------+
|    Google Gemini API   | |            | localStorage    |
| (Generative AI Model)  | +------------>| (Browser        |
+------------------------+              |  Storage)       |
                                        +-----------------+
```

This serverless architecture makes the application easy to deploy and scale statically. However, it presents challenges for direct, cross-origin integrations (like Jira), which often require a backend proxy to handle CORS policies securely.

### 🚀 Core Workflow

1.  **Provide Requirements**: The user selects an input method in the **Generate** view (document upload, Jira, manual entry, or API spec).
2.  **AI Analysis & Review**: The application provides an AI-generated summary, identifies test categories, and estimates the number of test cases. The user reviews and approves this analysis.
3.  **Generation in Progress**: A visual progress screen shows the AI working through multiple steps: extracting requirements, generating test cases, and building the traceability matrix.
4.  **Manage & Analyze**: The user is directed to the results, where they can manage test cases in the **Generated Test Cases** view, analyze coverage in the **Traceability Matrix**, or review high-level data in the **Reports** view.

### 🛠️ Tech Stack

*   **Frontend**: React, TypeScript
*   **AI Engine**: Google Gemini API (`@google/genai`)
*   **Styling**: Tailwind CSS
*   **State Management**: React Hooks (`useState`, `useEffect`, `useMemo`)
*   **Data Persistence**: Browser `localStorage`
*   **Utilities**: `pdf.js` for client-side document parsing.

### 🧠 Future Architecture: Evolving with Vertex AI

To elevate MedTest AI from a powerful generator to an intelligent, context-aware platform, the next architectural evolution involves integrating Google Cloud's Vertex AI. This transforms the application into a full-stack solution, unlocking advanced capabilities through a machine learning backend.

*   **Backend Service**: A Node.js backend will be introduced to manage API requests, securely handle the Gemini API key, act as a proxy for integrations like Jira, and communicate with Vertex AI services.

*   **Vector Database with Vertex AI Vector Search**:
    *   Generated test cases and requirements will be converted into vector embeddings using Google's `text-embedding-004` model.
    *   These embeddings will be stored and indexed in **Vertex AI Vector Search**, a high-performance, scalable vector database.

*   **Retrieval-Augmented Generation (RAG)**: When generating new test cases, the system will first query Vertex AI Vector Search to find existing, semantically similar test cases. This context is then provided to the Gemini model, resulting in:
    *   **Higher Consistency**: New test cases will match the style, format, and terminology of existing ones.
    *   **Reduced Duplication**: The AI can avoid creating redundant tests.
    *   **Improved Quality**: Grounding the AI with relevant examples enhances the accuracy and relevance of the output.

*   **Semantic Search**: Users will be able to search for test cases based on their meaning and intent, not just keywords. For example, a search for "patient data privacy" could intelligently find test cases related to PHI encryption.