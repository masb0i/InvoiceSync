"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Check, ArrowLeft, Sparkles, Zap, ShieldCheck, ChevronDown, Sparkle } from "lucide-react"

interface Tier {
  id: "basic" | "pro" | "enterprise"
  name: string
  priceMonthly: string
  priceAnnual: string
  priceValMonthly: number
  priceValAnnual: number
  billedAnnual: string
  description: string
  features: string[]
  badge?: string
  icon: any
  color: string
}

const TIERS: Tier[] = [
  {
    id: "basic",
    name: "Basic",
    priceMonthly: "Rp 99.000",
    priceAnnual: "Rp 79.000",
    priceValMonthly: 99000,
    priceValAnnual: 79000,
    billedAnnual: "Rp 948.000",
    description: "Cocok untuk freelancer dan UMKM mikro.",
    features: [
      "Kuota 250 invoice / bulan",
      "AI OCR Otomatis (Mistral OCR)",
      "Ekspor Laporan Bulanan (PDF)",
      "Dashboard Ringkasan Dasar",
      "Keamanan Data RLS Standar",
    ],
    icon: Zap,
    color: "blue",
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: "Rp 199.000",
    priceAnnual: "Rp 159.000",
    priceValMonthly: 199000,
    priceValAnnual: 159000,
    billedAnnual: "Rp 1.908.000",
    description: "Sangat direkomendasikan untuk bisnis berkembang & SME.",
    features: [
      "Kuota 1.000 invoice / bulan",
      "AI OCR Otomatis Prioritas (Mistral OCR)",
      "Otomatis Rekonsiliasi Bank Statement",
      "Multi-User Akses Tim (Struktur UI)",
      "Prioritas Email Support",
    ],
    badge: "Terpopuler",
    icon: Sparkles,
    color: "indigo",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: "Rp 499.000",
    priceAnnual: "Rp 399.000",
    priceValMonthly: 499000,
    priceValAnnual: 399000,
    billedAnnual: "Rp 4.788.000",
    description: "Solusi korporat & audit akuntansi berskala besar.",
    features: [
      "Kuota Invoice Tanpa Batas (Unlimited)",
      "Integrasi Custom AI & Fallback",
      "Laporan Lengkap Audit Pajak & Rekonsiliasi",
      "Dedicated Account Manager",
      "SLA Server 99.9%",
    ],
    icon: ShieldCheck,
    color: "violet",
  },
]

const FAQS = [
  {
    question: "Bagaimana cara kerja pembayaran di InvoiceSync?",
    answer: "Kami menggunakan Xendit sebagai payment gateway resmi. Anda bisa membayar dengan aman menggunakan Transfer Bank (Virtual Account), E-Wallet (OVO, Dana, LinkAja, ShopeePay), QRIS, atau Kartu Kredit."
  },
  {
    question: "Apakah saya bisa membatalkan langganan kapan saja?",
    answer: "Tentu saja. Anda bisa membatalkan langganan Anda kapan saja melalui halaman Pengaturan Bisnis. Akun Anda akan tetap memiliki akses premium hingga akhir masa penagihan berjalan."
  },
  {
    question: "Apakah data keuangan dan invoice saya aman?",
    answer: "Sangat aman. Semua data disimpan dalam database PostgreSQL Supabase dengan perlindungan Row Level Security (RLS) tingkat tinggi. Setiap pengguna hanya bisa melihat data milik mereka sendiri. Data Anda tidak akan dibagikan ke pihak ketiga."
  },
  {
    question: "Apa yang terjadi jika kuota invoice bulanan saya habis?",
    answer: "Untuk pengguna paket Free, pembacaan invoice baru akan terkunci setelah mencapai 50 invoice. Pada paket Basic dan Pro, jika Anda mencapai batas limit, Anda akan ditawarkan untuk upgrade ke tier berikutnya atau membeli kuota tambahan."
  }
]

