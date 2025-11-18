import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { transcriptId, question } = await request.json();

    if (!transcriptId || !question) {
      return NextResponse.json(
        { error: 'Missing transcriptId or question' },
        { status: 400 }
      );
    }

    // Get transcript from database to retrieve geminiDocumentId
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: transcript, error } = await supabase
      .from('transcripts')
      .select('geminiDocumentId, fileName, language')
      .eq('id', transcriptId)
      .single();

    if (error || !transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    if (!transcript.geminiDocumentId) {
      return NextResponse.json(
        { error: 'Transcript not indexed in Gemini. Try re-processing the file.' },
        { status: 400 }
      );
    }

    // Initialize Gemini client
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Query using the uploaded file directly (not File Search Store)
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                mimeType: 'text/plain',
                fileUri: transcript.geminiDocumentId,
              },
            },
            { text: question },
          ],
        },
      ],
    });

    const response = result.response;
    const answer = response.text();

    // Extract grounding metadata (citations)
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const citations = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      text: chunk.text,
      source: chunk.retrievalMetadata?.title || 'Unknown',
    })) || [];

    return NextResponse.json({
      answer,
      citations,
      metadata: {
        fileName: transcript.fileName,
        language: transcript.language,
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process question' },
      { status: 500 }
    );
  }
}
