export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          change_summary: string
          edited_at: string
          edited_by: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          change_summary: string
          edited_at?: string
          edited_by: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          change_summary?: string
          edited_at?: string
          edited_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      cases: {
        Row: {
          cancer_type: string | null
          case_name: string
          created_at: string
          created_by: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          cancer_type?: string | null
          case_name: string
          created_at?: string
          created_by: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancer_type?: string | null
          case_name?: string
          created_at?: string
          created_by?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          case_id: string
          content: string
          created_at: string
          id: string
          is_group_message: boolean
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          case_id: string
          content: string
          created_at?: string
          id?: string
          is_group_message?: boolean
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          case_id?: string
          content?: string
          created_at?: string
          id?: string
          is_group_message?: boolean
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      document_edit_tracking: {
        Row: {
          document_id: string
          id: string
          last_edited_stage: string
          requires_revisit: boolean
          updated_at: string
        }
        Insert: {
          document_id: string
          id?: string
          last_edited_stage: string
          requires_revisit?: boolean
          updated_at?: string
        }
        Update: {
          document_id?: string
          id?: string
          last_edited_stage?: string
          requires_revisit?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_edit_tracking_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          anonymized_file_url: string | null
          case_id: string
          created_at: string
          digitized_text: Json | null
          file_category: string | null
          file_name: string
          file_type: string
          id: string
          is_anonymized: boolean
          is_digitized: boolean
          last_modified_at: string
          page_count: number | null
          storage_path: string | null
        }
        Insert: {
          anonymized_file_url?: string | null
          case_id: string
          created_at?: string
          digitized_text?: Json | null
          file_category?: string | null
          file_name: string
          file_type: string
          id?: string
          is_anonymized?: boolean
          is_digitized?: boolean
          last_modified_at?: string
          page_count?: number | null
          storage_path?: string | null
        }
        Update: {
          anonymized_file_url?: string | null
          case_id?: string
          created_at?: string
          digitized_text?: Json | null
          file_category?: string | null
          file_name?: string
          file_type?: string
          id?: string
          is_anonymized?: boolean
          is_digitized?: boolean
          last_modified_at?: string
          page_count?: number | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          id: string
          invited_by_id: string
          invited_by_name: string
          invited_user_email: string
          mtb_id: string
          mtb_name: string
          read: boolean
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by_id: string
          invited_by_name: string
          invited_user_email: string
          mtb_id: string
          mtb_name: string
          read?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by_id?: string
          invited_by_name?: string
          invited_user_email?: string
          mtb_id?: string
          mtb_name?: string
          read?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invitations_mtb"
            columns: ["mtb_id"]
            isOneToOne: false
            referencedRelation: "mtbs"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_notifications: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          read: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          read?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_notifications_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          created_by: string
          id: string
          mtb_id: string
          repeat_days: number[] | null
          schedule_type: string
          scheduled_date: string
          scheduled_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          mtb_id: string
          repeat_days?: number[] | null
          schedule_type?: string
          scheduled_date: string
          scheduled_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          mtb_id?: string
          repeat_days?: number[] | null
          schedule_type?: string
          scheduled_date?: string
          scheduled_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_mtb_id_fkey"
            columns: ["mtb_id"]
            isOneToOne: false
            referencedRelation: "mtbs"
            referencedColumns: ["id"]
          },
        ]
      }
      mtb_cases: {
        Row: {
          added_at: string
          case_id: string
          id: string
          mtb_id: string
        }
        Insert: {
          added_at?: string
          case_id: string
          id?: string
          mtb_id: string
        }
        Update: {
          added_at?: string
          case_id?: string
          id?: string
          mtb_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtb_cases_mtb_id_fkey"
            columns: ["mtb_id"]
            isOneToOne: false
            referencedRelation: "mtbs"
            referencedColumns: ["id"]
          },
        ]
      }
      mtb_members: {
        Row: {
          id: string
          joined_at: string
          mtb_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          mtb_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          mtb_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtb_members_mtb_id_fkey"
            columns: ["mtb_id"]
            isOneToOne: false
            referencedRelation: "mtbs"
            referencedColumns: ["id"]
          },
        ]
      }
      mtbs: {
        Row: {
          created_at: string
          display_picture: string | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          display_picture?: string | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          display_picture?: string | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          age: number | null
          anonymized_name: string
          case_id: string
          created_at: string
          id: string
          sex: string | null
        }
        Insert: {
          age?: number | null
          anonymized_name: string
          case_id: string
          created_at?: string
          id?: string
          sex?: string | null
        }
        Update: {
          age?: number | null
          anonymized_name?: string
          case_id?: string
          created_at?: string
          id?: string
          sex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          hospital_name: string | null
          id: string
          name: string
          phone: string | null
          profession: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          hospital_name?: string | null
          id: string
          name: string
          phone?: string | null
          profession?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          hospital_name?: string | null
          id?: string
          name?: string
          phone?: string | null
          profession?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_mtb_member: {
        Args: { _mtb_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
