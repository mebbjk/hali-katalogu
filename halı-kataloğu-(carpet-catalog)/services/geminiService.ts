import { GoogleGenAI, Type } from "@google/genai";
import type { Carpet } from "../types";

// FIX: Implement the Gemini service to provide AI functionalities.
// Initialize the Google Gemini AI client
// The API key is expected to be available as a process environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Utility function to convert a File object to a GenerativePart
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

/**
 * Uses AI to analyze an image of a carpet and extract its details.
 */
export const getDetailsFromImage = async (file: File): Promise<Partial<Carpet>> => {
  try {
    const imagePart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                imagePart,
                { text: "Analyze this image of a carpet and provide its details. If a detail is not clear, leave it empty. Provide size and yarn type as an array of strings." }
            ],
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "A creative and descriptive name for the carpet." },
                    brand: { type: Type.STRING, description: "The brand of the carpet, if visible or inferrable." },
                    model: { type: Type.STRING, description: "The model name or number of the carpet." },
                    pattern: { type: Type.STRING, description: "Describe the pattern of the carpet (e.g., geometric, floral, abstract)." },
                    texture: { type: Type.STRING, description: "Describe the texture of the carpet (e.g., plush, shag, low-pile)." },
                    description: { type: Type.STRING, description: "A brief, appealing description of the carpet." },
                    size: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "An array of possible standard sizes for this carpet, e.g., ['160x230 cm', '200x300 cm']."
                    },
                    yarnType: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "An array of possible yarn types used in this carpet (e.g., ['Wool', 'Polyester'])."
                    },
                }
            }
        }
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("AI returned an empty response.");
    }

    return JSON.parse(jsonText) as Partial<Carpet>;
  } catch (error) {
    console.error("Error getting details from image:", error);
    throw new Error("Failed to analyze carpet image with AI.");
  }
};

/**
 * Reads a barcode or QR code from an image.
 */
export const readCodeFromImage = async (file: File): Promise<string | null> => {
    try {
        const imagePart = await fileToGenerativePart(file);
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    imagePart,
                    { text: "Read the barcode or QR code in this image. Respond with only the code's value, and nothing else. If no code is found, respond with an empty string." }
                ]
            },
        });

        const code = response.text.trim();
        return code || null;
    } catch (error) {
        console.error("Error reading code from image:", error);
        throw new Error("Failed to read code from image.");
    }
};

/**
 * Finds the best matching carpet from a list based on an image.
 */
export const findMatchByImage = async (file: File, allCarpets: Carpet[]): Promise<Carpet | null> => {
  if (allCarpets.length === 0) return null;

  try {
    const imagePart = await fileToGenerativePart(file);
    
    // Create a simplified list of carpets for the prompt
    const carpetDescriptions = allCarpets.map(c => 
      `ID: ${c.id}, Name: ${c.name}, Brand: ${c.brand}, Pattern: ${c.pattern}, Description: ${c.description}`
    ).join('\n');

    const prompt = `From the following list of carpets, which one is the best match for the carpet in the image?
Respond with only the ID of the best matching carpet. Do not add any other text.
Here is the list:\n${carpetDescriptions}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [ imagePart, { text: prompt } ]
        }
    });

    const bestMatchId = response.text.trim();
    
    if (bestMatchId) {
      return allCarpets.find(c => c.id === bestMatchId) || null;
    }

    return null;
  } catch (error) {
    console.error("Error finding match by image:", error);
    throw new Error("Failed to find a matching carpet with AI.");
  }
};