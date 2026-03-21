export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; full_name: string | null; avatar_url: string | null; created_at: string; updated_at: string; };
        Insert: { id: string; email: string; full_name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string; };
        Update: { id?: string; email?: string; full_name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      groups: { Row: { id: string; name: string; created_by: string; created_at: string; }; Insert: { id?: string; name: string; created_by: string; created_at?: string; }; Update: { id?: string; name?: string; created_by?: string; created_at?: string; }; Relationships: []; };
      members: { Row: { id: string; group_id: string; user_id: string; role: 'member' | 'admin'; joined_at: string; }; Insert: { id?: string; group_id: string; user_id: string; role?: 'member' | 'admin'; joined_at?: string; }; Update: { id?: string; group_id?: string; user_id?: string; role?: 'member' | 'admin'; joined_at?: string; }; Relationships: []; };
      invitation_links: { Row: { id: string; group_id: string; token: string; created_by: string; expires_at: string | null; created_at: string; }; Insert: { id?: string; group_id: string; token: string; created_by: string; expires_at?: string | null; created_at?: string; }; Update: { id?: string; group_id?: string; token?: string; created_by?: string; expires_at?: string | null; created_at?: string; }; Relationships: []; };
      events: { Row: { id: string; group_id: string; organizer_id: string; title: string | null; event_date: string; location: string | null; description: string | null; status: 'draft' | 'published' | 'closed'; created_at: string; updated_at: string; }; Insert: { id?: string; group_id: string; organizer_id: string; title?: string | null; event_date: string; location?: string | null; description?: string | null; status?: 'draft' | 'published' | 'closed'; created_at?: string; updated_at?: string; }; Update: { id?: string; group_id?: string; organizer_id?: string; title?: string | null; event_date?: string; location?: string | null; description?: string | null; status?: 'draft' | 'published' | 'closed'; created_at?: string; updated_at?: string; }; Relationships: []; };
      attendances: { Row: { id: string; event_id: string; member_id: string; status: 'va' | 'no_va' | 'tal_vez'; updated_at: string; }; Insert: { id?: string; event_id: string; member_id: string; status: 'va' | 'no_va' | 'tal_vez'; updated_at?: string; }; Update: { id?: string; event_id?: string; member_id?: string; status?: 'va' | 'no_va' | 'tal_vez'; updated_at?: string; }; Relationships: []; };
      rotation: { Row: { id: string; group_id: string; user_id: string; month: string; is_current: boolean; }; Insert: { id?: string; group_id: string; user_id: string; month: string; is_current?: boolean; }; Update: { id?: string; group_id?: string; user_id?: string; month?: string; is_current?: boolean; }; Relationships: []; };
      polls: { Row: { id: string; event_id: string; created_by: string; closes_at: string; is_closed: boolean; created_at: string; }; Insert: { id?: string; event_id: string; created_by: string; closes_at: string; is_closed?: boolean; created_at?: string; }; Update: { id?: string; event_id?: string; created_by?: string; closes_at?: string; is_closed?: boolean; created_at?: string; }; Relationships: []; };
      poll_options: { Row: { id: string; poll_id: string; label: string; order_index: number; }; Insert: { id?: string; poll_id: string; label: string; order_index?: number; }; Update: { id?: string; poll_id?: string; label?: string; order_index?: number; }; Relationships: []; };
      poll_votes: { Row: { id: string; poll_id: string; option_id: string; user_id: string; voted_at: string; }; Insert: { id?: string; poll_id: string; option_id: string; user_id: string; voted_at?: string; }; Update: { id?: string; poll_id?: string; option_id?: string; user_id?: string; voted_at?: string; }; Relationships: []; };
      restaurant_history: { Row: { id: string; group_id: string; event_id: string | null; restaurant_name: string; visited_at: string; attendees_count: number | null; created_by: string; created_at: string; }; Insert: { id?: string; group_id: string; event_id?: string | null; restaurant_name: string; visited_at: string; attendees_count?: number | null; created_by: string; created_at?: string; }; Update: { id?: string; group_id?: string; event_id?: string | null; restaurant_name?: string; visited_at?: string; attendees_count?: number | null; created_by?: string; created_at?: string; }; Relationships: []; };
      checklist_templates: { Row: { id: string; group_id: string | null; label: string; order_index: number; is_active: boolean; }; Insert: { id?: string; group_id?: string | null; label: string; order_index?: number; is_active?: boolean; }; Update: { id?: string; group_id?: string | null; label?: string; order_index?: number; is_active?: boolean; }; Relationships: []; };
      checklist_items: { Row: { id: string; event_id: string; template_id: string | null; label: string; is_done: boolean; order_index: number; completed_at: string | null; }; Insert: { id?: string; event_id: string; template_id?: string | null; label: string; is_done?: boolean; order_index?: number; completed_at?: string | null; }; Update: { id?: string; event_id?: string; template_id?: string | null; label?: string; is_done?: boolean; order_index?: number; completed_at?: string | null; }; Relationships: []; };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type InvitationLink = Database["public"]["Tables"]["invitation_links"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Attendance = Database["public"]["Tables"]["attendances"]["Row"];
export type Rotation = Database["public"]["Tables"]["rotation"]["Row"];
export type Poll = Database["public"]["Tables"]["polls"]["Row"];
export type PollOption = Database["public"]["Tables"]["poll_options"]["Row"];
export type PollVote = Database["public"]["Tables"]["poll_votes"]["Row"];
export type RestaurantHistory = Database["public"]["Tables"]["restaurant_history"]["Row"];
export type ChecklistTemplate = Database["public"]["Tables"]["checklist_templates"]["Row"];
export type ChecklistItem = Database["public"]["Tables"]["checklist_items"]["Row"];
