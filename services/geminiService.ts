// FIX: Implement the geminiService to interact with the Google Gemini API for carpet image analysis.
import { GoogleGenAI, Type } from '@google/genai';
import type { Carpet } from '../types';

// FIX: Initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to convert a File to a base64 string and prepare it for the API.
const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

// FIX: Implement getDetailsFromImage to extract carpet details using Gemini.
export const getDetailsFromImage = async (file: File): Promise<Partial<Carpet>> => {
  const imagePart = await fileToGenerativePart(file);

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "The name of the carpet." },
      brand: { type: Type.STRING, description: "The brand of the carpet." },
      model: { type: Type.STRING, description: "The model or product code of the carpet." },
      price: { type: Type.NUMBER, description: "The price of the carpet. Return 0 if not visible." },
      size: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of available sizes (e.g., '120x170 cm'). Return empty array if not mentioned." },
      pattern: { type: Type.STRING, description: "The main pattern of the carpet (e.g., 'geometric', 'floral')." },
      texture: { type: Type.STRING, description: "The texture of the carpet (e.g., 'soft', 'shaggy')." },
      yarnType: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of yarn types used (e.g., 'wool', 'polyester')." },
      type: { type: Type.STRING, description: "The general type of carpet (e.g., 'area rug', 'runner')." },
      description: { type: Type.STRING, description: "A brief description of the carpet's style and features." },
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          imagePart,
          { text: "Analyze this image of a carpet and provide its details. If a detail is not clear, make a reasonable guess or leave it blank. Provide the response in JSON format according to the provided schema." },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    const text = response.text?.trim() || '{}';
    return JSON.parse(text) as Partial<Carpet>;
  } catch (error) {
    console.error("Error getting details from image:", error);
    throw new Error("Failed to analyze image with AI.");
  }
};

// FIX: Implement findMatchByImage to find a matching carpet from the database using Gemini.
export const findMatchByImage = async (file: File, carpets: Carpet[]): Promise<Carpet | null> => {
    if (carpets.length === 0) {
        return null;
    }

    const imagePart = await fileToGenerativePart(file);
    const carpetListForPrompt = carpets.map(({ id, name, brand, model, description }) => 
      ({ id, name, brand, model, description: description.substring(0, 100) })
    );

    const prompt = `
      From the following list of carpets, find the one that best matches the carpet in the image.
      Respond with only the JSON object containing the "id" of the best matching carpet.
      Example: {"id": "123-abc"}
      If no good match is found, respond with an empty JSON object {}.

      Available carpets:
      ${JSON.stringify(carpetListForPrompt, null, 2)}
    `;
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: "The ID of the best matching carpet." },
      },
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    imagePart,
                    { text: prompt },
                ],
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema,
            }
        });
        
        const text = response.text?.trim() || '{}';
        const matchedCarpetInfo = JSON.parse(text) as { id?: string };

        if (matchedCarpetInfo && matchedCarpetInfo.id) {
            return carpets.find(c => c.id === matchedCarpetInfo.id) || null;
        }
        return null;
    } catch (error) {
        console.error("Error finding match by image:", error);
        throw new Error("Failed to find a match with AI.");
    }
};

// FIX: Implement readCodeFromImage to read a barcode or QR code from an image.
export const readCodeFromImage = async (file: File): Promise<string | null> => {
  const imagePart = await fileToGenerativePart(file);
  const prompt = "Read the barcode or QR code in this image. Respond with only the code value as a string. If no code is visible, respond with an empty string.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          imagePart,
          { text: prompt },
        ],
      },
    });

    const text = response.text?.trim();
    return text || null; // Return null if the string is empty
  } catch (error) {
    console.error("Error reading code from image:", error);
    throw new Error("Failed to read code from image with AI.");
  }
};
