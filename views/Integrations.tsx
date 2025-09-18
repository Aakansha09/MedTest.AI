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

interface IntegrationField {
    name: string;
    placeholder: string;
    type: 'text' | 'password';
}

interface Integration {
    id: string;
    title: string;
    category: string;
    description: string;
    logo: React.FC<React.SVGProps<SVGSVGElement>>;
    fields: IntegrationField[];
    connected: boolean;
}

const initialIntegrations: Integration[] = [
    { 
        id: "jira",
        title: "Jira Healthcare", 
        category: "Project Management", 
        description: "Import requirements and user stories, and push generated test cases back to Jira projects.", 
        logo: JiraIcon,
        fields: [
            { name: "Instance URL", placeholder: "https://your-company.atlassian.net", type: "text" },
            { name: "API Token", placeholder: "Enter your Jira API Token", type: "password" }
        ],
        connected: false 
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
        connected: false 
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
        connected: false 
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
        connected: false 
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
        connected: false 
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
        connected: false 
    },
];


const IntegrationCard: React.FC<{
    integration: Integration;
    onConnect: (id: string, formData: Record<string, string>) => void;
    onDisconnect: (id: string) => void;
}> = ({ integration, onConnect, onDisconnect }) => {
    const [formData, setFormData] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConnect(integration.id, formData);
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
                {integration.connected ? (
                    <div className="flex items-center justify-between">
                         <div className="inline-flex items-center text-sm font-medium text-green-600">
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            Connected
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => alert("Manage settings not implemented.")} className="p-2 text-text-secondary hover:bg-gray-100 rounded-md"><CogIcon className="w-5 h-5"/></button>
                            <button onClick={() => onDisconnect(integration.id)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200">Disconnect</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {integration.fields.map(field => (
                            <div key={field.name}>
                                <label className="text-xs font-medium text-text-secondary block mb-1.5">{field.name}</label>
                                <input
                                    type={field.type}
                                    name={field.name}
                                    placeholder={field.placeholder}
                                    onChange={handleInputChange}
                                    required
                                    className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                />
                            </div>
                        ))}
                        <button type="submit" className="w-full inline-flex items-center justify-center px-4 py-2 border border-border-color text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Save & Connect
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};


export const Integrations: React.FC = () => {
    const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);

    useEffect(() => {
        try {
            const storedIntegrations = window.localStorage.getItem('healthtest-integrations');
            if (storedIntegrations) {
                const connectedStatus = JSON.parse(storedIntegrations) as Record<string, boolean>;
                setIntegrations(prev => prev.map(int => ({
                    ...int,
                    connected: connectedStatus[int.id] || false,
                })));
            }
        } catch (error) {
            console.error("Failed to load integration statuses from localStorage", error);
        }
    }, []);

    const updateLocalStorage = (updatedIntegrations: Integration[]) => {
        try {
            const connectedStatus = updatedIntegrations.reduce((acc, int) => {
                acc[int.id] = int.connected;
                return acc;
            }, {} as Record<string, boolean>);
            window.localStorage.setItem('healthtest-integrations', JSON.stringify(connectedStatus));
        } catch (error)            {
            console.error("Failed to save integration statuses to localStorage", error);
        }
    };
    
    const handleConnect = (id: string, formData: Record<string, string>) => {
        console.log(`Connecting ${id} with data:`, formData); // Simulate API call
        const updatedIntegrations = integrations.map(int => 
            int.id === id ? { ...int, connected: true } : int
        );
        setIntegrations(updatedIntegrations);
        updateLocalStorage(updatedIntegrations);
        alert(`${integrations.find(i=>i.id===id)?.title} connected successfully! (simulation)`);
    };

    const handleDisconnect = (id: string) => {
        const updatedIntegrations = integrations.map(int => 
            int.id === id ? { ...int, connected: false } : int
        );
        setIntegrations(updatedIntegrations);
        updateLocalStorage(updatedIntegrations);
    };

  return (
    <div>
        <h1 className="text-3xl font-bold text-text-primary">Integrations</h1>
        <p className="mt-2 text-text-secondary mb-8">Connect your healthcare systems and development tools to streamline testing workflows.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map(item => 
                <IntegrationCard 
                    key={item.id} 
                    integration={item}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                />
            )}
        </div>
    </div>
  );
};
