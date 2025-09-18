import React, { useState, useRef } from 'react';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { BulkUpdatePayload, TestCasePriority, TestCaseStatus } from '../types';
import { XIcon } from './icons/XIcon';

interface BulkEditModalProps {
    onClose: () => void;
    onConfirm: (payload: BulkUpdatePayload) => void;
    selectedCount: number;
    actionType: 'status' | 'priority' | 'tags';
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({ onClose, onConfirm, selectedCount, actionType }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(modalRef, onClose);

    const [status, setStatus] = useState<TestCaseStatus>('Draft');
    const [priority, setPriority] = useState<TestCasePriority>('Medium');
    const [tags, setTags] = useState('');
    const [tagMode, setTagMode] = useState<'append' | 'overwrite'>('append');

    const handleSubmit = () => {
        let payload: BulkUpdatePayload = {};
        switch (actionType) {
            case 'status':
                payload = { status };
                break;
            case 'priority':
                payload = { priority };
                break;
            case 'tags':
                if (tags.trim()) {
                    payload = {
                        tags: {
                            mode: tagMode,
                            values: tags.split(',').map(t => t.trim()).filter(Boolean),
                        },
                    };
                }
                break;
        }
        onConfirm(payload);
    };

    const renderContent = () => {
        switch (actionType) {
            case 'status':
                return (
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-text-primary mb-1">New Status</label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as TestCaseStatus)}
                            className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        >
                            <option value="Draft">Draft</option>
                            <option value="Active">Active</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                );
            case 'priority':
                return (
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-text-primary mb-1">New Priority</label>
                        <select
                            id="priority"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as TestCasePriority)}
                            className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                );
            case 'tags':
                return (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-text-primary mb-1">Tags (comma-separated)</label>
                            <input
                                type="text"
                                id="tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="e.g., Regression, UI, v2.1"
                                className="bg-background border border-border-color text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            />
                        </div>
                        <div>
                            <span className="block text-sm font-medium text-text-primary mb-2">Mode</span>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input type="radio" name="tagMode" value="append" checked={tagMode === 'append'} onChange={() => setTagMode('append')} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                                    <span className="ml-2 text-sm text-text-secondary">Append to existing tags</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="tagMode" value="overwrite" checked={tagMode === 'overwrite'} onChange={() => setTagMode('overwrite')} className="h-4 w-4 text-primary focus:ring-primary border-gray-300" />
                                    <span className="ml-2 text-sm text-text-secondary">Overwrite existing tags</span>
                                </label>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    
    const title = `Bulk Edit: Change ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div ref={modalRef} className="bg-surface rounded-lg shadow-xl w-full max-w-md" role="dialog" aria-modal="true">
                <div className="p-4 border-b border-border-color flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <XIcon className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-text-secondary mb-4">You are about to update <span className="font-bold text-text-primary">{selectedCount}</span> selected test case(s).</p>
                    {renderContent()}
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-border-color flex justify-end gap-3">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-text-primary bg-white border border-border-color rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} type="button" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm">
                        Confirm Update
                    </button>
                </div>
            </div>
        </div>
    );
};