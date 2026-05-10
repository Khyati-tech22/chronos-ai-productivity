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
  // Using gemini-2.0-flash which is more reliably supported on v1beta
  const model = "gemini-2.0-flash";
  
  const systemInstruction = `
    You are Chronos, a Time-Aware Productivity AI. Your primary directive is to provide "Practical Intelligence" by filtering all responses through the user's current time constraints and task priority.

    OPERATIONAL PROTOCOL:
    1. Priority level:
       - 'high': RUTHLESS EFFICIENCY. Be blunt and direct. Focus on non-negotiable must-haves.
       - 'medium': Balanced approach.
       - 'low': Focus on low-friction entry points.
    2. Depth based on window:
       - '5-15m': High-level quick wins.
       - '30-60m': Tactical execution steps & mini-exercises.
       - '2h+': DEEP RESEARCH & FULL PROJECT ARCHITECTURE. Provide high-density info.
    3. Format: Strict JSON following this schema:
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
    
    const msg = error?.message || "";
    const status = error?.status || error?.code || "";

    if (status === 429 || msg.includes('429') || msg.includes('exhausted')) {
      throw new Error("QUOTA EXHAUSTED: You've hit the Gemini API free tier limit. Please wait a minute or check your Google AI Studio billing.");
    }
    
    if (status === 404 || msg.includes('404') || msg.includes('not found')) {
      throw new Error(`MODEL NOT FOUND: The selected model (${model}) is currently unavailable or the API key is restricted.`);
    }

    if (error instanceof Error && msg.includes('fetch')) {
      throw new Error("Network connectivity issue detected. Please check your connection.");
    }
    
    throw error;
  }
}
