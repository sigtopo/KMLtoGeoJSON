
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const convertKmlToGeoJson = async (kmlContent: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Convert the following KML file content into a standard, valid GeoJSON format. Ensure all coordinates and properties (like name, description) are preserved. Return ONLY the JSON object string. KML Content:\n\n${kmlContent}`,
      config: {
        systemInstruction: "You are a specialized geospatial data engineer. Your task is to convert KML data to valid GeoJSON. Output only the raw GeoJSON string without markdown blocks or extra text.",
        temperature: 0.1, // Low temperature for consistency in format
      },
    });

    const text = response.text || '';
    // Clean up potential markdown formatting if the model adds it despite instructions
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Validate if it's actual JSON
    JSON.parse(cleanedJson);
    
    return cleanedJson;
  } catch (error) {
    console.error("Conversion failed:", error);
    throw new Error("Failed to process KML file. Ensure the file is not too large or malformed.");
  }
};
