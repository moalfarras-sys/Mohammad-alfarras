import type { Metadata } from "next";

import { EmailCenter } from "@/components/admin/pages/email-center";
import { isMailerConfigured } from "@/lib/mailer";
import { readEmailInboxData } from "@/lib/email-center";

export const metadata: Metadata = { title: "Email Management", robots: { index: false, follow: false } };

export default async function EmailPage() {
  const data = await readEmailInboxData();
  return <EmailCenter data={data} smtpReady={isMailerConfigured()} />;
}
