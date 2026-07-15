import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { INVOICE_JSON_SCHEMA } from "@/lib/constants"

export async function POST(request: Request) {
  const supabase = createClient()

  // 1. Verify User Authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { filePath } = await request.json()
    if (!filePath) {
      return NextResponse.json({ error: "filePath is required" }, { status: 400 })
    }

    // 2. Check Usage Limit for Free Tier users via Postgres RPC function
    const { data: limitReached, error: limitError } = await supabase.rpc('check_invoice_limit')
    
    if (limitError) {
      console.error("Failed to check invoice limit:", limitError)
      return NextResponse.json({ error: "Gagal memeriksa limit penggunaan" }, { status: 500 })
    }

    if (limitReached) {
      return NextResponse.json(
        {
          error: "LIMIT_REACHED",
          message: "Anda telah mencapai batas 50 invoice gratis bulan ini. Silakan upgrade ke premium untuk menikmati pemrosesan tanpa batas!",
        },
        { status: 403 }
      )
    }

    // 3. Try to invoke the Supabase Edge Function first (Hybrid approach)
    try {
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('process-invoice', {
        body: { filePath }
      })

      if (!edgeError && edgeData) {
        console.log("Invoice processed successfully via Edge Function.")
        return NextResponse.json(edgeData)
      }
      
      console.warn("Edge function invocation failed/unreachable, falling back to Next.js API processing:", edgeError)
    } catch (edgeErr) {
      console.warn("Edge function call threw exception, falling back to Next.js API processing:", edgeErr)
    }

    // --- FALLBACK LOCAL IMPLEMENTATION (Next.js server-side) ---

    // 4. Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("invoices")
      .download(filePath)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: "Gagal mengunduh berkas gambar/PDF dari storage", details: downloadError },
        { status: 400 }
      )
    }

    // Convert file blob to base64 data URI
    const arrayBuffer = await fileData.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = fileData.type || "image/jpeg"
    const documentUrl = `data:${mimeType};base64,${base64Image}`

    // 5. Setup Mistral API call
    // CATATAN BIAYA: Fitur Document AI (JSON terstruktur) pada Mistral OCR berbayar per halaman dokumen
    // (Annotated-Page rate) di luar kuota gratis dasar. Pantau usage di Mistral Console untuk production.
    const mistralApiKey = process.env.MISTRAL_API_KEY
    
    let extractedData = {
      vendor: "",
      nominal_total: null as number | null,
      tanggal: null as string | null,
      rincian_item: [] as any[],
      kategori: "Lainnya",
    }
    let aiFailed = false

    // Local abstraction function to call Mistral OCR API
    const extractInvoiceDataLocal = async (docUrl: string): Promise<any> => {
      if (!mistralApiKey || mistralApiKey === "your-mistral-api-key") {
        throw new Error("Local MISTRAL_API_KEY is placeholder or not configured")
      }

      const response = await fetch("https://api.mistral.ai/v1/ocr", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mistralApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-ocr-latest",
          document: {
            type: "document_url",
            document_url: docUrl
          },
          document_annotation_format: {
            type: "json_schema",
            json_schema: {
              name: "invoice_schema",
              schema: INVOICE_JSON_SCHEMA
            }
          },
          document_annotation_prompt: "Extract the vendor name, invoice date, total amount (be tolerant to local Indonesian terms like 'Grand Total', 'Jumlah', 'Total', 'Netto', 'Bayar', 'Tagihan', etc. that refer to the final transaction total value), list of items (rincian_item), and category from this document."
        }),
      })

      if (!response.ok) {
        throw new Error(`Local Mistral OCR responded with status ${response.status}: ${await response.text()}`)
      }

      const resJson = await response.json()
      if (!resJson.document_annotation) {
        throw new Error("Local Mistral OCR did not return document_annotation field")
      }

      const parsed = typeof resJson.document_annotation === 'string'
        ? JSON.parse(resJson.document_annotation)
        : resJson.document_annotation

      return parsed
    }

    // Execute Local AI Extraction
    try {
      const data = await extractInvoiceDataLocal(documentUrl)
      extractedData = {
        vendor: data.vendor || '',
        tanggal: data.tanggal || null,
        nominal_total: data.nominal_total || null,
        rincian_item: data.rincian_item || [],
        kategori: data.kategori || 'Lainnya'
      }
    } catch (err) {
      console.error("Local Mistral OCR API failed:", err)
      aiFailed = true
    }

    // 6. Get file public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("invoices").getPublicUrl(filePath)

    // 7. Save initial record to invoices table with status 'draft'
    // Note: Database triggers enforce_invoice_limit and increment_invoice_usage
    // are automatically fired on this insertion.
    const { data: invoice, error: insertError } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        vendor: extractedData.vendor || null,
        amount: extractedData.nominal_total || null,
        category: extractedData.kategori || "Lainnya",
        invoice_date: extractedData.tanggal || null,
        rincian_item: extractedData.rincian_item || [],
        status: "draft",
      })
      .select()
      .single()

    if (insertError) {
      console.error("Local DB Insert Error:", insertError)
      if (insertError.message && insertError.message.includes('LIMIT_REACHED')) {
        return NextResponse.json(
          {
            error: "LIMIT_REACHED",
            message: "Anda telah mencapai batas 50 invoice gratis bulan ini. Silakan upgrade ke premium untuk menikmati pemrosesan tanpa batas!",
          },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: "Gagal menyimpan data invoice ke database", details: insertError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      aiFailed,
      invoice,
    })
  } catch (error: any) {
    console.error("Invoice processing exception:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    )
  }
}
