import { redirect } from "next/navigation";

export default async function SupportRedirect({
  searchParams,
}: {
  searchParams?: Promise<{ support?: string }>;
}) {
  const query = (await searchParams) ?? {};
  redirect(query.support ? `/ar/support?support=${encodeURIComponent(query.support)}` : "/ar/support");
}
