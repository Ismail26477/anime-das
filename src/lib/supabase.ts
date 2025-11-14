import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://edzojevlzrwbiqyxklss.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkem9qZXZsenJ3YmlxeXhrbHNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MzA5MzgsImV4cCI6MjA3MTEwNjkzOH0.yhQpFcnYugnox6KEHMmD8YcNQYLmXFw0E0wvT-7WXuE"

console.log("[v0] Supabase connected to:", supabaseUrl)

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase credentials")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      anime: {
        Row: {
          id: string
          title: string
          description: string
          synopsis: string
          release_year: number
          episode_count: number
          studio_id: string | null
          studio_name: string | null
          rating: number
          status: "ongoing" | "completed" | "upcoming"
          thumbnail_url: string | null
          created_at: string
          updated_at: string
          added_by: string
          is_archived: boolean
          genres: string[]
        }
        Insert: {
          id?: string
          title: string
          description?: string
          synopsis?: string
          release_year: number
          episode_count: number
          studio_id?: string | null
          studio_name?: string | null
          rating: number
          status: "ongoing" | "completed" | "upcoming"
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
          added_by: string
          is_archived?: boolean
          genres: string[]
        }
        Update: {
          id?: string
          title?: string
          description?: string
          synopsis?: string
          release_year?: number
          episode_count?: number
          studio_id?: string | null
          studio_name?: string | null
          rating?: number
          status?: "ongoing" | "completed" | "upcoming"
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
          added_by?: string
          is_archived?: boolean
          genres?: string[]
        }
      }
      episodes: {
        Row: {
          id: string
          anime_id: string
          episode_number: number
          title: string | null
          description: string | null
          duration: string | null
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          anime_id: string
          episode_number: number
          title?: string | null
          description?: string | null
          duration?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          anime_id?: string
          episode_number?: number
          title?: string | null
          description?: string | null
          duration?: string | null
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      episode_links: {
        Row: {
          id: string
          episode_id: string
          platform: string
          url: string
          quality: string | null
          file_size: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          episode_id: string
          platform: string
          url: string
          quality?: string | null
          file_size?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          episode_id?: string
          platform?: string
          url?: string
          quality?: string | null
          file_size?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subtitles: {
        Row: {
          id: string
          link_id: string
          language: string
          url: string | null
          file_path: string | null
          file_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          link_id: string
          language: string
          url?: string | null
          file_path?: string | null
          file_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          link_id?: string
          language?: string
          url?: string | null
          file_path?: string | null
          file_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
