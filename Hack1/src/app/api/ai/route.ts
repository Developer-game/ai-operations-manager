import { NextRequest, NextResponse } from 'next/server';
import { sanitizeNoEmDash } from '@/lib/sanitizer';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyApVxehCHTtwcRsgyzDk7fgISQc6KXjjyQ';
const GEMMA_MODEL = process.env.GEMMA_MODEL || 'gemma-4-26b-a4b-it';

export async function POST(req: NextRequest) {
  try {
    const { prompt, history, context, userRole, userName } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required.' },
        { status: 400 }
      );
    }

    // Grounded Role-Aware System Prompt
    const roleTitle = userRole || 'Member';
    const callerName = userName || 'User';

    const systemInstructions = `You are the ClubOps AI Assistant for university student societies, powered by Google Gemma 4.
You are currently chatting with ${callerName}, whose role is "${roleTitle}".
Identity & Permissions Rules:
1. ONLY share information that this user is permitted to see based on their role:
   - Organiser: Allowed full access to all society metrics, events, all members, all tasks, teams, and role permissions.
   - Team Lead: Allowed access to their team's tasks, their team's members, upcoming events, and their own tasks. Cannot see other teams' private data.
   - Member: Allowed access ONLY to their own tasks, their events, and their team lead's name. Cannot see other members or society-wide administrative settings.
2. Grounded Data:
${JSON.stringify(context || {}, null, 2)}
3. Honesty: Only state facts that appear in the grounded data above. If a piece of data is missing or not assigned, state that clearly and honestly. Do not hallucinate or invent records.
4. Formatting Rules:
   - STRICTLY ZERO em dashes or en dashes anywhere. Use colons, commas, or parentheses instead.
   - Keep answers clear, friendly, helpful, and concise (2 to 4 sentences).
   - If the user asks for actions or duties, offer practical steps.`;

    // Construct multi-turn contents for Gemma 4
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // System prompt as initial user message or system instruction
    contents.push({
      role: 'user',
      parts: [{ text: systemInstructions }],
    });
    contents.push({
      role: 'model',
      parts: [
        {
          text: `Understood. I am ready to assist ${callerName} (${roleTitle}) with grounded information from ${context?.societyName || 'the society'}. I will never use em dashes and will respect all role permissions.`,
        },
      ],
    });

    // Append conversation history if available
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-8).forEach((item: { sender: 'user' | 'assistant'; text: string }) => {
        contents.push({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.text }],
        });
      });
    }

    // Append current prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Gemma 4 API non-200 response:', errText);
      return NextResponse.json({
        success: false,
        error: 'The AI model is temporarily unavailable. Please try again shortly.',
      }, { status: 502 });
    }

    const data = await response.json();
    const candidateParts = data?.candidates?.[0]?.content?.parts || [];

    // CRITICAL FIX: In Gemma 4 thinking models, part with thought: true is the scratchpad.
    // The final answer is the part without thought: true.
    let answerText = '';
    const nonThoughtPart = candidateParts.find((p: any) => !p.thought);
    if (nonThoughtPart && nonThoughtPart.text) {
      answerText = nonThoughtPart.text;
    } else {
      // Fallback to last part text
      answerText = candidateParts[candidateParts.length - 1]?.text || '';
    }

    const sanitized = sanitizeNoEmDash(answerText.trim());

    return NextResponse.json({
      success: true,
      reply: sanitized,
      modelUsed: GEMMA_MODEL,
    });
  } catch (err: any) {
    console.error('AI route error:', err);
    return NextResponse.json({
      success: false,
      error: 'Could not connect to AI service.',
    }, { status: 500 });
  }
}
