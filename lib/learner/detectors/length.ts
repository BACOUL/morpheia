import type { InteractionEvent, Signal } from "../types";
import { includesAny, safeLower, wordCount } from "../utils";

const SHORT_PATTERNS = [
  "plus court",
  "trop long",
  "raccourcis",
  "condense",
  "va à l’essentiel",
  "va a l'essentiel",
  "en bref",
  "résume",
  "resume",
];

const LONG_PATTERNS = [
  "développe",
  "developpe",
  "explique davantage",
  "plus détaillé",
  "plus detaille",
  "plus complet",
  "élabore",
  "elabore",
];

export function detectLengthSignal(event: InteractionEvent): Signal | null {
  const instruction = safeLower(event.userInstruction);
  const modelText = event.modelOutput || "";
  const userText = event.userEdit || "";

  const modelWords = wordCount(modelText);
  const userWords = wordCount(userText);

  const shortMatches = includesAny(instruction, SHORT_PATTERNS);
  const longMatches = includesAny(instruction, LONG_PATTERNS);

  let direction: Signal["direction"] = "neutral";
  let score = 0;
  let strength: Signal["strength"] = "weak";

  const canUseRatio = modelWords >= 12 && userWords > 0;
  const ratio = canUseRatio ? userWords / modelWords : null;
  const removedWords = canUseRatio ? modelWords - userWords : 0;

  if (shortMatches.length > 0) {
    direction = "shorter";
    score += 2;
    strength = "strong";
  }

  if (longMatches.length > 0) {
    direction = "longer";
    score += 2;
    strength = "strong";
  }

  if (event.userChoice === "short") {
    direction = "shorter";
    score += 1;
  }

  if (event.userChoice === "long") {
    direction = "longer";
    score += 1;
  }

  if (ratio !== null && ratio < 0.85 && removedWords >= 8 && direction === "neutral") {
    direction = "shorter";
    score += 1;
  }

  if (ratio !== null && ratio > 1.15 && direction === "neutral") {
    direction = "longer";
    score += 1;
  }

  if (score <= 0 || direction === "neutral") {
    return null;
  }

  return {
    userId: event.userId,
    signalType: "length",
    direction,
    score,
    strength,
    evidence: {
      modelWords,
      userWords,
      ratio,
      removedWords,
      shortMatches,
      longMatches,
      choice: event.userChoice || null,
    },
    timestamp: event.timestamp,
  };
}
