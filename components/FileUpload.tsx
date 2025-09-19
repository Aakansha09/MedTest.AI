import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  processing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, processing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset the input value to allow re-uploading the same file
    if (e.target) {
        e.target.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  return (
    <>
      <div
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary-light' : 'border-border-color bg-background'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !processing && fileInputRef.current?.click()}
      >
        <UploadIcon className="w-12 h-12 mx-auto text-text-secondary" />
        <h3 className="mt-4 text-lg font-semibold text-text-primary">Upload requirements documents</h3>
        <p className="mt-1 text-sm text-text-secondary">Supported formats: PDF, DOC, DOCX, TXT</p>
        <p className="mt-4 text-sm text-text-secondary">or</p>
        <button
          type="button"
          disabled={processing}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-md text-text-primary bg-surface border border-border-color hover:bg-gray-50 disabled:opacity-50"
        >
          Browse Files
        </button>
      </div>
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,.xml,.doc,.docx" onChange={handleFileChange} className="hidden" disabled={processing} />
    </>
  );
};
