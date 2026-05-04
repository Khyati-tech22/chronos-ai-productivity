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
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are Chronos, a Time-Aware Productivity AI. Your primary directive is to provide "Practical Intelligence" by filtering all responses through the user's current time constraints and task priority.

    CONTEXT:
    The current local time is: ${new Date().toISOString()}.

    OPERATIONAL PROTOCOL:
    1. ALWAYS check the user's mentioned availability, schedule, or deadlines in their query.
    2. Consider the Priority level:
       - 'high': Be blunt, direct, and focus on non-negotiable must-haves. Cut all fluff.
       - 'medium': Balanced approach with quality-of-life tips.
       - 'low': Focus on low-friction entry points and enjoyable progress.
    3. Scale depth based on time window:
       - '5-15m': High-level summaries & quick wins.
       - '30-60m': Core concepts & mini-exercises.
       - '2h+': Deep dives & full milestones.
    4. BE REALISTIC. 
    5. Format: Strict JSON following this schema:
    {
      "title": "Short catchy title",
      "summary": "Practical overview",
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
      contents: `Task/Goal: ${task}\nTime Window: ${timeWindow}\nPriority: ${priority}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
