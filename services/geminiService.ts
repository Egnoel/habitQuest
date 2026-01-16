
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getMotivationalTip(habitName: string, streak: number) {
  try {
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
