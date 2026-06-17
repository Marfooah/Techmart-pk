export function computeConfidence(scores: {
  ragScore?: number;
  toolSuccessRate?: number;
  workflowComplete?: boolean;
}): number {
  const rag = scores.ragScore ?? 0.7;
  const tools = scores.toolSuccessRate ?? 1;
  const workflow = scores.workflowComplete ? 1 : 0.8;
  return Math.min(1, rag * 0.35 + tools * 0.35 + workflow * 0.3);
}

export function getConfidenceThreshold(): number {
  return parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || "0.75");
}

export function isLowConfidence(score: number): boolean {
  return score < getConfidenceThreshold();
}
