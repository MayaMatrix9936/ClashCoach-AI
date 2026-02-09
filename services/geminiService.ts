import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AttackPlanRequest, AttackPlanResponse } from '../types';

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  // Fail fast with a clear message for local dev
  throw new Error("Missing GEMINI_API_KEY (set it in .env.local).");
}

const ai = new GoogleGenAI({ apiKey });

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateAttackPlan = async (
  request: AttackPlanRequest,
  options?: { onProgress?: (step: number) => void }
): Promise<AttackPlanResponse> => {
  const startTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    options?.onProgress?.(0);
    console.info('[ClashCoachAI] Starting analysis');
    const encodeStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const armyBase64 = await fileToBase64(request.armyImage);
    const baseBase64 = await fileToBase64(request.baseImage);
    const encodeEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    console.info('[ClashCoachAI] Image encoding ms:', Math.round(encodeEnd - encodeStart));

    // Define the schema to force Gemini to return structured data
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        armyAnalysis: { type: Type.STRING, description: "Analysis of the user's army strengths/weaknesses." },
        baseWeaknesses: { type: Type.STRING, description: "Key vulnerabilities in the enemy base." },
        criticalAdvice: { type: Type.STRING, description: "Top 1-2 critical things to avoid." },
        armyAdjustments: { type: Type.STRING, description: "If the player can retrain, suggest up to 3 concise optional army improvements. If no changes are needed, say 'No changes recommended'." },
        steps: {
          type: Type.ARRAY,
          description: "A list of 3 to 5 distinct phases of the attack.",
          items: {
            type: Type.OBJECT,
            properties: {
              phaseName: { type: Type.STRING, description: "e.g., 'Phase 1: Funneling' or 'Phase 2: Main Push'" },
              description: { type: Type.STRING, description: "Detailed instructions for this step." },
              troopsUsed: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "List of specific troops/spells used in this phase (e.g. ['Golem', 'Wizard'])." 
              },
            },
            required: ["phaseName", "description", "troopsUsed"]
          }
        }
      },
      required: ["armyAnalysis", "baseWeaknesses", "criticalAdvice", "armyAdjustments", "steps"]
    };

    // Step 1: Generate Structured Plan with Gemini 3 Pro
    const prompt = `
      You are an expert strategic game coach.
      Goal: "${request.goal}".
      
      Analyze the Army Image and Enemy Base Image.
      Create a step-by-step attack plan.
      The plan must be based on the uploaded army; do not invent troops outside the army image.
      Break the attack into 3 to 5 distinct phases.
      Use explicit numeric counts for troops and spells (no vague phrases like "a line of", "several", or "some").
      Every deploy instruction must include a direction, using both clock position and cardinal direction (e.g., "Deploy 2 Dragons at 3 o'clock (east)").
      If the user can retrain, provide up to 3 concise optional army improvements; otherwise say "No changes recommended."
    `;

    options?.onProgress?.(1);
    await sleep(2000);
    const modelStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const jsonResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: request.armyImage.type, data: armyBase64 } },
          { inlineData: { mimeType: request.baseImage.type, data: baseBase64 } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    if (!jsonResponse.text) throw new Error("No response text generated");
    const modelEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    console.info('[ClashCoachAI] Model call ms:', Math.round(modelEnd - modelStart));
    options?.onProgress?.(2);
    
    const planData: AttackPlanResponse = JSON.parse(jsonResponse.text);
    options?.onProgress?.(3);
    await sleep(2000);
    options?.onProgress?.(4);
    await sleep(2000);
    const endTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
    console.info('[ClashCoachAI] Total analysis ms:', Math.round(endTimestamp - startTimestamp));
    return planData;

  } catch (error: unknown) {
    console.error("Error generating attack plan:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze strategy: ${message}`);
  }
};

export const validateImageWithGemini = async (
  file: File,
  kind: 'army' | 'base'
): Promise<{ isClashRelated: boolean; reason: string }> => {
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      isClashRelated: { type: Type.BOOLEAN, description: "True if the image is a Clash of Clans screenshot." },
      reason: { type: Type.STRING, description: "Short reason for the decision." },
    },
    required: ["isClashRelated", "reason"],
  };

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const data = result.split(',')[1];
      resolve(data);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  const prompt = `
    Determine whether this image is a Clash of Clans screenshot.
    The image should be a ${kind === 'army' ? 'army composition' : 'enemy base'} screenshot.
    Return JSON only.
  `;

  const jsonResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: file.type, data: base64 } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  if (!jsonResponse.text) throw new Error("No response text generated");
  return JSON.parse(jsonResponse.text) as { isClashRelated: boolean; reason: string };
};

export const validateGoalWithGemini = async (
  goal: string
): Promise<{ isClashRelated: boolean; reason: string }> => {
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      isClashRelated: { type: Type.BOOLEAN, description: "True if the goal is about Clash of Clans." },
      reason: { type: Type.STRING, description: "Short reason for the decision." },
    },
    required: ["isClashRelated", "reason"],
  };

  const prompt = `
    Determine whether the user's goal is related to Clash of Clans.
    Return JSON only.
    Goal: "${goal}"
  `;

  const jsonResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  if (!jsonResponse.text) throw new Error("No response text generated");
  return JSON.parse(jsonResponse.text) as { isClashRelated: boolean; reason: string };
};