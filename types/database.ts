export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      families: {
        Row: {
          id: string;
          name: string;
          timezone: string;
          default_target_minutes: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          timezone?: string;
          default_target_minutes?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          timezone?: string;
          default_target_minutes?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: "owner" | "parent";
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          role: "owner" | "parent";
          created_at?: string;
        };
        Update: {
          role?: "owner" | "parent";
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          target_minutes_per_day: number;
          active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          target_minutes_per_day?: number;
          active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          target_minutes_per_day?: number;
          active?: boolean;
          display_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      wearing_sessions: {
        Row: {
          id: string;
          family_id: string;
          child_id: string;
          start_at: string;
          end_at: string | null;
          report_date: string;
          duration_minutes: number | null;
          status: "active" | "closed";
          note: string | null;
          created_by: string;
          updated_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          child_id: string;
          start_at: string;
          end_at?: string | null;
          report_date: string;
          duration_minutes?: number | null;
          status: "active" | "closed";
          note?: string | null;
          created_by: string;
          updated_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          start_at?: string;
          end_at?: string | null;
          report_date?: string;
          duration_minutes?: number | null;
          status?: "active" | "closed";
          note?: string | null;
          updated_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      invite_codes: {
        Row: {
          id: string;
          family_id: string;
          code: string;
          invited_email: string | null;
          created_by: string;
          expires_at: string;
          used_by: string | null;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          code: string;
          invited_email?: string | null;
          created_by: string;
          expires_at: string;
          used_by?: string | null;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          used_by?: string | null;
          used_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      daily_wearing_summary: {
        Row: {
          family_id: string;
          child_id: string;
          report_date: string;
          session_count: number;
          total_minutes: number;
        };
        Relationships: [];
      };
      weekly_wearing_summary: {
        Row: {
          family_id: string;
          child_id: string;
          week_start_date: string;
          session_count: number;
          total_minutes: number;
        };
        Relationships: [];
      };
      monthly_wearing_summary: {
        Row: {
          family_id: string;
          child_id: string;
          month_start_date: string;
          session_count: number;
          total_minutes: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_family_member: {
        Args: { target_family_id: string };
        Returns: boolean;
      };
      redeem_invite_code: {
        Args: { invite_code: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Family = Database["public"]["Tables"]["families"]["Row"];
export type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];
export type Child = Database["public"]["Tables"]["children"]["Row"];
export type WearingSession = Database["public"]["Tables"]["wearing_sessions"]["Row"];
export type InviteCode = Database["public"]["Tables"]["invite_codes"]["Row"];
export type DailyWearingSummary = Database["public"]["Views"]["daily_wearing_summary"]["Row"];
export type WeeklyWearingSummary = Database["public"]["Views"]["weekly_wearing_summary"]["Row"];
export type MonthlyWearingSummary = Database["public"]["Views"]["monthly_wearing_summary"]["Row"];
