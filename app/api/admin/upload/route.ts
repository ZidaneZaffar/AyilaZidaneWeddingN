import { isAdmin, unauthorized } from "@/lib/auth";
import { uploadFile } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAdmin()) return unauthorized();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Tidak ada file" }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return Response.json({ error: "Maksimal 15 MB" }, { status: 400 });
  try {
    const url = await uploadFile(file.name, Buffer.from(await file.arrayBuffer()), file.type);
    return Response.json({ url });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
