import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardClient from "@/components/dashboard-client"

export default async function DashboardPage() {
  const supabase = createClient()

  // 1. Verify Authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // TEMPORARY MOCK FOR VISUAL INSPECTION
    const mockUser = { id: "mock-id-123", email: "demo@invoicesync.com" }
    const mockProfile = { business_name: "PT Solusi Digital Indonesia", tier: "free" }
    const mockUsage = { invoice_count: 18 }
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lmStr = lastMonth.toISOString().substring(0, 7) // Format: YYYY-MM

    const mockInvoices = [
      // Current Month Invoices
      {
        id: "1",
        vendor: "Indomaret Kelapa Gading",
        invoice_date: new Date().toISOString().substring(0, 10),
        category: "Operasional",
        status: "paid",
        amount: 85000,
        created_at: new Date().toISOString()
      },
      {
        id: "2",
        vendor: "PLN Pascabayar",
        invoice_date: new Date().toISOString().substring(0, 10),
        category: "Utilitas",
        status: "unpaid",
        amount: 1250000,
        created_at: new Date().toISOString()
      },
      {
        id: "3",
        vendor: "Gojek (Transport)",
        invoice_date: new Date().toISOString().substring(0, 10),
        category: "Logistik",
        status: "paid",
        amount: 45000,
        created_at: new Date().toISOString()
      },
      {
        id: "4",
        vendor: "Meta Ads (Facebook/IG)",
        invoice_date: new Date().toISOString().substring(0, 10),
        category: "Pemasaran",
        status: "confirmed",
        amount: 3500000,
        created_at: new Date().toISOString()
      },
      {
        id: "5",
        vendor: "Gaji Karyawan Juni",
        invoice_date: new Date().toISOString().substring(0, 10),
        category: "Gaji",
        status: "paid",
        amount: 12000000,
        created_at: new Date().toISOString()
      },
      {
        id: "6",
        vendor: "Rumah Makan Padang Sederhana",
        invoice_date: new Date().toISOString().substring(0, 10),
        category: "Lainnya",
        status: "pending_review",
        amount: 155000,
        created_at: new Date().toISOString()
      },
      
      // Previous Month Invoices (for MoM calculations)
      {
        id: "prev-1",
        vendor: "Indomaret Kelapa Gading",
        invoice_date: `${lmStr}-10`,
        category: "Operasional",
        status: "paid",
        amount: 80000,
        created_at: `${lmStr}-10T12:00:00Z`
      },
      {
        id: "prev-2",
        vendor: "PLN Pascabayar",
        invoice_date: `${lmStr}-05`,
        category: "Utilitas",
        status: "unpaid",
        amount: 1100000,
        created_at: `${lmStr}-05T12:00:00Z`
      },
      {
        id: "prev-3",
        vendor: "Gojek (Transport)",
        invoice_date: `${lmStr}-12`,
        category: "Logistik",
        status: "paid",
        amount: 40000,
        created_at: `${lmStr}-12T12:00:00Z`
      },
      {
        id: "prev-4",
        vendor: "Meta Ads (Facebook/IG)",
        invoice_date: `${lmStr}-15`,
        category: "Pemasaran",
        status: "confirmed",
        amount: 3000000,
        created_at: `${lmStr}-15T12:00:00Z`
      },
      {
        id: "prev-5",
        vendor: "Gaji Karyawan Mei",
        invoice_date: `${lmStr}-25`,
        category: "Gaji",
        status: "paid",
        amount: 12000000,
        created_at: `${lmStr}-25T12:00:00Z`
      },
      {
        id: "prev-6",
        vendor: "Warung Nasi Ampera",
        invoice_date: `${lmStr}-18`,
        category: "Lainnya",
        status: "confirmed",
        amount: 120000,
        created_at: `${lmStr}-18T12:00:00Z`
      }
    ]
    return (
      <DashboardClient
        initialUser={mockUser}
        initialProfile={mockProfile}
        initialUsage={mockUsage}
        initialInvoices={mockInvoices}
      />
    )
  }

  // 2. Fetch User Profile, Monthly Usage, and Invoices list in parallel
  const currentMonth = new Date().toISOString().substring(0, 7) // Format: YYYY-MM

  const [profileResult, usageResult, invoicesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase
      .from("usage_limits")
      .select("invoice_count")
      .eq("user_id", user.id)
      .eq("month", currentMonth)
      .single(),
    supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
  ])

  return (
    <DashboardClient
      initialUser={{ id: user.id, email: user.email }}
      initialProfile={profileResult.data}
      initialUsage={usageResult.data}
      initialInvoices={invoicesResult.data || []}
    />
  )
}
