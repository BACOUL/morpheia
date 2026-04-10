import type { InteractionEvent, Signal } from "../types";
import { includesAny, safeLower } from "../utils";

const ACTION_PATTERNS = [
  "next step",
  "étape suivante",
  "etape suivante",
  "action suivante",
  "à faire maintenant",
  "a faire maintenant",
  "ce que tu dois faire",
  "tu peux maintenant",
  "procède à",
  "procede a",
];

const PREFER_PATTERNS = [
  "ajoute un next step",
  "donne-moi la prochaine étape",
  "donne moi la prochaine etape",
  "conclus avec une action",
  "termine par ce que je dois faire",
  "oriente vers l’action",
  "oriente vers l'action",
];

const AVOID_PATTERNS = [
  "pas de next step",
  "ne conclus pas",
  "pas d’action finale",
  "pas d'action finale",
];

const PROCEDURAL_HINTS = [
  "comment faire",
  "explique les étapes",
  "explique les etapes",
  "process",
  "tutoriel",
];

export function detectNextStepSignal(event: InteractionEvent): Signal | null {
  const modelText = safeLower(event.modelOutput);
  const userText = safeLower(event.userEdit);
  const instruction = safeLower(event.userInstruction);
  const contextText = `${instruction} ${modelText}`;

  const addedPatterns = ACTION_PATTERNS.filter(
    (item) => !modelText.includes(item) && userText.includes(item)
  );

  const removedPatterns = ACTION_PATTERNS.filter(
    (item) => modelText.includes(item) && !userText.includes(item)
  );

  const preferMatches = includesAny(instruction, PREFER_PATTERNS);
  const avoidMatches = includesAny(instruction, AVOID_PATTERNS);

  const isProcedural = includesAny(contextText, PROCEDURAL_HINTS).length > 0;

  let direction: Signal["direction"] = "neutral";
  let score = 0;
  let strength: Signal["strength"] = "weak";

  if (addedPatterns.length >= 1) {
    direction = "prefer_next_step";
    score += 1;
  }

  if (addedPatterns.length >= 2) {
    direction = "prefer_next_step";
    score += 1;
    strength = "strong";
  }

  if (preferMatches.length > 0) {
    direction = "prefer_next_step";
    score += 2;
    strength = "strong";
  }

  if (removedPatterns.length >= 1) {
    direction = "avoid_next_step";
    score += 1;
  }

  if (avoidMatches.length > 0) {
    direction = "avoid_next_step";
    score += 2;
    strength = "strong";
  }

  if (event.userChoice === "with_action") {
    direction = "prefer_next_step";
    score += 1;
  }

  if (event.userChoice === "without_action") {
    direction = "avoid_next_step";
    score += 1;
  }

  if (isProcedural && strength === "strong") {
    strength = "weak";
  }

  if (score <= 0 || direction === "neutral") {
    return null;
  }

  const position =
    userText && addedPatterns.length > 0
      ? userText.lastIndexOf(addedPatterns[0]) > userText.length * 0.75
        ? "final"
        : "middle"
      : null;

  return {
    userId: event.userId,
    signalType: "next_step",
    direction,
    score,
    strength,
    evidence: {
      addedPatterns,
      removedPatterns,
      preferMatches,
      avoidMatches,
      choice: event.userChoice || null,
      position,
      isProcedural,
    },
    timestamp: event.timestamp,
  };
      }
