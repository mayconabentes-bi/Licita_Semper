import { GoogleGenAI } from "@google/genai";
import { AnalysisDecision } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function analyzeOpportunity(opportunityData: { 
  object: string, 
  agency: string, 
  value?: number 
}) {
  const prompt = `
    Você é um consultor sênior em licitações públicas no Brasil.
    Analise a seguinte oportunidade de licitação e forneça um parecer técnico robusto focado em:
    1. Aderência Técnica: Se o objeto é comum ou exige alta especialização.
    2. Regularidade: Riscos fiscais ou jurídicos implícitos no edital.
    3. Fator Estratégico: O potencial de crescimento ou margem para o fornecedor.
    
    Agência: ${opportunityData.agency}
    Objeto: ${opportunityData.object}
    Valor Estimado: ${opportunityData.value || 'Não informado'}
    
    Responda em formato JSON (apenas o JSON) com os seguintes campos:
    {
      "technicalScore": number (0 a 10),
      "competitiveScore": number (0 a 10),
      "marginScore": number (0 a 10),
      "finalDecision": "${AnalysisDecision.GO}" | "${AnalysisDecision.NO_GO}" | "${AnalysisDecision.UNDECIDED}",
      "reason": "String com a justificativa resumida em português cobrindo os 3 pontos acima."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
