# Nikahin: Undangan Ayila & Zidane

Undangan pernikahan digital bergaya streaming app (dark, merah, episode, top list) plus CMS sederhana di `/admin`.

Stack: Next.js 14 (App Router) + Supabase (database, storage) + Vercel. Semua gratis di tier free.

## Struktur

```
app/page.tsx              halaman undangan (server, ambil konten dari DB)
components/Invitation.tsx tampilan undangan (semua section + music player)
app/admin/                CMS: login, editor per section, daftar tamu, data RSVP
app/api/                  endpoint: content, rsvp, admin/*
lib/db.ts                 akses Supabase; fallback ke data/content.json kalau env kosong
data/content.json         isi default (dipakai saat preview / pertama kali)
supabase/schema.sql       tabel + bucket storage
```

## Deploy (sekali jalan, kira-kira 20 menit)

### 1. Supabase

1. Buat akun di supabase.com, New project (region Singapore).
2. SQL Editor > New query > tempel isi `supabase/schema.sql` > Run.
3. Project Settings > API: catat `Project URL` dan `service_role` key (yang secret, bukan anon).

### 2. GitHub

Upload folder ini ke repo baru (private boleh). Jangan ikutkan `node_modules` dan `.env`.

### 3. Vercel

1. vercel.com > Add New Project > import repo tadi. Framework otomatis terdeteksi Next.js.
2. Environment Variables:

| Nama | Isi |
|---|---|
| `ADMIN_PASSWORD` | password admin, bebas |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key dari Supabase |
| `NEXT_PUBLIC_SITE_URL` | URL situs setelah deploy, contoh `https://ayila-zidane.vercel.app` (isi setelah deploy pertama, lalu Redeploy) |

3. Deploy. Buka `https://<domain>/admin`, masuk dengan password, klik Simpan sekali supaya konten default masuk ke database.

### 4. Isi konten

Di `/admin`, tab per tab:

- Umum: brand, hero (foto latar potrait), kutipan, musik (unggah mp3), countdown, penutup.
- Mempelai: nama, orang tua, IG, foto 3:4.
- Acara: akad, resepsi, link Maps.
- Cerita: episode; teks "Cerita lengkap" muncul saat episode diketuk.
- Galeri: dua baris foto potrait 2:3, badge opsional.
- RSVP & Hadiah: maks tamu, rekening, alamat kado.
- Easter Egg: rahasia tersembunyi buat Kahoot. Tiap rahasia punya cara buka (ketuk logo 7x, ketuk TOP 1 3x, tahan foto mempelai, kata kunci di menu Cari, buka semua episode, ketuk logo footer 5x), petunjuk, dan isi fakta. Progres tamu tersimpan di HP-nya (localStorage); tab Profil menampilkan petunjuk yang belum ketemu dan pesan akhir saat semua terbuka.
- Tamu: tempel daftar nama, dapat link `?to=Nama` dan tombol kirim WhatsApp.
- Data RSVP: rekap hadir, total orang, unduh CSV.

Tombol Simpan ada di bawah. Situs langsung berubah tanpa deploy ulang.

## Jalankan lokal

```
npm install
cp .env.example .env.local   # isi minimal ADMIN_PASSWORD
npm run dev
```

Tanpa env Supabase, situs jalan dalam mode preview: konten dibaca dari `data/content.json`, RSVP hanya di memori.

## Tampilan (v4)

App bar sticky dengan chips pintas, hero berbentuk kartu poster (genre tags, TOP 1, Putar, Simpan Tanggal), baris "Lanjutkan menonton untuk {nama tamu}" dari episode cerita, Top list bernomor, bottom nav (Home, Episode, Cari, Profil) plus mini music player di atasnya.

## Catatan jujur

- Password admin tersimpan sebagai env var dan cookie hash; cukup untuk undangan, bukan untuk data sensitif.
- Upload foto langsung ke bucket publik `media`. Kompres dulu foto (di bawah 500 KB) supaya undangan cepat dibuka di HP.
- Musik autoplay hanya jalan setelah tamu mengetuk profil di layar pembuka (batasan browser, bukan bug).
- Font Bebas Neue dan Inter dimuat dari Google Fonts; kalau diblokir, jatuh ke font sistem.
