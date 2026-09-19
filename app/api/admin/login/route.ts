import { adminPassword, token, COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({}));
  if (password !== adminPassword()) {
    return Response.json({ error: "Password salah" }, { status: 401 });
  }
  cookies().set(COOKIE, token(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return Response.json({ ok: true });
}

export async function DELETE() {
  cookies().delete(COOKIE);
  return Response.json({ ok: true });
}
