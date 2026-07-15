import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin credentials are not fully configured in environment variables.")
  }

  // Create standard client with service role key, which bypasses Row Level Security (RLS)
  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
