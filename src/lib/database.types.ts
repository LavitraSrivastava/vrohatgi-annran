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
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'auditor' | 'reviewer'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: 'admin' | 'auditor' | 'reviewer'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'auditor' | 'reviewer'
          created_at?: string
        }
      }
      audits: {
        Row: {
          id: string
          title: string
          created_by: string
          site: string
          type: string
          status: 'draft' | 'submitted' | 'reviewed' | 'approved'
          score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          created_by: string
          site: string
          type: string
          status?: 'draft' | 'submitted' | 'reviewed' | 'approved'
          score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          created_by?: string
          site?: string
          type?: string
          status?: 'draft' | 'submitted' | 'reviewed' | 'approved'
          score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_items: {
        Row: {
          id: string
          audit_id: string
          question: string
          category: string
          response: 'yes' | 'no' | 'n/a' | null
          notes: string | null
          evidence_urls: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          question: string
          category: string
          response?: 'yes' | 'no' | 'n/a' | null
          notes?: string | null
          evidence_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          question?: string
          category?: string
          response?: 'yes' | 'no' | 'n/a' | null
          notes?: string | null
          evidence_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_templates: {
        Row: {
          id: string
          title: string
          description: string
          created_by: string
          categories: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          created_by: string
          categories: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          created_by?: string
          categories?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      template_items: {
        Row: {
          id: string
          template_id: string
          question: string
          category: string
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          question: string
          category: string
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          question?: string
          category?: string
          created_at?: string
        }
      }
    }
  }
}