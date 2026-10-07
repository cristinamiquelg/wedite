import type { Metadata } from "next";
import LegalDocument from "@/components/site/LegalDocument";
import { privacyDoc } from "@/lib/legal-content";

export const metadata: Metadata = {
  title: "Política de privacidad — Wedite",
  description: "Qué datos trata Wedite, para qué los usa y cómo podéis ejercer vuestros derechos.",
};

export default function PrivacidadPage() {
  return <LegalDocument build={privacyDoc} />;
}
