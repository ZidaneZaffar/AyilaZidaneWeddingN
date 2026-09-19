"use client";

import { useEffect, useState } from "react";
import type { Content, Guest, Rsvp } from "@/lib/db";
import "./admin.css";

const TABS = ["Tamu", "Data RSVP"];

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [c, setC] = useState<Content | null>(null);
  const [preview, setPreview] = useState(false);
  const [tab, setTab] = useState(0);
  const [msg, setMsg] = useState("");

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
    <div className="adm">
      <div className="adm-top">
        <h1><span className="brand">{c.meta.brand}</span> Admin</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/" target="_blank">Lihat situs ↗</a>
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Keluar</a>
        </div>
      </div>
      <p className="note">Konten undangan (teks &amp; foto) diedit langsung di kode, di file data/content.json. Halaman ini hanya untuk kelola tamu &amp; lihat RSVP.</p>
      {preview && (
        <div className="warn">
          Mode preview: Supabase belum terhubung. Daftar tamu &amp; RSVP hanya tersimpan sementara dan hilang saat server restart. Isi env Supabase untuk mengaktifkan secara permanen.
        </div>
      )}
      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={t} className={tab === i ? "on" : ""} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {tab === 0 && <Guests c={c} />}
      {tab === 1 && <Rsvps />}
    </div>
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
