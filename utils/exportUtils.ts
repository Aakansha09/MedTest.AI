import { TestCase, RequirementTraceability, Report } from '../types';

const escapeCSVField = (field: string | string[]): string => {
  const value = Array.isArray(field) ? field.join('; ') : String(field);
  return `"${value.replace(/"/g, '""')}"`;
};

export const exportAsCSV = (testCases: TestCase[], filename: string = 'test-cases'): void => {
  const headers = ['id', 'title', 'description', 'requirementId', 'priority', 'status', 'tags', 'source', 'compliance', 'steps', 'expectedOutcome'];
  
  const rows = testCases.map(tc => {
    const stepsString = tc.steps.join('\n');
    return [
      escapeCSVField(tc.id),
      escapeCSVField(tc.title),
      escapeCSVField(tc.description),
      escapeCSVField(tc.requirementId),
      escapeCSVField(tc.priority),
      escapeCSVField(tc.status),
      escapeCSVField(tc.tags),
      escapeCSVField(tc.source),
      escapeCSVField(tc.compliance),
      escapeCSVField(stepsString),
      escapeCSVField(tc.expectedOutcome),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-t;' });
  const link = document.createElement('a');
  if (link.href) {
    URL.revokeObjectURL(link.href);
  }
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAsJSON = (testCases: TestCase[]): void => {
  const jsonContent = JSON.stringify(testCases, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.href) {
    URL.revokeObjectURL(link.href);
  }
  link.href = URL.createObjectURL(blob);
  link.download = 'test-cases.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportReportDataAsJSON = (report: Report): void => {
  // Fix: Handle optional 'data' property by providing a default empty object.
  const jsonContent = JSON.stringify(report.data || {}, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${report.name.replace(/\s+/g, '_')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const exportReportDataAsCSV = (report: Report): void => {
  const data = report.data || {};
  if (Object.keys(data).length === 0) {
    console.warn("Report data is empty, exporting an empty CSV.");
  }
  const headers = ['Category', 'Value'];
  const rows = Object.entries(data).map(([key, value]) => 
    [escapeCSVField(key), escapeCSVField(String(value))].join(',')
  );
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${report.name.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportReportDataAsPDF = (report: Report): void => {
  const data = report.data || {};
  const title = report.name;
  const date = `Generated on: ${new Date(report.date).toLocaleString()}`;
  const scope = `Scope: ${report.scope}`;
  
  let content = `
    REPORT: ${title}\n
    ${'='.repeat(title.length + 8)}\n\n
    ${date}\n
    ${scope}\n
    \n
    ----------------------------------------\n
    COMPLIANCE SUMMARY DATA\n
    ----------------------------------------\n
  `;

  if (Object.keys(data).length > 0) {
    Object.entries(data).forEach(([key, value]) => {
      content += `${key.padEnd(25)}: ${value}\n`;
    });
  } else {
    content += "\nNo data available for this report.\n";
  }

  content += `\n\n--- End of Report ---`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  // Note: Saving a text file as .pdf. A real implementation would use a library like jsPDF.
  link.download = `${report.name.replace(/\s+/g, '_')}.pdf`; 
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportTraceabilityMatrixCSV = (items: RequirementTraceability[]): void => {
  const headers = ['Requirement ID', 'Description', 'Status', 'Linked Test Case IDs'];
  
  const rows = items.map(item => [
    escapeCSVField(item.id),
    escapeCSVField(item.description),
    escapeCSVField(item.status),
    escapeCSVField(item.linkedTestCases.map(tc => tc.id).join('; ')),
  ].join(','));
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'traceability-matrix.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};