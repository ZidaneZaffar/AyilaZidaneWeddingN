"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Content } from "@/lib/db";

/* ---------- small helpers ---------- */
const I = {
  play: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8z" /></svg>,
  pause: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v.5M12 11v5" /></svg>,
  pin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>,
  cal: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  note: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3v12.1A3.5 3.5 0 1 0 11 18V7h6V3H9z" /></svg>,
  ig: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>,
  img: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 16l5-5 4 4 3-3 6 6" /><circle cx="16" cy="9" r="1.5" /></svg>,
  copy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5L20 7" /></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>,
  clips: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>,
  cast: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 18a3 3 0 0 1 3 3M3 14a7 7 0 0 1 7 7M3 10a11 11 0 0 1 11 11M3 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8" /></svg>,
  dl: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" /></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" /></svg>,
  more: <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>,
  egg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3c-4 0-7 6-7 11a7 7 0 0 0 14 0c0-5-3-11-7-11z" /></svg>,
  lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
};

const EGG_KEY = "nikahin_eggs";
function loadEggs(): string[] {
  try { return JSON.parse(localStorage.getItem(EGG_KEY) || "[]"); } catch { return []; }
}
function storeEggs(v: string[]) {
  try { localStorage.setItem(EGG_KEY, JSON.stringify(v)); } catch {}
}

function Img({ src, alt = "" }: { src?: string; alt?: string }) {
  if (src) return <img src={src} alt={alt} loading="lazy" />;
  return <div className="ph">{I.img}</div>;
}

function Head({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <>
      <div className="eyebrow">{label}</div>
      <h2 className="h2">{title}</h2>
      {subtitle && <p className="sub">{subtitle}</p>}
    </>
  );
}

const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");
const fmtTime = (s: number) => (isFinite(s) ? `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}` : "0:00");

