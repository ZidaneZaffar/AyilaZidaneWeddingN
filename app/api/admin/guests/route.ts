import { isAdmin, unauthorized } from "@/lib/auth";
import { addGuests, deleteGuest, listGuests } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return unauthorized();
  return Response.json({ guests: await listGuests() });
}

export async function POST(req: Request) {
  if (!isAdmin()) return unauthorized();
  const { names, group } = await req.json();
  const rows = String(names || "")
    .split("\n")
    .map((s: string) => s.trim())
    .filter(Boolean)
    .map((name: string) => ({ name, group_name: String(group || "") }));
  if (!rows.length) return Response.json({ error: "Kosong" }, { status: 400 });
  return Response.json({ guests: await addGuests(rows) });
}

export async function DELETE(req: Request) {
  if (!isAdmin()) return unauthorized();
  const { id } = await req.json();
  await deleteGuest(id);
  return Response.json({ ok: true });
}
