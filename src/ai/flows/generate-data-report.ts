
// src/ai/flows/generate-data-report.ts
'use server';

/**
 * @fileOverview Generates a data report summarizing a CSV dataset using GenAI.
 *
 * - generateDataReport - A function that takes CSV data and returns a textual report.
 * - GenerateDataReportInput - The input type for the generateDataReport function.
 * - GenerateDataReportOutput - The return type for the generateDataReport function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateDataReportInputSchema = z.object({
  csvData: z
    .string()
    .describe('The CSV data to analyze, including headers.'),
});
export type GenerateDataReportInput = z.infer<typeof GenerateDataReportInputSchema>;

const GenerateDataReportOutputSchema = z.object({
  report: z
    .string()
    .describe('A comprehensive textual report summarizing the provided CSV data.'),
});
export type GenerateDataReportOutput = z.infer<typeof GenerateDataReportOutputSchema>;

export async function generateDataReport(input: GenerateDataReportInput): Promise<GenerateDataReportOutput> {
  return generateDataReportFlow(input);
}

const generateDataReportPrompt = ai.definePrompt({
  name: 'generateDataReportPrompt',
  input: {
    schema: z.object({
      csvData: z
        .string()
        .describe('The CSV data to analyze, including headers.'),
    }),
  },
  output: {
    schema: z.object({
      report: z
        .string()
        .describe('A comprehensive textual report summarizing the provided CSV data.'),
    }),
  },
  // Updated prompt for clarity and robustness
  prompt: `You are an expert data analyst. Your task is to analyze the provided CSV data and generate a comprehensive textual report.

Here is the CSV data:
\`\`\`csv
{{csvData}}
\`\`\`

Your report should include the following sections, formatted clearly using Markdown:

1.  **Data Overview:**
    *   Number of rows (excluding the header).
    *   Number of columns.

2.  **Column Analysis:**
    *   For each column, list its name.
    *   Infer its data type (e.g., Numerical, Categorical, Text, Date, Boolean).
    *   Calculate and state the percentage of missing/empty values (formatted to one decimal place, e.g., 15.2%).

3.  **Basic Statistics (for Numerical columns):**
    *   For columns identified as Numerical:
        *   Provide Mean, Median, Minimum (Min), Maximum (Max), and Standard Deviation (Std Dev).
        *   Format numerical statistics to two decimal places (e.g., 123.45).
    *   If a statistic cannot be calculated for a numerical column (e.g., due to non-numeric entries mixed in, or only one data point for Std Dev), clearly state "N/A" or "Cannot calculate" for that specific statistic and briefly mention the reason if obvious (e.g., "contains non-numeric values"). Do not halt the entire analysis.

4.  **Key Insights & Observations:**
    *   Identify any potential patterns, trends, or relationships between columns you observe.
    *   Point out any significant outliers or unusual distributions in numerical columns.
    *   Mention potential data quality issues you notice (e.g., inconsistent formatting, high percentage of missing values in an important column, seemingly incorrect values).
    *   Suggest potential next steps for analysis or cleaning based on the findings.

5.  **Summary:**
    *   Provide a brief overall summary paragraph describing the dataset's main characteristics and potential usefulness based on your analysis.

**Important Considerations:**
*   Ensure the entire output is valid Markdown.
*   If the provided dataset is extremely large, state that the analysis might be based on a representative sample of the data to ensure timely processing.
*   Handle potential errors in parsing or calculations gracefully within the report where possible (as described for statistics).
`,
});

const generateDataReportFlow = ai.defineFlow<
  typeof GenerateDataReportInputSchema,
  typeof GenerateDataReportOutputSchema
>({
  name: 'generateDataReportFlow',
  inputSchema: GenerateDataReportInputSchema,
  outputSchema: GenerateDataReportOutputSchema,
},
async input => {
  // Add basic input validation if needed (e.g., check if csvData is empty)
   if (!input.csvData || input.csvData.trim().split('\n').length < 2) {
     // Handle case with no data or only headers
     return { report: "Input CSV data is missing, empty, or contains only a header row. Cannot generate report." };
   }

  const {output} = await generateDataReportPrompt(input);
  // Add basic output validation/sanitization if needed
  return output!;
});
