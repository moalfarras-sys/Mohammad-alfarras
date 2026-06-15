import { generateLegalMetadata, renderLegalPage } from "@/lib/legal-route";

export const generateMetadata = generateLegalMetadata.bind(null, "app-disclaimer");

export default function AppDisclaimerPage(props: { params: Promise<{ locale: string }> }) {
  return renderLegalPage("app-disclaimer", props);
}
