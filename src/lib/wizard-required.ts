import type { WeddingData } from "./wedding-types";

// What the couple must get right before the wizard lets them move on. Only the
// couple step has rules; every other step is optional.
//  - partnerA, partnerB and date are mandatory: they can't be empty.
//  - estateName, estateLocation and welcomeMessage are optional, but if they
//    have something it must be at least MIN_LENGTH characters (one stray
//    letter would show up on the site as a meaningless word).
export type RequiredField =
  | "partnerA"
  | "partnerB"
  | "date"
  | "estateName"
  | "estateLocation"
  | "welcomeMessage";

export const MIN_LENGTH = 2;

const MIN_LENGTH_FIELDS: ReadonlySet<RequiredField> = new Set(["estateName", "estateLocation", "welcomeMessage"]);

const REQUIRED_BY_STEP: Record<string, RequiredField[]> = {
  couple: ["partnerA", "partnerB", "date", "estateName", "estateLocation", "welcomeMessage"],
};

/** A field that is optional but, once started, needs at least MIN_LENGTH characters. */
export function hasMinLength(field: RequiredField): boolean {
  return MIN_LENGTH_FIELDS.has(field);
}

function isValid(data: WeddingData, field: RequiredField): boolean {
  const value = data[field].trim();
  return hasMinLength(field) ? value === "" || value.length >= MIN_LENGTH : value !== "";
}

export function missingForStep(stepKey: string, data: WeddingData): RequiredField[] {
  return (REQUIRED_BY_STEP[stepKey] ?? []).filter((field) => !isValid(data, field));
}

export function missingAll(data: WeddingData): RequiredField[] {
  return Object.keys(REQUIRED_BY_STEP).flatMap((key) => missingForStep(key, data));
}

/** Index of the first step with something mandatory still empty, or -1 if none. */
export function firstIncompleteStep(stepKeys: string[], data: WeddingData): number {
  return stepKeys.findIndex((key) => missingForStep(key, data).length > 0);
}
