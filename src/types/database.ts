// Database type definitions for Supabase
// These types represent the structure of our database tables

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
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            time_entries: {
                Row: {
                    id: string
                    user_id: string
                    date: string
                    clock_in: string
                    clock_out: string | null
                    status: string
                    total_hours: number | null
                    edited_manually: boolean
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    date: string
                    clock_in: string
                    clock_out?: string | null
                    status: string
                    total_hours?: number | null
                    edited_manually?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    date?: string
                    clock_in?: string
                    clock_out?: string | null
                    status?: string
                    total_hours?: number | null
                    edited_manually?: boolean
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "time_entries_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            pauses: {
                Row: {
                    id: string
                    time_entry_id: string
                    start_time: string
                    end_time: string | null
                    duration: number | null
                    type: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    time_entry_id: string
                    start_time: string
                    end_time?: string | null
                    duration?: number | null
                    type: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    time_entry_id?: string
                    start_time?: string
                    end_time?: string | null
                    duration?: number | null
                    type?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "pauses_time_entry_id_fkey"
                        columns: ["time_entry_id"]
                        referencedRelation: "time_entries"
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
