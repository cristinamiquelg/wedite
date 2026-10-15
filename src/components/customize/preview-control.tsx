"use client";

import { createContext, useContext } from "react";

export type RsvpFocusTarget = "bus" | "contact" | "kids";

// Lets a wizard step steer the live preview beyond the section it scrolls to: today, taking the
// guests' form to the question the couple has just switched on or off.
export const PreviewControlContext = createContext<{ showRsvpQuestion: (target: RsvpFocusTarget) => void }>({
  showRsvpQuestion: () => {},
});

export const usePreviewControl = () => useContext(PreviewControlContext);
