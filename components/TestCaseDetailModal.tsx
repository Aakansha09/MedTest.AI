import React, { useState, useEffect, useRef } from 'react';
import { TestCase, TestCasePriority, TestCaseStatus } from '../types';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { XIcon } from './icons/XIcon';
import { PencilIcon } from './icons/PencilIcon';

interface TestCaseDetailModalProps {
    testCase: TestCase;
    onClose: () => void;
    onSave: (updatedTC: TestCase) => void;
}

const GherkinStep: React.FC<{ step: string }> = ({ step }) => {
    const match = step.match(/^(Given|When|Then|And|But)\s(.*)/);
    if (match) {
        return (
            <p>
                <span className="font-bold text-text-primary">{match[1]}</span>
                <span className="text-text-secondary"> {match[2]}</span>
            </p>
        );
    }
    return <p className="text-text-secondary">{step}</p>;
};

// Fix: Define arrays for dropdowns since TestCaseStatus and TestCasePriority are type aliases.
const testCaseStatuses: TestCaseStatus[] = ['Draft', 'Active', 'Under Review', 'Completed', 'Pending'];
const testCasePriorities: TestCasePriority[] = ['Low', 'Medium', 'High', 'Critical'];

export const TestCaseDetailModal: React.FC<TestCaseDetailModalProps> = ({ testCase, onClose, onSave }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(modalRef, onClose);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<TestCase>(testCase);

    useEffect(() => {
        setFormData(testCase);
        setIsEditing(false); 
    }, [testCase]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (name: 'tags' | 'compliance', value: string) => {
        setFormData(prev => ({...prev, [name]: value.split(',').map(s => s.trim()).filter(Boolean)}));
    }
    
    const handleSaveChanges = () => {
        onSave(formData);
    };

    const renderViewMode = () => (
        <>
            <div className="p-6 space-y-6">
                <p className="text-sm text-text-secondary">{formData.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                        <label className="block font-medium text-text-secondary">Status</label>
                        <p className="text-text-primary capitalize">{formData.status}</p>
                    </div>
                     <div>
                        <label className="block font-medium text-text-secondary">Priority</label>
                        <p className="text-text-primary">{formData.priority}</p>
                    </div>
                    <div>
                        <label className="block font-medium text-text-secondary">Tags</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {formData.tags.map(t => <span key={t} className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 text-text-secondary ring-1 ring-inset ring-gray-200">{t}</span>)}
                        </div>
                    </div>
                     <div>
                        <label className="block font-medium text-text-secondary">Compliance</label>
                         <div className="flex flex-wrap gap-1 mt-1">
                            {formData.compliance.map(c => <span key={c} className="px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 text-text-secondary ring-1 ring-inset ring-gray-200">{c}</span>)}
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-md font-semibold text-text-primary mb-2 border-b pb-2">Test Scenario</h3>
                    <div className="space-y-2 mt-4 text-sm">
                        {formData.steps.map((step, index) => <GherkinStep key={index} step={step} />)}
                    </div>
                </div>
                 <div>
                    <h3 className="text-md font-semibold text-text-primary mb-2 border-b pb-2">Expected Outcome</h3>
                    <p className="mt-2 text-sm text-text-secondary italic">{formData.expectedOutcome}</p>
                </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-border-color flex justify-end gap-3">
                <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-text-primary bg-white border border-border-color rounded-md hover:bg-gray-50">Close</button>
                <button onClick={() => setIsEditing(true)} type="button" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover">
                    <PencilIcon className="w-4 h-4 mr-2" /> Edit
                </button>
            </div>
        </>
    );

    const renderEditMode = () => (
        <>
            <div className="p-6 space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-1">Title</label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleInputChange} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5" />
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-1">Description</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={2} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-text-primary mb-1">Status</label>
                        <select name="status" id="status" value={formData.status} onChange={handleInputChange} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                            {/* Fix: Iterate over the testCaseStatuses array */}
                            {testCaseStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-text-primary mb-1">Priority</label>
                        <select name="priority" id="priority" value={formData.priority} onChange={handleInputChange} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                             {/* Fix: Iterate over the testCasePriorities array */}
                            {testCasePriorities.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                 <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-text-primary mb-1">Tags (comma-separated)</label>
                    <input type="text" name="tags" id="tags" value={formData.tags.join(', ')} onChange={(e) => handleArrayChange('tags', e.target.value)} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5" />
                </div>
                 <div>
                    <label htmlFor="steps" className="block text-sm font-medium text-text-primary mb-1">Steps</label>
                    <textarea name="steps" id="steps" value={formData.steps.join('\n')} onChange={(e) => setFormData(prev => ({...prev, steps: e.target.value.split('\n')}))} rows={5} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 font-mono"></textarea>
                </div>
                 <div>
                    <label htmlFor="expectedOutcome" className="block text-sm font-medium text-text-primary mb-1">Expected Outcome</label>
                    <textarea name="expectedOutcome" id="expectedOutcome" value={formData.expectedOutcome} onChange={handleInputChange} rows={2} className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"></textarea>
                </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-border-color flex justify-end gap-3">
                <button onClick={() => { setIsEditing(false); setFormData(testCase); }} type="button" className="px-4 py-2 text-sm font-medium text-text-primary bg-white border border-border-color rounded-md hover:bg-gray-50">Cancel</button>
                <button onClick={handleSaveChanges} type="button" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm">Save Changes</button>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div ref={modalRef} className="bg-surface rounded-lg shadow-xl w-full max-w-2xl transform transition-all my-8" role="dialog" aria-modal="true">
                 <div className="p-6 border-b border-border-color flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">{isEditing ? `Editing: ${formData.title}` : formData.title}</h2>
                        <p className="text-sm text-text-secondary mt-1 font-mono">{formData.id} &bull; Requirement: {formData.requirementId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mt-2 -mr-2 rounded-full hover:bg-gray-100" aria-label="Close">
                        <XIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                </div>
                {isEditing ? renderEditMode() : renderViewMode()}
            </div>
        </div>
    );
};
