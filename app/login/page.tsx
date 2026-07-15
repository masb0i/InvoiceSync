"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Eye, EyeOff, Mail, Lock, User, Sparkle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isSignUp, setIsSignUp] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [businessName, setBusinessName] = React.useState("")
  const [agreeTerms, setAgreeTerms] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  // Clear messages on toggle
  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (isSignUp) {
      if (!agreeTerms) {
        setErrorMsg("Anda harus menyetujui Syarat & Ketentuan untuk mendaftar.")
        setLoading(false)
        return
      }

      // Sign Up Flow
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            business_name: businessName || "Bisnis Baru",
          },
        },
      })

      if (error) {
        setErrorMsg(error.message)
      } else if (data?.user?.identities?.length === 0) {
        // User already exists
        setErrorMsg("Email ini sudah terdaftar. Silakan login.")
      } else {
        setSuccessMsg("Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi.")
        // Clear inputs
        setEmail("")
        setPassword("")
        setBusinessName("")
        setAgreeTerms(false)
      }
    } else {
      // Sign In Flow
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        router.push("/dashboard")
      }
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setErrorMsg(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans relative overflow-hidden">
      
      {/* Stylesheet containing animated fluid mesh background for left panel & stagger transitions */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-mesh {
          background: linear-gradient(-45deg, #1d4ed8, #2563eb, #4f46e5, #6366f1, #1e3a8a);
          background-size: 300% 300%;
          animation: wave-gradient 12s ease infinite;
        }
        .fade-in-slide-up-0 {
          animation: slideUpShort 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .fade-in-slide-up-1 {
          animation: slideUpShort 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.08s forwards;
          opacity: 0;
        }
        .fade-in-slide-up-2 {
          animation: slideUpShort 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.16s forwards;
          opacity: 0;
        }
        .fade-in-slide-up-3 {
          animation: slideUpShort 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.24s forwards;
          opacity: 0;
        }
        .fade-in-slide-up-4 {
          animation: slideUpShort 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.32s forwards;
          opacity: 0;
        }
        @keyframes slideUpShort {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />

      {/* Main Split Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row p-4 min-h-[600px] z-10 relative">
        
        {/* LEFT COLUMN: Brand Banner with Animated Fluid Mesh */}
        <div className="w-full md:w-1/2 rounded-[24px] animated-mesh p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden min-h-[340px] md:min-h-[560px]">
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />

          {/* Branding Top */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-white text-sm shadow-sm">
                IS
              </div>
              <span className="font-extrabold tracking-tight text-white text-sm">InvoiceSync</span>
            </div>
            
            <div className="space-y-4 mt-8 md:mt-16">
              <span className="text-[10px] font-black text-blue-100/90 tracking-widest uppercase block bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full w-fit border border-white/10">
                Otomatis &amp; Akurat
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight max-w-sm">
                Otomatisasi Invoice &amp; Keuangan UMKM Indonesia
              </h2>
              <p className="text-xs text-blue-100/70 max-w-xs font-medium leading-relaxed">
                Unggah invoice fisik atau digital, biarkan AI mengekstrak data dalam hitungan detik, dan pantau keuangan Anda secara real-time.
              </p>
            </div>
          </div>

          {/* Bottom Integrated Tech Stack list */}
          <div className="relative z-10 mt-8 md:mt-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-200/50 mb-3 pl-0.5">
              Teknologi Terintegrasi
            </p>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-blue-100/70 font-extrabold">
              <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-bold text-blue-100 flex items-center gap-1.5 hover:bg-white/20 transition-all cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Supabase
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-bold text-blue-100 flex items-center gap-1.5 hover:bg-white/20 transition-all cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Mistral OCR
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-bold text-blue-100 flex items-center gap-1.5 hover:bg-white/20 transition-all cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Xendit Payment
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Login/Register Form */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center bg-white rounded-[24px]">
          
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header Title (Stagger 0) */}
            <div className="space-y-1 text-left fade-in-slide-up-0">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {isSignUp ? "Daftar Akun Baru" : "Masuk ke Akun Anda"}
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed">
                {isSignUp 
                  ? "Mulai 50 invoice gratis setiap bulan untuk otomatisasi bisnis Anda."
                  : "Silakan masukkan email dan password untuk mengelola invoice."
                }
              </p>
            </div>

            {/* Status Messages (No Stagger) */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-start gap-2 animate-fadeIn font-semibold">
                <span className="select-none text-sm">⚠️</span>
                <div className="flex-1 mt-0.5 leading-relaxed">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex items-start gap-2 animate-fadeIn font-semibold">
                <span className="select-none text-sm">✅</span>
                <div className="flex-1 mt-0.5 leading-relaxed">{successMsg}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Business Name Field (Sign Up Only, Stagger 1) */}
              {isSignUp && (
                <div className="space-y-1.5 fade-in-slide-up-1">
                  <label htmlFor="businessName" className="text-xs font-bold text-slate-800 block pl-0.5">
                    Nama Bisnis / Organisasi
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="businessName"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Masukkan nama bisnis Anda..."
                      required={isSignUp}
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-xs text-slate-800 placeholder:text-slate-350"
                    />
                  </div>
                </div>
              )}

              {/* Email Address Field (Stagger 1 or 2) */}
              <div className={cn("space-y-1.5", isSignUp ? "fade-in-slide-up-2" : "fade-in-slide-up-1")}>
                <label htmlFor="email" className="text-xs font-bold text-slate-800 block pl-0.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh@bisnis.com"
                    required
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-xs text-slate-800 placeholder:text-slate-350"
                  />
                </div>
              </div>

              {/* Password Field (Stagger 2 or 3) */}
              <div className={cn("space-y-1.5", isSignUp ? "fade-in-slide-up-3" : "fade-in-slide-up-2")}>
                <div className="flex items-center justify-between pl-0.5">
                  <label htmlFor="password" className="text-xs font-bold text-slate-800">
                    Kata Sandi
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setErrorMsg("Fitur Lupa Password sedang dipersiapkan.")}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-bold transition-colors outline-none"
                    >
                      Lupa password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-xs text-slate-800 placeholder:text-slate-350"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Agreement Checkbox (Sign Up Only, Stagger 3) */}
              {isSignUp && (
                <div className="flex items-start gap-2.5 pt-1 fade-in-slide-up-3">
                  <input
                    id="agreeTerms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 w-4 h-4 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="agreeTerms" className="text-[10px] text-slate-500 leading-tight font-medium select-none cursor-pointer">
                    Saya menyetujui <span className="text-blue-600 font-bold hover:underline">Syarat &amp; Ketentuan Privasi</span>
                  </label>
                </div>
              )}

              {/* Submit Button (Stagger 3 or 4) */}
              <div className={isSignUp ? "fade-in-slide-up-4" : "fade-in-slide-up-3"}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/15 flex items-center justify-center gap-2 mt-4 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isSignUp ? (
                    "Daftar Sekarang"
                  ) : (
                    "Masuk Sekarang"
                  )}
                </button>
              </div>
            </form>

            {/* Switch Mode Text */}
            <div className={cn("text-center pt-2", isSignUp ? "fade-in-slide-up-4" : "fade-in-slide-up-3")}>
              <p className="text-xs text-slate-500 font-medium">
                {isSignUp ? "Sudah memiliki akun?" : "Belum memiliki akun?"}
                <button
                  onClick={toggleMode}
                  className="text-blue-600 font-bold hover:underline ml-1.5 outline-none"
                >
                  {isSignUp ? "Masuk disini" : "Daftar gratis"}
                </button>
              </p>
            </div>

            {/* Divider (Stagger 4) */}
            <div className="relative my-4 flex items-center justify-center fade-in-slide-up-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <span className="relative bg-white px-3 text-[9px] uppercase font-black text-slate-400 select-none">
                atau
              </span>
            </div>

            {/* Social Logins (Google Only, Stagger 4) */}
            <div className="fade-in-slide-up-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-11 border border-slate-200/80 hover:bg-slate-50 bg-white rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.98] transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Masuk dengan Google Workspace</span>
              </button>
            </div>

          </div>
          
        </div>
        
      </div>
      
    </div>
  )
}
