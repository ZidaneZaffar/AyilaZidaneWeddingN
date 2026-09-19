-- Jalankan di Supabase > SQL Editor > New query > Run
-- Semua akses lewat service role key dari server Next.js, jadi RLS dinyalakan
-- dan tidak ada policy publik (anon key tidak dipakai sama sekali).
-- Konten undangan (teks & foto) tidak lagi disimpan di sini, tapi langsung
-- di kode (data/content.json + folder public/). Tabel di bawah ini hanya
-- untuk data yang benar-benar dinamis: RSVP & daftar tamu.

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  attending boolean not null default true,
  guests int not null default 1,
  message text default '',
  created_at timestamptz default now()
);

create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  group_name text default '',
  created_at timestamptz default now()
);

alter table rsvps enable row level security;
alter table guests enable row level security;
