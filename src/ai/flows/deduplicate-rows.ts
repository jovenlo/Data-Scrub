// src/ai/flows/deduplicate-rows.ts
'use server';

/**
 * @fileOverview Deduplicates rows in a CSV dataset using GenAI to identify and remove likely duplicates.
 *
 * - deduplicateRows - A function that takes a CSV dataset as input and returns a cleaned CSV dataset with duplicates removed.
 * - DeduplicateRowsInput - The input type for the deduplicateRows function.
 * - DeduplicateRowsOutput - The return type for the deduplicateRows function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const DeduplicateRowsInputSchema = z.object({
  csvData: z
    .string()
    .describe('The CSV data to deduplicate, including headers.'),
});
export type DeduplicateRowsInput = z.infer<typeof DeduplicateRowsInputSchema>;

const DeduplicateRowsOutputSchema = z.object({
  cleanedCsvData: z
    .string()
    .describe('The cleaned CSV data with duplicate rows removed.'),
});
export type DeduplicateRowsOutput = z.infer<typeof DeduplicateRowsOutputSchema>;

export async function deduplicateRows(input: DeduplicateRowsInput): Promise<DeduplicateRowsOutput> {
  return deduplicateRowsFlow(input);
}

const deduplicateRowsPrompt = ai.definePrompt({
  name: 'deduplicateRowsPrompt',
  input: {
    schema: z.object({
      csvData: z
        .string()
        .describe('The CSV data to deduplicate, including headers.'),
    }),
  },
  output: {
    schema: z.object({
      cleanedCsvData: z
        .string()
        .describe('The cleaned CSV data with duplicate rows removed.'),
    }),
  },
  prompt: `You are an expert data cleaner. Your task is to remove duplicate rows from a given CSV dataset.

  Here is the CSV data:
  {{csvData}}

  Identify and remove rows that are likely to be duplicates based on data similarity. Return the cleaned CSV data, including the header row.
  Ensure that the output is valid CSV. Do not include any explanation or other text besides the cleaned CSV data.
  `,
});

const deduplicateRowsFlow = ai.defineFlow<
  typeof DeduplicateRowsInputSchema,
  typeof DeduplicateRowsOutputSchema
>({
  name: 'deduplicateRowsFlow',
  inputSchema: DeduplicateRowsInputSchema,
  outputSchema: DeduplicateRowsOutputSchema,
},
async input => {
  const {output} = await deduplicateRowsPrompt(input);
  return output!;
});
