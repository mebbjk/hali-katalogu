import { GoogleGenAI, Type } from "@google/genai";
import type { Carpet } from '../types';

const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

// Lazily initialize the AI client to prevent app crash on load if API_KEY is missing.
const getAiInstance = (): GoogleGenAI => {
    if (ai) {
        return ai;
    }
    if (!API_KEY) {
        // This error is now thrown only when an AI feature is used, not on app load.
        throw new Error("API_KEY environment variable not set.");
    }
    ai = new GoogleGenAI({ apiKey: API_KEY });
    return ai;
};


// Helper function to convert a File object to a Gemini-compatible format
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const extractCarpetDetails = async (imageFile: File): Promise<Partial<Carpet>> => {
  const ai = getAiInstance();
  const imagePart = await fileToGenerativePart(imageFile);
  const prompt = `You are an expert carpet cataloger. Analyze the provided image of a carpet and extract its features. Respond ONLY with a valid JSON object. Do not include any other text or markdown formatting. If a value is unknown, use "Unknown". For price, provide an estimated integer value without currency symbols.

The JSON object must follow this schema:`;

  // Fix: Updated contents to be a single Content object for multi-part request.
  const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, {text: prompt}] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "A descriptive name, e.g., 'Blue Abstract Modern Rug'" },
                brand: { type: Type.STRING, description: "Identify the brand if a logo is visible, otherwise 'Unknown'" },
                model: { type: Type.STRING, description: "Identify the model if visible, otherwise 'Unknown'" },
                price: { type: Type.INTEGER, description: "An estimated price as an integer." },
                size: { type: Type.STRING, description: "Estimate the size, e.g., '200x300 cm'" },
                pattern: { type: Type.STRING, description: "Describe the main pattern, e.g., 'Geometric', 'Floral', 'Abstract', 'Solid'" },
                texture: { type: Type.STRING, description: "Describe the texture, e.g., 'Plush', 'Low-pile', 'Shaggy', 'Woven'" },
                yarnType: { type: Type.STRING, description: "Guess the yarn type, e.g., 'Wool', 'Polypropylene', 'Nylon', 'Cotton'" },
                type: { type: Type.STRING, description: "Classify as 'Carpet', 'Rug', or 'Plush'" },
                description: { type: Type.STRING, description: "Provide a one-paragraph detailed description covering colors, style, and overall look." },
            }
        }
      }
  });

  const text = (result.text ?? '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Could not extract carpet details. The AI response was not valid JSON.");
  }
};


export const findMatchingCarpet = async (imageFile: File, allCarpets: Carpet[]): Promise<Carpet | null> => {
    if (allCarpets.length === 0) return null;

    const ai = getAiInstance();
    const imagePart = await fileToGenerativePart(imageFile);
    
    // Step 1: Generate a description for the new image.
    // Fix: Updated contents to be a single Content object for multi-part request.
    const descriptionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, {text: "Describe this carpet in detail for matching purposes, focusing on pattern, prominent colors, texture, and style."}] },
    });
    const targetDescription = descriptionResponse.text;

    // Step 2: Ask Gemini to find the best match from the existing carpet descriptions.
    const candidateCarpets = allCarpets.map(c => ({ id: c.id, description: c.description }));

    const matchingPrompt = `You are a carpet matching engine. I have a 'target_description' for a carpet I'm looking for. I also have a list of 'candidate_carpets' from my inventory.
Your task is to identify which candidate is the best match for the target.
Respond ONLY with a valid JSON object in the format: {"best_match_id": "the_id_of_the_best_matching_carpet"}.
If no candidate is a reasonably good match, respond with {"best_match_id": null}.

Target Description:
${targetDescription}

Candidate Carpets:
${JSON.stringify(candidateCarpets)}
`;

    // Fix: Simplified contents for a text-only prompt.
    const matchResult = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: matchingPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              // The prompt instructs the model to return a string ID or `null`.
              // Since the response schema doesn't support union types (e.g., string | null),
              // we declare it as a string. The model is smart enough to follow the prompt,
              // and the client-side parsing logic correctly handles the `null` case.
              best_match_id: { type: Type.STRING }
            }
          }
        }
    });

    const matchText = (matchResult.text ?? '').trim();
    try {
        const result = JSON.parse(matchText);
        const bestMatchId = result.best_match_id;
        if (!bestMatchId) return null;

        return allCarpets.find(c => c.id === bestMatchId) || null;
    } catch(e) {
        console.error("Failed to parse matching response:", matchText);
        throw new Error("Could not find a match. The AI response was not valid JSON.");
    }
};