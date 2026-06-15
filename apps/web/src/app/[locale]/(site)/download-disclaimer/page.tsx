import { generateLegalMetadata, renderLegalPage } from "@/lib/legal-route";

export const generateMetadata = generateLegalMetadata.bind(null, "download-disclaimer");

export default function DownloadDisclaimerPage(props: { params: Promise<{ locale: string }> }) {
  return renderLegalPage("download-disclaimer", props);
}
