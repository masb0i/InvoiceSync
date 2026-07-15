"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import InvoiceUpload from "@/components/invoice-upload"
import InvoiceReviewForm from "@/components/invoice-review-form"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { jsPDF } from "jspdf"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { 
  Home, 
  FileText, 
  ArrowLeftRight, 
  FileSpreadsheet, 
  Lock, 
  Settings, 
  Rocket, 
  LogOut, 
  Building2, 
  AlertTriangle, 
  Wallet, 
  Database, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  ChevronDown, 
  Search, 
  Plus, 
  X,
  Sparkles,
  CheckCircle2,
  Info,
  Trash2
} from "lucide-react"

interface DashboardClientProps {
  initialUser: {
    id: string
    email?: string
  }
  initialProfile: {
    business_name: string | null
    tier: string
  } | null
  initialUsage: {
    invoice_count: number
  } | null
  initialInvoices: any[]
}

const CATEGORIES = ["Operasional", "Pemasaran", "Utilitas", "Gaji", "Logistik", "Lainnya"]

const CATEGORY_COLORS = {
  "Operasional": "#3b82f6", // Blue 500
  "Pemasaran": "#60a5fa",    // Blue 400
  "Utilitas": "#f59e0b",      // Amber 500
  "Gaji": "#10b981",          // Emerald 500
  "Logistik": "#6366f1",      // Indigo 500
  "Lainnya": "#cbd5e1"        // Slate 300
}

const getTrend = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) return { percent: 0, isPositive: true, formatted: "0%" };
    return { percent: 100, isPositive: true, formatted: "+100%" };
  }
  const diff = current - previous;
  const percent = (diff / previous) * 100;
  return {
    percent: Math.abs(percent),
    isPositive: diff >= 0,
    formatted: `${diff >= 0 ? "+" : ""}${percent.toFixed(1)}%`
  };
};

