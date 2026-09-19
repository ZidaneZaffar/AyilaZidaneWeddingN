import { addRsvp, listRsvps, isPreview } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listRsvps();
  // publik hanya melihat ucapan, tanpa jumlah tamu
  return Response.json({
    preview: isPreview(),
    wishes: rows
      .filter((r) => r.message?.trim())
      .map((r) => ({ name: r.name, attending: r.attending, message: r.message, created_at: r.created_at })),
  });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const name = String(b.name || "").trim().slice(0, 80);
  const message = String(b.message || "").trim().slice(0, 500);
  const attending = Boolean(b.attending);
  const guests = Math.max(1, Math.min(10, Number(b.guests) || 1));
  if (!name) return Response.json({ error: "Nama wajib diisi" }, { status: 400 });
  const row = await addRsvp({ name, attending, guests: attending ? guests : 0, message });
  return Response.json({ ok: true, rsvp: row, preview: isPreview() });
}
