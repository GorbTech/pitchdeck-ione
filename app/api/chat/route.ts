import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Fetch prompt from admin database
async function getPromptFromAdmin(): Promise<string> {
  try {
    const adminUrl = process.env.ADMIN_API_URL || 'http://localhost:3737';
    const response = await fetch(`${adminUrl}/api/ai-contexts/pitchdeck`);
    if (response.ok) {
      const data = await response.json();
      return data.prompt_template || getDefaultPrompt();
    }
  } catch (e) {
    console.error('Failed to fetch prompt from admin:', e);
  }
  return getDefaultPrompt();
}

function getDefaultPrompt(): string {
  return `You are iONE, an AI assistant for the iONE autonomous energy station pitch deck.

iONE is an autonomous solar-powered energy station:
- 4.32 kWp dual-axis solar tracking
- 16-48 kWh LiFePO4 battery storage
- Operating range: -60°C to +75°C
- 200+ km/h wind resistance (stealth fold)
- 25-year design life
- Deploy in 30 minutes, 2 people
- No concrete, no crane, no permits

Answer questions concisely and professionally. If you don't know something, say so.`;
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== 'string' || question.trim().length < 2) {
      return NextResponse.json({
        error: 'Please enter a valid question.',
      }, { status: 400 });
    }

    const systemPrompt = await getPromptFromAdmin();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `${systemPrompt}

User question: ${question}

Provide a helpful, concise answer:`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return NextResponse.json({
      answer,
      status: 'OK',
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({
      error: 'Failed to process your question. Please try again.',
    }, { status: 500 });
  }
}
