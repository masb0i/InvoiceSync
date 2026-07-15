# PROJECT CONTEXT: InvoiceSync

Kamu adalah AI coding assistant yang membantu membangun MVP SaaS bernama
**InvoiceSync** — platform invoice tracking & accounting automation untuk
UMKM, freelancer, dan SME di Indonesia.

## Status Proyek Saat Ini
- ✅ Sudah selesai: Auth (login), Dashboard, sidebar navigasi, Upload Invoice,
  ekstraksi data via Mistral OCR (Document AI), Review & Edit hasil ekstraksi,
  laporan bulanan (export PDF), enforce kuota free-tier (50 dokumen/bulan).
- ⏳ Belum dikerjakan: integrasi Xendit (langganan Pro).
- Saat melanjutkan fitur baru, JANGAN menulis ulang halaman/fitur yang sudah
  ada kecuali diminta eksplisit — perlakukan sebagai fondasi yang sudah stabil.

## Konsep Produk
User upload foto/scan invoice → sistem AI otomatis membaca amount, vendor,
tanggal, dan kategori → data direkonsiliasi dengan bank statement →
sistem menghasilkan laporan keuangan yang siap dipakai untuk pajak/audit.

Model bisnis: Freemium (gratis 50 invoice/bulan, upgrade untuk automation
& insight lanjutan).

## Tech Stack (WAJIB DIPATUHI — jangan ganti tanpa konfirmasi)
- Backend & DB: Supabase (Postgres + Auth + Storage + Edge Functions)
- AI automation: **Mistral OCR (Document AI) sebagai primary** — model
  `mistral-ocr-latest`, menggunakan fitur `document_annotation_format`
  (JSON Schema) untuk langsung menghasilkan data terstruktur dari
  gambar/PDF dalam satu API call. Native support PDF, jadi tidak perlu
  konversi PDF ke gambar. Groq & Gemini dinonaktifkan dulu, boleh
  dipertimbangkan lagi nanti sebagai fallback/alternatif.
- Frontend: Next.js 14 App Router, TypeScript, TailwindCSS, shadcn/ui
- Chart: Recharts
- Payment: Xendit
- Email: Resend
- Analytics: PostHog
- Hosting: Vercel (frontend) + Supabase Cloud (backend)

## Alur Data Invoice (Pipeline) — 1 Langkah AI via Mistral OCR (Document AI)
Keputusan arsitektur: **Mistral OCR menerima gambar ATAU PDF langsung**
(tidak perlu konversi PDF ke gambar), dan lewat fitur Document AI-nya
langsung menghasilkan data terstruktur sesuai JSON Schema yang kita
tentukan, dalam satu API call.

Alurnya:
```
Upload gambar/PDF → Supabase Storage → Edge Function panggil Mistral OCR API
  (endpoint /v1/ocr, model "mistral-ocr-latest", dengan
  document_annotation_format = JSON Schema kita) → Mistral balas JSON:
  { vendor, tanggal, nominal_total, rincian_item, kategori }
  → simpan sebagai draft di tabel `invoices` → user review & edit di UI
  → setelah dikonfirmasi, status jadi `confirmed`
```
- **Wajib buat layer abstraksi provider AI** (misal fungsi
  `extractInvoiceData(file)` di Edge Function) supaya provider bisa diganti
  tanpa mengubah kode di tempat lain.
- Definisikan JSON Schema ekstraksi invoice sebagai konstanta terpisah
  (reusable), dipakai di parameter `document_annotation_format`.
- `document_annotation_prompt` (prompt pengarah) harus toleran terhadap
  variasi istilah nota lokal Indonesia ("Grand Total", "Jumlah", "Netto",
  dll merujuk ke nominal akhir).
- **Catat biaya:** fitur Document AI (JSON terstruktur) berbayar per halaman
  di luar quota gratis dasar OCR — pantau usage di Mistral Console selama
  development, meskipun tier gratis ("Experiment") sudah cukup untuk testing.
- Kalau Mistral gagal/timeout/rate-limited, tampilkan error yang jelas ke
  user dan minta upload ulang — belum ada fallback provider lain untuk saat ini.
- Rekonsiliasi bank statement adalah fitur terpisah, di luar scope MVP 3 bulan ini
  (lihat Scope MVP) — jangan dibangun sekarang kecuali diminta.

