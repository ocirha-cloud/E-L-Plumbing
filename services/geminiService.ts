
import { GoogleGenAI } from "@google/genai";

export async function generatePlumbingImage(prompt: string): Promise<string | null> {
  // Fix: Create a new GoogleGenAI instance right before making an API call to ensure it uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `${prompt}. Ensure the environment is extremely clean, professional, and well-lit. No messy sites, no text overlays, no watermarks.`
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    // Fix: Safely iterate through candidates and parts to find the generated image part
    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}
