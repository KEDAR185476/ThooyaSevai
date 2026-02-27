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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      dealer_offers: {
        Row: {
          created_at: string
          dealer_id: string
          id: string
          listing_id: string
          message: string | null
          price_offered: number
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          dealer_id: string
          id?: string
          listing_id: string
          message?: string | null
          price_offered: number
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          dealer_id?: string
          id?: string
          listing_id?: string
          message?: string | null
          price_offered?: number
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealer_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "waste_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          family_name: string
          id: string
          is_participating: boolean
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family_name: string
          id?: string
          is_participating?: boolean
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family_name?: string
          id?: string
          is_participating?: boolean
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard: {
        Row: {
          created_at: string
          id: string
          leaderboard_type: string
          points: number
          rank: number | null
          school_id: string | null
          street_name: string | null
          user_id: string | null
          ward_id: string | null
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          leaderboard_type: string
          points?: number
          rank?: number | null
          school_id?: string | null
          street_name?: string | null
          user_id?: string | null
          ward_id?: string | null
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          leaderboard_type?: string
          points?: number
          rank?: number | null
          school_id?: string | null
          street_name?: string | null
          user_id?: string | null
          ward_id?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badge_level: Database["public"]["Enums"]["badge_level"]
          created_at: string
          email: string
          id: string
          name: string
          total_points: number
          updated_at: string
          user_id: string
          ward_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          badge_level?: Database["public"]["Enums"]["badge_level"]
          created_at?: string
          email: string
          id?: string
          name: string
          total_points?: number
          updated_at?: string
          user_id: string
          ward_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          badge_level?: Database["public"]["Enums"]["badge_level"]
          created_at?: string
          email?: string
          id?: string
          name?: string
          total_points?: number
          updated_at?: string
          user_id?: string
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          id: string
          redeemed_at: string
          reward_id: string
          user_id: string
        }
        Insert: {
          id?: string
          redeemed_at?: string
          reward_id: string
          user_id: string
        }
        Update: {
          id?: string
          redeemed_at?: string
          reward_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          assigned_officer_id: string | null
          confidence_score: number | null
          created_at: string
          id: string
          image_url: string
          latitude: number
          longitude: number
          resolved_at: string | null
          status: Database["public"]["Enums"]["report_status"]
          street_name: string | null
          updated_at: string
          user_id: string
          ward_id: string | null
          waste_type: Database["public"]["Enums"]["waste_type"] | null
        }
        Insert: {
          assigned_officer_id?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          image_url: string
          latitude: number
          longitude: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          street_name?: string | null
          updated_at?: string
          user_id: string
          ward_id?: string | null
          waste_type?: Database["public"]["Enums"]["waste_type"] | null
        }
        Update: {
          assigned_officer_id?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          image_url?: string
          latitude?: number
          longitude?: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          street_name?: string | null
          updated_at?: string
          user_id?: string
          ward_id?: string | null
          waste_type?: Database["public"]["Enums"]["waste_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          points_required: number
          sponsor_name: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          points_required: number
          sponsor_name?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          points_required?: number
          sponsor_name?: string | null
          title?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          created_at: string
          id: string
          name: string
          ward_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          ward_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          ward_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_ward_id_fkey"
            columns: ["ward_id"]
            isOneToOne: false
            referencedRelation: "wards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wards: {
        Row: {
          cleanliness_score: number
          created_at: string
          id: string
          name: string
          resolved_reports: number
          total_reports: number
          updated_at: string
          ward_number: number
        }
        Insert: {
          cleanliness_score?: number
          created_at?: string
          id?: string
          name: string
          resolved_reports?: number
          total_reports?: number
          updated_at?: string
          ward_number: number
        }
        Update: {
          cleanliness_score?: number
          created_at?: string
          id?: string
          name?: string
          resolved_reports?: number
          total_reports?: number
          updated_at?: string
          ward_number?: number
        }
        Relationships: []
      }
      waste_listings: {
        Row: {
          accepted_offer_id: string | null
          address: string | null
          category: Database["public"]["Enums"]["waste_category"]
          created_at: string
          description: string | null
          id: string
          image_url: string
          latitude: number
          longitude: number
          quantity_kg: number
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_offer_id?: string | null
          address?: string | null
          category: Database["public"]["Enums"]["waste_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          latitude: number
          longitude: number
          quantity_kg: number
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_offer_id?: string | null
          address?: string | null
          category?: Database["public"]["Enums"]["waste_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          latitude?: number
          longitude?: number
          quantity_kg?: number
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_listings_accepted_offer_fkey"
            columns: ["accepted_offer_id"]
            isOneToOne: false
            referencedRelation: "dealer_offers"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role:
        | "citizen"
        | "student"
        | "ward_officer"
        | "admin"
        | "scrap_dealer"
      badge_level: "bronze" | "silver" | "gold" | "platinum"
      listing_status:
        | "open"
        | "offered"
        | "accepted"
        | "collected"
        | "cancelled"
      offer_status: "pending" | "accepted" | "rejected" | "withdrawn"
      report_status: "pending" | "assigned" | "resolved"
      waste_category: "plastic" | "paper" | "metal" | "ewaste" | "glass"
      waste_type: "plastic" | "organic" | "construction" | "mixed"
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
      app_role: ["citizen", "student", "ward_officer", "admin", "scrap_dealer"],
      badge_level: ["bronze", "silver", "gold", "platinum"],
      listing_status: ["open", "offered", "accepted", "collected", "cancelled"],
      offer_status: ["pending", "accepted", "rejected", "withdrawn"],
      report_status: ["pending", "assigned", "resolved"],
      waste_category: ["plastic", "paper", "metal", "ewaste", "glass"],
      waste_type: ["plastic", "organic", "construction", "mixed"],
    },
  },
} as const
