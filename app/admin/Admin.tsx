"use client";

import { useEffect, useState } from "react";
import type { Content, Guest, Rsvp } from "@/lib/db";
import "./admin.css";

/* ---------- path helpers ---------- */
type Path = (string | number)[];
const get = (o: any, p: Path) => p.reduce((a, k) => (a == null ? a : a[k]), o);
function set(o: any, p: Path, v: any): any {
  if (!p.length) return v;
  const [k, ...rest] = p;
  const copy = Array.isArray(o) ? [...o] : { ...(o || {}) };
  copy[k as any] = set(o?.[k as any], rest, v);
  return copy;
}


/* ---------- context so field components keep identity between renders ---------- */
import { createContext, useContext } from "react";
const Ctx = createContext<{ c: Content; upd: (p: Path, v: any) => void; setMsg: (s: string) => void }>(null as any);
const useCtx = () => useContext(Ctx);

function F({ p, label, type = "text", area = false, hint }: { p: Path; label: string; type?: string; area?: boolean; hint?: string }) {
  const { c, upd } = useCtx();
  return (
  <div className="f">
    <label>{label}</label>
    {area ? (
      <textarea className="input" value={get(c, p) ?? ""} onChange={(e) => upd(p, e.target.value)} />
    ) : (
      <input className="input" type={type} value={get(c, p) ?? ""} onChange={(e) => upd(p, type === "number" ? Number(e.target.value) : e.target.value)} />
    )}
    {hint && <small style={{ color: "var(--muted2)", fontSize: 11 }}>{hint}</small>}
  </div>
);
}

function Up({ p, label, accept = "image/*" }: { p: Path; label: string; accept?: string }) {
  const { c, upd, setMsg } = useCtx();
  const v = get(c, p) || "";
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMsg("Mengunggah " + f.name + "...");
    const fd = new FormData();
    fd.append("file", f);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const d = await r.json();
    if (r.ok) {
      upd(p, d.url);
      setMsg("Terunggah. Jangan lupa Simpan.");
    } else setMsg("Upload gagal: " + d.error);
  }
  return (
    <div className="f">
      <label>{label}</label>
      <div className="upload">
        {v && accept.startsWith("image") && <img className="thumb" src={v} alt="" />}
        <input className="input" value={v} placeholder="https://... (atau unggah)" onChange={(e) => upd(p, e.target.value)} />
        <label className="mini">
          Unggah
          <input type="file" accept={accept} hidden onChange={onFile} />
        </label>
      </div>
    </div>
  );
}

function ListCtl({ p, i }: { p: Path; i: number }) {
  const { c, upd } = useCtx();
  const arr: any[] = get(c, p) || [];
  const move = (d: number) => {
    const a = [...arr];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    upd(p, a);
  }
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button className="mini" onClick={() => move(-1)} disabled={i === 0}>↑</button>
      <button className="mini" onClick={() => move(1)} disabled={i === arr.length - 1}>↓</button>
      <button className="mini danger" onClick={() => confirm("Hapus item ini?") && upd(p, arr.filter((_, k) => k !== i))}>Hapus</button>
    </div>
  );
}
function AddBtn({ p, blank, label }: { p: Path; blank: any; label: string }) {
  const { c, upd } = useCtx();
  return (
  <button className="mini" onClick={() => upd(p, [...(get(c, p) || []), blank])}>+ {label}</button>
);
}


