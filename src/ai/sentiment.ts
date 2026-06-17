const ANGRY_KEYWORDS = [
  "angry",
  "furious",
  "terrible",
  "worst",
  "sue",
  "lawyer",
  "scam",
  "fraud",
  "chargeback",
  "useless",
];

const FRUSTRATED_KEYWORDS = [
  "frustrated",
  "annoyed",
  "disappointed",
  "unacceptable",
  "ridiculous",
  "still waiting",
  "again",
  "third time",
];

const POSITIVE_KEYWORDS = [
  "thank",
  "thanks",
  "great",
  "awesome",
  "excellent",
  "perfect",
  "appreciate",
  "helpful",
];

export function classifySentiment(
  text: string
): "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "FRUSTRATED" | "ANGRY" {
  const lower = text.toLowerCase();
  if (ANGRY_KEYWORDS.some((k) => lower.includes(k))) return "ANGRY";
  if (FRUSTRATED_KEYWORDS.some((k) => lower.includes(k))) return "FRUSTRATED";
  if (POSITIVE_KEYWORDS.some((k) => lower.includes(k))) return "POSITIVE";
  if (lower.includes("not happy") || lower.includes("bad") || lower.includes("broken"))
    return "NEGATIVE";
  return "NEUTRAL";
}

export function sentimentToPriority(
  sentiment: string
): "LOW" | "MEDIUM" | "HIGH" | "URGENT" {
  switch (sentiment) {
    case "ANGRY":
      return "HIGH";
    case "FRUSTRATED":
      return "MEDIUM";
    case "NEGATIVE":
      return "MEDIUM";
    default:
      return "LOW";
  }
}

export function shouldEscalateByKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("human") ||
    lower.includes("manager") ||
    lower.includes("speak to someone") ||
    lower.includes("real person") ||
    lower.includes("agent") ||
    ANGRY_KEYWORDS.some((k) => lower.includes(k))
  );
}