export default function PricingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = React.useState<any | null>(null)
  const [loadingTier, setLoadingTier] = React.useState<string | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  
  // Interactive UI states
  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "annual">("monthly")
  const [openFaq, setOpenFaq] = React.useState<number | null>(null)
  const [showAnnualModal, setShowAnnualModal] = React.useState(false)
  const [selectedTierForAnnual, setSelectedTierForAnnual] = React.useState<"basic" | "pro" | "enterprise" | null>(null)

  React.useEffect(() => {
    // Fetch active session on client
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
    }
    checkUser()
  }, [supabase.auth])

  const handleUpgrade = async (tierId: "basic" | "pro" | "enterprise") => {
    if (!user) {
      router.push(`/login?next=/pricing`)
      return
    }

    if (billingPeriod === "annual") {
      setSelectedTierForAnnual(tierId)
      setShowAnnualModal(true)
      return
    }

    setLoadingTier(tierId)
    setErrorMsg(null)

    try {
      const response = await fetch("/api/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier: tierId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Gagal memproses pembayaran.")
      }

      // Redirect user to Xendit Invoice Portal
      if (result.invoiceUrl) {
        window.location.href = result.invoiceUrl
      } else {
        throw new Error("URL invoice tidak ditemukan.")
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "Terjadi kesalahan saat memulai pembayaran.")
      setLoadingTier(null)
    }
  }

  const handleProceedWithMonthly = () => {
    setShowAnnualModal(false)
    if (selectedTierForAnnual) {
      // Force billing period to monthly for checkout process
      setBillingPeriod("monthly")
      handleUpgrade(selectedTierForAnnual)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-slate-55/40 py-16 px-6 relative overflow-hidden flex flex-col items-center">
      
      {/* Stylesheets containing premium micro-animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-slow-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(45px, -65px) scale(1.08); }
        }
        @keyframes float-slow-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-55px, 45px) scale(1.04); }
        }
        @keyframes float-slow-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(35px, 55px) scale(0.96); }
        }
        @keyframes text-shine {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-float-1 {
          animation: float-slow-1 25s ease-in-out infinite;
        }
        .animate-float-2 {
          animation: float-slow-2 28s ease-in-out infinite;
        }
        .animate-float-3 {
          animation: float-slow-3 22s ease-in-out infinite;
        }
        .animate-text-shine {
          background-size: 200% auto;
          animation: text-shine 6s linear infinite;
        }
        .card-slide-up-0 {
          animation: slideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .card-slide-up-1 {
          animation: slideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.12s forwards;
          opacity: 0;
        }
        .card-slide-up-2 {
          animation: slideUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.24s forwards;
          opacity: 0;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(35px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes border-glow-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .pro-glowing-border {
          position: relative;
        }
        .pro-glowing-border::before {
          content: '';
          position: absolute;
          inset: -1.5px;
          background: linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6, #3b82f6);
          background-size: 300% 300%;
          z-index: 0;
          border-radius: 24px;
          animation: border-glow-move 6s linear infinite;
        }
        .pro-glowing-border > div {
          position: relative;
          z-index: 10;
        }
      `}} />

      {/* Floating animated blobs */}
      <div className="absolute top-[10%] left-[-15%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-blue-300/10 to-indigo-400/10 blur-[100px] animate-float-1 pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-indigo-300/10 to-violet-400/10 blur-[100px] animate-float-2 pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-br from-violet-300/5 to-fuchsia-400/5 blur-[120px] animate-float-3 pointer-events-none" />

      <div className="max-w-6xl w-full text-center relative z-10 space-y-10">
        
        {/* Header Title */}
        <div className="space-y-4 max-w-3xl mx-auto flex flex-col items-center">
          <button
            onClick={() => router.push(user ? "/dashboard" : "/")}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-slate-200/80 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-white shadow-sm transition-all active:scale-95 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </button>
          
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
            <Sparkle className="w-3 h-3 text-blue-600 animate-spin" style={{ animationDuration: '4s' }} />
            <span>InvoiceSync Premium</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight leading-tight sm:text-5xl max-w-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 bg-clip-text text-transparent">
            Upgrade Bisnis Anda ke Level Premium
          </h1>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            Dapatkan kuota pembacaan AI OCR lebih banyak, otomatisasi rekonsiliasi laporan bank, dan buat laporan keuangan dengan standar audit instan.
          </p>
        </div>

        {errorMsg && (
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2 animate-bounce">
            <span>🛑</span>
            <div className="font-semibold">{errorMsg}</div>
          </div>
        )}

        {/* Billing Switcher Toggle */}
        <div className="inline-flex items-center bg-slate-100/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200/60 relative">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-extrabold transition-all relative z-10 duration-200",
              billingPeriod === "monthly" ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Bulanan
          </button>
          <button
            onClick={() => setBillingPeriod("annual")}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-extrabold transition-all relative z-10 duration-200 flex items-center gap-1.5",
              billingPeriod === "annual" ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <span>Tahunan</span>
            <span className="bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-md font-black tracking-wider uppercase">Hemat 20%</span>
          </button>
          {/* Animated Selection Slide */}
          <div
            className={cn(
              "absolute top-1 bottom-1 left-1 rounded-xl bg-white border border-slate-250/20 shadow-sm transition-all duration-300 ease-out",
              billingPeriod === "monthly" ? "w-[83px] translate-x-0" : "w-[125px] translate-x-[83px]"
            )}
          />
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto pt-4 relative">
          {TIERS.map((tier, index) => {
            const isLoading = loadingTier === tier.id
            const isPro = tier.id === "pro"
            const Icon = tier.icon
            
            const cardContent = (
              <div className={cn(
                "relative flex flex-col justify-between rounded-[22px] p-8 bg-white/80 backdrop-blur-xl transition-all duration-500 border h-full text-left",
                isPro 
                  ? "border-transparent shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10 bg-white" 
                  : "border-slate-200/80 hover:border-slate-300 hover:bg-white shadow-sm hover:shadow-md"
              )}>
                {/* Popular Badge */}
                {tier.badge && (
                  <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-650 text-white shadow-sm shadow-blue-500/20 animate-pulse">
                    {tier.badge}
                  </span>
                )}

                <div className="space-y-6">
                  {/* Tier Icon & Title */}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300",
                      isPro 
                        ? "bg-indigo-50 border-indigo-100 text-indigo-600 shadow-inner" 
                        : "bg-slate-50 border-slate-100 text-slate-500"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{tier.name}</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">InvoiceSync Premium</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 min-h-[32px] leading-relaxed">{tier.description}</p>

                  {/* Pricing Display */}
                  <div className="border-y border-slate-100/80 py-4 flex flex-col justify-center">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-800 tracking-tight">
                        {billingPeriod === "monthly" ? tier.priceMonthly : tier.priceAnnual}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">/ bulan</span>
                    </div>
                    {billingPeriod === "annual" && (
                      <span className="text-[9px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                        ✨ Ditagih {tier.billedAnnual} / tahun
                      </span>
                    )}
                  </div>

                  {/* Features Checklist */}
                  <ul className="space-y-3.5 text-xs text-slate-600">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 group/item">
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover/item:scale-110",
                          isPro 
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                            : "bg-slate-50 border-slate-100 text-slate-500"
                        )}>
                          <Check className="w-3 h-3 font-bold" />
                        </span>
                        <span className="leading-tight mt-0.5 font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Action Button */}
                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={loadingTier !== null}
                    className={cn(
                      "w-full h-11 rounded-xl text-xs font-extrabold active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover:shadow-md",
                      isPro
                        ? "bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white shadow-md shadow-blue-500/15"
                        : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900"
                    )}
                  >
                    {isLoading ? (
                      <span className="w-4.5 h-4.5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                    ) : (
                      "Upgrade Sekarang"
                    )}
                  </button>
                </div>
              </div>
            )

            return (
              <div
                key={tier.id}
                className={cn(
                  `card-slide-up-${index} transition-all duration-500 h-full`,
                  isPro 
                    ? "pro-glowing-border scale-105 md:translate-y-[-10px] p-[1.5px] rounded-[24px] shadow-2xl" 
                    : "p-0"
                )}
              >
                {cardContent}
              </div>
            )
          })}
        </div>

        {/* Trust Badges */}
        <div className="max-w-4xl mx-auto py-8 border-y border-slate-100/80 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-slate-400 pt-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Pembayaran Aman via Xendit</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">Row Level Security (RLS)</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-violet-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700">SLA Jaringan Server 99.9%</span>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="max-w-3xl mx-auto space-y-4 pt-10 text-left">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-xs text-slate-400">Temukan jawaban cepat mengenai paket billing dan keamanan data Anda.</p>
          </div>
          
          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div key={index} className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-slate-800 text-xs sm:text-sm hover:bg-slate-50 transition-all outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-350 shrink-0", isOpen && "rotate-180")} />
                  </button>
                  <div
                    className={cn(
                      "transition-all duration-350 ease-in-out overflow-hidden",
                      isOpen ? "max-h-[300px] border-t border-slate-100 p-6 bg-slate-50/40" : "max-h-0"
                    )}
                  >
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{faq.answer}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Free plan info footer */}
        <div className="text-center text-[10px] text-slate-400 pt-6">
          Batas paket Free adalah 50 invoice / bulan. Seluruh proses pembayaran difasilitasi oleh Xendit secara aman dan enkripsi SSL.
        </div>

      </div>

      {/* Annual Notification Dialog Modal */}
      {showAnnualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 max-w-md w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-800">Sistem Billing Tahunan Segera Hadir!</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Metode penagihan tahunan otomatis sedang diintegrasikan bersama Xendit. Untuk saat ini, Anda dapat beralih ke paket <strong>Bulanan</strong> yang langsung siap diaktifkan secara instan.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setShowAnnualModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all outline-none"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleProceedWithMonthly}
                className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition-all outline-none"
              >
                Gunakan Bulanan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
