import React, { useState, useEffect } from 'react';
import { PlusIcon } from '../components/icons/PlusIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { JiraIcon } from '../components/icons/JiraIcon';
import { AzureDevOpsIcon } from '../components/icons/AzureDevOpsIcon';
import { GitHubIcon } from '../components/icons/GitHubIcon';
import { EpicSystemsIcon } from '../components/icons/EpicSystemsIcon';
import { CernerIcon } from '../components/icons/CernerIcon';
import { FhirIcon } from '../components/icons/FhirIcon';
import { CogIcon } from '../components/icons/CogIcon';
import { JiraConfig } from '../types';
import { verifyConnection } from '../services/jiraService';
import { LoaderIcon } from '../components/icons/LoaderIcon';
import { InfoIcon } from '../components/icons/InfoIcon';

interface IntegrationField {
    name: string;
    placeholder: string;
    type: 'text' | 'password' | 'email';
}

interface Integration {
    id: string;
    title: string;
    category: string;
    description: string;
    logo: React.FC<React.SVGProps<SVGSVGElement>>;
    fields: IntegrationField[];
}

const allIntegrations: Integration[] = [
    { 
        id: "jira",
        title: "Jira Healthcare", 
        category: "Project Management", 
        description: "Import requirements and user stories, and push generated test cases back to Jira projects.", 
        logo: JiraIcon,
        fields: [
            { name: "Instance URL", placeholder: "https://your-company.atlassian.net", type: "text" },
            { name: "Email", placeholder: "your-email@company.com", type: "email" },
            { name: "API Token", placeholder: "Enter your Jira API Token", type: "password" }
        ],
    },
    { 
        id: "azure",
        title: "Azure DevOps", 
        category: "DevOps", 
        description: "Sync with Azure DevOps healthcare project work items for seamless requirement and test case management.", 
        logo: AzureDevOpsIcon,
        fields: [
            { name: "Organization URL", placeholder: "https://dev.azure.com/your-org", type: "text" },
            { name: "Personal Access Token", placeholder: "Enter your PAT", type: "password" }
        ],
    },
    { 
        id: "github",
        title: "GitHub Enterprise", 
        category: "Version Control", 
        description: "Import healthcare application requirements from GitHub issues and sync test cases.", 
        logo: GitHubIcon,
        fields: [
            { name: "Repository URL", placeholder: "https://github.com/org/repo", type: "text" },
            { name: "Personal Access Token", placeholder: "Enter your PAT", type: "password" }
        ],
    },
    { 
        id: "epic",
        title: "Epic Systems", 
        category: "EMR/EHR", 
        description: "Import patient workflows and clinical requirements directly from your Epic EMR instance.", 
        logo: EpicSystemsIcon,
        fields: [
            { name: "FHIR Endpoint URL", placeholder: "https://your-epic-fhir-endpoint", type: "text" },
            { name: "API Key", placeholder: "Enter your Epic API Key", type: "password" }
        ],
    },
    { 
        id: "cerner",
        title: "Cerner PowerChart", 
        category: "EMR/EHR", 
        description: "Sync with Cerner clinical documentation, workflows, and patient data requirements.", 
        logo: CernerIcon,
        fields: [
            { name: "FHIR Endpoint URL", placeholder: "https://your-cerner-fhir-endpoint", type: "text" },
            { name: "API Key", placeholder: "Enter your Cerner API Key", type: "password" }
        ],
    },
    { 
        id: "fhir",
        title: "HL7 FHIR Server", 
        category: "Standards", 
        description: "Connect to any HL7 FHIR-compliant server to import healthcare interoperability standards and requirements.", 
        logo: FhirIcon,
        fields: [
            { name: "Server Base URL", placeholder: "https://your-fhir-server.com/api", type: "text" },
            { name: "Auth Token", placeholder: "Enter your Bearer Token", type: "password" }
        ],
    },
];

interface IntegrationsProps {
    jiraConfig: JiraConfig | null;
    setJiraConfig: (config: JiraConfig | null) => void;
}

