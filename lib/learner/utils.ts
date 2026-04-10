export function tokenizeWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

export function wordCount(text: string): number {
  return tokenizeWords(text).length;
}

export function safeLower(text?: string | null): string {
  return (text || "").toLowerCase().trim();
}

export function includesAny(text: string, patterns: string[]): string[] {
  const lower = safeLower(text);
  return patterns.filter((pattern) => lower.includes(pattern.toLowerCase()));
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function computeConfidence(positive: number, negative: number): number {
  return sigmoid((positive - negative) / 5);
}

export function computeMagnitude(modelOutput: string, userEdit?: string | null): number {
  if (!userEdit) return 0;

  const modelWords = wordCount(modelOutput);
  const userWords = wordCount(userEdit);

  if (modelWords === 0) return 0;

  return Math.abs(userWords - modelWords) / modelWords;
}
