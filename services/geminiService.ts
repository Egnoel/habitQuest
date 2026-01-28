
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export async function getMotivationalTip(habitName: string, streak: number) {
  try {
    // Initialize AI client only when needed and if API key is available
    if (!ai && process.env.API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }

    // If no API key is available, return default message
    if (!ai) {
      return "O destino sorri para os persistentes. Segue em frente!";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O utilizador está a tentar manter o hábito "${habitName}" e tem uma sequência de ${streak} dias. 
      Dá uma dica motivacional curta (máximo 2 frases) para o incentivar a continuar e subir de nível. 
      Responde em Português de Portugal num tom épico de RPG.`,
    });
    return response.text || "Continua a tua jornada, herói! A glória aguarda por ti.";
  } catch (error) {
    console.error("Error fetching tip:", error);
    return "O destino sorri para os persistentes. Segue em frente!";
  }
}
