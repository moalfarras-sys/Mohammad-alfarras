import { generateLegalMetadata, renderLegalPage } from "@/lib/legal-route";

export const generateMetadata = generateLegalMetadata.bind(null, "impressum");

export default function ImpressumPage(props: { params: Promise<{ locale: string }> }) {
  return renderLegalPage("impressum", props);
}
