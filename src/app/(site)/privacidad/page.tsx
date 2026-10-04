import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Política de privacidad — Wedite",
};

// The policy is generated, hosted and kept up to date by LexVibe.
const LEXVIBE_PRIVACY_URL = "https://golexvibe.com/p/9c792a55-4811-499c-bd5a-a61abb57aa9c/privacy";

export default function PrivacidadPage() {
  redirect(LEXVIBE_PRIVACY_URL);
}
