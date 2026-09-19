import { cookies } from "next/headers";
import { createHash } from "crypto";

export const COOKIE = "nikahin_admin";

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || "admin";
}

export function token() {
  return createHash("sha256").update("nikahin:" + adminPassword()).digest("hex");
}

export function isAdmin(): boolean {
  return cookies().get(COOKIE)?.value === token();
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