## Skema Database (inti)
Tabel minimal yang dibutuhkan untuk scope MVP saat ini:
- `profiles` — data user, kolom `tier` (`free` | `pro`), diupdate via webhook Xendit.
- `invoices` — hasil ekstraksi: `vendor`, `tanggal`, `nominal_total`, `rincian_item`
  (jsonb), `kategori`, `status` (`draft` | `confirmed`), `image_url`, `user_id`,
  `created_at`.
- `usage_counters` (atau kolom counter di `profiles`) — untuk enforce limit
  50 invoice/bulan di Free tier lewat trigger/function Postgres, bukan cuma
  dihitung di frontend.

Setiap perubahan skema WAJIB lewat migration file Supabase, bukan edit manual
di dashboard (lihat "Yang TIDAK boleh dilakukan").

## Integrasi Xendit & Billing (Deployment: Vercel + Supabase)
Karena frontend live di Vercel dan backend logic di Supabase Edge Functions,
integrasi Xendit WAJIB mengikuti pembagian tanggung jawab berikut:

**1. Semua panggilan ke Xendit terjadi di Supabase Edge Function, bukan Vercel**
- `XENDIT_SECRET_KEY` HANYA disimpan sebagai Supabase secret, TIDAK PERNAH
  di environment variable Vercel maupun kode frontend.
- Alur: user klik "Upgrade ke Pro" di frontend (Vercel) → frontend memanggil
  Edge Function `create-payment-link` → Edge Function ini yang memanggil
  Xendit API pakai secret key → mengembalikan URL pembayaran ke frontend →
  frontend redirect user ke URL tersebut.

**2. Callback URL (webhook) mengarah ke Supabase, bukan Vercel**
- Daftarkan Callback URL Xendit ke endpoint Edge Function yang stabil, mis.
  `https://<project-ref>.supabase.co/functions/v1/handle-xendit-webhook`.
- JANGAN gunakan URL Vercel (apalagi Preview Deployment) sebagai Callback URL
  — URL Preview Vercel berubah tiap deployment sehingga webhook akan putus.
- Edge Function webhook ini WAJIB memvalidasi header `x-callback-token`
  terhadap `XENDIT_CALLBACK_TOKEN` sebelum memproses payload apa pun.
- `success_redirect_url` / `failure_redirect_url` (tempat user diarahkan
  browsernya setelah bayar) BOLEH mengarah ke domain Vercel, karena ini
  bukan jalur data sensitif.

**3. Environment terpisah: Test Mode vs Live Mode**
- Selama development: pakai `XENDIT_SECRET_KEY` awalan `xnd_development_...`
  dan callback token dari Test Mode.
- Sebelum go-live: generate ulang secret key (`xnd_production_...`) dan
  callback token dari Live Mode, lalu update di Supabase secrets. Live Mode
  butuh verifikasi bisnis (KYB) di Xendit terlebih dahulu.
- Simpan dengan penamaan jelas saat development (mis. suffix `_DEV` /
  `_PROD`) agar tidak tertukar saat deploy.

**4. Billing bulanan berulang via Scheduled Edge Function**
- Xendit tidak punya produk "subscription" native. Gunakan Supabase
  Scheduled Function (`pg_cron`) yang berjalan tiap awal bulan:
  cek semua user `tier = pro/enterprise` aktif → generate Invoice API baru
  per user via Xendit → (opsional) kirim reminder via Resend.
- Saat user bayar, webhook masuk ke `handle-xendit-webhook` → update status
  pembayaran & `tier` di tabel `profiles`.
- Kalau lewat jatuh tempo tanpa pembayaran, downgrade otomatis `tier`
  kembali ke `free`.

## Paywall & RLS (harus di-enforce di level DB, bukan hanya UI)
- Free tier: maks 50 invoice/bulan. Ini divalidasi di backend lewat trigger
  Postgres yang cek jumlah row `invoices` milik user dalam 30 hari terakhir
  (atau counter bulanan), BUKAN dicek di React saja.
- Semua tabel yang menyimpan data user (invoices, profiles, dll) WAJIB punya
  RLS policy: user hanya bisa SELECT/INSERT/UPDATE baris miliknya sendiri.
- Update status tier (`free` → `pro`) dilakukan via webhook Xendit yang
  memanggil Supabase (server-side), bukan diubah langsung dari client.

## UI Design Reference
- Saya akan melampirkan referensi UI design (screenshot, mockup, atau file
  Figma/gambar) saat mengerjakan suatu fitur/halaman.
