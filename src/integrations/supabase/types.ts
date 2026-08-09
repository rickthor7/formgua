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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_admin: boolean
          message: string | null
          read_by_admin: boolean
          read_by_user: boolean
          sender_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_admin?: boolean
          message?: string | null
          read_by_admin?: boolean
          read_by_user?: boolean
          sender_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_admin?: boolean
          message?: string | null
          read_by_admin?: boolean
          read_by_user?: boolean
          sender_id?: string
          user_id?: string
        }
        Relationships: []
      }
      form_responses: {
        Row: {
          completed: boolean
          correct_count: number | null
          created_at: string
          data: Json
          form_id: string
          id: string
          max_score: number | null
          participant_name: string | null
          score: number | null
          wrong_count: number | null
        }
        Insert: {
          completed?: boolean
          correct_count?: number | null
          created_at?: string
          data?: Json
          form_id: string
          id?: string
          max_score?: number | null
          participant_name?: string | null
          score?: number | null
          wrong_count?: number | null
        }
        Update: {
          completed?: boolean
          correct_count?: number | null
          created_at?: string
          data?: Json
          form_id?: string
          id?: string
          max_score?: number | null
          participant_name?: string | null
          score?: number | null
          wrong_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          banner_url: string | null
          created_at: string
          description: string | null
          fields: Json
          form_type: string
          giveaway_enabled: boolean
          giveaway_ewallets: string[]
          giveaway_mode: string
          giveaway_total_amount: number
          giveaway_winner_count: number
          id: string
          join_code: string | null
          layout_mode: string
          notify_email: string | null
          notify_enabled: boolean
          og_image_url: string | null
          owner_id: string | null
          password: string | null
          quiz_time_limit: number | null
          slug: string | null
          status: string
          success_links: Json
          success_message: string | null
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          fields?: Json
          form_type?: string
          giveaway_enabled?: boolean
          giveaway_ewallets?: string[]
          giveaway_mode?: string
          giveaway_total_amount?: number
          giveaway_winner_count?: number
          id?: string
          join_code?: string | null
          layout_mode?: string
          notify_email?: string | null
          notify_enabled?: boolean
          og_image_url?: string | null
          owner_id?: string | null
          password?: string | null
          quiz_time_limit?: number | null
          slug?: string | null
          status?: string
          success_links?: Json
          success_message?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          description?: string | null
          fields?: Json
          form_type?: string
          giveaway_enabled?: boolean
          giveaway_ewallets?: string[]
          giveaway_mode?: string
          giveaway_total_amount?: number
          giveaway_winner_count?: number
          id?: string
          join_code?: string | null
          layout_mode?: string
          notify_email?: string | null
          notify_enabled?: boolean
          og_image_url?: string | null
          owner_id?: string | null
          password?: string | null
          quiz_time_limit?: number | null
          slug?: string | null
          status?: string
          success_links?: Json
          success_message?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      giveaway_entries: {
        Row: {
          amount_won: number | null
          created_at: string
          ewallet: string
          form_id: string
          id: string
          is_winner: boolean
          phone: string
          response_id: string | null
        }
        Insert: {
          amount_won?: number | null
          created_at?: string
          ewallet: string
          form_id: string
          id?: string
          is_winner?: boolean
          phone: string
          response_id?: string | null
        }
        Update: {
          amount_won?: number | null
          created_at?: string
          ewallet?: string
          form_id?: string
          id?: string
          is_winner?: boolean
          phone?: string
          response_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_entries_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giveaway_entries_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "form_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_number: string
          period_end: string | null
          period_start: string
          premium_request_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_number: string
          period_end?: string | null
          period_start?: string
          premium_request_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_number?: string
          period_end?: string | null
          period_start?: string
          premium_request_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_premium_request_id_fkey"
            columns: ["premium_request_id"]
            isOneToOne: false
            referencedRelation: "premium_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          duration_months: number
          id: string
          notes: string | null
          payment_method: string | null
          proof_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          duration_months?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          duration_months?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_usage_count: number
          ai_usage_reset_at: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_usage_count?: number
          ai_usage_reset_at?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_usage_count?: number
          ai_usage_reset_at?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          expires_at: string | null
          granted_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
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
      generate_join_code: { Args: never; Returns: string }
      generate_slug: { Args: { title: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "premium" | "user"
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
      app_role: ["admin", "premium", "user"],
    },
  },
} as const
