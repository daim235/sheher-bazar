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
      bookings: {
        Row: {
          address: string | null
          agreed_price: number
          commission_amount: number
          commission_pct: number
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          provider_id: string
          scheduled_for: string | null
          service_id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          agreed_price?: number
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          provider_id: string
          scheduled_for?: string | null
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          agreed_price?: number
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          provider_id?: string
          scheduled_for?: string | null
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          name_ur: string | null
          slug: string
          type: Database["public"]["Enums"]["listing_type"]
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_ur?: string | null
          slug: string
          type: Database["public"]["Enums"]["listing_type"]
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_ur?: string | null
          slug?: string
          type?: Database["public"]["Enums"]["listing_type"]
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          phone: string | null
          shipping_address: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          phone?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          phone?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          booking_commission_pct: number
          id: string
          updated_at: string
          vendor_commission_pct: number
        }
        Insert: {
          booking_commission_pct?: number
          id?: string
          updated_at?: string
          vendor_commission_pct?: number
        }
        Update: {
          booking_commission_pct?: number
          id?: string
          updated_at?: string
          vendor_commission_pct?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          rating: number | null
          stock: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          rating?: number | null
          stock?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          rating?: number | null
          stock?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          contact_email: string | null
          created_at: string
          default_address: string | null
          default_phone: string | null
          full_name: string | null
          id: string
          phone: string | null
          provider_applied_at: string | null
          provider_rejection_reason: string | null
          provider_reviewed_at: string | null
          provider_reviewed_by: string | null
          provider_skills: string | null
          provider_status: Database["public"]["Enums"]["provider_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string
          default_address?: string | null
          default_phone?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          provider_applied_at?: string | null
          provider_rejection_reason?: string | null
          provider_reviewed_at?: string | null
          provider_reviewed_by?: string | null
          provider_skills?: string | null
          provider_status?: Database["public"]["Enums"]["provider_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string
          default_address?: string | null
          default_phone?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          provider_applied_at?: string | null
          provider_rejection_reason?: string | null
          provider_reviewed_at?: string | null
          provider_reviewed_by?: string | null
          provider_skills?: string | null
          provider_status?: Database["public"]["Enums"]["provider_status"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string
          id: string
          product_id: string | null
          rating: number
          service_id: string | null
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          rating: number
          service_id?: string | null
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string | null
          rating?: number
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          price_unit: string | null
          provider_id: string
          rating: number | null
          reviews_count: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          price_unit?: string | null
          provider_id: string
          rating?: number | null
          reviews_count?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          price_unit?: string | null
          provider_id?: string
          rating?: number | null
          reviews_count?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      vendors: {
        Row: {
          banner_url: string | null
          city: string | null
          contact_email: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          owner_id: string
          rating: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shop_name: string
          slug: string
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          owner_id: string
          rating?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_name: string
          slug: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          owner_id?: string
          rating?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shop_name?: string
          slug?: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          full_name: string | null
          id: string | null
          provider_skills: string | null
          provider_status: Database["public"]["Enums"]["provider_status"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          full_name?: string | null
          id?: string | null
          provider_skills?: string | null
          provider_status?:
            | Database["public"]["Enums"]["provider_status"]
            | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          full_name?: string | null
          id?: string | null
          provider_skills?: string | null
          provider_status?:
            | Database["public"]["Enums"]["provider_status"]
            | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_set_provider_status: {
        Args: {
          _reason?: string
          _status: Database["public"]["Enums"]["provider_status"]
          _user_id: string
        }
        Returns: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          contact_email: string | null
          created_at: string
          default_address: string | null
          default_phone: string | null
          full_name: string | null
          id: string
          phone: string | null
          provider_applied_at: string | null
          provider_rejection_reason: string | null
          provider_reviewed_at: string | null
          provider_reviewed_by: string | null
          provider_skills: string | null
          provider_status: Database["public"]["Enums"]["provider_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_vendor_status: {
        Args: {
          _reason?: string
          _status: Database["public"]["Enums"]["approval_status"]
          _vendor_id: string
        }
        Returns: {
          banner_url: string | null
          city: string | null
          contact_email: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          owner_id: string
          rating: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          shop_name: string
          slug: string
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "vendors"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_as_provider:
        | {
            Args: {
              _bio?: string
              _city?: string
              _phone?: string
              _skills: string
            }
            Returns: {
              avatar_url: string | null
              bio: string | null
              city: string | null
              contact_email: string | null
              created_at: string
              default_address: string | null
              default_phone: string | null
              full_name: string | null
              id: string
              phone: string | null
              provider_applied_at: string | null
              provider_rejection_reason: string | null
              provider_reviewed_at: string | null
              provider_reviewed_by: string | null
              provider_skills: string | null
              provider_status: Database["public"]["Enums"]["provider_status"]
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "profiles"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              _bio?: string
              _city?: string
              _email?: string
              _phone?: string
              _skills: string
            }
            Returns: {
              avatar_url: string | null
              bio: string | null
              city: string | null
              contact_email: string | null
              created_at: string
              default_address: string | null
              default_phone: string | null
              full_name: string | null
              id: string
              phone: string | null
              provider_applied_at: string | null
              provider_rejection_reason: string | null
              provider_reviewed_at: string | null
              provider_reviewed_by: string | null
              provider_skills: string | null
              provider_status: Database["public"]["Enums"]["provider_status"]
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "profiles"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_provider: { Args: { _user_id: string }; Returns: boolean }
      is_approved_vendor: { Args: { _vendor_id: string }; Returns: boolean }
      is_convo_participant: {
        Args: { _convo_id: string; _user_id: string }
        Returns: boolean
      }
      is_order_vendor: {
        Args: { _order_id: string; _user_id: string }
        Returns: boolean
      }
      notify_admins: {
        Args: {
          _body: string
          _link: string
          _metadata: Json
          _title: string
          _type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "provider" | "vendor" | "admin"
      approval_status: "pending" | "approved" | "rejected"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      listing_type: "service" | "product"
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
      provider_status: "none" | "pending" | "approved" | "rejected"
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
      app_role: ["customer", "provider", "vendor", "admin"],
      approval_status: ["pending", "approved", "rejected"],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      listing_type: ["service", "product"],
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      provider_status: ["none", "pending", "approved", "rejected"],
    },
  },
} as const
