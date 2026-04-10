import type { InteractionEvent, Signal } from "../types";
import { includesAny, safeLower } from "../utils";

const REMOVABLE_POLITENESS = [
  "merci",
  "bien sûr",
  "bien sur",
  "n'hésitez pas",
  "n'hesitez pas",
  "je serais ravi de",
  "permettez-moi de",
  "permettez moi de",
  "s'il vous plaît",
  "s'il vous plait",
  "j'espère que cela vous aide",
  "j'espere que cela vous aide",
];

const DIRECT_PATTERNS = [
  "plus direct",
  "moins poli",
  "moins formel",
  "pas de politesse",
  "pas de fluff",
  "straightforward",
  "straight to the point",
  "arrête les formules",
  "arrete les formules",
];

const POLITE_PATTERNS = [
  "plus poli",
  "plus formel",
  "plus professionnel",
  "plus courtois",
];

export function detectToneSignal(event: InteractionEvent): Signal | null {
  const modelText = safeLower(event.modelOutput);
  const userText = safeLower(event.userEdit);
  const instruction = safeLower(event.userInstruction);

  const removedPoliteness = REMOVABLE_POLITENESS.filter(
    (item) => modelText.includes(item) && !userText.includes(item)
  );

  const directMatches = includesAny(instruction, DIRECT_PATTERNS);
  const politeMatches = includesAny(instruction, POLITE_PATTERNS);

  let direction: Signal["direction"] = "neutral";
  let score = 0;
  let strength: Signal["strength"] = "weak";

  if (removedPoliteness.length === 1) {
    direction = "more_direct";
    score += 1;
  }

  if (removedPoliteness.length >= 2) {
    direction = "more_direct";
    score += 2;
    strength = "strong";
  }

  if (directMatches.length > 0) {
    direction = "more_direct";
    score += 2;
    strength = "strong";
  }

  if (politeMatches.length > 0) {
    direction = "more_polite";
    score += 2;
    strength = "strong";
  }

  if (event.userChoice === "direct") {
    direction = "more_direct";
    score += 1;
  }

  if (event.userChoice === "polite") {
    direction = "more_polite";
    score += 1;
  }

  if (score <= 0 || direction === "neutral") {
    return null;
  }

  return {
    userId: event.userId,
    signalType: "tone",
    direction,
    score,
    strength,
    evidence: {
      removedPoliteness,
      directMatches,
      politeMatches,
      choice: event.userChoice || null,
      subsignals: {
        directness: direction === "more_direct" ? 1 : 0,
        politeness: direction === "more_direct" ? -removedPoliteness.length : direction === "more_polite" ? 1 : 0,
        formality: directMatches.includes("moins formel") ? -1 : politeMatches.includes("plus formel") ? 1 : 0,
      },
    },
    timestamp: event.timestamp,
  };
}
