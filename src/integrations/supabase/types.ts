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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          change_details: Json | null
          change_summary: string
          created_at: string
          edited_by: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          change_details?: Json | null
          change_summary: string
          created_at?: string
          edited_by: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          change_details?: Json | null
          change_summary?: string
          created_at?: string
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
          clinical_summary: string | null
          created_at: string
          created_by: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          cancer_type?: string | null
          case_name: string
          clinical_summary?: string | null
          created_at?: string
          created_by: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancer_type?: string | null
          case_name?: string
          clinical_summary?: string | null
          created_at?: string
          created_by?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_edit_tracking: {
        Row: {
          created_at: string
          document_id: string
          id: string
          last_edited_stage: string
          last_verified_at: string | null
          requires_revisit: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          last_edited_stage?: string
          last_verified_at?: string | null
          requires_revisit?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          last_edited_stage?: string
          last_verified_at?: string | null
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
          page_count: number
          storage_path: string | null
        }
        Insert: {
          anonymized_file_url?: string | null
          case_id: string
          created_at?: string
          digitized_text?: Json | null
          file_category?: string | null
          file_name: string
          file_type?: string
          id?: string
          is_anonymized?: boolean
          is_digitized?: boolean
          last_modified_at?: string
          page_count?: number
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
          page_count?: number
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
      group_messages: {
        Row: {
          case_id: string | null
          content: string
          created_at: string
          id: string
          mtb_id: string
          sender_id: string
        }
        Insert: {
          case_id?: string | null
          content: string
          created_at?: string
          id?: string
          mtb_id: string
          sender_id: string
        }
        Update: {
          case_id?: string | null
          content?: string
          created_at?: string
          id?: string
          mtb_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_mtb_id_fkey"
            columns: ["mtb_id"]
            isOneToOne: false
            referencedRelation: "mtbs"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          invited_email: string
          invited_user_id: string | null
          mtb_id: string
          read: boolean
          responded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          invited_email: string
          invited_user_id?: string | null
          mtb_id: string
          read?: boolean
          responded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          invited_user_id?: string | null
          mtb_id?: string
          read?: boolean
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_mtb_id_fkey"
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
      meeting_responses: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          meeting_id: string
          response: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          meeting_id: string
          response?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          meeting_id?: string
          response?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_responses_meeting_id_fkey"
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
          ended_at: string | null
          id: string
          meeting_link: string | null
          mtb_id: string
          repeat_days: number[] | null
          schedule_type: string
          scheduled_date: string
          scheduled_time: string
          started_at: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          ended_at?: string | null
          id?: string
          meeting_link?: string | null
          mtb_id: string
          repeat_days?: number[] | null
          schedule_type?: string
          scheduled_date: string
          scheduled_time: string
          started_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          ended_at?: string | null
          id?: string
          meeting_link?: string | null
          mtb_id?: string
          repeat_days?: number[] | null
          schedule_type?: string
          scheduled_date?: string
          scheduled_time?: string
          started_at?: string | null
          status?: string
          title?: string | null
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
          added_by: string
          case_id: string
          id: string
          mtb_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          case_id: string
          id?: string
          mtb_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          case_id?: string
          id?: string
          mtb_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtb_cases_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
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
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          mtb_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          mtb_id?: string
          role?: string
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
          description: string | null
          dp_image: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dp_image?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dp_image?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
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
          updated_at: string
        }
        Insert: {
          age?: number | null
          anonymized_name: string
          case_id: string
          created_at?: string
          id?: string
          sex?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          anonymized_name?: string
          case_id?: string
          created_at?: string
          id?: string
          sex?: string | null
          updated_at?: string
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_mtb_member: {
        Args: { _mtb_id: string; _user_id: string }
        Returns: boolean
      }
      is_mtb_owner: {
        Args: { _mtb_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "expert"
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
    Enums: {
      app_role: ["admin", "doctor", "expert"],
    },
  },
} as const
