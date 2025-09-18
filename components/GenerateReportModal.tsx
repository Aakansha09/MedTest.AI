import React, { useState } from 'react';
import { Report } from '../types';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon';

interface GenerateReportModalProps {
    onClose: () => void;
    onCreateReport: (details: Omit<Report, 'id' | 'date' | 'status' | 'testCaseCount' | 'fileSize' | 'fileType'>) => void;
}

export const GenerateReportModal: React.FC<GenerateReportModalProps> = ({ onClose, onCreateReport }) => {
    const modalRef = React.useRef<HTMLDivElement>(null);
    useOnClickOutside(modalRef, onClose);

    const [name, setName] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [scope, setScope] = useState('');
    const [tags, setTags] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !subtitle || !scope) {
            alert('Please fill out all fields.');
            return;
        }
        onCreateReport({ 
            name, 
            subtitle, 
            scope, 
            tags: tags.split(',').map(t => t.trim()).filter(Boolean) 
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div ref={modalRef} className="bg-surface rounded-lg shadow-xl w-full max-w-lg transform transition-all" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="p-6 border-b border-border-color flex justify-between items-center">
                    <h2 id="modal-title" className="text-xl font-bold text-text-primary">Generate New Report</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
                        <XIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="reportName" className="block text-sm font-medium text-text-primary mb-1">Report Name</label>
                            <input
                                type="text"
                                id="reportName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Q2 Security Analysis"
                                className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="reportSubtitle" className="block text-sm font-medium text-text-primary mb-1">Report Type / Subtitle</label>
                             <input
                                type="text"
                                id="reportSubtitle"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                placeholder="e.g., Compliance Summary"
                                className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                required
                            />
                        </div>
                         <div>
                            <label htmlFor="reportTags" className="block text-sm font-medium text-text-primary mb-1">Compliance Tags (comma-separated)</label>
                            <input
                                type="text"
                                id="reportTags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="e.g., HIPAA, SOC2, GDPR"
                                className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            />
                        </div>
                        <div>
                            <label htmlFor="reportScope" className="block text-sm font-medium text-text-primary mb-1">Scope</label>
                            <input
                                type="text"
                                id="reportScope"
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                                placeholder="e.g., All Systems, Patient Portal"
                                className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                required
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-border-color rounded-b-lg flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-white border border-border-color rounded-md hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Generate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};