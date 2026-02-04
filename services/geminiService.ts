
import { GoogleGenAI } from "@google/genai";

export const convertKmlToGeoJson = async (kmlContent: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Convert the following KML file content into a standard, valid GeoJSON format. 
      Ensure all coordinates and properties (like name, description, timestamps) are preserved. 
      Return ONLY the JSON object string. 
      
      KML Content snippet (first 50k chars):
      ${kmlContent.substring(0, 50000)}`,
      config: {
        systemInstruction: "You are a specialized geospatial data engineer. Your task is to convert KML data to valid GeoJSON. Output ONLY the raw JSON string. Do not include markdown formatting, explanations, or any text other than the GeoJSON object itself.",
        temperature: 0.1,
      },
    });

    let text = response.text || '';
    
    // Robust extraction: find the first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error("The AI did not return a valid JSON object. Try again or check if the file is a valid KML.");
    }

    const cleanedJson = text.substring(start, end + 1);
    
    // Validate JSON structure
    JSON.parse(cleanedJson);
    
    return cleanedJson;
  } catch (error: any) {
    console.error("Conversion failed:", error);
    throw new Error(error.message || "Failed to process KML file. The file might be too complex or the service is temporarily unavailable.");
  }
};
