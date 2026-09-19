import { isAdmin, unauthorized } from "@/lib/auth";
import { deleteRsvp, listRsvps } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdmin()) return unauthorized();
  const rows = await listRsvps();
  if (new URL(req.url).searchParams.get("format") === "csv") {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      ["Nama", "Hadir", "Jumlah Tamu", "Ucapan", "Waktu"].join(","),
      ...rows.map((r) =>
        [r.name, r.attending ? "Ya" : "Tidak", r.guests, r.message, r.created_at].map(esc).join(",")
      ),
    ].join("\n");
    return new Response("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=rsvp.csv",
      },
    });
  }
  return Response.json({ rsvps: rows });
}

export async function DELETE(req: Request) {
  if (!isAdmin()) return unauthorized();
  const { id } = await req.json();
  await deleteRsvp(id);
  return Response.json({ ok: true });
}
