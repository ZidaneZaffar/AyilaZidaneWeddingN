import { createClient, SupabaseClient } from "@supabase/supabase-js";
import defaultContent from "@/data/content.json";

export type Content = typeof defaultContent;

export type Rsvp = {
  id: string;
  name: string;
  attending: boolean;
  guests: number;
  message: string;
  created_at: string;
};

export type Guest = {
  id: string;
  name: string;
  slug: string;
  group_name: string;
  created_at: string;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient | null {
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const isPreview = () => !supabase();

/* ---------- fallback store (no Supabase): memory only ---------- */
const mem: { rsvps: Rsvp[]; guests: Guest[] } = {
  rsvps: [],
  guests: [],
};

/* ---------- content: always from data/content.json, edited in code ---------- */
export async function getContent(): Promise<Content> {
  return defaultContent;
}

/* ---------- rsvp ---------- */
export async function listRsvps(): Promise<Rsvp[]> {
  const sb = supabase();
  if (!sb) return [...mem.rsvps].reverse();
  const { data, error } = await sb
    .from("rsvps")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Rsvp[];
}

export async function addRsvp(r: Omit<Rsvp, "id" | "created_at">): Promise<Rsvp> {
  const sb = supabase();
  if (!sb) {
    const row: Rsvp = { ...r, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    mem.rsvps.push(row);
    return row;
  }
  const { data, error } = await sb.from("rsvps").insert(r).select().single();
  if (error) throw new Error(error.message);
  return data as Rsvp;
}

export async function deleteRsvp(id: string): Promise<void> {
  const sb = supabase();
  if (!sb) {
    mem.rsvps = mem.rsvps.filter((r) => r.id !== id);
    return;
  }
  const { error } = await sb.from("rsvps").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- guests ---------- */
export async function listGuests(): Promise<Guest[]> {
  const sb = supabase();
  if (!sb) return mem.guests;
  const { data, error } = await sb.from("guests").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return data as Guest[];
}

export async function addGuests(rows: { name: string; group_name: string }[]): Promise<Guest[]> {
  const sb = supabase();
  const prepared = rows.map((g) => ({ ...g, slug: slugify(g.name) }));
  if (!sb) {
    const created = prepared.map((g) => ({
      ...g,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    }));
    mem.guests.push(...created);
    return created;
  }
  const { data, error } = await sb.from("guests").insert(prepared).select();
  if (error) throw new Error(error.message);
  return data as Guest[];
}

export async function deleteGuest(id: string): Promise<void> {
  const sb = supabase();
  if (!sb) {
    mem.guests = mem.guests.filter((g) => g.id !== id);
    return;
  }
  const { error } = await sb.from("guests").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
