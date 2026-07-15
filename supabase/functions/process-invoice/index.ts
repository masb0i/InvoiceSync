import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Reusable JSON Schema definition for Mistral OCR Document AI.
// Note: This defines the structure of the data to be extracted from the invoice.
const INVOICE_JSON_SCHEMA = {
  type: "object",
  properties: {
    vendor: {
      type: "string",
      description: "Nama merchant, vendor, atau toko penerbit invoice/nota"
    },
    tanggal: {
      type: ["string", "null"],
      description: "Tanggal transaksi dalam format YYYY-MM-DD"
    },
    nominal_total: {
      type: ["number", "null"],
      description: "Total tagihan atau nominal akhir transaksi (merujuk ke Grand Total, Jumlah, Netto, Bayar, dll)"
    },
    rincian_item: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nama: { type: "string", description: "Nama item, barang, atau jasa yang dibeli" },
          jumlah: { type: "number", description: "Jumlah/qty barang" },
          harga: { type: "number", description: "Harga satuan barang" }
        },
        required: ["nama", "jumlah", "harga"]
      },
      description: "Daftar item belanja yang tertera di nota"
    },
    kategori: {
      type: "string",
      description: "Kategori pengeluaran yang paling cocok dari pilihan berikut: 'Operasional', 'Pemasaran', 'Utilitas', 'Gaji', 'Logistik', 'Lainnya'"
    }
  },
  required: ["vendor", "tanggal", "nominal_total", "rincian_item", "kategori"]
}

serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Initialize Supabase Client with the caller's auth token (respecting RLS)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Parse Request Payload
    const { filePath } = await req.json()
    if (!filePath) {
      return new Response(JSON.stringify({ error: 'filePath is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Download file from Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('invoices')
      .download(filePath)

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: 'Gagal mengunduh berkas dari storage', details: downloadError }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Convert file to base64 data URI (Mistral v1/ocr accepts base64 data URIs)
    const arrayBuffer = await fileData.arrayBuffer()
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    const mimeType = fileData.type || 'image/jpeg'
    const documentUrl = `data:${mimeType};base64,${base64Data}`

    // 5. Setup Mistral API call
    // CATATAN BIAYA: Fitur Document AI (JSON terstruktur) pada Mistral OCR berbayar per halaman dokumen
    // (Annotated-Page rate) di luar kuota gratis dasar. Pantau usage di Mistral Console untuk production.
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY')
    
    let extractedData = {
      vendor: '',
      tanggal: null as string | null,
      nominal_total: null as number | null,
      rincian_item: [] as any[],
      kategori: 'Lainnya',
    }
    let aiFailed = false

    // Abstraction layer function to call Mistral OCR API
    const extractInvoiceData = async (docUrl: string): Promise<any> => {
      if (!mistralApiKey) {
        throw new Error("MISTRAL_API_KEY is not defined in environment secrets")
      }

      const response = await fetch("https://api.mistral.ai/v1/ocr", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mistralApiKey}`,
          "Content-Type": "application/json"
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
        })
      })

      if (!response.ok) {
        throw new Error(`Mistral API responded with status ${response.status}: ${await response.text()}`)
      }

      const resJson = await response.json()
      if (!resJson.document_annotation) {
        throw new Error("Mistral OCR API did not return document_annotation field")
      }

      const parsed = typeof resJson.document_annotation === 'string'
        ? JSON.parse(resJson.document_annotation)
        : resJson.document_annotation

      return parsed
    }

    // Execute AI Extraction
    try {
      const data = await extractInvoiceData(documentUrl)
      extractedData = {
        vendor: data.vendor || '',
        tanggal: data.tanggal || null,
        nominal_total: data.nominal_total || null,
        rincian_item: data.rincian_item || [],
        kategori: data.kategori || 'Lainnya'
      }
    } catch (err) {
      console.error("Mistral OCR API processing failed:", err)
      aiFailed = true
    }

    // 6. Get Public File URL
    const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(filePath)

    // 7. Save record to invoices table as draft
    // Note: DB level before insert trigger will check usage limits,
    // and after insert trigger will auto-increment usage count.
    const { data: invoice, error: insertError } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        vendor: extractedData.vendor || null,
        amount: extractedData.nominal_total || null,
        category: extractedData.kategori || 'Lainnya',
        invoice_date: extractedData.tanggal || null,
        rincian_item: extractedData.rincian_item || [],
        status: 'draft'
      })
      .select()
      .single()

    if (insertError) {
      console.error("Insert error:", insertError)
      // If trigger raised the LIMIT_REACHED exception, return it as custom error
      if (insertError.message && insertError.message.includes('LIMIT_REACHED')) {
        return new Response(JSON.stringify({ 
          error: 'LIMIT_REACHED', 
          message: 'Anda telah mencapai batas 50 invoice gratis bulan ini. Silakan upgrade ke premium untuk menikmati pemrosesan tanpa batas!' 
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({ error: 'Database insert failed', details: insertError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      aiFailed,
      invoice
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error("Edge function execution error:", err)
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
