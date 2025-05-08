// src/ai/flows/generate-data-report.ts
'use client';

/**
 * @fileOverview Generates a data report summarizing a CSV dataset using basic statistics.
 *
 * - generateDataReport - A function that takes CSV data and returns a textual report.
 * - GenerateDataReportInput - The input type for the generateDataReport function.
 * - GenerateDataReportOutput - The return type for the generateDataReport function.
 */

import Papa from 'papaparse';

export interface GenerateDataReportInput {
  csvData: string;
}

export interface GenerateDataReportOutput {
  report: string;
}

function calculateStats(data: any[], column: string) {
  const values = data
    .map(row => parseFloat(row[column]))
    .filter(val => !isNaN(val));

  if (values.length === 0) return null;

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate standard deviation
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  return {
    mean: mean.toFixed(2),
    median: median.toFixed(2),
    min: min.toFixed(2),
    max: max.toFixed(2),
    stdDev: stdDev.toFixed(2)
  };
}

function inferColumnType(data: any[], column: string) {
  const sampleSize = Math.min(100, data.length);
  const samples = data.slice(0, sampleSize).map(row => row[column]);
  
  // Count numeric values
  const numericCount = samples.filter(val => !isNaN(parseFloat(val)) && val !== '').length;
  const numericRatio = numericCount / samples.filter(val => val !== '').length;

  if (numericRatio > 0.8) return 'Numerical';
  return 'Categorical';
}

function calculateMissingPercentage(data: any[], column: string) {
  const totalRows = data.length;
  const missingCount = data.filter(row => !row[column] || row[column].trim() === '').length;
  return ((missingCount / totalRows) * 100).toFixed(1);
}

export async function generateDataReport(input: GenerateDataReportInput): Promise<GenerateDataReportOutput> {
  const results = Papa.parse(input.csvData, { header: true });
  const data = results.data;
  const columns = results.meta.fields || [];

  let report = '# Data Analysis Report\n\n';

  // Data Overview
  report += '## Data Overview\n\n';
  report += `* Number of rows: ${data.length}\n`;
  report += `* Number of columns: ${columns.length}\n\n`;

  // Column Analysis
  report += '## Column Analysis\n\n';
  for (const column of columns) {
    report += `### ${column}\n\n`;
    const type = inferColumnType(data, column);
    const missingPercentage = calculateMissingPercentage(data, column);
    
    report += `* Type: ${type}\n`;
    report += `* Missing values: ${missingPercentage}%\n`;

    if (type === 'Numerical') {
      const stats = calculateStats(data, column);
      if (stats) {
        report += `* Statistics:\n`;
        report += `  * Mean: ${stats.mean}\n`;
        report += `  * Median: ${stats.median}\n`;
        report += `  * Min: ${stats.min}\n`;
        report += `  * Max: ${stats.max}\n`;
        report += `  * Standard Deviation: ${stats.stdDev}\n`;
      }
    }
    report += '\n';
  }

  // Summary
  report += '## Summary\n\n';
  report += `This dataset contains ${data.length} records across ${columns.length} columns. `;
  report += `The data includes both numerical and categorical variables, with varying degrees of completeness. `;
  report += `Consider reviewing columns with high percentages of missing values for data quality improvement.\n`;

  return { report };
}
