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

    const systemInstructions = `You are Rally AI, the direct and intelligent operations assistant for university student societies.
You are currently assisting ${callerName} (${roleTitle}).

CRITICAL INSTRUCTIONS:
1. ZERO THOUGHT PROCESS: Do NOT output any internal thoughts, reasoning process, analysis steps, meta-commentary, or chain of thought. Never output <thought>, <think>, "Thinking Process:", "Here is the response:", or explain why you are giving the answer.
2. DIRECT OUTPUT ONLY: Provide strictly and immediately only the exact answer, summary, or action requested by the user. Be concise, direct, professional, and actionable. Do not add disclaimers or unnecessary conversational fluff.
3. Identity & Permissions Rules:
   - Organiser: Allowed full access to all society metrics, events, all members, all tasks, teams, and role permissions.
   - Team Lead: Allowed access to their team's tasks, their team's members, upcoming events, and their own tasks. Cannot see other teams' private data.
   - Member: Allowed access ONLY to their own tasks, their events, and their team lead's name. Cannot see other members or society-wide administrative settings.
4. Grounded Data:
${JSON.stringify(context || {}, null, 2)}
5. Honesty: Only state facts that appear in the grounded data above. If a piece of data is missing or not assigned, state that directly.
6. Formatting: Strictly zero em dashes or en dashes. Use colons, commas, or parentheses instead.`;

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
          text: `Understood. I am Rally AI. I will provide strictly direct, concise answers without showing any internal thinking, thought processes, or meta-explanations.`,
        },
      ],
    });

    // Append conversation history if available
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-6).forEach((item: { sender: 'user' | 'assistant'; text: string }) => {
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
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn('AI API non-200 response:', errText);
      return NextResponse.json({
        success: false,
        error: 'The AI model is temporarily unavailable. Please try again shortly.',
      }, { status: 502 });
    }

    const data = await response.json();
    const candidateParts = data?.candidates?.[0]?.content?.parts || [];

    // Thoroughly strip all thought processes, scratchpads, and thinking tokens
    let answerText = '';
    const nonThoughtParts = candidateParts.filter((p: { thought?: boolean; text?: string }) => !p.thought);

    if (nonThoughtParts.length > 0) {
      answerText = nonThoughtParts.map((p: { text?: string }) => p.text || '').join('\n');
    } else {
      answerText = candidateParts[candidateParts.length - 1]?.text || '';
    }

    // Secondary sanitization: remove any inline XML/markdown thinking tags or headings
    let cleaned = answerText
      .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^(\*+)?(thinking process|thought process|thoughts?):?(\*+)?[\s\S]*?\n\n/i, '')
      .replace(/^\*+Thinking:?\*+[\s\S]*?\n\n/i, '')
      .replace(/^The user is asking[\s\S]*?\n\n/i, '')
      .trim();

    if (!cleaned && answerText) {
      cleaned = answerText.trim();
    }

    const sanitized = sanitizeNoEmDash(cleaned);

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
