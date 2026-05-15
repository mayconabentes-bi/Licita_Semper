import { describe, it, expect } from 'vitest';
import { calculateBiddingScore } from './scoring';
import { DocumentStatus, AnalysisDecision, Document } from '../types';

describe('Scoring Motor', () => {
  const mockDocs: Document[] = [
    { type: 'CNPJ', status: DocumentStatus.VALID } as Document,
    { type: 'Contrato Social', status: DocumentStatus.VALID } as Document,
  ];

  it('should recommend GO for high score and valid docs', () => {
    const fullDocs: Document[] = [
      ...mockDocs,
      { type: 'Certidão RFB', status: DocumentStatus.VALID } as Document,
      { type: 'Certidão FGTS', status: DocumentStatus.VALID } as Document,
      { type: 'Certidão Trabalhista', status: DocumentStatus.VALID } as Document,
    ];

    const result = calculateBiddingScore({
      technicalCapacity: 9,
      estimatedMargin: 8,
      riskLevel: 2,
      deadlineFeasibility: 9,
      hasStrategicInterest: true,
      documents: fullDocs
    });

    expect(result.finalScore).toBeGreaterThanOrEqual(80);
    expect(result.recommendation).toBe(AnalysisDecision.GO);
  });

  it('should recommend NO_GO if documentation is insufficient', () => {
    const result = calculateBiddingScore({
      technicalCapacity: 10,
      estimatedMargin: 10,
      riskLevel: 0,
      deadlineFeasibility: 10,
      hasStrategicInterest: true,
      documents: [] // Missing all mandatory docs
    });

    expect(result.recommendation).toBe(AnalysisDecision.NO_GO);
    expect(result.dimensions.documentation).toBe(0);
  });

  it('should calculate technical score correctly', () => {
    const result = calculateBiddingScore({
      technicalCapacity: 10,
      estimatedMargin: 5,
      riskLevel: 5,
      deadlineFeasibility: 5,
      hasStrategicInterest: false,
      documents: []
    });

    // (10 * 0.7 + 5 * 0.3) * 10 = (7 + 1.5) * 10 = 85
    expect(result.dimensions.technical).toBe(85);
  });

  it('should clamp values outside range 0-10', () => {
    const result = calculateBiddingScore({
      technicalCapacity: 15, // should clamp to 10
      estimatedMargin: -5,  // should clamp to 0
      riskLevel: 5,
      deadlineFeasibility: 5,
      hasStrategicInterest: false,
      documents: []
    });

    expect(result.dimensions.technical).toBe(85); // same as 10 capacity
  });
});
