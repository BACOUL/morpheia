import type { Rule } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __LEARNER_RULES__: Record<string, Rule[]>;
}

function getStore() {
  if (!global.__LEARNER_RULES__) {
    global.__LEARNER_RULES__ = {};
  }

  return global.__LEARNER_RULES__;
}

export function getUserRules(userId: string): Rule[] {
  return getStore()[userId] || [];
}

export function saveUserRules(userId: string, rules: Rule[]) {
  getStore()[userId] = rules;
}
