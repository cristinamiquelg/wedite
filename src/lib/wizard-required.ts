import type { WeddingData } from "./wedding-types";

// What the couple must fill in before the wizard lets them move on. Only the
// couple step has mandatory fields; every other step is optional.
export type RequiredField = "partnerA" | "partnerB" | "date";

const REQUIRED_BY_STEP: Record<string, RequiredField[]> = {
  couple: ["partnerA", "partnerB", "date"],
};

function isFilled(data: WeddingData, field: RequiredField): boolean {
  return data[field].trim() !== "";
}

export function missingForStep(stepKey: string, data: WeddingData): RequiredField[] {
  return (REQUIRED_BY_STEP[stepKey] ?? []).filter((field) => !isFilled(data, field));
}

export function missingAll(data: WeddingData): RequiredField[] {
  return Object.keys(REQUIRED_BY_STEP).flatMap((key) => missingForStep(key, data));
}

/** Index of the first step with something mandatory still empty, or -1 if none. */
export function firstIncompleteStep(stepKeys: string[], data: WeddingData): number {
  return stepKeys.findIndex((key) => missingForStep(key, data).length > 0);
}
