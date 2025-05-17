// categorize-visit-purpose.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for categorizing the purpose of a visitor's visit using AI.
 *
 * The flow takes a visitor's purpose as input and returns a suggested category.
 * It exports:
 * - `categorizeVisitPurpose`: The main function to categorize the visit purpose.
 * - `CategorizeVisitPurposeInput`: The input type for the categorizeVisitPurpose function.
 * - `CategorizeVisitPurposeOutput`: The output type for the categorizeVisitPurpose function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeVisitPurposeInputSchema = z.object({
  purpose: z
    .string()
    .describe('The purpose of the visit as described by the visitor.'),
});
export type CategorizeVisitPurposeInput = z.infer<typeof CategorizeVisitPurposeInputSchema>;

const CategorizeVisitPurposeOutputSchema = z.object({
  suggestedCategory: z
    .string()
    .describe('The suggested category for the visit purpose.'),
});
export type CategorizeVisitPurposeOutput = z.infer<typeof CategorizeVisitPurposeOutputSchema>;

export async function categorizeVisitPurpose(input: CategorizeVisitPurposeInput): Promise<CategorizeVisitPurposeOutput> {
  return categorizeVisitPurposeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeVisitPurposePrompt',
  input: {schema: CategorizeVisitPurposeInputSchema},
  output: {schema: CategorizeVisitPurposeOutputSchema},
  prompt: `You are a receptionist AI, skilled at quickly categorizing the purpose of a visitor's visit.

  Given the visitor's stated purpose, suggest a single, concise category that best fits their description.

  Visitor's Purpose: {{{purpose}}}

  Respond ONLY with the single best category. Do not include any additional text or explanation.`,
});

const categorizeVisitPurposeFlow = ai.defineFlow(
  {
    name: 'categorizeVisitPurposeFlow',
    inputSchema: CategorizeVisitPurposeInputSchema,
    outputSchema: CategorizeVisitPurposeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
