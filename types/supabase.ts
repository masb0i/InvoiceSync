export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          business_name: string | null
          tier: 'free' | 'basic' | 'pro' | 'enterprise'
          updated_at: string
          created_at: string
        }
        Insert: {
          id: string
          business_name?: string | null
          tier?: 'free' | 'basic' | 'pro' | 'enterprise'
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          business_name?: string | null
          tier?: 'free' | 'basic' | 'pro' | 'enterprise'
          updated_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          image_url: string | null
          vendor: string | null
          amount: number | null
          category: string | null
          invoice_date: string | null
          status: 'draft' | 'pending_review' | 'unpaid' | 'paid' | 'confirmed'
          rincian_item: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url?: string | null
          vendor?: string | null
          amount?: number | null
          category?: string | null
          invoice_date?: string | null
          status?: 'draft' | 'pending_review' | 'unpaid' | 'paid' | 'confirmed'
          rincian_item?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string | null
          vendor?: string | null
          amount?: number | null
          category?: string | null
          invoice_date?: string | null
          status?: 'draft' | 'pending_review' | 'unpaid' | 'paid' | 'confirmed'
          rincian_item?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bank_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          description: string | null
          transaction_date: string
          matched_invoice_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          description?: string | null
          transaction_date: string
          matched_invoice_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          description?: string | null
          transaction_date?: string
          matched_invoice_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_matched_invoice_id_fkey"
            columns: ["matched_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      usage_limits: {
        Row: {
          id: string
          user_id: string
          month: string
          invoice_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          invoice_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month?: string
          invoice_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
