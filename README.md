<div align="center">

# 🧾 InvoiceSync

**Otomasi pembukuan untuk UMKM, freelancer, dan SME di Indonesia.**
Foto atau upload nota → AI baca & rapikan datanya → laporan keuangan siap pakai.

[![Live Demo](https://img.shields.io/badge/demo-invoice--sync--self.vercel.app-6C4EF6?style=flat-square)](https://invoice-sync-self.vercel.app)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)
![Status](https://img.shields.io/badge/status-in%20development-orange?style=flat-square)

[Live Demo](https://invoice-sync-self.vercel.app) · [Laporkan Bug](../../issues) · [Ajukan Fitur](../../issues)

</div>

---

## 📌 Tentang InvoiceSync

Kebanyakan UMKM dan freelancer di Indonesia masih mencatat pengeluaran secara manual — nota difoto, ditumpuk, lalu direkap manual pas mau lapor pajak. **InvoiceSync** menghilangkan proses itu:

1. Foto/upload nota atau invoice
2. AI otomatis membaca vendor, tanggal, nominal, dan kategori
3. Kamu tinggal review sekilas, bukan input manual dari nol
4. Dashboard & laporan keuangan langsung siap dipakai

## ✨ Fitur

| Fitur | Status |
|---|:---:|
| Autentikasi (Email + Google OAuth via Supabase Auth) | ✅ |
| Dashboard ringkasan keuangan | ✅ |
| Sidebar navigasi & struktur multi-tier (Free/Pro/Enterprise) | ✅ |
| Upload invoice (foto & PDF) | ✅ |
| Ekstraksi data otomatis via AI (Mistral OCR / Document AI) | ✅ |
| Review & edit hasil ekstraksi | ✅ |
| Laporan bulanan (export PDF) | ✅ |
| Kuota Free tier (50 dokumen/bulan, enforced di backend) | ✅ |
| Langganan Pro via Xendit | 🚧 |
| Rekonsiliasi bank otomatis | 🗓️ direncanakan (Pro) |
| Modul pajak & multi-user (Enterprise) | 🗓️ direncanakan |

✅ selesai · 🚧 sedang dikerjakan · 🗓️ direncanakan

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui, Recharts
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, Row Level Security)
- **AI/OCR:** Mistral OCR (Document AI) — ekstraksi data invoice satu langkah, native support gambar & PDF
- **Pembayaran:** Xendit (Invoice API untuk langganan berulang)
- **Email:** Resend
- **Analitik:** PostHog
- **Hosting:** Vercel (frontend) + Supabase Cloud (backend)

## 🚀 Menjalankan Secara Lokal

### Prasyarat
- Node.js 18+
- Akun [Supabase](https://supabase.com)
- Akun [Mistral AI](https://console.mistral.ai) (untuk `MISTRAL_API_KEY`)
- Akun [Xendit](https://dashboard.xendit.co) (mode Test, untuk simulasi pembayaran)

### Instalasi

```bash
git clone https://github.com/masb0i/InvoiceSync.git
cd InvoiceSync
npm install
```

Salin `.env.local.example` menjadi `.env.local`, lalu isi variabel berikut:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI (Mistral OCR)
MISTRAL_API_KEY=

# Payment
XENDIT_SECRET_KEY=
XENDIT_CALLBACK_TOKEN=

# Email
RESEND_API_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
```

Jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

> Untuk Edge Function Supabase, key sensitif (`MISTRAL_API_KEY`, `XENDIT_SECRET_KEY`, dll) disimpan terpisah lewat `supabase secrets set`, bukan lewat `.env.local` — lihat [`AGENTS.md`](./AGENTS.md) untuk detail arsitekturnya.

## 📂 Struktur Proyek

```
InvoiceSync/
├── app/            # Next.js App Router — halaman & route
├── components/     # Komponen UI (termasuk shadcn/ui)
├── lib/            # Helper: Supabase client, utils, dsb.
├── supabase/       # Migrations & Edge Functions
├── types/          # Definisi TypeScript
└── AGENTS.md        # Panduan arsitektur & konvensi untuk AI coding agent
```

## 🗺️ Roadmap

Roadmap pengembangan mengikuti target MVP 3 bulan. Detail arsitektur, keputusan teknis, dan aturan pengembangan lengkap ada di [`AGENTS.md`](./AGENTS.md).

## 💰 Model Bisnis

Freemium — 50 dokumen gratis per bulan, upgrade ke **Pro** untuk kuota tak terbatas, sinkronisasi bank, dan otomasi laporan pajak. Tier **Enterprise** menambahkan multi-user, approval workflow, dan akses API kustom.

## 📄 Lisensi

Belum ditentukan.

---

<div align="center">
Dibangun dengan ❤️ untuk UMKM Indonesia
</div>
