
import { GoogleGenAI } from "@google/genai";

export const convertKmlToGeoJson = async (kmlContent: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Missing Gemini API Key. Please configure it in your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a spatial data parser. Convert the KML provided into strictly valid GeoJSON.
      
      Requirements:
      1. Output ONLY the GeoJSON object. No markdown, no triple backticks, no explanations.
      2. Ensure coordinates are [longitude, latitude].
      3. Map <Placemark> <name> to properties.name.
      4. Map <description> to properties.description.
      5. Preserve all metadata found in the KML.
      
      KML DATA:
      ${kmlContent.substring(0, 75000)}`,
      config: {
        systemInstruction: "You are a professional Geospatial JSON Generator. You convert KML/XML files to valid GeoJSON FeatureCollections. Your response MUST be valid JSON that can be parsed with JSON.parse().",
        temperature: 0.1,
        responseMimeType: "application/json"
      },
    });

    let text = response.text || '';
    
    // Safety cleaning in case responseMimeType is ignored by model
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error("Geospatial extraction failed: The AI response was not a valid JSON structure.");
    }

    const cleanedJson = text.substring(start, end + 1);
    
    // Final validation
    try {
      JSON.parse(cleanedJson);
    } catch (e) {
      throw new Error("Format error: The generated GeoJSON is syntactically invalid.");
    }
    
    return cleanedJson;
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    // Bubble up user-friendly error
    if (error.message?.includes('403') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error("Authentication failed: The provided API Key is invalid or has no permissions.");
    }
    throw new Error(error.message || "An unexpected error occurred during AI processing.");
  }
};
