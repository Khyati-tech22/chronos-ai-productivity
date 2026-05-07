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
  // Switched to gemini-1.5-flash-8b for higher rate limits on free tier if available, 
  // or sticking to gemini-1.5-flash
  const model = "gemini-1.5-flash";
  
  const systemInstruction = `
    You are Chronos, a Time-Aware Productivity AI. Your primary directive is to provide "Practical Intelligence" by filtering all responses through the user's current time constraints and task priority.

    OPERATIONAL PROTOCOL:
    1. Priority level:
       - 'high': RUTHLESS EFFICIENCY. Be blunt and direct.
       - 'medium': Balanced approach.
       - 'low': Focus on low-friction entry points.
    2. Depth:
       - '5-15m': High-level quick wins.
       - '30-60m': Tactical execution steps.
       - '2h+': DEEP RESEARCH & FULL PROJECT ARCHITECTURE.
    3. Format: Strict JSON:
    {
      "title": "Short title",
      "summary": "Dense overview",
      "steps": ["Step 1", "Step 2", ...],
      "warning": "Optional warning",
      "miniExercise": "Optional exercise"
    }
  `;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY. Please set this environment variable.");
    }

    const response = await ai.models.generateContent({
      model,
      systemInstruction,
      contents: `Goal: ${task}\nTime: ${timeWindow}\nPriority: ${priority}`,
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
    
    // Specific error handling for Quota/Rate Limits
    if (error?.status === 429 || (error?.message && error.message.includes('429')) || (error?.message && error.message.includes('exhausted'))) {
      throw new Error("QUOTA EXHAUSTED: You've hit the Gemini API free tier limit. Please wait a minute or check your Google AI Studio billing.");
    }
    
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error("Network connectivity issue detected. Please check your connection.");
    }
    
    throw error;
  }
}
