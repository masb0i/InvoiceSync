"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface InvoiceUploadProps {
  onUploadSuccess: (invoice: any, aiFailed: boolean) => void
  onUploadError: (message: string) => void
}

export default function InvoiceUpload({ onUploadSuccess, onUploadError }: InvoiceUploadProps) {
  const supabase = createClient()
  const [dragActive, setDragActive] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [statusText, setStatusText] = React.useState("")
  const [localError, setLocalError] = React.useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    setLocalError(null)
    // Check format
    const isValidFormat = 
      selectedFile.type.startsWith("image/") || 
      selectedFile.type === "application/pdf"

    if (!isValidFormat) {
      onUploadError("Format file tidak didukung. Harap pilih file gambar (JPG, PNG, WebP) atau PDF.")
      return
    }

    // Check size limit (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      onUploadError("Ukuran file terlalu besar. Batas maksimal adalah 5MB.")
      return
    }

    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
    onUploadError("") // Clear any previous errors
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLocalError(null)
    setLoading(true)
    setStatusText("Mengunggah berkas ke storage...")

    let statusTimer: NodeJS.Timeout | null = null

    try {
      // 1. Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error("Gagal memverifikasi user. Silakan login kembali.")
      }

      // 2. Check limit via RPC before uploading to Storage (cost saving)
      const { data: limitReached, error: limitCheckError } = await supabase.rpc('check_invoice_limit')
      if (limitCheckError) {
        throw new Error("Gagal memverifikasi kuota limit akun.")
      }
      if (limitReached) {
        throw new Error("LIMIT_REACHED")
      }

      // 3. Upload file to Supabase Storage
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_")
      const uniqueFileName = `${Date.now()}-${cleanFileName}`
      const filePath = `${user.id}/${uniqueFileName}`

      const { error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Upload storage gagal: ${uploadError.message}`)
      }

      // 4. Process invoice via API Route (calls Gemini with Groq fallback)
      setStatusText("Membaca invoice...")
      
      // Rotate loading messages dynamically for a premium feel
      statusTimer = setTimeout(() => {
        setStatusText("Mengekstrak data...")
      }, 3000)
      
      const response = await fetch("/api/process-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      })

      if (statusTimer) clearTimeout(statusTimer)

      const result = await response.json()

      if (!response.ok) {
        if (result.error === "LIMIT_REACHED") {
          throw new Error("LIMIT_REACHED")
        }
        throw new Error(result.message || result.error || "Gagal memproses data invoice.")
      }

      // 5. Callback on success
      onUploadSuccess(result.invoice, result.aiFailed)
      
      // Reset state
      setFile(null)
      setPreviewUrl(null)
    } catch (err: any) {
      console.error(err)
      if (statusTimer) clearTimeout(statusTimer)
      
      if (err.message === "LIMIT_REACHED") {
        onUploadError("LIMIT_REACHED")
      } else {
        const errorMsg = err.message || "Terjadi kesalahan saat memproses invoice."
        setLocalError(errorMsg)
        onUploadError(errorMsg)
      }
    } finally {
      setLoading(false)
      setStatusText("")
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {localError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
          <span className="font-semibold select-none text-sm leading-none mt-0.5">⚠️</span>
          <div className="flex-1 leading-relaxed">
            <strong>Gagal Memproses:</strong> {localError}
          </div>
          <button 
            type="button"
            onClick={() => setLocalError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold text-xs"
          >
            Tutup
          </button>
        </div>
      )}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 transition-all min-h-[300px] bg-white/50 backdrop-blur-sm",
          dragActive ? "border-blue-500 bg-blue-50/40" : "border-slate-200 hover:border-slate-300",
          loading && "pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />

        {loading ? (
          // Visual scanning effects
          <div className="flex flex-col items-center w-full relative">
            {file && (
              <div className="relative w-48 h-48 border border-slate-200 rounded-2xl overflow-hidden mb-6 flex items-center justify-center bg-slate-50">
                {file.type === "application/pdf" && previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-none rounded-2xl"
                    title="PDF Scanning Preview"
                  />
                ) : (
                  previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Preview Invoice" className="max-w-full max-h-full object-contain" />
                  )
                )}
                {/* Laser scan line overlay */}
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-500 shadow-[0_0_10px_#2563eb] animate-scan" />
              </div>
            )}
            
            <div className="flex flex-col items-center gap-2">
              <span className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-sm font-semibold text-slate-750 animate-pulse">{statusText}</p>
              <p className="text-xs text-slate-400">Mohon tunggu, proses ini memakan waktu beberapa detik.</p>
            </div>
          </div>
        ) : file ? (
          // Selected File Preview Mode
          <div className="flex flex-col items-center w-full">
            <div className="relative w-48 h-48 border border-slate-200/60 rounded-2xl overflow-hidden mb-6 bg-slate-50 flex items-center justify-center">
              {file.type === "application/pdf" && previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-none rounded-2xl"
                  title="PDF Preview"
                />
              ) : (
                previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Preview Invoice" className="max-w-full max-h-full object-contain" />
                )
              )}
            </div>

            <p className="text-xs font-bold text-slate-700 truncate max-w-xs mb-1">
              {file.name}
            </p>
            <p className="text-[10px] text-slate-400 mb-6">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setFile(null)
                  setPreviewUrl(null)
                }}
                className="h-10 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all"
              >
                Proses dengan AI
              </button>
            </div>
          </div>
        ) : (
          // Upload Prompt Mode
          <div className="flex flex-col items-center text-center cursor-pointer w-full py-6" onClick={triggerFileSelect}>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl shadow-sm mb-4 transition-transform hover:scale-105">
              📄
            </div>
            
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Unggah Invoice / Struk belanja
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mb-4 leading-relaxed">
              Tarik & taruh berkas gambar (JPG, PNG) atau PDF di sini, atau klik untuk memilih file dari perangkat Anda.
            </p>
            <span className="h-9 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 inline-flex items-center shadow-sm">
              Pilih Berkas
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
