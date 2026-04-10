import type { MetricsEntry } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __LEARNER_METRICS__: MetricsEntry[];
}

function getMetricsStore() {
  if (!global.__LEARNER_METRICS__) {
    global.__LEARNER_METRICS__ = [];
  }

  return global.__LEARNER_METRICS__;
}

export function logMetrics(entry: MetricsEntry) {
  getMetricsStore().push(entry);
}

export function getUserMetrics(userId: string) {
  return getMetricsStore().filter((entry) => entry.userId === userId);
}
