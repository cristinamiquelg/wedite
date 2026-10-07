import type { Metadata } from "next";
import LegalDocument from "@/components/site/LegalDocument";
import { termsDoc } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Términos y condiciones — Wedite",
  description: "Las condiciones de uso y de compra de Wedite.",
};

export default function TerminosPage() {
  return <LegalDocument build={termsDoc} />;
}