const CorsErrorHelp: React.FC<{ error: string }> = ({ error }) => (
    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-sm">
        <div className="flex items-start">
            <InfoIcon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
                <h4 className="font-semibold mb-1">Browser Security Restriction (CORS)</h4>
                <p className="mb-3">{error}</p>
                <p className="font-semibold mb-1">How to resolve this:</p>
                <ul className="list-disc list-inside space-y-2 text-xs">
                    <li>
                        <strong>For Local Development:</strong> The easiest solution is to use a browser extension that disables the CORS policy. Search for "CORS Unblock" or a similar extension for your browser.
                    </li>
                    <li>
                        <strong>For Production Use:</strong> This application's architecture requires a backend proxy to securely handle requests to the Jira API. This is the standard, secure way to bypass browser CORS limitations.
                    </li>
                </ul>
            </div>
        </div>
    </div>
);

const IntegrationCard: React.FC<{
    integration: Integration;
    jiraConfig: JiraConfig | null;
    setJiraConfig: (config: JiraConfig | null) => void;
}> = ({ integration, jiraConfig, setJiraConfig }) => {
    const isJira = integration.id === 'jira';
    const connected = isJira && jiraConfig?.connected;

    const [formData, setFormData] = useState<Record<string, string>>({
        "Instance URL": jiraConfig?.url || '',
        "Email": jiraConfig?.email || '',
        "API Token": jiraConfig?.token || '',
    });
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [isCorsError, setIsCorsError] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isJira) {
            alert('This integration is not yet implemented.');
            return;
        }
        setIsConnecting(true);
        setConnectionError(null);
        setIsCorsError(false);
        const config: JiraConfig = {
            url: formData["Instance URL"],
            email: formData["Email"],
            token: formData["API Token"],
            connected: false,
        };

        try {
            await verifyConnection(config);
            setJiraConfig({ ...config, connected: true });
        } catch (err: any) {
            setIsCorsError(!!err.isCorsError);
            setConnectionError(err instanceof Error ? err.message : "Connection failed due to an unknown error.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        if(isJira) setJiraConfig(null);
    };

    return (
        <div className="bg-surface border border-border-color rounded-lg p-6 flex flex-col transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100">
                    <integration.logo className="h-6 w-6 text-text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-text-primary">{integration.title}</h3>
                    <p className="text-sm text-text-secondary">{integration.category}</p>
                </div>
            </div>
            <p className="text-sm text-text-secondary mt-4 flex-1">{integration.description}</p>
            
            <div className="mt-6">
                {connected ? (
                    <div className="flex items-center justify-between">
                         <div className="inline-flex items-center text-sm font-medium text-green-600">
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            Connected
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => alert("Manage settings not implemented.")} className="p-2 text-text-secondary hover:bg-gray-100 rounded-md"><CogIcon className="w-5 h-5"/></button>
                            <button onClick={handleDisconnect} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">Disconnect</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleConnect} className="space-y-4">
                         {connectionError && (
                            isCorsError 
                            ? <CorsErrorHelp error={connectionError} />
                            : <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
                                <strong>Connection Failed:</strong> {connectionError}
                              </div>
                        )}
                        {integration.fields.map(field => (
                            <div key={field.name}>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">{field.name}</label>
                                <input
                                    type={field.type}
                                    name={field.name}
                                    placeholder={field.placeholder}
                                    value={formData[field.name] || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                />
                            </div>
                        ))}
                        <button type="submit" disabled={isConnecting} className="w-full inline-flex items-center justify-center px-4 py-2 border border-border-color text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                            {isConnecting ? (
                                <>
                                    <LoaderIcon className="w-5 h-5 mr-2" /> Connecting...
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="w-5 h-5 mr-2" /> Save & Connect
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};


export const Integrations: React.FC<IntegrationsProps> = ({ jiraConfig, setJiraConfig }) => {
  return (
    <div>
        <h1 className="text-3xl font-bold text-text-primary">Integrations</h1>
        <p className="mt-2 text-text-secondary mb-8">Connect your healthcare systems and development tools to streamline testing workflows.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allIntegrations.map(item => 
                <IntegrationCard 
                    key={item.id} 
                    integration={item}
                    jiraConfig={jiraConfig}
                    setJiraConfig={setJiraConfig}
                />
            )}
        </div>
    </div>
  );
};