export default function DashboardClient({
  initialUser,
  initialProfile,
  initialUsage,
  initialInvoices,
}: DashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // State Management
  const [invoices, setInvoices] = React.useState(initialInvoices)
  const [usageCount, setUsageCount] = React.useState(initialUsage?.invoice_count ?? 0)
  
  const [viewState, setViewState] = React.useState<"list" | "upload" | "review" | "invoices" | "reports" | "settings">("list")
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false)
  const [activeInvoice, setActiveInvoice] = React.useState<any | null>(null)
  const [aiFailed, setAiFailed] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successUpgradeMsg, setSuccessUpgradeMsg] = React.useState<string | null>(null)
  
  // Custom interactive states
  const [searchQuery, setSearchQuery] = React.useState("")
  const [businessName, setBusinessName] = React.useState(initialProfile?.business_name ?? "")
  const [isProfileSaving, setIsProfileSaving] = React.useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false)
  const notificationRef = React.useRef<HTMLDivElement>(null)
  
  const [notifications, setNotifications] = React.useState([
    {
      id: "1",
      title: "Invoice berhasil diproses",
      description: "AI berhasil mengekstraksi data dari invoice Indomaret Kelapa Gading (Rp 85.000).",
      time: "5m yang lalu",
      read: false,
      type: "success" as const
    },
    {
      id: "2",
      title: "Batas kuota gratis bulanan",
      description: "Penggunaan kuota gratis Anda saat ini 18 dari 50 invoice. Tersisa 32 kuota lagi.",
      time: "2j yang lalu",
      read: false,
      type: "warning" as const
    },
    {
      id: "3",
      title: "Tagihan Belum Dibayar",
      description: "Invoice utilitas PLN Pascabayar (Rp 1.250.000) terdeteksi belum diselesaikan.",
      time: "1h yang lalu",
      read: true,
      type: "info" as const
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const handleMarkRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Dynamic Month Selector State and Helpers
  const uniqueMonths = React.useMemo(() => {
    const monthsSet = new Set<string>()
    // Add current calendar month as default fallback
    monthsSet.add(new Date().toISOString().substring(0, 7))
    
    invoices.forEach(inv => {
      const dateStr = inv.invoice_date || inv.created_at
      if (dateStr && dateStr.length >= 7) {
        monthsSet.add(dateStr.substring(0, 7))
      }
    })
    
    // Sort descending
    return Array.from(monthsSet).sort().reverse()
  }, [invoices])

  const [selectedMonth, setSelectedMonth] = React.useState(
    uniqueMonths[0] || new Date().toISOString().substring(0, 7)
  )

  // Update selectedMonth if invoices change and current selectedMonth is not in list anymore
  React.useEffect(() => {
    if (uniqueMonths.length > 0 && !uniqueMonths.includes(selectedMonth)) {
      setSelectedMonth(uniqueMonths[0])
    }
  }, [uniqueMonths, selectedMonth])

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    const monthsIndo = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const monthIdx = parseInt(month, 10) - 1
    return `${monthsIndo[monthIdx] || ''} ${year}`
  }
  
  // Modals for premium locking and stubs
  const [lockModal, setLockModal] = React.useState<{ isOpen: boolean; featureName: string; tierRequired: "Pro" | "Enterprise" } | null>(null)
  const [stubModal, setStubModal] = React.useState<{ isOpen: boolean; featureName: string; description: string } | null>(null)

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("upgrade") === "success") {
      setSuccessUpgradeMsg("Selamat! Akun bisnis Anda berhasil di-upgrade ke premium tier.")
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }
  }, [])

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)
  const pageSize = 5

  // Refresh data from Supabase
  const refreshData = async () => {
    const { data: updatedInvoices } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })

    if (updatedInvoices) {
      setInvoices(updatedInvoices)
    }

    const currentMonth = new Date().toISOString().substring(0, 7)
    const { data: updatedUsage } = await supabase
      .from("usage_limits")
      .select("invoice_count")
      .eq("user_id", initialUser.id)
      .eq("month", currentMonth)
      .single()

    if (updatedUsage) {
      setUsageCount(updatedUsage.invoice_count)
    }
  }

  const handleUploadSuccess = (invoice: any, wasAiFailed: boolean) => {
    setActiveInvoice(invoice)
    setAiFailed(wasAiFailed)
    setViewState("review")
    setErrorMsg(null)
  }

  const handleReviewSaveSuccess = async () => {
    await refreshData()
    setViewState("list")
    setActiveInvoice(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push("/login")
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProfileSaving(true)
    setErrorMsg(null)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ business_name: businessName })
        .eq("id", initialUser.id)
      if (error) throw error
      await refreshData()
      alert("Profil bisnis berhasil diperbarui!")
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memperbarui profil bisnis.")
    } finally {
      setIsProfileSaving(false)
    }
  }

  // --- Financial Metrics Calculations (Bulan Ini vs Bulan Lalu) ---
  const now = new Date()
  const currentMonthStr = selectedMonth
  
  const prevMonthStr = (() => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const date = new Date(y, m - 2, 1)
    return date.toISOString().substring(0, 7)
  })()

  // Filter invoices for current month (excluding pending_review)
  const confirmedMonthInvoices = invoices.filter(inv => {
    if (inv.status === "pending_review") return false
    const dateStr = inv.invoice_date || inv.created_at
    return dateStr && dateStr.startsWith(currentMonthStr)
  })

  // Filter invoices for previous month (excluding pending_review)
  const confirmedPrevMonthInvoices = invoices.filter(inv => {
    if (inv.status === "pending_review") return false
    const dateStr = inv.invoice_date || inv.created_at
    return dateStr && dateStr.startsWith(prevMonthStr)
  })

  // 1. Total Invoice Bulan Ini (Total tagihan semua status)
  const totalSpendMonth = confirmedMonthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const totalSpendPrevMonth = confirmedPrevMonthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const spendTrend = getTrend(totalSpendMonth, totalSpendPrevMonth)
  const totalInvoicesMonthCount = confirmedMonthInvoices.length

  // 2. Invoice Belum Dibayar
  const unpaidMonthInvoices = confirmedMonthInvoices.filter(inv => inv.status === "unpaid" || inv.status === "confirmed")
  const unpaidPrevMonthInvoices = confirmedPrevMonthInvoices.filter(inv => inv.status === "unpaid" || inv.status === "confirmed")
  const unpaidCountTrend = getTrend(unpaidMonthInvoices.length, unpaidPrevMonthInvoices.length)
  const totalUnpaidMonth = unpaidMonthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)

  // Overdue calculation (unpaid invoice that is older than 7 days)
  const overdueCount = unpaidMonthInvoices.filter(inv => {
    const invDateStr = inv.invoice_date || inv.created_at
    if (!invDateStr) return false
    const diffTime = Math.abs(now.getTime() - new Date(invDateStr).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 7
  }).length

  // 3. Total Pengeluaran (Paid Invoices Total)
  const paidMonthInvoices = confirmedMonthInvoices.filter(inv => inv.status === "paid")
  const paidPrevMonthInvoices = confirmedPrevMonthInvoices.filter(inv => inv.status === "paid")
  const paidSpendMonth = paidMonthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const paidSpendPrevMonth = paidPrevMonthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const paidSpendTrend = getTrend(paidSpendMonth, paidSpendPrevMonth)

  // 4. Invoice Terpakai (Usage limits & trends)
  const isFree = (initialProfile?.tier || "free") === "free"
  const remainingQuota = isFree ? Math.max(50 - usageCount, 0) : null
  const currentUploadsCount = invoices.filter(inv => inv.created_at && inv.created_at.startsWith(currentMonthStr)).length
  const prevUploadsCount = invoices.filter(inv => inv.created_at && inv.created_at.startsWith(prevMonthStr)).length
  const uploadCountTrend = getTrend(currentUploadsCount, prevUploadsCount)

  // --- Pie Chart Data Breakdown (Bulan Ini) ---
  const categoryMap: { [key: string]: number } = {}
  confirmedMonthInvoices.forEach(inv => {
    const cat = inv.category || "Lainnya"
    categoryMap[cat] = (categoryMap[cat] || 0) + (inv.amount || 0)
  })

  const chartData = Object.entries(categoryMap)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .filter(item => item.value > 0)

  // --- Live Search & Filter Logic ---
  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    const vendorMatch = (inv.vendor || "").toLowerCase().includes(searchLower)
    const categoryMatch = (inv.category || "").toLowerCase().includes(searchLower)
    const amountMatch = (inv.amount || "").toString().includes(searchLower)
    const statusMatch = getStatusLabel(inv.status).toLowerCase().includes(searchLower)
    return vendorMatch || categoryMatch || amountMatch || statusMatch
  })

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [filteredInvoices.length, totalPages, currentPage])

  // --- Export PDF (jsPDF) ---
  const handleExportPDF = () => {
    const doc = new jsPDF()

    doc.setFont("Helvetica", "bold")
    doc.setFontSize(24)
    doc.setTextColor(37, 99, 235) // Blue 600
    doc.text("InvoiceSync", 14, 20)

    doc.setFontSize(9)
    doc.setFont("Helvetica", "normal")
    doc.setTextColor(100, 116, 139)
    doc.text("Accounting & Automated Invoice Tracker", 14, 25)
    doc.text(`Dicetak pada: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())}`, 14, 30)

    doc.setDrawColor(226, 232, 240)
    doc.line(14, 35, 196, 35)

    doc.setFontSize(11)
    doc.setFont("Helvetica", "bold")
    doc.setTextColor(30, 41, 59)
    doc.text("INFORMASI PENGGUNA", 14, 46)
    
    doc.setFont("Helvetica", "normal")
    doc.setTextColor(71, 85, 105)
    doc.text(`Nama Bisnis  : ${initialProfile?.business_name || "Bisnis Baru"}`, 14, 53)
    doc.text(`Alamat Email : ${initialUser.email || "-"}`, 14, 59)
    doc.text(`Bulan Laporan: ${new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now)}`, 14, 65)

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(14, 73, 182, 28, 3, 3, "F")

    doc.setFontSize(9)
    doc.setFont("Helvetica", "normal")
    doc.setTextColor(100, 116, 139)
    doc.text("TOTAL BELANJA BULAN INI", 20, 81)
    doc.text("TOTAL BELUM DIBAYAR", 80, 81)
    doc.text("JUMLAH INVOICE (BULAN INI)", 140, 81)

    doc.setFontSize(13)
    doc.setFont("Helvetica", "bold")
    doc.setTextColor(30, 41, 59)
    doc.text(formatIDR(totalSpendMonth), 20, 91)
    
    doc.setTextColor(225, 29, 72)
    doc.text(formatIDR(totalUnpaidMonth), 80, 91)
    
    doc.setTextColor(30, 41, 59)
    doc.text(`${totalInvoicesMonthCount} Dokumen`, 140, 91)

    doc.setFontSize(11)
    doc.setFont("Helvetica", "bold")
    doc.text("PENGELUARAN PER KATEGORI (BULAN INI)", 14, 114)

    let catY = 122
    doc.setFontSize(9)
    doc.setFont("Helvetica", "bold")
    doc.setFillColor(241, 245, 249)
    doc.rect(14, catY, 182, 7, "F")
    doc.setTextColor(71, 85, 105)
    doc.text("Nama Kategori", 18, catY + 5)
    doc.text("Total Pengeluaran (IDR)", 150, catY + 5)
    
    doc.setFont("Helvetica", "normal")
    doc.setTextColor(30, 41, 59)
    catY += 7

    const categoriesList = Object.entries(categoryMap)
    if (categoriesList.length === 0) {
      doc.text("Tidak ada data pengeluaran.", 20, catY + 6)
      catY += 10
    } else {
      categoriesList.forEach(([catName, catVal], index) => {
        if (index % 2 === 1) {
          doc.setFillColor(250, 250, 250)
          doc.rect(14, catY, 182, 7, "F")
        }
        doc.text(catName, 18, catY + 5)
        doc.text(formatIDR(catVal).replace("Rp", "Rp "), 150, catY + 5)
        catY += 7
      })
    }

    doc.setFontSize(11)
    doc.setFont("Helvetica", "bold")
    doc.text("DAFTAR SELURUH DOKUMEN INVOICE", 14, catY + 12)

    let tableY = catY + 20
    doc.setFontSize(9)
    doc.setFillColor(241, 245, 249)
    doc.rect(14, tableY, 182, 7, "F")
    doc.setTextColor(71, 85, 105)
    doc.text("Vendor / Merchant", 18, tableY + 5)
    doc.text("Tanggal", 70, tableY + 5)
    doc.text("Kategori", 108, tableY + 5)
    doc.text("Status", 140, tableY + 5)
    doc.text("Nominal (IDR)", 168, tableY + 5)

    tableY += 7
    doc.setFont("Helvetica", "normal")
    doc.setTextColor(30, 41, 59)

    const invoicesToPrint = invoices.filter(inv => inv.status !== "pending_review")
    if (invoicesToPrint.length === 0) {
      doc.text("Belum ada data invoice terdaftar.", 20, tableY + 6)
    } else {
      invoicesToPrint.forEach((inv, index) => {
        if (tableY > 270) {
          doc.addPage()
          tableY = 20
          
          doc.setFont("Helvetica", "bold")
          doc.setFillColor(241, 245, 249)
          doc.rect(14, tableY, 182, 7, "F")
          doc.setTextColor(71, 85, 105)
          doc.text("Vendor / Merchant", 18, tableY + 5)
          doc.text("Tanggal", 70, tableY + 5)
          doc.text("Kategori", 108, tableY + 5)
          doc.text("Status", 140, tableY + 5)
          doc.text("Nominal (IDR)", 168, tableY + 5)
          
          tableY += 7
          doc.setFont("Helvetica", "normal")
          doc.setTextColor(30, 41, 59)
        }

        if (index % 2 === 1) {
          doc.setFillColor(250, 250, 250)
          doc.rect(14, tableY, 182, 7, "F")
        }

        const dateVal = inv.invoice_date || (inv.created_at ? inv.created_at.substring(0, 10) : "-")
        const statusLabel = getStatusLabel(inv.status)

        doc.text(inv.vendor || "Unknown", 18, tableY + 5)
        doc.text(dateVal, 70, tableY + 5)
        doc.text(inv.category || "Lainnya", 108, tableY + 5)
        doc.text(statusLabel, 140, tableY + 5)
        doc.text(formatIDR(inv.amount).replace("Rp", ""), 168, tableY + 5)
        
        tableY += 7
      })
    }

    const monthFileName = currentMonthStr.replace("-", "_")
    doc.save(`Laporan_Bulanan_${monthFileName}.pdf`)
  }

  // Format currency helper
  const formatIDR = (num: number | null) => {
    if (num === null || isNaN(num)) return "-"
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Format date helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  }

  // Get status badge classes helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_review":
        return "bg-amber-50 text-amber-700 border-amber-100"
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-100"
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-100"
      case "unpaid":
        return "bg-rose-50 text-rose-700 border-rose-100"
      default:
        return "bg-slate-50 text-slate-700 border-slate-100"
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case "pending_review":
        return "Menunggu Review"
      case "confirmed":
        return "Dikonfirmasi"
      case "paid":
        return "Lunas"
      case "unpaid":
        return "Belum Lunas"
      default:
        return status
    }
  }

  // Render dynamic trend badges
  const renderTrendBadge = (trend: { percent: number; isPositive: boolean; formatted: string }, isDarkBg: boolean) => {
    const { isPositive, formatted } = trend
    if (isDarkBg) {
      return (
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm",
          isPositive 
            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/10" 
            : "bg-rose-500/20 text-rose-300 border border-rose-500/10"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3 text-emerald-300 shrink-0" /> : <TrendingDown className="w-3 h-3 text-rose-300 shrink-0" />}
          {formatted}
        </span>
      )
    } else {
      return (
        <span className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
          isPositive 
            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
            : "bg-rose-50 text-rose-700 border-rose-100"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" /> : <TrendingDown className="w-3 h-3 text-rose-600 shrink-0" />}
          {formatted}
        </span>
      )
    }
  }

  // Handle Pro/Enterprise item click
  const handleLockedClick = (featureName: string, tierRequired: "Pro" | "Enterprise") => {
    setLockModal({ isOpen: true, featureName, tierRequired })
  }

  // Handle unlocked stub clicks
  const handleStubClick = (featureName: string, description: string) => {
    setStubModal({ isOpen: true, featureName, description })
  }

  // Active menu helper
  const isTabActive = (tab: typeof viewState) => viewState === tab

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex">
      
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR NAVIGATION PANEL                         */}
      {/* ========================================================= */}
      <aside className="w-64 bg-white border-r border-slate-200/60 flex flex-col justify-between p-6 sticky top-0 h-screen z-20 shrink-0">
        
        <div className="space-y-8 overflow-y-auto max-h-[calc(100vh-140px)] pr-1">
          {/* Logo & Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-lg shadow-lg shadow-blue-500/20 shrink-0">
              IS
            </div>
            <div>
              <span className="font-extrabold text-slate-800 tracking-tight text-sm block leading-tight">InvoiceSync</span>
              <span className="text-[9px] uppercase font-bold tracking-wider text-blue-650 bg-blue-50/70 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                {isFree ? "FREE PLAN" : `${initialProfile?.tier.toUpperCase()} PLAN`}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6">
            
            {/* MENU GROUP */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block px-3 mb-2">MENU</span>
              <button
                onClick={() => setViewState("list")}
                className={cn(
                  "w-full flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-semibold transition-all",
                  isTabActive("list") 
                    ? "bg-indigo-50/70 text-indigo-700" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                )}
              >
                <Home className="w-4 h-4" />
                <span>Beranda</span>
              </button>
              <div className="w-full flex items-center justify-between group gap-1">
                <button
                  onClick={() => setViewState("invoices")}
                  className={cn(
                    "flex-1 flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-semibold transition-all text-left",
                    isTabActive("invoices") 
                      ? "bg-indigo-50/70 text-indigo-700" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  )}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Invoice</span>
                </button>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-700 hover:bg-slate-100/85 active:scale-[0.95] transition-all shrink-0"
                  title="Tambah Invoice"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* FINANCIAL GROUP */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block px-3 mb-2">FINANCIAL</span>
              <button
                onClick={() => handleStubClick("Rekonsiliasi Bank", "Menyinkronkan data bank statement dengan invoice struk belanja secara otomatis.")}
                className="w-full flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all text-left"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Rekonsiliasi</span>
              </button>
              <button
                onClick={() => setViewState("reports")}
                className={cn(
                  "w-full flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-semibold transition-all",
                  isTabActive("reports") 
                    ? "bg-indigo-50/70 text-indigo-700" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                )}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Laporan</span>
              </button>
              
              {/* Pajak & Kepatuhan (Pro Locked) */}
              <button
                onClick={() => handleLockedClick("Pajak & Kepatuhan", "Pro")}
                className="w-full flex items-center justify-between h-10 px-3 rounded-xl text-xs font-semibold text-slate-400 opacity-60 hover:opacity-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pajak & Kepatuhan</span>
                </div>
                <span className="bg-indigo-100 text-indigo-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md">Pro</span>
              </button>

              {/* Analitik (Pro Locked) */}
              <button
                onClick={() => handleLockedClick("Analitik Keuangan", "Pro")}
                className="w-full flex items-center justify-between h-10 px-3 rounded-xl text-xs font-semibold text-slate-400 opacity-60 hover:opacity-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Analitik</span>
                </div>
                <span className="bg-indigo-100 text-indigo-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md">Pro</span>
              </button>
            </div>

            {/* TOOLS GROUP */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block px-3 mb-2">TOOLS</span>
              
              {/* Tim (Enterprise Locked) */}
              <button
                onClick={() => handleLockedClick("Akses Tim & Kolaborasi", "Enterprise")}
                className="w-full flex items-center justify-between h-10 px-3 rounded-xl text-xs font-semibold text-slate-400 opacity-60 hover:opacity-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tim</span>
                </div>
                <span className="bg-slate-100 text-slate-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">Enterprise</span>
              </button>

              <button
                onClick={() => setViewState("settings")}
                className={cn(
                  "w-full flex items-center gap-3 h-10 px-3 rounded-xl text-xs font-semibold transition-all",
                  isTabActive("settings") 
                    ? "bg-indigo-50/70 text-indigo-700" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                )}
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan</span>
              </button>
            </div>

          </nav>
        </div>

        {/* Bottom Actions Area */}
        <div className="space-y-6 pt-4 border-t border-slate-100">
          
          {/* Card CTA Upgrade ke Pro */}
          {isFree && (
            <div className="bg-gradient-to-br from-indigo-950 to-blue-950 text-white rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between shadow-lg">
              <div className="absolute top-[-20%] right-[-20%] w-24 h-24 rounded-full bg-blue-500/10 blur-xl animate-pulse" />
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                  <span className="font-extrabold text-[11px] tracking-tight">Upgrade ke Pro</span>
                </div>
                <p className="text-[9px] text-indigo-200 leading-relaxed">
                  Dapatkan fitur analitik tak terbatas.
                </p>
              </div>
              <button
                onClick={() => router.push("/pricing")}
                className="w-full h-8 mt-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shadow-md shadow-blue-900/30 transition-all flex items-center justify-center relative z-10"
              >
                Upgrade
              </button>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full h-10 px-3 rounded-xl hover:bg-red-50 hover:text-red-700 text-slate-500 text-xs font-bold transition-all flex items-center gap-3 text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>

        </div>

      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT AREA (Scrollable pane)                    */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* TOP BAR / HEADER CONTAINER */}
        <header className="h-16 bg-white border-b border-slate-200/60 sticky top-0 z-10 flex items-center justify-between px-8">
          <div>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight leading-none">
              {viewState === "list" && "Beranda"}
              {viewState === "invoices" && "Daftar Invoice"}
              {viewState === "reports" && "Laporan Keuangan"}
              {viewState === "settings" && "Pengaturan Bisnis"}
              {viewState === "upload" && "Tambah Invoice"}
              {viewState === "review" && "Verifikasi Hasil Baca AI"}
            </h1>
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-1.5 block leading-none">
              {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
            </span>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Live Search bar */}
            <div className="relative w-56 hidden md:block">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari invoice atau vendor..."
                className="w-full h-9 pl-9 pr-3.5 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-xs text-slate-700"
              />
            </div>

            {/* Quick Upload Button */}
            {viewState !== "review" && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                Upload Invoice Baru
              </button>
            )}

            {/* Notification Dropdown Container */}
            <div ref={notificationRef} className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={cn(
                  "relative w-9 h-9 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-all outline-none",
                  isNotificationOpen ? "text-blue-600 bg-blue-50/50" : "text-slate-500"
                )}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200/65 shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Header */}
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">Notifikasi</span>
                      {unreadCount > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded-full font-black">
                          {unreadCount} baru
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[9px] text-blue-600 hover:text-blue-700 font-extrabold hover:underline outline-none"
                        >
                          Tandai dibaca
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="text-[9px] text-slate-400 hover:text-red-600 font-extrabold flex items-center gap-0.5 outline-none"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notification List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 px-4 text-center flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shadow-inner">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Tidak ada notifikasi baru</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-medium">Semua aktivitas akun Anda berjalan dengan baik dan lancar.</p>
                        </div>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const NotifIcon = notif.type === 'success' ? CheckCircle2 : notif.type === 'warning' ? AlertTriangle : Info
                        const notifColorClass = notif.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : notif.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleMarkRead(notif.id)}
                            className={cn(
                              "p-3.5 flex gap-3 text-left transition-all cursor-pointer relative",
                              notif.read ? "bg-white hover:bg-slate-50/50" : "bg-blue-50/15 hover:bg-blue-50/25"
                            )}
                          >
                            {/* Unread Indicator Bar */}
                            {!notif.read && (
                              <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-blue-600" />
                            )}
                            
                            {/* Icon */}
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border shrink-0", notifColorClass)}>
                              <NotifIcon className="w-4 h-4" />
                            </div>

                            {/* Content */}
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className={cn("text-xs leading-none truncate", notif.read ? "font-bold text-slate-700" : "font-extrabold text-slate-800")}>
                                  {notif.title}
                                </p>
                                <span className="text-[9px] text-slate-400 shrink-0 font-medium">{notif.time}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-relaxed font-medium break-words">
                                {notif.description}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile dropdown */}
            <div ref={dropdownRef} className="relative z-50">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 pl-2 border-l border-slate-200/60 hover:bg-slate-50/85 p-1 rounded-xl transition-all text-left outline-none"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-xs shadow-sm uppercase shrink-0">
                  {initialUser.email ? initialUser.email.substring(0, 2) : "IS"}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {initialProfile?.business_name || "Pemilik Toko"}
                  </p>
                  <p className="text-[9px] text-slate-400 capitalize mt-0.5 font-medium leading-none">
                    {isFree ? "Free Account" : `${initialProfile?.tier} Account`}
                  </p>
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 hidden lg:block shrink-0 transition-transform duration-200", isProfileDropdownOpen && "rotate-180")} />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200/65 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium">Logged in as</p>
                    <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{initialUser.email}</p>
                  </div>
                  <div className="p-1.5 space-y-1">
                    {isFree && (
                      <button
                        onClick={() => {
                          setIsProfileDropdownOpen(false)
                          router.push("/pricing")
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Upgrade ke Pro</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false)
                        setViewState("settings")
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pengaturan Bisnis</span>
                    </button>
                    <div className="h-px bg-slate-100 my-1 mx-1.5" />
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false)
                        handleLogout()
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* INNER SCROLL CONTENT CONTAINER */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-start gap-2 animate-fadeIn">
              <span>⚠️</span>
              <div>{errorMsg}</div>
            </div>
          )}

          {successUpgradeMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <span className="font-semibold text-base">🎉</span>
              <div className="flex-1">{successUpgradeMsg}</div>
            </div>
          )}

          {/* ========================================================= */}
          {/* A. DASHBOARD VIEW (list)                                 */}
          {/* ========================================================= */}
          {viewState === "list" && (
            <div className="space-y-8">
              
              {/* Period Selector */}
              <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-extrabold text-slate-800">Periode Data Dashboard</h3>
                  <p className="text-[10px] text-slate-400">Menampilkan rangkuman finansial berdasarkan periode bulan terpilih.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Pilih Periode:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-xs font-extrabold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer transition-all outline-none"
                  >
                    {uniqueMonths.map((m) => (
                      <option key={m} value={m}>
                        {formatMonthName(m)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4 SUMMARY METRICS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Card 1: Total Invoice Bulan Ini (Solid Blue Gradient) */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-3xl p-6 relative flex flex-col justify-between shadow-lg shadow-indigo-500/10 min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-100/90">
                      Total Invoice Bulan Ini
                    </span>
                    <span className="bg-white/10 p-2 rounded-xl text-white">
                      <Building2 className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">
                      {formatIDR(totalSpendMonth)}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      {renderTrendBadge(spendTrend, true)}
                      <span className="text-[10px] text-indigo-150">vs bulan lalu</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Invoice Belum Dibayar (Left Red Border) */}
                <div className="bg-white border border-slate-100 border-l-4 border-l-rose-500 rounded-3xl p-6 relative flex flex-col justify-between shadow-sm min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Invoice Belum Dibayar
                    </span>
                    <span className="bg-rose-50 p-2 rounded-xl text-rose-500">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                      {unpaidMonthInvoices.length} <span className="text-xs font-semibold text-slate-400">Invoice</span>
                    </h3>
                    <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                      {overdueCount > 0 ? `${overdueCount.toString().padStart(2, '0')} Overdue (Jatuh Tempo) ⚠️` : "00 Overdue (Jatuh Tempo) ⚠️"}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      {renderTrendBadge(unpaidCountTrend, false)}
                      <span className="text-[10px] text-slate-400">vs bulan lalu</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Total Pengeluaran */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 relative flex flex-col justify-between shadow-sm min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Total Pengeluaran
                    </span>
                    <span className="bg-emerald-50 p-2 rounded-xl text-emerald-500">
                      <Wallet className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                      {formatIDR(paidSpendMonth)}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      {renderTrendBadge(paidSpendTrend, false)}
                      <span className="text-[10px] text-slate-400">vs bulan lalu</span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Invoice Terpakai (Progress bar) */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 relative flex flex-col justify-between shadow-sm min-h-[150px]">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                      Invoice Terpakai
                    </span>
                    <span className="bg-indigo-50/70 p-2 rounded-xl text-indigo-500">
                      <Database className="w-4 h-4" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                      {isFree ? `${usageCount}/50` : `${usageCount} / Unlimited`}
                    </h3>
                    
                    {isFree && (
                      <div className="mt-2">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                            style={{ width: `${Math.min((usageCount / 50) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] text-slate-400 font-semibold">{remainingQuota} Invoice tersisa</span>
                          {renderTrendBadge(uploadCountTrend, false)}
                        </div>
                      </div>
                    )}

                    {!isFree && (
                      <div className="mt-2 flex items-center justify-between">
                        {renderTrendBadge(uploadCountTrend, false)}
                        <span className="text-[10px] text-slate-400">vs bulan lalu</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* GRID CONTENT: TABLE & DONUT CHART */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* TABLE CARD */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800">Daftar Dokumen Invoice</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Catatan invoice struk pengeluaran yang diunggah.</p>
                    </div>
                    {invoices.length > 0 && (
                      <button
                        onClick={handleExportPDF}
                        className="h-9 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-650 inline-flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        📄 Export PDF
                      </button>
                    )}
                  </div>

                  {filteredInvoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 text-2xl mb-4">📂</div>
                      <h3 className="text-sm font-bold text-slate-700 mb-1">Tidak Ada Invoice</h3>
                      <p className="text-xs text-slate-400 max-w-xs">Tidak ada data invoice yang sesuai pencarian atau belum diunggah.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                              <th className="pb-3 pl-3">Vendor</th>
                              <th className="pb-3">Tanggal</th>
                              <th className="pb-3">Kategori</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3 text-right pr-3">Total Tagihan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {paginatedInvoices.map((inv) => (
                              <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-3.5 pl-3 font-semibold text-slate-800">{inv.vendor || "Unknown Vendor"}</td>
                                <td className="py-3.5 text-slate-500">{formatDate(inv.invoice_date || inv.created_at)}</td>
                                <td className="py-3.5">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/40">
                                    {inv.category || "Lainnya"}
                                  </span>
                                </td>
                                <td className="py-3.5">
                                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border", getStatusBadge(inv.status))}>
                                    {getStatusLabel(inv.status)}
                                  </span>
                                </td>
                                <td className="py-3.5 text-right pr-3 font-bold text-slate-850">{formatIDR(inv.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] font-bold text-slate-500">
                          <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                          >
                            Sebelumnya
                          </button>
                          <span>Halaman {currentPage} dari {totalPages}</span>
                          <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                          >
                            Selanjutnya
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* DONUT CHART CARD WITH INTEGRATED SIDE LEGEND */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Kategori Pengeluaran</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Analisis breakdown belanja bulan ini.</p>
                  </div>

                  {chartData.length === 0 ? (
                    <div className="text-center py-20 flex-1 flex flex-col items-center justify-center">
                      <div className="text-2xl mb-2">📊</div>
                      <p className="text-xs text-slate-400">Tidak ada data pengeluaran bulan ini.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center mt-6 flex-1">
                      
                      {/* Donut Chart Display */}
                      <div className="relative w-full h-36 flex items-center justify-center">
                        <ResponsiveContainer width="105%" height="105%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={42}
                              outerRadius={58}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || "#cbd5e1"}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => [formatIDR(value), "Nilai"]}
                              contentStyle={{
                                background: "rgba(255, 255, 255, 0.95)",
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                fontSize: "10px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                          <span className="text-xs font-black text-slate-850 leading-tight">100%</span>
                        </div>
                      </div>

                      {/* Legends */}
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                        {chartData.map((data) => {
                          const color = CATEGORY_COLORS[data.name as keyof typeof CATEGORY_COLORS] || "#cbd5e1"
                          const percentage = totalSpendMonth > 0 ? Math.round((data.value / totalSpendMonth) * 100) : 0
                          
                          return (
                            <div key={data.name} className="flex justify-between items-center text-[11px] gap-2">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-slate-500 font-medium truncate">{data.name}</span>
                              </div>
                              <span className="text-slate-800 font-bold shrink-0">{percentage}%</span>
                            </div>
                          )
                        })}
                      </div>

                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 text-center font-medium">
                    Total Belanja: <span className="font-bold text-slate-700">{formatIDR(totalSpendMonth)}</span>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* B. INVOICES ONLY VIEW (invoices)                          */}
          {/* ========================================================= */}
          {viewState === "invoices" && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">Semua Invoice</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Kelola dan review seluruh invoice struk belanja Anda.</p>
                </div>
                {invoices.length > 0 && (
                  <button
                    onClick={handleExportPDF}
                    className="h-10 px-4.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-650 inline-flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    📄 Export PDF
                  </button>
                )}
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 text-3xl mb-4">📂</div>
                  <h3 className="text-sm font-bold text-slate-700 mb-1">Belum Ada Invoice</h3>
                  <p className="text-xs text-slate-400 max-w-xs">Mulai unggah invoice pertama Anda menggunakan tombol unggah di kanan atas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                          <th className="pb-3 pl-3">Vendor</th>
                          <th className="pb-3">Tanggal</th>
                          <th className="pb-3">Kategori</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right pr-3">Total Tagihan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {paginatedInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-4 pl-3 font-semibold text-slate-800">{inv.vendor || "Unknown Vendor"}</td>
                            <td className="py-4 text-slate-500">{formatDate(inv.invoice_date || inv.created_at)}</td>
                            <td className="py-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/40">
                                {inv.category || "Lainnya"}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border", getStatusBadge(inv.status))}>
                                {getStatusLabel(inv.status)}
                              </span>
                            </td>
                            <td className="py-4 text-right pr-3 font-bold text-slate-850">{formatIDR(inv.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      >
                        Sebelumnya
                      </button>
                      <span>Halaman {currentPage} dari {totalPages}</span>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="h-8 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* C. REPORTS VIEW (reports)                                  */}
          {/* ========================================================= */}
          {viewState === "reports" && (
            <div className="space-y-6 max-w-3xl">
              {/* Period Selector Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-extrabold text-slate-800">Periode Laporan Keuangan</h3>
                  <p className="text-[10px] text-slate-400">Pilih periode bulanan untuk mencetak laporan PDF.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Pilih Periode:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-xs font-extrabold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer transition-all outline-none"
                  >
                    {uniqueMonths.map((m) => (
                      <option key={m} value={m}>
                        {formatMonthName(m)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 text-2xl shrink-0">📄</div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">Laporan Keuangan Bulanan</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">Laporan ringkasan pengeluaran bulanan Anda. File PDF berisi rincian spending per kategori pengeluaran dan daftar invoice terverifikasi secara lengkap.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-6 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Belanja</p>
                    <p className="text-base font-black text-slate-800 mt-1">{formatIDR(totalSpendMonth)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Terbayar</p>
                    <p className="text-base font-black text-emerald-600 mt-1">{formatIDR(paidSpendMonth)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Jumlah Invoice</p>
                    <p className="text-base font-black text-indigo-600 mt-1">{totalInvoicesMonthCount} Dokumen</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">Ekspor instan format .pdf</span>
                  <button
                    onClick={handleExportPDF}
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5 animate-fadeIn"
                  >
                    📄 Download PDF Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* D. SETTINGS VIEW (settings)                                */}
          {/* ========================================================= */}
          {viewState === "settings" && (
            <div className="space-y-6 max-w-2xl">
              <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Profil Bisnis & Organisasi</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Edit rincian profil bisnis Anda untuk format dokumen laporan.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="busName" className="text-xs font-semibold text-slate-650 block pl-1">Nama Organisasi / Bisnis</label>
                    <input
                      id="busName"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="misal: PT Solusi Digital"
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 outline-none text-sm text-slate-800"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-650 block pl-1">Alamat Email Terdaftar</label>
                    <input
                      type="text"
                      value={initialUser.email || ""}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 outline-none text-sm cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isProfileSaving}
                    className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm"
                  >
                    {isProfileSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* E. UPLOAD VIEW (upload)                                   */}
          {/* ========================================================= */}
          {viewState === "upload" && (
            <div className="space-y-6">
              <div>
                <button
                  onClick={() => setViewState("list")}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 leading-none"
                >
                  ← Kembali ke Dashboard
                </button>
                <h2 className="text-base font-extrabold text-slate-800 mt-3 leading-none">Tambah Invoice Baru</h2>
                <p className="text-xs text-slate-400 mt-1.5">Unggah foto struk belanja untuk mengekstrak data nominal secara otomatis via Gemini AI.</p>
              </div>
              <InvoiceUpload
                onUploadSuccess={handleUploadSuccess}
                onUploadError={(msg) => setErrorMsg(msg)}
              />
            </div>
          )}

          {/* ========================================================= */}
          {/* F. REVIEW VIEW (review)                                   */}
          {/* ========================================================= */}
          {viewState === "review" && activeInvoice && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">Verifikasi Hasil Baca AI</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pastikan nominal total, vendor, dan kategori dari bacaan AI sudah sesuai sebelum dikonfirmasi.</p>
              </div>
              <InvoiceReviewForm
                invoice={activeInvoice}
                aiFailed={aiFailed}
                onSaveSuccess={handleReviewSaveSuccess}
                onCancel={() => {
                  setViewState("list")
                  setActiveInvoice(null)
                }}
              />
            </div>
          )}

        </main>
      </div>

      {/* ========================================================= */}
      {/* 3. LOCKED PREMIUM MODAL OVERLAY                           */}
      {/* ========================================================= */}
      {lockModal?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-xl flex flex-col items-center text-center space-y-5 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">Fitur Premium Terkunci</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fitur <strong>{lockModal.featureName}</strong> membutuhkan paket langganan <strong>{lockModal.tierRequired}</strong>.
              </p>
            </div>
            <div className="w-full flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setLockModal(null)
                  router.push("/pricing")
                }}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all"
              >
                Lihat Paket & Upgrade
              </button>
              <button
                onClick={() => setLockModal(null)}
                className="w-full h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. STUB PLACEHOLDER MODAL OVERLAY                         */}
      {/* ========================================================= */}
      {stubModal?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-xl flex flex-col items-center text-center space-y-5 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl shrink-0">
              ⚙️
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">{stubModal.featureName}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {stubModal.description} Fitur ini sedang dikembangkan dalam pipeline rilis berikutnya.
              </p>
            </div>
            <button
              onClick={() => setStubModal(null)}
              className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. INVOICE UPLOAD MODAL OVERLAY                           */}
      {/* ========================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-100 shadow-xl flex flex-col space-y-5 animate-fadeIn relative">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1 pr-8">
              <h3 className="text-sm font-extrabold text-slate-800">Tambah Invoice Baru</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unggah foto struk belanja (.jpg, .jpeg, .png) atau dokumen PDF untuk mengekstrak nominal secara otomatis via Gemini AI.
              </p>
            </div>
            <div className="pt-2">
              <InvoiceUpload
                onUploadSuccess={async (invoice, wasAiFailed) => {
                  setIsUploadModalOpen(false)
                  await refreshData()
                  handleUploadSuccess(invoice, wasAiFailed)
                }}
                onUploadError={(msg) => {
                  if (msg === "LIMIT_REACHED") {
                    setIsUploadModalOpen(false)
                    handleLockedClick("Ekstraksi Invoice Bulanan", "Pro")
                  } else {
                    setErrorMsg(msg)
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
