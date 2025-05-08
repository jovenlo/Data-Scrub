// src/ai/flows/deduplicate-rows.ts
import Papa from 'papaparse';

export interface DeduplicateRowsInput {
  csvData: string;
}

export interface DeduplicateRowsOutput {
  cleanedCsvData: string;
}

export async function deduplicateRows(input: DeduplicateRowsInput): Promise<DeduplicateRowsOutput> {
  // Parse CSV data
  const results = Papa.parse(input.csvData, { header: true });
  
  // Create a Set to track unique rows
  const seen = new Set();
  const uniqueRows = results.data.filter((row: any) => {
    // Convert row to string for comparison
    const rowStr = JSON.stringify(row);
    if (seen.has(rowStr)) {
      return false;
    }
    seen.add(rowStr);
    return true;
  });

  // Convert back to CSV
  const cleanedCsvData = Papa.unparse(uniqueRows);
  
  return { cleanedCsvData };
}