- **Layout global:** semua halaman utama (setelah login) WAJIB punya sidebar
  navigasi kiri, konsisten di seluruh app, mengikuti referensi berikut:
  - Header sidebar: logo InvoiceSync + label tier user (mis. "FREE PLAN").
  - Grup **MENU**: Beranda (dashboard), Invoice.
  - Grup **FINANCIAL**: Rekonsiliasi, Laporan, Pajak & Kepatuhan (badge "Pro"),
    Analitik (badge "Pro").
  - Grup **TOOLS**: Tim (badge "Enterprise"), Pengaturan.
  - Card CTA "Upgrade ke Pro" di bagian bawah sidebar (di atas tombol Keluar).
  - Item berbadge Pro/Enterprise ditampilkan dalam state **locked** (ikon gembok,
    warna redup/disabled) — klik item ini mengarahkan ke halaman upgrade,
    BUKAN ke fitur sungguhan.
  - **Scope MVP saat ini:** hanya Beranda, Invoice, Laporan, dan Pengaturan
    yang perlu difungsikan penuh. Rekonsiliasi, Pajak & Kepatuhan, Analitik,
    dan Tim cukup jadi **UI stub terkunci** (tidak ada logic di baliknya)
    sampai fase Pro/Enterprise dikerjakan — jangan bangun logic-nya sekarang
    kecuali diminta eksplisit.
- WAJIB ikuti referensi tersebut sebagai acuan utama untuk: layout,
  spacing, warna, tipografi, komponen, dan gaya visual — jangan
  membuat desain versi sendiri kalau referensi sudah diberikan.
- Kalau referensi tidak memberikan detail untuk suatu elemen (misal
  state hover, error, atau mobile view), boleh improvisasi TAPI harus
  tetap konsisten dengan gaya visual di referensi (warna, radius,
  font, spacing yang sudah terlihat di gambar).
- Kalau saya belum melampirkan referensi untuk suatu halaman, gunakan
  gaya default: bersih, minimalis, warna netral (biru/putih), khas
  dashboard finance SaaS — sambil menunggu referensi yang lebih spesifik.
- Jangan asumsikan referensi lama masih berlaku untuk halaman baru
  kecuali saya bilang "pakai style yang sama seperti sebelumnya".

## Prinsip Coding
- Gunakan TypeScript strict mode, jangan ada `any` tanpa alasan jelas.
- Semua akses ke Supabase lewat helper client terpisah (`lib/supabase/client.ts`
  untuk browser, `lib/supabase/server.ts` untuk server component).
- Semua tabel Supabase WAJIB pakai Row Level Security (RLS) — user hanya
  boleh akses data miliknya sendiri.
- Simpan API key (Mistral, Xendit, Resend) di `.env.local`, JANGAN pernah
  hardcode di kode.
- Struktur folder Next.js: `app/`, `components/`, `lib/`, `types/`.
- Setiap fitur baru: buat dulu skema database & tipe TypeScript-nya,
  baru bangun UI.
- Gunakan bahasa Indonesia untuk teks UI (label, tombol, pesan error),
  tapi nama variabel/fungsi/komentar kode dalam bahasa Inggris.

## Yang TIDAK boleh dilakukan
- Jangan menambah dependency/library baru di luar tech stack di atas
  tanpa bertanya dulu ke saya.
- Jangan membuat fitur di luar scope MVP (lihat daftar MVP di bawah)
  kecuali saya minta.
- Jangan mengubah skema database yang sudah ada tanpa migration file.
- Jangan menambahkan OCR engine terpisah (Google Vision, Tesseract, dll) —
  ekstraksi data invoice cukup lewat Mistral OCR (Document AI) satu langkah.
- Jangan menulis ulang halaman login/dashboard yang sudah ada tanpa diminta.

## Scope MVP (3 bulan)
1. Auth (sign up/login via Supabase Auth — email + Google OAuth) ✅ selesai
2. Dashboard skeleton ✅ selesai
3. Upload invoice (foto/scan) ke Supabase Storage ✅ selesai
4. AI ekstraksi: amount, vendor, tanggal, kategori otomatis (Mistral OCR Document AI, 1 langkah) ✅ selesai
5. Review & edit hasil ekstraksi oleh user ✅ selesai
6. Dashboard lengkap: ringkasan pengeluaran (pie chart), daftar invoice ✅ selesai
7. Laporan bulanan (export PDF) ✅ selesai
8. Free tier limit: 50 invoice/bulan (enforce di backend, bukan cuma UI) ✅ selesai
9. Premium tier: paywall sederhana + integrasi Xendit untuk subscription
