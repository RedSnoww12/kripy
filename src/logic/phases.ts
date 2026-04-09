export type PhaseId = "A" | "B" | "C" | "D" | "E";

export const PHASE_NAMES: Record<PhaseId, string> = {
  A: "Pre-prep",
  B: "Deficit",
  C: "Reverse",
  D: "PDM",
  E: "Reset",
};

export const PHASE_MULTIPLIERS: Record<PhaseId, number> = {
  A: 1.0,
  B: 0.85,
  C: 0.9,
  D: 1.075,
  E: 0.88,
};

export const PHASE_COLORS: Record<PhaseId, string> = {
  A: "#00B894",
  B: "#FD79A8",
  C: "#A29BFE",
  D: "#F39C12",
  E: "#6C5CE7",
};

export const PHASE_IDS: PhaseId[] = ["A", "B", "C", "D", "E"];
