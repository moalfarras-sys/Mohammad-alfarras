import { redirect } from "next/navigation";

export default async function SupportRedirect({
  searchParams,
}: {
  searchParams?: Promise<{ support?: string }>;
}) {
  const query = (await searchParams) ?? {};
  redirect(query.support ? `/en/support?support=${encodeURIComponent(query.support)}` : "/en/support");
}
