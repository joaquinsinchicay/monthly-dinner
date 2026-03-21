export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name?: string | null;
          email: string;
          avatar_url: string | null;
          created_at: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          created_by?: string | null;
          created_at: string;
        };
      };
      members: {
        Row: {
          id: string;
          group_id: string;
          profile_id?: string;
          user_id?: string;
          role: 'member' | 'organizer' | 'organizador' | 'miembro';
          rotation_order?: number | null;
          joined_at: string;
        };
      };
      invitation_links: {
        Row: {
          id: string;
          token: string;
          group_id: string;
          created_by: string;
          expires_at: string;
          revoked: boolean;
          created_at: string;
        };
      };
      monthly_events: {
        Row: {
          id: string;
          group_id: string;
          organizer_id: string | null;
          month: string;
          event_date: string | null;
          venue_name: string | null;
          venue_address: string | null;
          description: string | null;
          status: 'pendiente' | 'publicado' | 'cerrado';
          restaurant_name: string | null;
          closed_at: string | null;
          created_at: string;
        };
      };
      attendances: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: 'va' | 'no_va' | 'tal_vez' | 'sin_respuesta';
          updated_at: string;
        };
      };
      polls: { Row: { id: string; event_id: string; created_by: string | null; closes_at: string; status: 'activa' | 'cerrada'; created_at: string; }; };
      poll_options: { Row: { id: string; poll_id: string; restaurant_name: string; created_at: string; }; };
      poll_votes: { Row: { id: string; poll_id: string; option_id: string; user_id: string; voted_at: string; }; };
      rotation_history: { Row: { id: string; group_id: string; user_id: string; month: string; assigned_at: string; }; };
      checklist_items: { Row: { id: string; event_id: string; label: string; is_completed: boolean; order_index: number | null; completed_at: string | null; }; };
      notifications: { Row: { id: string; user_id: string; event_id: string | null; type: 'convocatoria' | 'recordatorio' | 'cierre' | 'turno' | 'votacion'; message: string; read: boolean; created_at: string; }; };
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Group = Database['public']['Tables']['groups']['Row'];
export type GroupMember = Database['public']['Tables']['members']['Row'];
export type MonthlyEvent = Database['public']['Tables']['monthly_events']['Row'];
export type Attendance = Database['public']['Tables']['attendances']['Row'];
export type Poll = Database['public']['Tables']['polls']['Row'];
export type PollOption = Database['public']['Tables']['poll_options']['Row'];
export type PollVote = Database['public']['Tables']['poll_votes']['Row'];
export type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
