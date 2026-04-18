import { redirect } from "next/navigation";

export default async function CvPageRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/about`);
}
