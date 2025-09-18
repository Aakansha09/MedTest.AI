import React from 'react';
import { Report } from '../types';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { BarChart } from './BarChart';
import { XIcon } from './icons/XIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { exportReportDataAsJSON } from '../utils/exportUtils';

interface ReportDetailModalProps {
    report: Report;
    onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose }) => {
    const modalRef = React.useRef<HTMLDivElement>(null);
    useOnClickOutside(modalRef, onClose);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div ref={modalRef} className="bg-surface rounded-lg shadow-xl w-full max-w-2xl transform transition-all" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="p-6 border-b border-border-color flex justify-between items-start">
                    <div>
                        <h2 id="modal-title" className="text-xl font-bold text-text-primary">{report.name}</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Generated on {new Date(report.date).toLocaleString()} &bull; Scope: {report.scope}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
                        <XIcon className="w-6 h-6 text-text-secondary" />
                    </button>
                </div>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-text-primary">Compliance Summary</h3>
                    <p className="text-sm text-text-secondary mb-6">Test case distribution by compliance standard.</p>
                    {/* Fix: Check if report.data exists and has keys before rendering BarChart. */}
                    {report.data && Object.keys(report.data).length > 0 ? (
                        <BarChart data={report.data} />
                    ) : (
                         <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-text-secondary">No data available for this report.</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t border-border-color rounded-b-lg flex justify-end">
                    <button
                        onClick={() => exportReportDataAsJSON(report)}
                        className="inline-flex items-center justify-center px-4 py-2 border border-border-color text-sm font-medium rounded-md text-text-primary bg-surface hover:bg-gray-100"
                    >
                       <DownloadIcon className="w-5 h-5 mr-2" />
                       Download JSON
                    </button>
                </div>
            </div>
        </div>
    );
};
