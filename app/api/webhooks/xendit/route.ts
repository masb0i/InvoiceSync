import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  // 1. Verify Xendit Callback Token (Security Signature Verification)
  const incomingToken = request.headers.get("x-callback-token")
  const expectedToken = process.env.XENDIT_CALLBACK_TOKEN

  if (!expectedToken) {
    console.error("XENDIT_CALLBACK_TOKEN is not configured on the server.")
    return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 })
  }

  if (!incomingToken || incomingToken !== expectedToken) {
    console.warn("Unauthorized webhook hit: Invalid or missing x-callback-token.")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { external_id, status } = body

    console.log(`Xendit Webhook received: external_id=${external_id}, status=${status}`)

    // 2. Filter for paid invoice upgrade webhook hits
    if (status === "PAID" && external_id && external_id.startsWith("upgrade-")) {
      // Split ID details: upgrade-{user_id}-{tier}-{timestamp}
      const parts = external_id.split("-")
      if (parts.length >= 4) {
        const userId = parts[1]
        const tier = parts[2]

        if (["basic", "pro", "enterprise"].includes(tier)) {
          // 3. Initialize Admin Client (RLS bypass) to update profile tier
          const adminSupabase = createAdminClient()
          
          const { error: updateError } = await adminSupabase
            .from("profiles")
            .update({
              tier: tier as "basic" | "pro" | "enterprise",
              updated_at: new Date().toISOString()
            })
            .eq("id", userId)

          if (updateError) {
            console.error(`Database error updating tier for user ${userId}:`, updateError)
            return NextResponse.json(
              { error: "Gagal memperbarui tier di database", details: updateError },
              { status: 500 }
            )
          }

          console.log(`SUCCESS: User ${userId} has been upgraded to tier ${tier}.`)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Xendit Webhook processing failed:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    )
  }
}
