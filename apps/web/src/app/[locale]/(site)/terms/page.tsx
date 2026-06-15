import { generateLegalMetadata, renderLegalPage } from "@/lib/legal-route";

export const generateMetadata = generateLegalMetadata.bind(null, "terms");

export default function TermsPage(props: { params: Promise<{ locale: string }> }) {
  return renderLegalPage("terms", props);
}
