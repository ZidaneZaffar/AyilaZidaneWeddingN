-- Jalankan di Supabase > SQL Editor > New query > Run
-- Semua akses lewat service role key dari server Next.js, jadi RLS dinyalakan
-- dan tidak ada policy publik (anon key tidak dipakai sama sekali).

create table if not exists site_content (
  id int primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

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

alter table site_content enable row level security;
alter table rsvps enable row level security;
alter table guests enable row level security;

-- Bucket publik untuk foto & musik (Storage > New bucket > "media", Public = ON)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
