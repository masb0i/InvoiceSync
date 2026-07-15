# Product Requirements Document (PRD)
## InvoiceSync — Otomasi Pembukuan Berbasis AI untuk UMKM Indonesia

| | |
|---|---|
| **Dokumen** | Product Requirements Document |
| **Produk** | InvoiceSync |
| **Versi** | 1.0 |
| **Status** | In Development (MVP) |
| **Live Demo** | https://invoice-sync-self.vercel.app |
| **Repository** | https://github.com/masb0i/InvoiceSync |

---

## 1. Latar Belakang & Masalah

Sebagian besar Usaha Mikro, Kecil, dan Menengah (UMKM) serta freelancer di Indonesia masih mencatat pengeluaran dan pemasukan secara manual. Nota dan invoice fisik ditumpuk, lalu direkap satu per satu ke buku kas atau spreadsheet — proses yang lambat, rawan salah catat, dan baru terasa menyulitkan saat harus menyiapkan laporan untuk keperluan pajak atau audit.

Di sisi lain, software akuntansi yang tersedia di pasar pada umumnya:
- Dirancang untuk perusahaan menengah-besar dengan kompleksitas fitur yang berlebihan untuk kebutuhan UMKM.
- Tetap mengharuskan input data manual — hanya memindahkan pencatatan dari kertas ke aplikasi, tanpa benar-benar menghilangkan pekerjaan administratifnya.
- Berharga relatif mahal untuk skala usaha mikro.

**InvoiceSync** hadir untuk menutup celah ini: pengguna cukup memfoto atau mengunggah nota/invoice, dan sistem berbasis AI membaca, mengekstrak, mengategorikan datanya secara otomatis — mengubah pekerjaan input manual menjadi proses verifikasi singkat.

## 2. Tujuan Produk (Goals)

1. Mengurangi waktu pencatatan transaksi dari hitungan menit per nota menjadi hitungan detik.
2. Menyediakan ringkasan keuangan (arus kas, kategori pengeluaran) secara real-time tanpa proses rekap manual.
3. Menyediakan laporan keuangan bulanan yang siap dipakai untuk kebutuhan administratif/pajak dasar.
4. Membangun model bisnis berkelanjutan (freemium) yang dapat diakses UMKM skala mikro secara gratis, dengan jalur upgrade yang jelas untuk kebutuhan lebih lanjut.

### Non-Goals (di luar cakupan versi saat ini)
- InvoiceSync bukan pengganti software akuntansi penuh (general ledger, jurnal berpasangan lengkap).
- Bukan aplikasi pelaporan pajak resmi (e-Faktur/SPT) pada tahap MVP — modul ini direncanakan untuk tier lanjutan di masa depan.
- Tidak menangani penggajian (payroll) atau manajemen inventaris.

## 3. Target Pengguna

| Segmen | Kebutuhan Utama |
|---|---|
| **UMKM mikro/kecil** (warung, toko, jasa) | Catat pengeluaran operasional harian tanpa perlu staf akuntansi |
| **Freelancer** | Lacak pengeluaran untuk keperluan pribadi/klien dengan cepat |
| **SME kecil-menengah** | Butuh laporan keuangan rapi + kontrol multi-staf (tier Enterprise) |

### Persona Utama
- **Nama:** Ferra, pemilik toko kelontong/usaha jasa kecil.
- **Masalah:** Menghabiskan waktu tiap akhir bulan merekap nota belanja operasional secara manual, sering lupa mencatat, kesulitan tahu kategori pengeluaran terbesar.
- **Kebutuhan:** Cara cepat mencatat nota tanpa harus mengetik manual, dan gambaran ringkas ke mana uang usahanya pergi.

## 4. Ruang Lingkup Produk (Scope)

### 4.1 Alur Pengguna Utama (Core User Flow)
```
Login → Upload foto/PDF nota → AI mengekstrak data (vendor, tanggal,
nominal, kategori) → Pengguna review & konfirmasi data → Data tersimpan
→ Dashboard & laporan terupdate otomatis
```

### 4.2 Daftar Fitur (Functional Requirements)

| # | Fitur | Deskripsi | Status |
|---|---|---|:---:|
| F1 | Autentikasi | Login/registrasi via email & Google OAuth (Supabase Auth) | ✅ |
| F2 | Dashboard | Ringkasan keuangan: total pengeluaran, invoice belum dibayar, kategori pengeluaran, kuota terpakai | ✅ |
| F3 | Navigasi Sidebar | Navigasi utama dengan struktur menu sesuai tier (Free/Pro/Enterprise) | ✅ |
| F4 | Upload Invoice | Unggah nota/invoice dalam format JPG, JPEG, PNG, atau PDF | ✅ |
| F5 | Ekstraksi Data Otomatis | AI (Mistral OCR/Document AI) membaca dokumen dan mengekstrak vendor, tanggal, nominal, rincian item, dan kategori dalam satu proses | ✅ |
| F6 | Review & Edit | Pengguna dapat meninjau dan mengoreksi hasil ekstraksi AI sebelum data dikonfirmasi | ✅ |
| F7 | Laporan Bulanan | Ekspor laporan ringkasan pengeluaran/pemasukan dalam format PDF | ✅ |
| F8 | Kuota Free Tier | Pembatasan 50 dokumen/bulan untuk pengguna gratis, divalidasi di sisi backend | ✅ |
| F9 | Langganan Pro | Upgrade tier via integrasi payment gateway Xendit, kuota tak terbatas | 🚧 |
| F10 | Rekonsiliasi Bank | Pencocokan otomatis transaksi dengan mutasi rekening bank (tier Pro) | 🗓️ Direncanakan |
| F11 | Modul Pajak | Draf laporan siap e-Faktur/SPT (tier Pro) | 🗓️ Direncanakan |
| F12 | Multi-user & Approval | Kolaborasi tim dengan alur persetujuan pengeluaran (tier Enterprise) | 🗓️ Direncanakan |

