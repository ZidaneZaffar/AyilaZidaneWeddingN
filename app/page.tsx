import { getContent, isPreview } from "@/lib/db";
import Invitation from "@/components/Invitation";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { to?: string } }) {
  const content = await getContent();
  const to = (searchParams?.to || "").replace(/\+/g, " ").trim();
  return <Invitation content={content} guest={to} preview={isPreview()} />;
}
