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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      data_integrity_logs: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          league_id: string
          operation_type: string
          table_name: string
          user_id: string | null
          violation_type: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          league_id: string
          operation_type: string
          table_name: string
          user_id?: string | null
          violation_type: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          league_id?: string
          operation_type?: string
          table_name?: string
          user_id?: string | null
          violation_type?: string
        }
        Relationships: []
      }
      dead_cap_players: {
        Row: {
          created_at: string
          id: string
          league_id: string
          player_id: string
          roster_id: number
          salary: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          player_id: string
          roster_id: number
          salary?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          player_id?: string
          roster_id?: number
          salary?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      draft_picks: {
        Row: {
          created_at: string
          draft_id: string
          id: string
          is_keeper: boolean | null
          league_id: string
          metadata: Json | null
          pick_no: number
          picked_by: string | null
          player_id: string | null
          roster_id: number
          round: number
        }
        Insert: {
          created_at?: string
          draft_id: string
          id?: string
          is_keeper?: boolean | null
          league_id: string
          metadata?: Json | null
          pick_no: number
          picked_by?: string | null
          player_id?: string | null
          roster_id: number
          round: number
        }
        Update: {
          created_at?: string
          draft_id?: string
          id?: string
          is_keeper?: boolean | null
          league_id?: string
          metadata?: Json | null
          pick_no?: number
          picked_by?: string | null
          player_id?: string | null
          roster_id?: number
          round?: number
        }
        Relationships: []
      }
      league_drafts: {
        Row: {
          created_at: string
          draft_id: string
          id: string
          league_id: string
          metadata: Json | null
          season: string | null
          season_type: string | null
          settings: Json | null
          sport: string | null
          start_time: number | null
          status: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          draft_id: string
          id?: string
          league_id: string
          metadata?: Json | null
          season?: string | null
          season_type?: string | null
          settings?: Json | null
          sport?: string | null
          start_time?: number | null
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          draft_id?: string
          id?: string
          league_id?: string
          metadata?: Json | null
          season?: string | null
          season_type?: string | null
          settings?: Json | null
          sport?: string | null
          start_time?: number | null
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      league_metadata: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_synced_at: string
          league_id: string
          name: string | null
          roster_positions: Json | null
          scoring_settings: Json | null
          season: string | null
          season_type: string | null
          sleeper_verified_at: string | null
          sport: string | null
          total_rosters: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string
          league_id: string
          name?: string | null
          roster_positions?: Json | null
          scoring_settings?: Json | null
          season?: string | null
          season_type?: string | null
          sleeper_verified_at?: string | null
          sport?: string | null
          total_rosters?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string
          league_id?: string
          name?: string | null
          roster_positions?: Json | null
          scoring_settings?: Json | null
          season?: string | null
          season_type?: string | null
          sleeper_verified_at?: string | null
          sport?: string | null
          total_rosters?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      league_ownership: {
        Row: {
          claimed_at: string
          id: string
          is_active: boolean
          league_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          is_active?: boolean
          league_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          is_active?: boolean
          league_id?: string
          user_id?: string
        }
        Relationships: []
      }
      league_settings: {
        Row: {
          created_at: string
          dead_cap_enabled: boolean | null
          faab_cap: number | null
          id: string
          league_id: string
          reserve_limit: number | null
          salary_cap: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dead_cap_enabled?: boolean | null
          faab_cap?: number | null
          id?: string
          league_id: string
          reserve_limit?: number | null
          salary_cap?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dead_cap_enabled?: boolean | null
          faab_cap?: number | null
          id?: string
          league_id?: string
          reserve_limit?: number | null
          salary_cap?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      league_transactions: {
        Row: {
          adds: Json | null
          consenter_ids: Json | null
          created_at: string
          creator: string | null
          draft_picks: Json | null
          drops: Json | null
          id: string
          league_id: string
          metadata: Json | null
          settings: Json | null
          status: string | null
          transaction_id: string
          type: string | null
          updated_at: string
          waiver_budget: Json | null
          week: number | null
        }
        Insert: {
          adds?: Json | null
          consenter_ids?: Json | null
          created_at?: string
          creator?: string | null
          draft_picks?: Json | null
          drops?: Json | null
          id?: string
          league_id: string
          metadata?: Json | null
          settings?: Json | null
          status?: string | null
          transaction_id: string
          type?: string | null
          updated_at?: string
          waiver_budget?: Json | null
          week?: number | null
        }
        Update: {
          adds?: Json | null
          consenter_ids?: Json | null
          created_at?: string
          creator?: string | null
          draft_picks?: Json | null
          drops?: Json | null
          id?: string
          league_id?: string
          metadata?: Json | null
          settings?: Json | null
          status?: string | null
          transaction_id?: string
          type?: string | null
          updated_at?: string
          waiver_budget?: Json | null
          week?: number | null
        }
        Relationships: []
      }
      player_contracts: {
        Row: {
          contract_length: number | null
          created_at: string
          id: string
          league_id: string
          player_id: string
          updated_at: string
        }
        Insert: {
          contract_length?: number | null
          created_at?: string
          id?: string
          league_id: string
          player_id: string
          updated_at?: string
        }
        Update: {
          contract_length?: number | null
          created_at?: string
          id?: string
          league_id?: string
          player_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_salaries: {
        Row: {
          acquisition_type: string | null
          created_at: string
          id: string
          league_id: string
          player_id: string
          salary: number | null
          taxi_squad: boolean | null
          updated_at: string
        }
        Insert: {
          acquisition_type?: string | null
          created_at?: string
          id?: string
          league_id: string
          player_id: string
          salary?: number | null
          taxi_squad?: boolean | null
          updated_at?: string
        }
        Update: {
          acquisition_type?: string | null
          created_at?: string
          id?: string
          league_id?: string
          player_id?: string
          salary?: number | null
          taxi_squad?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      processed_transactions: {
        Row: {
          created_at: string
          id: string
          league_id: string
          player_updates: Json | null
          processed_at: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          player_updates?: Json | null
          processed_at?: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          player_updates?: Json | null
          processed_at?: string
          transaction_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          sleeper_username: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          sleeper_username?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          sleeper_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_integrity_violation: {
        Args: {
          details_param?: Json
          league_id_param: string
          operation_type_param: string
          table_name_param: string
          user_id_param?: string
          violation_type_param: string
        }
        Returns: undefined
      }
      validate_league_exists: {
        Args: { league_id_param: string }
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
