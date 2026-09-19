import { getContent, isPreview } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({ content: await getContent(), preview: isPreview() });
}