✅ selesai · 🚧 sedang dikerjakan · 🗓️ direncanakan

### 4.3 Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| **Keamanan Data** | Setiap tabel database wajib menerapkan Row Level Security (RLS) — pengguna hanya bisa mengakses data miliknya sendiri |
| **Performa** | Proses ekstraksi AI dari upload hingga data draft tersimpan idealnya < 15 detik per dokumen |
| **Ketersediaan** | Aplikasi di-hosting di infrastruktur cloud (Vercel + Supabase Cloud) dengan continuous deployment |
| **Bahasa** | Antarmuka pengguna berbahasa Indonesia; toleran terhadap variasi istilah nota lokal ("Grand Total", "Jumlah", "Netto") |
| **Skalabilitas** | Enforcement kuota dan batasan tier dilakukan di level database (trigger/RLS), bukan hanya di frontend, agar tidak mudah dibobol |

## 5. Model Bisnis & Struktur Tier

Model bisnis **Freemium** dengan tiga tingkatan:

| Tier | Harga | Kuota Dokumen | Fitur Utama |
|---|---|---|---|
| **Free** | Gratis | 50 dokumen/bulan | Ekstraksi dasar, laporan PDF sederhana |
| **Pro** | Rp199.000/bulan | Tak terbatas | + Rekonsiliasi bank, modul pajak, kategorisasi lanjutan |
| **Enterprise** | Rp499.000/bulan | Tak terbatas | + Multi-user, approval workflow, akses API/white-label |

## 6. Arsitektur & Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui, Recharts |
| Backend & Database | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI / Ekstraksi Dokumen | Mistral OCR (Document AI) — satu langkah, mendukung gambar & PDF secara native |
| Payment Gateway | Xendit (Invoice API untuk langganan berulang) |
| Email Transaksional | Resend |
| Analitik Produk | PostHog |
| Hosting | Vercel (frontend) + Supabase Cloud (backend) |

Detail keputusan arsitektur, skema database, dan konvensi pengembangan didokumentasikan di [`AGENTS.md`](./AGENTS.md).

### 6.1 Skema Data Inti

- **`profiles`** — data pengguna, termasuk kolom `tier` (`free`/`pro`/`enterprise`)
- **`invoices`** — hasil ekstraksi: vendor, tanggal, nominal, rincian item, kategori, status (`draft`/`confirmed`), tautan gambar sumber
- **`usage_counters`** — penghitung kuota bulanan per pengguna untuk enforcement tier Free

## 7. Metrik Keberhasilan (Success Metrics)

| Metrik | Target |
|---|---|
| Waktu rata-rata pencatatan per nota | < 30 detik (unggah + review) |
| Akurasi ekstraksi data (vendor, nominal, tanggal) | > 85% tanpa perlu koreksi manual |
| Konversi Free → Pro | Menjadi indikator validasi model bisnis freemium |
| Retensi pengguna aktif bulanan | Dipantau melalui PostHog setelah peluncuran publik |

## 8. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Akurasi AI menurun untuk nota kualitas buruk/tulisan tangan | Fitur Review & Edit sebagai lapisan koreksi manual sebelum data final |
| Ketergantungan pada satu provider AI pihak ketiga | Arsitektur dirancang dengan layer abstraksi provider agar mudah beralih model/vendor |
| Kebocoran data finansial antar pengguna | Row Level Security diterapkan wajib di seluruh tabel sejak awal pengembangan |
| Beban biaya API AI meningkat seiring pertumbuhan pengguna | Pembatasan kuota Free tier di level backend sebagai kontrol biaya |

## 9. Roadmap Pengembangan

Roadmap awal disusun untuk jangka waktu 3 bulan pengembangan MVP:

1. **Bulan 1** — Setup infrastruktur, autentikasi, penyimpanan dokumen
2. **Bulan 2** — Integrasi AI ekstraksi data & antarmuka dashboard
3. **Bulan 3** — Pembatasan tier, integrasi pembayaran, uji coba terbatas, peluncuran

Status detail per fitur tercantum pada bagian [4.2 Daftar Fitur](#42-daftar-fitur-functional-requirements) di atas.

## 10. Referensi

- [`README.md`](./README.md) — panduan instalasi & menjalankan proyek secara lokal
- [`AGENTS.md`](./AGENTS.md) — panduan arsitektur teknis, konvensi kode, dan aturan pengembangan untuk AI coding agent
