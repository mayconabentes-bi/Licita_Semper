import { Document, DocumentStatus, AnalysisDecision, ScoringResult } from '../types';

export interface ScoringInputs {
  technicalCapacity: number; // 0-10
  estimatedMargin: number; // 0-10
  riskLevel: number; // 0-10
  deadlineFeasibility: number; // 0-10
  hasStrategicInterest: boolean;
  documents: Document[];
}

export function calculateBiddingScore(inputs: ScoringInputs): ScoringResult {
  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const technicalCapacity = clamp(inputs.technicalCapacity, 0, 10);
  const estimatedMargin = clamp(inputs.estimatedMargin, 0, 10);
  const riskLevel = clamp(inputs.riskLevel, 0, 10);
  const deadlineFeasibility = clamp(inputs.deadlineFeasibility, 0, 10);
  const { hasStrategicInterest, documents } = inputs;

  // 1. Dimension: Documentation (0-100)
  const mandatoryTypes = ['CNPJ', 'Contrato Social', 'Certidão RFB', 'Certidão FGTS', 'Certidão Trabalhista'];
  const presentDocs = documents.filter(d => 
    mandatoryTypes.includes(d.type) && d.status === DocumentStatus.VALID
  );
  const docScore = (presentDocs.length / mandatoryTypes.length) * 100;

  // 2. Dimension: Technical (0-100)
  const techScore = ((technicalCapacity * 0.7) + (deadlineFeasibility * 0.3)) * 10;

  // 3. Dimension: Regularity (0-100)
  const regularityScore = (10 - riskLevel) * 10;

  // 4. Dimension: Strategic (0-100)
  const strategicScore = clamp(((estimatedMargin * 0.6) + (hasStrategicInterest ? 4 : 0)) * 10, 0, 100);

  // Final Weighted Score
  const finalScore = Math.round(
    (docScore * 0.25) + 
    (techScore * 0.30) + 
    (regularityScore * 0.20) + 
    (strategicScore * 0.25)
  );

  // Recommendation Logic
  let recommendation = AnalysisDecision.UNDECIDED;
  if (finalScore >= 80 && docScore >= 80) recommendation = AnalysisDecision.GO;
  else if (finalScore < 50 || docScore < 40) recommendation = AnalysisDecision.NO_GO;

  // Justification builder
  const justifications: string[] = [];
  if (docScore < 100) {
    const missingCount = mandatoryTypes.length - presentDocs.length;
    justifications.push(`Faltam ${missingCount} documentos de habilitação ${missingCount === 1 ? 'obrigatório' : 'obrigatórios'}.`);
  }
  if (techScore < 60) justifications.push("Baixa aderência técnica ou prazo crítico.");
  if (strategicScore > 80) justifications.push("Oportunidade estratégica com excelente margem.");
  if (regularityScore < 40) justifications.push("Nível de risco operacional preocupante.");

  return {
    finalScore,
    dimensions: {
      documentation: Math.round(docScore),
      technical: Math.round(techScore),
      regularity: Math.round(regularityScore),
      strategic: Math.round(strategicScore)
    },
    recommendation,
    justification: justifications.join(' ') || "Avaliação positiva para participação."
  };
}
