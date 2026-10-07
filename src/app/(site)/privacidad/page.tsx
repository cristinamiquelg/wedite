import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Política de privacidad — Wedite",
};

// The policy is generated, hosted and kept up to date by LexVibe.
const LEXVIBE_PRIVACY_URL = "https://golexvibe.com/p/5b0ef43a-5f2d-45ef-8234-40f831d64729/privacy";

export default function PrivacidadPage() {
  redirect(LEXVIBE_PRIVACY_URL);
}
