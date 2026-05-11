import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export type TimeWindow = '5-15m' | '30-60m' | '2h+';
export type Priority = 'low' | 'medium' | 'high';

export interface ProductivityResponse {
  title: string;
  summary: string;
  steps: string[];
  warning?: string;
  miniExercise?: string;
}

export async function getProductivityAdvice(
  task: string,
  timeWindow: TimeWindow,
  priority: Priority
): Promise<ProductivityResponse> {
  const model = "gemini-2.5-flash";
  
  const systemPrompt = `You are Chronos, a Time-Aware Productivity AI. Your primary directive is to provide "Practical Intelligence" by filtering all responses through the user's current time constraints and task priority.

CONTEXT: The current local time is: ${new Date().toISOString()}.

OPERATIONAL PROTOCOL:
1. Priority level:
   - 'high': RUTHLESS EFFICIENCY. Be blunt, direct, and focus strictly on non-negotiable must-haves.
   - 'medium': Balanced approach with quality-of-life tips and strategic context.
   - 'low': Focus on low-friction entry points and building momentum.
2. Scale depth based on time window:
   - '5-15m': High-level summaries & immediate quick wins.
   - '30-60m': Core concepts, tactical execution steps, & mini-exercises.
   - '2h+': DEEP RESEARCH & FULL PROJECT ARCHITECTURE. Be extraordinarily thorough.
3. You MUST respond with ONLY valid JSON matching this exact schema:
{
  "title": "Short catchy title",
  "summary": "Practical overview with high information density",
  "steps": ["Step 1 with detail", "Step 2 with detail"],
  "warning": "Optional strategic warning or null",
  "miniExercise": "Optional deep-thought exercise or null"
}`;

  const userPrompt = `${systemPrompt}

Goal: ${task}
Time Window: ${timeWindow}
Priority: ${priority}

Respond with ONLY the JSON object, no other text.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY. Please set this environment variable.");
    }

    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    try {
      return JSON.parse(text);
    } catch (e) {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleanedText);
    }
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    
    const msg = error?.message || "";
    const status = error?.status || error?.code || "";

    if (status === 429 || msg.includes('429') || msg.includes('exhausted')) {
      throw new Error("QUOTA EXHAUSTED: You've hit the Gemini API free tier limit. Please wait a few minutes or check your Google AI Studio billing.");
    }
    
    if (status === 404 || msg.includes('404') || msg.includes('not found')) {
      throw new Error(`MODEL NOT FOUND: The model (${model}) is unavailable.`);
    }

    if (error instanceof Error && msg.includes('fetch')) {
      throw new Error("Network connectivity issue detected. Please check your connection.");
    }
    
    throw error;
  }
}
