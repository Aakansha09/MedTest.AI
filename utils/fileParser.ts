import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';

// Set the worker source for pdf.js, which is required for it to run in the browser.
// The URL is sourced from a reliable CDN.
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs';

/**
 * Extracts text content from a PDF file.
 * @param file The PDF file to process.
 * @returns A promise that resolves with the extracted text content.
 */
const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    // Load the PDF document from the ArrayBuffer.
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
    // Iterate through each page of the PDF.
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Concatenate the text from all items on the page.
        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
        fullText += pageText + '\n\n'; // Add newlines for separation between pages.
    }
    return fullText;
};

/**
 * Extracts text from plain text files (e.g., .md, .xml, .txt).
 * @param file The text file to read.
 * @returns A promise that resolves with the file's content as a string.
 */
const extractTextFromTextFile = (file: File): Promise<string> => {
    return file.text();
};

/**
 * Processes an array of files, extracting text from each based on its MIME type.
 * @param files An array of File objects to process.
 * @returns A promise that resolves with a single string containing the concatenated text from all supported files.
 */
export const extractTextFromFiles = async (files: File[]): Promise<string> => {
    const extractionPromises = files.map(file => {
        if (file.type === 'application/pdf') {
            return extractTextFromPdf(file);
        }
        // Handle plain text, markdown, and xml files.
        if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.xml')) {
            return extractTextFromTextFile(file);
        }
        // For unsupported file types like .docx, warn the user.
        console.warn(`Unsupported file type for client-side extraction: ${file.name}`);
        // A full implementation for .docx would require a library like mammoth.js.
        return Promise.resolve(`[Content of '${file.name}' cannot be read. This file type is not supported for text extraction in the browser.]`);
    });

    const allTexts = await Promise.all(extractionPromises);
    // Join the content from all files, separated by a clear marker.
    return allTexts.join('\n\n--- (New Document) ---\n\n');
};
