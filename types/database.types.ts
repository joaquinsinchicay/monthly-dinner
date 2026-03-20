export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          created_by: string | null;
          invite_token: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_by?: string | null;
          invite_token?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string | null;
          invite_token?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: string;
          joined_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          event_date: string;
          location: string | null;
          status: string;
          organizer_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          title: string;
          event_date: string;
          location?: string | null;
          status?: string;
          organizer_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          title?: string;
          event_date?: string;
          location?: string | null;
          status?: string;
          organizer_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
