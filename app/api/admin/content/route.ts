import { isAdmin, unauthorized } from "@/lib/auth";
import { getContent, isPreview } from "@/lib/db";
export const dynamic = "force-dynamic";

// Site content is edited directly in data/content.json (see README), not through the admin panel.
export async function GET() {
  if (!isAdmin()) return unauthorized();
  return Response.json({ content: await getContent(), preview: isPreview() });
}
