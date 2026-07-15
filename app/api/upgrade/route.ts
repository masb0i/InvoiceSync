import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = createClient()

  // 1. Verify User Session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { tier } = await request.json()
    if (!tier || !["basic", "pro", "enterprise"].includes(tier)) {
      return NextResponse.json({ error: "Tier tidak valid" }, { status: 400 })
    }

    // 2. Define Pricing details
    let amount = 0
    let tierName = ""

    switch (tier) {
      case "basic":
        amount = 99000
        tierName = "Basic"
        break
      case "pro":
        amount = 199000
        tierName = "Pro"
        break
      case "enterprise":
        amount = 499000
        tierName = "Enterprise"
        break
    }

    const apiKey = process.env.XENDIT_SECRET_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Xendit API Key belum dikonfigurasi di server." },
        { status: 500 }
      )
    }

    // 3. Prepare Redirect URLs
    const { origin } = new URL(request.url)
    const externalId = `upgrade-${user.id}-${tier}-${Date.now()}`

    // 4. Hit Xendit Create Invoice API
    const authString = Buffer.from(`${apiKey}:`).toString("base64")
    
    const response = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authString}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: amount,
        description: `Upgrade akun InvoiceSync ke Tier ${tierName}`,
        payer_email: user.email,
        success_redirect_url: `${origin}/dashboard?upgrade=success`,
        failure_redirect_url: `${origin}/pricing?upgrade=failed`,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Xendit API Error:", data)
      return NextResponse.json(
        { error: "Gagal membuat invoice di Xendit Payment Gateway", details: data },
        { status: response.status }
      )
    }

    // 5. Return Xendit Portal Invoice URL
    return NextResponse.json({
      success: true,
      invoiceUrl: data.invoice_url,
    })
  } catch (error: any) {
    console.error("Upgrade API exception:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    )
  }
}
