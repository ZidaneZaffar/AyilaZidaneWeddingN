import { isAdmin, unauthorized } from "@/lib/auth";
import { getContent, saveContent, isPreview } from "@/lib/db";
import { revalidatePath } from "next/cache";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return unauthorized();
  return Response.json({ content: await getContent(), preview: isPreview() });
}

export async function PUT(req: Request) {
  if (!isAdmin()) return unauthorized();
  const body = await req.json();
  try {
    await saveContent(body.content);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
  revalidatePath("/");
  return Response.json({ ok: true });
}