function calendarUrl(c: Content) {
  const ev = c.events.items[0];
  if (!ev) return "#";
  const d = ev.date.replace(/-/g, "");
  const text = encodeURIComponent(`Pernikahan ${c.hero.bride} & ${c.hero.groom}`);
  const details = encodeURIComponent(`${ev.name} ${ev.time}\n${ev.venue}`);
  const loc = encodeURIComponent(`${ev.venue}, ${ev.address}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${d}/${d}&details=${details}&location=${loc}`;
}

/* ---------- main ---------- */
export default function Invitation({ content: c, guest, preview }: { content: Content; guest: string; preview: boolean }) {
  const [opened, setOpened] = useState(false);
  const [episode, setEpisode] = useState<number | null>(null);
  const [seen, setSeen] = useState<number[]>([]);
  const [overlay, setOverlay] = useState<"search" | "profile" | null>(null);
  const [q, setQ] = useState("");
  const [saved, setSaved] = useState(false);

  /* easter eggs */
  const eggs = c.eggs?.enabled ? c.eggs.items : [];
  const [found, setFound] = useState<string[]>([]);
  const [reveal, setReveal] = useState<number | null>(null);
  const [showFinal, setShowFinal] = useState(false);
  const taps = useRef<Record<string, number>>({});
  const holdTimer = useRef<any>(null);
  useEffect(() => { setFound(loadEggs()); }, []);
  const eggId = (i: number) => `${eggs[i].trigger}:${i}`;
  const unlock = (i: number) => {
    if (i < 0 || found.includes(eggId(i))) return;
    const next = [...found, eggId(i)];
    setFound(next);
    storeEggs(next);
    setReveal(i);
  };
  const fire = (trigger: string) => {
    const i = eggs.findIndex((e) => e.trigger === trigger);
    if (i >= 0) unlock(i);
  };
  const tapCount = (key: string, need: number, trigger: string) => {
    taps.current[key] = (taps.current[key] || 0) + 1;
    clearTimeout(taps.current[key + "_t"]);
    taps.current[key + "_t"] = setTimeout(() => (taps.current[key] = 0), 1500) as any;
    if (taps.current[key] >= need) { taps.current[key] = 0; fire(trigger); }
  };
  const holdStart = () => { holdTimer.current = setTimeout(() => fire("coupleHold"), 1200); };
  const holdEnd = () => clearTimeout(holdTimer.current);
  const openEpisode = (i: number) => {
    setEpisode(i);
    setSeen((prev) => {
      const n = prev.includes(i) ? prev : [...prev, i];
      if (n.length >= c.story.episodes.length) setTimeout(() => fire("allEpisodes"), 600);
      return n;
    });
  };
  const closeReveal = () => {
    setReveal(null);
    if (eggs.length && found.length >= eggs.length) setTimeout(() => setShowFinal(true), 300);
  };
  const search = (v: string) => {
    setQ(v);
    const kw = v.trim().toLowerCase();
    if (!kw) return;
    eggs.forEach((e, i) => { if (e.trigger === "search" && e.keyword && kw === e.keyword.toLowerCase()) unlock(i); });
  };
  const go = (id: string) => { setOverlay(null); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };
  const firstName = (guest || "kamu").split(" ").slice(0, 2).join(" ");

  /* music */
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState({ cur: 0, dur: 0 });
  const hasMusic = Boolean(c.music.src);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  };

  const open = () => {
    setOpened(true);
    if (hasMusic && c.music.autoplay) audio.current?.play().catch(() => {});
  };

  /* countdown */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(c.countdown.target).getTime();
  const diff = Math.max(0, target - now);
  const cd = {
    d: Math.floor(diff / 864e5),
    h: Math.floor((diff / 36e5) % 24),
    m: Math.floor((diff / 6e4) % 60),
    s: Math.floor((diff / 1e3) % 60),
  };
  const progress = useMemo(() => {
    const start = new Date(c.hero.date).getTime() - 365 * 864e5;
    return Math.min(100, Math.max(5, ((now - start) / (target - start)) * 100));
  }, [now, target, c.hero.date]);

  /* rsvp */
  const [wishes, setWishes] = useState<{ name: string; attending: boolean; message: string; created_at: string }[]>([]);
  const [form, setForm] = useState({ name: guest || "", attending: true, guests: 1, message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const loadWishes = () =>
    fetch("/api/rsvp").then((r) => r.json()).then((d) => setWishes(d.wishes || [])).catch(() => {});
  useEffect(() => {
    loadWishes();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.name.trim()) return setErr("Nama wajib diisi");
    setSending(true);
    try {
      const r = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Gagal mengirim");
      setSent(form.attending ? "Terima kasih, sampai jumpa di hari bahagia kami!" : "Terima kasih atas doa dan ucapannya.");
      setForm((f) => ({ ...f, message: "" }));
      loadWishes();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  };

  const [copied, setCopied] = useState<string | null>(null);
  const copy = (s: string) => {
    navigator.clipboard?.writeText(s).then(() => {
      setCopied(s);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const initials = (guest || `${c.hero.bride[0]}${c.hero.groom[0]}`).trim().slice(0, 1).toUpperCase();

  return (
    <>
      {/* ---------- opener ---------- */}
      <div className={`opener ${opened ? "hide" : ""}`}>
        <div className="brand">{c.meta.brand}</div>
        <h1>Siapa yang menonton?</h1>
        <button className="profile" onClick={open}>
          <div className="avatar">{initials}</div>
          {guest ? (
            <>
              <div className="to">Kepada Yth.</div>
              <div className="guest">{guest}</div>
            </>
          ) : (
            <div className="guest">Tamu Undangan</div>
          )}
        </button>
        <p style={{ color: "var(--muted2)", fontSize: 13, marginTop: 30 }}>Ketuk untuk membuka undangan</p>
      </div>

      <div className="page">
        {/* ---------- app bar ---------- */}
        <div className="appbar">
          <div className="wrap appbar-in">
            <button className="brand brand-btn" onClick={() => tapCount("logo", 7, "logoTap")} aria-label="logo">{c.meta.brand}</button>
            <span className="appbar-title">{c.app.homeLabel}</span>
            <div className="appbar-icons">
              <a href={c.events.items[0]?.mapsUrl || "#"} target="_blank" rel="noreferrer" aria-label="Lokasi">{I.cast}</a>
              <a href={calendarUrl(c)} target="_blank" rel="noreferrer" aria-label="Kalender">{I.dl}</a>
              <button onClick={() => setOverlay("profile")} aria-label="Notifikasi" className="bell">
                {I.bell}
                {eggs.length > 0 && found.length < eggs.length && <i />}
              </button>
            </div>
          </div>
          <div className="wrap chips">
            {c.app.chips.map((ch, i) => (
              <button key={i} onClick={() => go(ch.target)}>{ch.label}</button>
            ))}
          </div>
        </div>

        {/* ---------- hero card ---------- */}
        <header className="wrap" id="top">
          <div className="herocard">
            <div className="herocard-img">
              {c.hero.image ? <img src={c.hero.image} alt="" /> : <div className="hero-ph" />}
              <span className="brand mini-brand">{c.meta.brand.slice(0, 1)}</span>
              <span className="pill herocard-pill">{c.hero.badge}</span>
            </div>
            <div className="herocard-body">
              <h1>
                {c.hero.bride} <span className="amp">&amp;</span> {c.hero.groom}
              </h1>
              <div className="genres">
                {c.hero.genres.map((g, i) => (
                  <span key={i}>{i > 0 && <i>•</i>}{g}</span>
                ))}
              </div>
              <div className="top-row">
                <button className="topbadge topbadge-btn" onClick={() => tapCount("top", 3, "topBadge")}>
                  {c.hero.topBadge.split(" ")[0]}
                  <b>{c.hero.topBadge.split(" ")[1] || ""}</b>
                </button>
                {c.hero.dateLabel}
                {c.hero.hashtag && <span className="tag tag-sm">{c.hero.hashtag}</span>}
              </div>
              <p>{c.hero.description}</p>
              <div className="hero-actions">
                <button className="btn btn-white" onClick={() => { if (hasMusic) toggle(); go("story"); }}>
                  {playing ? I.pause : I.play} {c.hero.playLabel}
                </button>
                <a className="btn btn-grey" href={calendarUrl(c)} target="_blank" rel="noreferrer" onClick={() => setSaved(true)}>
                  {saved ? I.check : I.plus} {c.hero.myListLabel}
                </a>
              </div>
            </div>
          </div>
        </header>

        {/* ---------- continue watching ---------- */}
        <section className="cw">
          <div className="wrap">
            <h3 className="rowtitle">{c.app.continueTitle.replace("{guest}", firstName)}</h3>
            <div className="rail">
              {c.story.episodes.map((ep, i) => (
                <div className="cw-card" key={i}>
                  <button className="cw-thumb" onClick={() => openEpisode(i)}>
                    <Img src={ep.image} />
                    <span className="cw-play">{I.play}</span>
                    {i === 0 && <span className="tenbadge">TOP<b>10</b></span>}
                    {seen.includes(i) ? (
                      <span className="two-badge"><b>Sudah ditonton</b><span>Tonton lagi</span></span>
                    ) : i < 2 ? (
                      <span className="two-badge"><b>Episode Baru</b><span>Tonton Sekarang</span></span>
                    ) : null}
                  </button>
                  <div className="cw-bar"><i style={{ width: `${seen.includes(i) ? 100 : Math.min(85, 15 + i * 17)}%` }} /></div>
                  <div className="cw-actions">
                    <button onClick={() => openEpisode(i)} aria-label="Info">{I.info}</button>
                    <span />
                    <button onClick={() => go("story")} aria-label="Lainnya">{I.more}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- quote ---------- */}
        <section className="quote">
          <div className="bars" />
          <div className="wrap">
            <p>{c.quote.text}</p>
          </div>
        </section>

        {/* ---------- couple ---------- */}
        <section className="section wrap" id="couple">
          <Head label={c.couple.label} title={c.couple.title} subtitle={c.couple.subtitle} />
          <div className="grid2">
            {[c.couple.bride, c.couple.groom].map((p, i) => (
              <div className="card" key={i}>
                <div className="photo" onPointerDown={holdStart} onPointerUp={holdEnd} onPointerLeave={holdEnd} onContextMenu={(e) => e.preventDefault()}>
                  <Img src={p.image} alt={p.name} />
                </div>
                <div className="body">
                  <div className="role">{p.role}</div>
                  <h3>{p.name}</h3>
                  <p className="parents">{p.parents}</p>
                  {p.instagram && (
                    <a className="ig" href={`https://instagram.com/${p.instagram.replace("@", "")}`} target="_blank" rel="noreferrer">
                      {I.ig} @{p.instagram.replace("@", "")}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- events ---------- */}
        <section className="section wrap" id="events">
          <Head label={c.events.label} title={c.events.title} subtitle={c.events.subtitle} />
          {c.events.items.map((ev, i) => (
            <div className="event" key={i}>
              <div className="ep">Episode {pad(i + 1)}</div>
              <h3>{ev.name}</h3>
              <div className="meta">{I.cal}<div>{ev.dateLabel}</div></div>
              <div className="meta">{I.clock}<div>{ev.time}</div></div>
              <div className="meta">{I.pin}<div>{ev.venue}<small>{ev.address}</small></div></div>
              <a className="btn btn-red btn-block" href={ev.mapsUrl} target="_blank" rel="noreferrer">
                {I.pin} Lihat Lokasi
              </a>
              {i === 0 && (
                <a className="btn btn-outline btn-block" href={calendarUrl(c)} target="_blank" rel="noreferrer" style={{ marginTop: 10 }}>
                  {I.cal} Simpan ke Kalender
                </a>
              )}
              <div className="timeline">
                <span>{c.events.timelineLabel}</span>
                <b>{c.events.timelineEnd}</b>
              </div>
              <div className="bar"><i style={{ width: `${progress}%` }} /></div>
            </div>
          ))}
        </section>

        {/* ---------- story ---------- */}
        <section className="section wrap" id="story">
          <Head label={c.story.label} title={c.story.title} subtitle={c.story.subtitle} />
          <div className="eplist">
            {c.story.episodes.map((ep, i) => (
              <button className="ep-row" key={i} onClick={() => openEpisode(i)}>
                <div className="ep-num">{pad(i + 1)}</div>
                <div className="ep-main">
                  <div className="ep-thumb"><Img src={ep.image} /></div>
                  <div>
                    <p className="ep-title">{ep.title}</p>
                    <div className="ep-date">{I.cal} {ep.date}</div>
                    <p className="ep-sum">{ep.summary}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ---------- gallery ---------- */}
        <section className="section" id="gallery">
          <div className="wrap">
            <Head label={c.gallery.label} title={c.gallery.title} subtitle={c.gallery.subtitle} />
            <h3 className="rowtitle">{c.gallery.rowTitle}</h3>
            <div className="rail">
              {c.gallery.items.map((g, i) => (
                <div className="poster" key={i}>
                  <div className="pimg"><Img src={g.image} /></div>
                  {g.badge && <div className={`pbadge ${/baru ditambahkan|recently/i.test(g.badge) ? "white" : "red"}`}>{g.badge}</div>}
                </div>
              ))}
            </div>
            <h3 className="rowtitle" style={{ marginTop: 26 }}>
              <span className="topbadge">TOP<b>{c.gallery.topItems.length}</b></span>
              {c.gallery.topTitle}
            </h3>
            <div className="rail toprail">
              {c.gallery.topItems.map((g, i) => (
                <div className="poster" key={i} data-n={i + 1}>
                  <div className="pimg"><Img src={g.image} /></div>
                  {g.badge && <div className={`pbadge ${/baru ditambahkan/i.test(g.badge) ? "white" : "red"}`}>{g.badge}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- countdown ---------- */}
        <section className="section wrap" id="countdown">
          <Head label={c.countdown.label} title={c.countdown.title} />
          <div className="count">
            <div><b>{cd.d}</b><span>Hari</span></div>
            <div><b>{pad(cd.h)}</b><span>Jam</span></div>
            <div><b>{pad(cd.m)}</b><span>Menit</span></div>
            <div><b>{pad(cd.s)}</b><span>Detik</span></div>
          </div>
        </section>

        {/* ---------- rsvp ---------- */}
        <section className="section wrap" id="rsvp">
          <Head label={c.rsvp.label} title={c.rsvp.title} subtitle={c.rsvp.subtitle} />
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label>Nama</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama kamu" />
            </div>
            <div className="field">
              <label>Kehadiran</label>
              <div className="seg">
                <button type="button" className={form.attending ? "on" : ""} onClick={() => setForm({ ...form, attending: true })}>Hadir</button>
                <button type="button" className={!form.attending ? "on" : ""} onClick={() => setForm({ ...form, attending: false })}>Tidak Hadir</button>
              </div>
            </div>
            <div className="field" hidden={!form.attending}>
              <label>Jumlah Tamu</label>
              <div className="stepper">
                <button type="button" disabled={form.guests <= 1} onClick={() => setForm({ ...form, guests: form.guests - 1 })}>-</button>
                <b>{form.guests}</b>
                <button type="button" disabled={form.guests >= c.rsvp.maxGuests} onClick={() => setForm({ ...form, guests: form.guests + 1 })}>+</button>
                <span className="note" style={{ margin: 0 }}>maks. {c.rsvp.maxGuests} orang</span>
              </div>
            </div>
            <div className="field">
              <label>Ucapan &amp; Doa</label>
              <textarea className="input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tulis ucapan untuk kedua mempelai" />
            </div>
            {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}
            {sent && <div className="ok" style={{ marginBottom: 12 }}>{sent}</div>}
            <button className="btn btn-red btn-block" disabled={sending}>{sending ? "Mengirim..." : "Kirim Konfirmasi"}</button>
            {preview && <p className="note">Mode preview: Supabase belum terhubung, RSVP hanya tersimpan sementara.</p>}
          </form>

          <div style={{ marginTop: 40 }}>
            <Head label="Reviews" title={c.rsvp.wishesTitle} subtitle={c.rsvp.wishesSubtitle} />
            {wishes.length === 0 && <p className="note">Belum ada ucapan. Jadilah yang pertama!</p>}
            {wishes.map((w, i) => (
              <div className="wish" key={i}>
                <div className="w-head">
                  <b>{w.name}</b>
                  <span className={`w-att ${w.attending ? "yes" : "no"}`}>{w.attending ? "Hadir" : "Tidak Hadir"}</span>
                </div>
                <div className="stars">★★★★★</div>
                <p>{w.message}</p>
                <time>{new Date(w.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</time>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- gift ---------- */}
        <section className="section wrap" id="gift">
          <Head label={c.gift.label} title={c.gift.title} subtitle={c.gift.subtitle} />
          {c.gift.accounts.map((a, i) => (
            <div className="bank" key={i}>
              <div className="bname">{a.bank}</div>
              <div className="bnum">{a.number}</div>
              <div className="bholder">a.n. {a.holder}</div>
              <button className="btn btn-grey" type="button" onClick={() => copy(a.number)}>
                {I.copy} {copied === a.number ? "Tersalin" : "Salin Nomor"}
              </button>
            </div>
          ))}
          {c.gift.address.line && (
            <div className="addr">
              <b>Kirim kado ke</b>
              <p>{c.gift.address.recipient}</p>
              <p>{c.gift.address.line}</p>
              <button className="btn btn-grey" type="button" style={{ marginTop: 12, padding: "10px 16px", fontSize: 12 }} onClick={() => copy(`${c.gift.address.recipient}, ${c.gift.address.line}`)}>
                {I.copy} {copied?.startsWith(c.gift.address.recipient) ? "Tersalin" : "Salin Alamat"}
              </button>
            </div>
          )}
        </section>

        {/* ---------- closing ---------- */}
        <section className="closing wrap">
          <h2>{c.closing.title}</h2>
          <p>{c.closing.text}</p>
          <div className="names">
            {c.closing.names.split("&").map((n, i, arr) => (
              <span key={i}>{n.trim()}{i < arr.length - 1 && <span className="amp"> &amp; </span>}</span>
            ))}
          </div>
        </section>
        <footer className="footer">
          <button className="brand brand-btn" onClick={() => tapCount("footer", 5, "footerTap")}>{c.meta.brand}</button>
          {c.hero.dateLabel} · {c.hero.hashtag}
        </footer>
      </div>

      {/* ---------- episode modal ---------- */}
      {episode !== null && c.story.episodes[episode] && (
        <div className="modal-bg" onClick={() => setEpisode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="hero-img">
              <span className="epbadge">EPISODE {pad(episode + 1)}</span>
              <button className="close" onClick={() => setEpisode(null)} aria-label="Tutup">×</button>
              <Img src={c.story.episodes[episode].image} />
              <h3 className="mtitle">{c.story.episodes[episode].title}</h3>
            </div>
            <div className="mbody">
              <div className="mbar"><i /></div>
              <div className="ep-date" style={{ marginBottom: 12 }}>{I.cal} {c.story.episodes[episode].date}</div>
              <p className="mq">{c.story.episodes[episode].summary}</p>
              <p className="mtext">{c.story.episodes[episode].body}</p>
            </div>
          </div>
        </div>
      )}

      {/* ---------- egg reveal ---------- */}
      {reveal !== null && eggs[reveal] && (
        <div className="modal-bg" onClick={closeReveal}>
          <div className="modal egg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="egg-head">
              <span className="epbadge" style={{ position: "static" }}>{c.eggs.title} · {found.length}/{eggs.length}</span>
              <div className="egg-icon">{I.egg}</div>
              <h3>{eggs[reveal].title}</h3>
            </div>
            {eggs[reveal].image && <img src={eggs[reveal].image} alt="" className="egg-img" />}
            <p className="mtext egg-text">{eggs[reveal].text}</p>
            <button className="btn btn-red btn-block" onClick={closeReveal}>Mantap</button>
          </div>
        </div>
      )}
      {showFinal && (
        <div className="modal-bg" onClick={() => setShowFinal(false)}>
          <div className="modal egg-modal final" onClick={(e) => e.stopPropagation()}>
            <div className="egg-head">
              <div className="egg-icon gold">{I.check}</div>
              <h3>{c.eggs.finalTitle}</h3>
            </div>
            <p className="mtext egg-text">{c.eggs.finalText}</p>
            <button className="btn btn-red btn-block" onClick={() => setShowFinal(false)}>Siap</button>
          </div>
        </div>
      )}

      {/* ---------- search overlay ---------- */}
      {overlay === "search" && (
        <div className="overlay">
          <div className="wrap">
            <div className="searchbar">
              {I.search}
              <input autoFocus value={q} onChange={(e) => search(e.target.value)} placeholder="Cari episode, acara, atau kata rahasia..." />
              <button onClick={() => { setOverlay(null); setQ(""); }}>Batal</button>
            </div>
            <div className="results">
              {(() => {
                const kw = q.trim().toLowerCase();
                const items = [
                  ...c.story.episodes.map((e, i) => ({ t: e.title, s: e.summary, act: () => { setOverlay(null); openEpisode(i); } })),
                  ...c.events.items.map((e) => ({ t: e.name, s: `${e.dateLabel} · ${e.time}`, act: () => go("events") })),
                  { t: c.rsvp.title, s: c.rsvp.subtitle, act: () => go("rsvp") },
                  { t: c.gift.title, s: c.gift.subtitle, act: () => go("gift") },
                  { t: c.gallery.title, s: c.gallery.subtitle, act: () => go("gallery") },
                ].filter((r) => !kw || r.t.toLowerCase().includes(kw) || r.s.toLowerCase().includes(kw));
                if (!items.length) return <p className="note">Tidak ada hasil. Tapi coba kata lain, siapa tahu ada rahasia.</p>;
                return items.map((r, i) => (
                  <button className="result" key={i} onClick={r.act}>
                    <b>{r.t}</b><span>{r.s}</span>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ---------- profile overlay ---------- */}
      {overlay === "profile" && (
        <div className="overlay">
          <div className="wrap">
            <div className="prof-head">
              <div className="avatar" style={{ width: 72, height: 72, fontSize: 30, margin: 0 }}>{initials}</div>
              <div>
                <div className="to" style={{ fontSize: 11, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--muted2)" }}>{guest ? "Kepada Yth." : "Profil"}</div>
                <div className="guest" style={{ fontSize: 20, fontWeight: 700 }}>{guest || "Tamu Undangan"}</div>
              </div>
              <button className="mini-x" onClick={() => setOverlay(null)}>×</button>
            </div>
            <div className="prof-links">
              <button onClick={() => go("rsvp")}>{I.check} Konfirmasi kehadiran</button>
              <button onClick={() => go("gift")}>{I.copy} Kirim hadiah</button>
              <a href={calendarUrl(c)} target="_blank" rel="noreferrer">{I.cal} Simpan ke kalender</a>
            </div>
            {eggs.length > 0 && (
              <div className="egg-panel">
                <div className="eyebrow">{c.eggs.title}</div>
                <h3>{c.eggs.foundLabel} {found.length}/{eggs.length}</h3>
                <p className="note" style={{ marginTop: 0 }}>{c.eggs.intro.replace("{n}", String(eggs.length))}</p>
                <div className="egg-list">
                  {eggs.map((e, i) => {
                    const ok = found.includes(eggId(i));
                    return (
                      <button className={`egg-row ${ok ? "ok" : ""}`} key={i} onClick={() => ok && setReveal(i)}>
                        <span className="egg-ic">{ok ? I.check : I.lock}</span>
                        <span>
                          <b>{ok ? e.title : `Rahasia #${i + 1}`}</b>
                          <small>{ok ? "Ketuk untuk lihat lagi" : e.hint}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {found.length >= eggs.length && (
                  <button className="btn btn-red btn-block" style={{ marginTop: 12 }} onClick={() => setShowFinal(true)}>{c.eggs.finalTitle}</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- bottom nav ---------- */}
      <nav className={`bnav ${opened ? "" : "player-hidden"}`}>
        <button onClick={() => { setOverlay(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{I.home}<span>{c.app.navHome}</span></button>
        <button onClick={() => go("story")}>{I.clips}<span>{c.app.navStory}</span></button>
        <button className={overlay === "search" ? "on" : ""} onClick={() => setOverlay(overlay === "search" ? null : "search")}>{I.search}<span>{c.app.navSearch}</span></button>
        <button className={overlay === "profile" ? "on" : ""} onClick={() => setOverlay(overlay === "profile" ? null : "profile")}>
          <span className="avatar nav-avatar">{initials}</span><span>{c.app.navProfile}</span>
          {eggs.length > 0 && found.length < eggs.length && <i className="dot" />}
        </button>
      </nav>

      {/* ---------- player ---------- */}
      <div className={`player ${opened ? "" : "player-hidden"}`}>
          {hasMusic && <audio
            ref={audio}
            src={c.music.src}
            loop
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setT({ cur: e.currentTarget.currentTime, dur: e.currentTarget.duration || 0 })}
            onLoadedMetadata={(e) => setT({ cur: 0, dur: e.currentTarget.duration || 0 })}
          />}
          <div className="pbar"><i style={{ width: t.dur ? `${(t.cur / t.dur) * 100}%` : 0 }} /></div>
          <div className="pin">
            <div className={`icon ${playing ? "spin" : ""}`}>{I.note}</div>
            <div className="info">
              <b>{c.music.title || "Belum ada lagu"}</b>
              <span>{c.music.artist || "Unggah mp3 di admin"}</span>
            </div>
            <div className="time">{fmtTime(t.cur)} / {fmtTime(t.dur)}</div>
            <button className="play" onClick={toggle} aria-label={playing ? "Pause" : "Play"} disabled={!hasMusic} title={hasMusic ? "" : "Unggah lagu di admin"}>
              {playing ? I.pause : I.play}
            </button>
          </div>
        </div>
    </>
  );
}