const TABS = ["Umum", "Mempelai", "Acara", "Cerita", "Galeri", "RSVP & Hadiah", "Easter Egg", "Tamu", "Data RSVP"];
const TRIGGERS: [string, string][] = [
  ["logoTap", "Ketuk logo di app bar 7x"],
  ["topBadge", "Ketuk badge TOP 1 di hero 3x"],
  ["coupleHold", "Tahan foto mempelai 1.2 detik"],
  ["search", "Ketik kata kunci di menu Cari"],
  ["allEpisodes", "Buka semua episode Cerita Kami"],
  ["footerTap", "Ketuk logo di footer 5x"],
];

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [c, setC] = useState<Content | null>(null);
  const [preview, setPreview] = useState(false);
  const [tab, setTab] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    fetch("/api/admin/content").then(async (r) => {
      if (r.status === 401) return setAuthed(false);
      const d = await r.json();
      setC(d.content);
      setPreview(d.preview);
      setAuthed(true);
    });
  useEffect(() => {
    load();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) {
      setMsg("");
      load();
    } else setMsg("Password salah");
  };
  const logout = async () => {
    await fetch("/api/admin/login", { method: "DELETE" });
    setAuthed(false);
    setC(null);
  };

  const upd = (p: Path, v: any) => {
    setC((prev) => set(prev, p, v));
    setDirty(true);
  };
  const save = async () => {
    setSaving(true);
    setMsg("");
    const r = await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: c }) });
    setSaving(false);
    if (r.ok) {
      setDirty(false);
      setMsg("Tersimpan " + new Date().toLocaleTimeString("id-ID"));
    } else setMsg("Gagal menyimpan: " + ((await r.json()).error || r.status));
  };

  if (authed === null) return <div className="adm" style={{ color: "var(--muted)" }}>Memuat...</div>;
  if (!authed)
    return (
      <form className="login" onSubmit={login}>
        <div className="brand">ADMIN</div>
        <input className="input" type="password" placeholder="Password admin" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        {msg && <p className="err" style={{ marginTop: 10 }}>{msg}</p>}
        <button className="btn btn-red btn-block" style={{ marginTop: 12 }}>Masuk</button>
      </form>
    );
  if (!c) return null;

  return (
    <Ctx.Provider value={{ c, upd, setMsg }}>
    <div className="adm">
      <div className="adm-top">
        <h1><span className="brand">{c.meta.brand}</span> Admin</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/" target="_blank">Lihat situs ↗</a>
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Keluar</a>
        </div>
      </div>
      {preview && (
        <div className="warn">
          Mode preview: Supabase belum terhubung. Perubahan konten tidak permanen di Vercel, upload foto nonaktif, dan RSVP hilang saat server restart. Isi env Supabase untuk mengaktifkan.
        </div>
      )}
      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={t} className={tab === i ? "on" : ""} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <>
          <div className="panel">
            <h2>Meta &amp; Brand</h2>
            <F p={["meta", "brand"]} label="Nama brand (logo merah)" />
            <F p={["meta", "title"]} label="Judul tab / share" />
            <F p={["meta", "description"]} label="Deskripsi share (WhatsApp/IG)" area />
            <Up p={["meta", "ogImage"]} label="Gambar share (1200x630)" />
          </div>
          <div className="panel">
            <h2>Hero</h2>
            <div className="row2">
              <F p={["hero", "bride"]} label="Nama panggilan wanita" />
              <F p={["hero", "groom"]} label="Nama panggilan pria" />
            </div>
            <div className="row2">
              <F p={["hero", "badge"]} label="Badge (Coming Soon)" />
              <F p={["hero", "hashtag"]} label="Hashtag" />
            </div>
            <div className="row2">
              <F p={["hero", "date"]} label="Tanggal (YYYY-MM-DD)" />
              <F p={["hero", "dateLabel"]} label="Tanggal (tampilan)" />
            </div>
            <F p={["hero", "topBadge"]} label="Badge kecil (TOP 1)" />
            <div className="f">
              <label>Genre tags (pisahkan koma)</label>
              <input className="input" value={(c.hero.genres || []).join(", ")} onChange={(e) => upd(["hero", "genres"], e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
            </div>
            <F p={["hero", "description"]} label="Deskripsi" area />
            <Up p={["hero", "image"]} label="Foto latar hero (potrait)" />
            <div className="row2">
              <F p={["hero", "playLabel"]} label="Tombol Putar" />
              <F p={["hero", "myListLabel"]} label="Tombol Simpan Tanggal" />
            </div>
          </div>
          <div className="panel">
            <h2>App Bar &amp; Navigasi</h2>
            <F p={["app", "homeLabel"]} label="Judul app bar" />
            <F p={["app", "continueTitle"]} label="Judul baris lanjutkan menonton" hint="{guest} diganti nama tamu" />
            <div className="row2">
              <F p={["app", "navHome"]} label="Nav 1" />
              <F p={["app", "navStory"]} label="Nav 2" />
            </div>
            <div className="row2">
              <F p={["app", "navSearch"]} label="Nav 3" />
              <F p={["app", "navProfile"]} label="Nav 4" />
            </div>
            <h3>Chips (tombol pintas di bawah app bar)</h3>
            {c.app.chips.map((_, i) => (
              <div className="item" key={i}>
                <div className="item-head"><b>Chip {i + 1}</b><ListCtl p={["app", "chips"]} i={i} /></div>
                <div className="row2">
                  <F p={["app", "chips", i, "label"]} label="Label" />
                  <div className="f">
                    <label>Tujuan</label>
                    <select className="input" value={get(c, ["app", "chips", i, "target"])} onChange={(e) => upd(["app", "chips", i, "target"], e.target.value)}>
                      {["top", "couple", "events", "story", "gallery", "countdown", "rsvp", "gift"].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <AddBtn p={["app", "chips"]} label="Tambah chip" blank={{ label: "Baru", target: "top" }} />
          </div>
          <div className="panel">
            <h2>Kutipan</h2>
            <F p={["quote", "text"]} label="Teks kutipan" area />
          </div>
          <div className="panel">
            <h2>Musik</h2>
            <div className="row2">
              <F p={["music", "title"]} label="Judul lagu" />
              <F p={["music", "artist"]} label="Artis" />
            </div>
            <Up p={["music", "src"]} label="File audio (mp3)" accept="audio/*" />
            <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={!!c.music.autoplay} onChange={(e) => upd(["music", "autoplay"], e.target.checked)} /> Putar otomatis saat undangan dibuka
            </label>
          </div>
          <div className="panel">
            <h2>Countdown &amp; Penutup</h2>
            <F p={["countdown", "target"]} label="Target countdown (ISO, contoh 2026-10-24T14:00:00+07:00)" />
            <div className="row2">
              <F p={["countdown", "label"]} label="Label kecil" />
              <F p={["countdown", "title"]} label="Judul" />
            </div>
            <F p={["closing", "title"]} label="Judul penutup" />
            <F p={["closing", "text"]} label="Teks penutup" area />
            <F p={["closing", "names"]} label="Nama (pisahkan dengan &)" />
          </div>
        </>
      )}

      {tab === 1 && (
        <>
          <div className="panel">
            <h2>Judul Section</h2>
            <div className="row2">
              <F p={["couple", "label"]} label="Label kecil" />
              <F p={["couple", "title"]} label="Judul" />
            </div>
            <F p={["couple", "subtitle"]} label="Sub judul" />
          </div>
          {(["bride", "groom"] as const).map((k) => (
            <div className="panel" key={k}>
              <h2>{k === "bride" ? "Mempelai Wanita" : "Mempelai Pria"}</h2>
              <F p={["couple", k, "name"]} label="Nama lengkap" />
              <F p={["couple", k, "role"]} label="Peran" />
              <F p={["couple", k, "parents"]} label="Orang tua" area />
              <F p={["couple", k, "instagram"]} label="Instagram (tanpa @)" />
              <Up p={["couple", k, "image"]} label="Foto (potrait 3:4)" />
            </div>
          ))}
        </>
      )}

      {tab === 2 && (
        <>
          <div className="panel">
            <h2>Judul Section</h2>
            <div className="row2">
              <F p={["events", "label"]} label="Label kecil" />
              <F p={["events", "title"]} label="Judul" />
            </div>
            <F p={["events", "subtitle"]} label="Sub judul" />
            <div className="row2">
              <F p={["events", "timelineLabel"]} label="Label timeline" />
              <F p={["events", "timelineEnd"]} label="Teks kanan timeline" />
            </div>
          </div>
          {c.events.items.map((_, i) => (
            <div className="item" key={i}>
              <div className="item-head"><b>Acara {i + 1}</b><ListCtl p={["events", "items"]} i={i} /></div>
              <F p={["events", "items", i, "name"]} label="Nama acara" />
              <div className="row2">
                <F p={["events", "items", i, "date"]} label="Tanggal (YYYY-MM-DD)" />
                <F p={["events", "items", i, "dateLabel"]} label="Tanggal (tampilan)" />
              </div>
              <F p={["events", "items", i, "time"]} label="Jam" />
              <F p={["events", "items", i, "venue"]} label="Tempat" />
              <F p={["events", "items", i, "address"]} label="Alamat" area />
              <F p={["events", "items", i, "mapsUrl"]} label="Link Google Maps" />
            </div>
          ))}
          <AddBtn p={["events", "items"]} label="Tambah acara" blank={{ name: "Acara Baru", date: c.hero.date, dateLabel: c.hero.dateLabel, time: "", venue: "", address: "", mapsUrl: "" }} />
        </>
      )}

      {tab === 3 && (
        <>
          <div className="panel">
            <h2>Judul Section</h2>
            <div className="row2">
              <F p={["story", "label"]} label="Label kecil" />
              <F p={["story", "title"]} label="Judul" />
            </div>
            <F p={["story", "subtitle"]} label="Sub judul" />
          </div>
          {c.story.episodes.map((_, i) => (
            <div className="item" key={i}>
              <div className="item-head"><b>Episode {String(i + 1).padStart(2, "0")}</b><ListCtl p={["story", "episodes"]} i={i} /></div>
              <div className="row2">
                <F p={["story", "episodes", i, "title"]} label="Judul" />
                <F p={["story", "episodes", i, "date"]} label="Waktu (bebas)" />
              </div>
              <F p={["story", "episodes", i, "summary"]} label="Ringkasan (1 kalimat)" />
              <F p={["story", "episodes", i, "body"]} label="Cerita lengkap (muncul saat dibuka)" area />
              <Up p={["story", "episodes", i, "image"]} label="Foto" />
            </div>
          ))}
          <AddBtn p={["story", "episodes"]} label="Tambah episode" blank={{ title: "Episode Baru", date: "", summary: "", body: "", image: "" }} />
        </>
      )}

      {tab === 4 && (
        <>
          <div className="panel">
            <h2>Judul Section</h2>
            <div className="row2">
              <F p={["gallery", "label"]} label="Label kecil" />
              <F p={["gallery", "title"]} label="Judul" />
            </div>
            <F p={["gallery", "subtitle"]} label="Sub judul" />
            <F p={["gallery", "rowTitle"]} label="Judul baris 1" />
            <F p={["gallery", "topTitle"]} label="Judul baris 2 (Top list)" />
          </div>
          <div className="panel">
            <h2>Baris 1</h2>
            {c.gallery.items.map((_, i) => (
              <div className="item" key={i}>
                <div className="item-head"><b>Foto {i + 1}</b><ListCtl p={["gallery", "items"]} i={i} /></div>
                <Up p={["gallery", "items", i, "image"]} label="Foto (potrait 2:3)" />
                <F p={["gallery", "items", i, "badge"]} label="Badge (kosongkan jika tidak perlu)" hint='"Baru Ditambahkan" tampil putih, lainnya merah' />
              </div>
            ))}
            <AddBtn p={["gallery", "items"]} label="Tambah foto" blank={{ image: "", badge: "" }} />
          </div>
          <div className="panel">
            <h2>Baris 2 (Top list bernomor)</h2>
            {c.gallery.topItems.map((_, i) => (
              <div className="item" key={i}>
                <div className="item-head"><b>#{i + 1}</b><ListCtl p={["gallery", "topItems"]} i={i} /></div>
                <Up p={["gallery", "topItems", i, "image"]} label="Foto (potrait 2:3)" />
                <F p={["gallery", "topItems", i, "badge"]} label="Badge" />
              </div>
            ))}
            <AddBtn p={["gallery", "topItems"]} label="Tambah foto" blank={{ image: "", badge: "" }} />
          </div>
        </>
      )}

      {tab === 5 && (
        <>
          <div className="panel">
            <h2>RSVP</h2>
            <div className="row2">
              <F p={["rsvp", "label"]} label="Label kecil" />
              <F p={["rsvp", "title"]} label="Judul" />
            </div>
            <F p={["rsvp", "subtitle"]} label="Sub judul" />
            <F p={["rsvp", "maxGuests"]} label="Maks. tamu per undangan" type="number" />
            <div className="row2">
              <F p={["rsvp", "wishesTitle"]} label="Judul ucapan" />
              <F p={["rsvp", "wishesSubtitle"]} label="Sub judul ucapan" />
            </div>
          </div>
          <div className="panel">
            <h2>Hadiah</h2>
            <div className="row2">
              <F p={["gift", "label"]} label="Label kecil" />
              <F p={["gift", "title"]} label="Judul" />
            </div>
            <F p={["gift", "subtitle"]} label="Sub judul" area />
            <h3>Rekening</h3>
            {c.gift.accounts.map((_, i) => (
              <div className="item" key={i}>
                <div className="item-head"><b>Rekening {i + 1}</b><ListCtl p={["gift", "accounts"]} i={i} /></div>
                <F p={["gift", "accounts", i, "bank"]} label="Bank / e-wallet" />
                <F p={["gift", "accounts", i, "number"]} label="Nomor" />
                <F p={["gift", "accounts", i, "holder"]} label="Atas nama" />
              </div>
            ))}
            <AddBtn p={["gift", "accounts"]} label="Tambah rekening" blank={{ bank: "", number: "", holder: "" }} />
            <h3>Alamat kirim kado</h3>
            <F p={["gift", "address", "recipient"]} label="Penerima" />
            <F p={["gift", "address", "line"]} label="Alamat (kosongkan untuk sembunyikan)" area />
          </div>
        </>
      )}

      {tab === 6 && (
        <>
          <div className="panel">
            <h2>Easter Egg (buat Kahoot)</h2>
            <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
              <input type="checkbox" checked={!!c.eggs.enabled} onChange={(e) => upd(["eggs", "enabled"], e.target.checked)} /> Aktifkan easter egg
            </label>
            <F p={["eggs", "title"]} label="Judul fitur" />
            <F p={["eggs", "intro"]} label="Pengantar di halaman profil" area hint="{n} diganti jumlah rahasia" />
            <F p={["eggs", "foundLabel"]} label="Label progres (Ditemukan x/n)" />
            <F p={["eggs", "finalTitle"]} label="Judul saat semua ditemukan" />
            <F p={["eggs", "finalText"]} label="Pesan akhir (kata kunci Kahoot, dll.)" area />
          </div>
          {c.eggs.items.map((it, i) => (
            <div className="item" key={i}>
              <div className="item-head"><b>Rahasia #{i + 1}</b><ListCtl p={["eggs", "items"]} i={i} /></div>
              <div className="f">
                <label>Cara membuka</label>
                <select className="input" value={it.trigger} onChange={(e) => upd(["eggs", "items", i, "trigger"], e.target.value)}>
                  {TRIGGERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {it.trigger === "search" && <F p={["eggs", "items", i, "keyword"]} label="Kata kunci (harus persis, tidak peduli huruf besar)" />}
              <F p={["eggs", "items", i, "title"]} label="Judul rahasia" />
              <F p={["eggs", "items", i, "hint"]} label="Petunjuk (tampil sebelum ditemukan)" />
              <F p={["eggs", "items", i, "text"]} label="Isi rahasia (fakta buat Kahoot)" area />
              <Up p={["eggs", "items", i, "image"]} label="Foto (opsional)" />
            </div>
          ))}
          <AddBtn p={["eggs", "items"]} label="Tambah rahasia" blank={{ trigger: "search", keyword: "", title: "Rahasia Baru", hint: "", text: "", image: "" }} />
          <p className="note">Tiap cara membuka sebaiknya dipakai satu rahasia saja; kalau dua rahasia pakai cara yang sama, hanya yang pertama yang terbuka.</p>
        </>
      )}
      {tab === 7 && <Guests c={c} />}
      {tab === 8 && <Rsvps />}

      {tab < 7 && (
        <div className="savebar">
          <div className="in">
            <span className="msg">{dirty ? "Ada perubahan belum disimpan" : msg}</span>
            <button className="btn btn-red" onClick={save} disabled={saving || !dirty}>{saving ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </div>
      )}
    </div>
    </Ctx.Provider>
  );
}

/* ---------- guests ---------- */
function Guests({ c }: { c: Content }) {
  const [rows, setRows] = useState<Guest[]>([]);
  const [names, setNames] = useState("");
  const [group, setGroup] = useState("");
  const [copied, setCopied] = useState("");
  const base = (c.meta.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
  const load = () => fetch("/api/admin/guests").then((r) => r.json()).then((d) => setRows(d.guests || []));
  useEffect(() => {
    load();
  }, []);
  const add = async () => {
    await fetch("/api/admin/guests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ names, group }) });
    setNames("");
    load();
  };
  const del = async (id: string) => {
    if (!confirm("Hapus tamu ini?")) return;
    await fetch("/api/admin/guests", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  };
  const link = (g: Guest) => `${base}/?to=${encodeURIComponent(g.name).replace(/%20/g, "+")}`;
  const wa = (g: Guest) =>
    `https://wa.me/?text=${encodeURIComponent(
      `Kepada Yth. ${g.name},\n\nTanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan kami, ${c.hero.bride} & ${c.hero.groom}.\n\nUndangan lengkap: ${link(g)}\n\nMerupakan suatu kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir. Terima kasih.`
    )}`;
  const copy = (s: string) => navigator.clipboard?.writeText(s).then(() => { setCopied(s); setTimeout(() => setCopied(""), 1200); });
  return (
    <>
      <div className="panel">
        <h2>Tambah Tamu</h2>
        <div className="f">
          <label>Nama tamu (satu per baris)</label>
          <textarea className="input" value={names} onChange={(e) => setNames(e.target.value)} placeholder={"Bapak Budi & Keluarga\nIbu Sari\nTeman Kantor Odoo"} style={{ minHeight: 110 }} />
        </div>
        <div className="f">
          <label>Grup (opsional)</label>
          <input className="input" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Keluarga / Kantor / Kuliah" />
        </div>
        <button className="btn btn-red" onClick={add} disabled={!names.trim()}>Tambahkan</button>
      </div>
      <div className="panel">
        <h2>Daftar Tamu ({rows.length})</h2>
        {rows.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13 }}>Belum ada tamu.</p>}
        {rows.map((g) => (
          <div className="item" key={g.id}>
            <div className="item-head">
              <div><b style={{ color: "#fff" }}>{g.name}</b>{g.group_name && <span style={{ color: "var(--muted)", fontSize: 12 }}> · {g.group_name}</span>}</div>
              <button className="mini danger" onClick={() => del(g.id)}>Hapus</button>
            </div>
            <div className="link">{link(g)}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button className="mini" onClick={() => copy(link(g))}>{copied === link(g) ? "Tersalin" : "Salin link"}</button>
              <a className="mini" href={wa(g)} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>Kirim via WhatsApp</a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- rsvps ---------- */
function Rsvps() {
  const [rows, setRows] = useState<Rsvp[]>([]);
  const load = () => fetch("/api/admin/rsvps").then((r) => r.json()).then((d) => setRows(d.rsvps || []));
  useEffect(() => {
    load();
  }, []);
  const del = async (id: string) => {
    if (!confirm("Hapus RSVP ini?")) return;
    await fetch("/api/admin/rsvps", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  };
  const hadir = rows.filter((r) => r.attending);
  const pax = hadir.reduce((a, r) => a + r.guests, 0);
  return (
    <>
      <div className="stat">
        <div><b>{rows.length}</b><span>Respon</span></div>
        <div><b>{hadir.length}</b><span>Hadir</span></div>
        <div><b>{pax}</b><span>Total orang</span></div>
      </div>
      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>Data RSVP</h2>
          <a className="mini" href="/api/admin/rsvps?format=csv" style={{ textDecoration: "none" }}>Unduh CSV</a>
        </div>
        <table className="tbl">
          <thead><tr><th>Nama</th><th>Hadir</th><th>Org</th><th>Ucapan</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}<br /><small style={{ color: "var(--muted2)" }}>{new Date(r.created_at).toLocaleString("id-ID")}</small></td>
                <td>{r.attending ? "Ya" : "Tidak"}</td>
                <td>{r.guests}</td>
                <td style={{ maxWidth: 220 }}>{r.message}</td>
                <td><button className="mini danger" onClick={() => del(r.id)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
