
// src/app/api/categorize-visit/route.ts
import {NextResponse, type NextRequest} from 'next/server';
import {categorizeVisitPurpose, type CategorizeVisitPurposeInput} from '@/ai/flows/categorize-visit-purpose';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CategorizeVisitPurposeInput;

    if (!body.purpose || typeof body.purpose !== 'string') {
      return NextResponse.json({error: 'Purpose is required and must be a string.'}, {status: 400});
    }

    const result = await categorizeVisitPurpose({purpose: body.purpose});
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in categorize-visit API:', error);
    // Check if error is an instance of Error to safely access message
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({error: 'Failed to categorize visit purpose.', details: errorMessage}, {status: 500});
  }
}
