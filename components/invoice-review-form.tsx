"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"

interface InvoiceReviewFormProps {
  invoice: {
    id: string
    image_url: string | null
    vendor: string | null
    amount: number | null
    category: string | null
    invoice_date: string | null
    status: string
  }
  aiFailed: boolean
  onSaveSuccess: () => void
  onCancel: () => void
}

const CATEGORIES = ["Operasional", "Pemasaran", "Utilitas", "Gaji", "Logistik", "Lainnya"]

export default function InvoiceReviewForm({
  invoice,
  aiFailed,
  onSaveSuccess,
  onCancel,
}: InvoiceReviewFormProps) {
  const supabase = createClient()
  
  const [vendor, setVendor] = React.useState(invoice.vendor || "")
  const [amount, setAmount] = React.useState(invoice.amount !== null ? invoice.amount.toString() : "")
  const [invoiceDate, setInvoiceDate] = React.useState(invoice.invoice_date || "")
  const [category, setCategory] = React.useState(invoice.category || "Lainnya")
  
  const [loading, setLoading] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    const getSignedUrl = async () => {
      if (!invoice.image_url) return
      
      if (invoice.image_url.startsWith('blob:')) {
        setSignedUrl(invoice.image_url)
        return
      }
      
      const parts = invoice.image_url.split('/invoices/')
      if (parts.length > 1) {
        const relativePath = decodeURIComponent(parts[1])
        const { data, error } = await supabase.storage
          .from('invoices')
          .createSignedUrl(relativePath, 3600)
        
        if (data) {
          setSignedUrl(data.signedUrl)
        } else {
          console.error("Failed to get signed URL:", error)
          setSignedUrl(invoice.image_url)
        }
      } else {
        setSignedUrl(invoice.image_url)
      }
    }
    
    getSignedUrl()
  }, [invoice.image_url, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const parsedAmount = amount ? parseFloat(amount) : null
      if (parsedAmount !== null && isNaN(parsedAmount)) {
        throw new Error("Format nominal total tagihan tidak valid.")
      }

      // Update invoice record status to 'confirmed' and save edits
      const { error } = await supabase
        .from("invoices")
        .update({
          vendor: vendor || null,
          amount: parsedAmount,
          invoice_date: invoiceDate || null,
          category,
          status: "confirmed",
        })
        .eq("id", invoice.id)

      if (error) {
        throw new Error(`Gagal menyimpan invoice: ${error.message}`)
      }

      onSaveSuccess()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan review invoice.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex flex-col items-start mb-6">
        <h2 className="text-xl font-bold text-slate-800">Review Data Invoice</h2>
        <p className="text-xs text-slate-500 mt-1">
          Harap periksa dan sesuaikan data hasil bacaan AI sebelum disimpan secara permanen.
        </p>
      </div>

      {aiFailed && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs flex items-start gap-2.5">
          <span className="font-semibold select-none text-sm">⚠️</span>
          <div>
            <strong>AI gagal mendeteksi gambar secara otomatis.</strong> Harap masukkan informasi rincian invoice secara manual menggunakan formulir di bawah ini.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-start gap-2.5">
          <span className="font-semibold select-none text-sm">🛑</span>
          <div>{errorMsg}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="flex flex-col items-center justify-center border border-slate-200/60 bg-slate-50/50 rounded-2xl p-4 min-h-[300px] overflow-hidden w-full">
          {signedUrl ? (
            signedUrl.toLowerCase().includes(".pdf") || (invoice.image_url && invoice.image_url.toLowerCase().includes(".pdf")) ? (
              <iframe
                src={signedUrl}
                className="w-full h-[380px] rounded-lg shadow-sm border border-slate-200"
                title="Invoice PDF Preview"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signedUrl}
                alt="Uploaded Invoice"
                className="max-h-[380px] w-auto object-contain rounded-lg shadow-sm"
              />
            )
          ) : invoice.image_url ? (
            <div className="text-sm text-slate-400 animate-pulse">Memuat pratinjau...</div>
          ) : (
            <span className="text-sm text-slate-400">Tidak ada gambar preview</span>
          )}
        </div>

        {/* Right Side: Data Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            
            <div className="space-y-1">
              <label htmlFor="vendor" className="text-xs font-semibold text-slate-600 block pl-1">
                Nama Vendor / Merchant
              </label>
              <input
                id="vendor"
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="misal: Gojek, Starbucks, Tokopedia"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="amount" className="text-xs font-semibold text-slate-600 block pl-1">
                Total Tagihan (IDR)
              </label>
              <input
                id="amount"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="misal: 150000"
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="invoiceDate" className="text-xs font-semibold text-slate-600 block pl-1">
                Tanggal Transaksi / Invoice
              </label>
              <input
                id="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="category" className="text-xs font-semibold text-slate-600 block pl-1">
                Kategori Pengeluaran
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm text-slate-800 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="flex gap-3 pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 h-11 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-600 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Simpan & Konfirmasi"
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
