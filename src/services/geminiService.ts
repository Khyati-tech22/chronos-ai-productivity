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
  // Using gemini-1.5-flash for maximum reliability and speed
  const model = "gemini-1.5-flash";
  
  const systemInstruction = `
    You are Chronos, a Time-Aware Productivity AI. Your primary directive is to provide "Practical Intelligence" by filtering all responses through the user's current time constraints and task priority.

    CONTEXT:
    The current local time is: ${new Date().toISOString()}.

    OPERATIONAL PROTOCOL:
    1. ALWAYS check the user's mentioned availability, schedule, or deadlines in their query.
    2. Consider the Priority level:
       - 'high': RUTHLESS EFFICIENCY. Be blunt, direct, and focus strictly on non-negotiable must-haves. Eliminate all fluff. Focus on high-impact, high-stakes actions.
       - 'medium': Balanced approach with quality-of-life tips, steady progression, and strategic context.
       - 'low': Focus on low-friction entry points, enjoyable progress, and building momentum through small wins.
    3. Scale depth based on time window:
       - '5-15m': High-level summaries & immediate quick wins. Focus on what can be done RIGHT NOW.
       - '30-60m': Core concepts, tactical execution steps, & mini-exercises. Provide enough detail for a solid working session.
       - '2h+': DEEP RESEARCH & FULL PROJECT ARCHITECTURE. Provide high-density information, comprehensive project plans, research frameworks, and complex milestones. Be extraordinarily thorough. If the user asks for research, provide deep analysis, source suggestions, and structural outlines.
    4. BE REALISTIC but ambitious for long windows. For '2h+', maximize the quantity and quality of actionable steps.
    5. Format: Strict JSON following this schema:
    {
      "title": "Short catchy title",
      "summary": "Practical overview with high information density",
      "steps": ["Step 1 with detail", "Step 2 with detail", ...],
      "warning": "Optional strategic warning",
      "miniExercise": "Optional deep-thought exercise"
    }
  `;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY. Please set this environment variable.");
    }

    const genModel = ai.getGenerativeModel({ 
      model,
      systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await genModel.generateContent(`Task/Goal: ${task}\nTime Window: ${timeWindow}\nPriority: ${priority}`);
    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error("Empty response from AI");
    
    console.log("Gemini Response Text:", text); // Debugging log

    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("JSON Parse Error. Raw Text:", text);
      // Attempt to clean the response if it's wrapped in markdown
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleanedText);
    }
  } catch (error) {
    console.error("Gemini Service Error:", error);
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error("Network connectivity issue detected. Please check your connection.");
    }
    throw error;
  }
}
