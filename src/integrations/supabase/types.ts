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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          tweet_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tweet_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          tweet_id?: string
          user_id?: string
        }
        Relationships: []
      }
      dm_conversations: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      dm_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
          text: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          read: boolean
          tweet_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          read?: boolean
          tweet_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          read?: boolean
          tweet_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_reports: {
        Row: {
          created_at: string
          details: string
          id: string
          post_id: string
          reason: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          post_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          post_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          post_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accent: string | null
          bio: string | null
          cover_photo_url: string | null
          created_at: string
          followers: string[]
          following: string[]
          id: string
          location: string | null
          name: string
          photo_url: string
          pinned_tweet: string | null
          theme: string | null
          total_photos: number
          total_tweets: number
          updated_at: string | null
          username: string
          verified: boolean
          website: string | null
        }
        Insert: {
          accent?: string | null
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string
          followers?: string[]
          following?: string[]
          id: string
          location?: string | null
          name?: string
          photo_url?: string
          pinned_tweet?: string | null
          theme?: string | null
          total_photos?: number
          total_tweets?: number
          updated_at?: string | null
          username: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          accent?: string | null
          bio?: string | null
          cover_photo_url?: string | null
          created_at?: string
          followers?: string[]
          following?: string[]
          id?: string
          location?: string | null
          name?: string
          photo_url?: string
          pinned_tweet?: string | null
          theme?: string | null
          total_photos?: number
          total_tweets?: number
          updated_at?: string | null
          username?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      tweets: {
        Row: {
          created_at: string
          created_by: string
          edited_at: string | null
          id: string
          images: Json | null
          parent_id: string | null
          parent_username: string | null
          reply_permission: string
          text: string | null
          updated_at: string | null
          user_likes: string[]
          user_replies: number
          user_retweets: string[]
        }
        Insert: {
          created_at?: string
          created_by: string
          edited_at?: string | null
          id?: string
          images?: Json | null
          parent_id?: string | null
          parent_username?: string | null
          reply_permission?: string
          text?: string | null
          updated_at?: string | null
          user_likes?: string[]
          user_replies?: number
          user_retweets?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string
          edited_at?: string | null
          id?: string
          images?: Json | null
          parent_id?: string | null
          parent_username?: string | null
          reply_permission?: string
          text?: string | null
          updated_at?: string | null
          user_likes?: string[]
          user_replies?: number
          user_retweets?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "tweets_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          created_at: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          target_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_mutes: {
        Row: {
          created_at: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          target_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          likes: string[]
          tweets: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          likes?: string[]
          tweets?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          likes?: string[]
          tweets?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_reply_to_post: { Args: { p_post_id: string }; Returns: boolean }
      create_tweet: {
        Args: { p_images: Json; p_parent_id: string; p_text: string }
        Returns: {
          created_at: string
          created_by: string
          edited_at: string | null
          id: string
          images: Json | null
          parent_id: string | null
          parent_username: string | null
          reply_permission: string
          text: string | null
          updated_at: string | null
          user_likes: string[]
          user_replies: number
          user_retweets: string[]
        }
        SetofOptions: {
          from: "*"
          to: "tweets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_conversations: {
        Args: never
        Returns: {
          conversation_id: string
          last_created_at: string
          last_text: string
          other_id: string
          other_name: string
          other_photo_url: string
          other_username: string
          unread: number
        }[]
      }
      get_post_analytics: { Args: { p_post_id?: string }; Returns: Json }
      get_public_post_activity: { Args: { p_post_id: string }; Returns: Json }
      get_suggested_users: {
        Args: { p_limit: number; p_seed: string }
        Returns: {
          accent: string | null
          bio: string | null
          cover_photo_url: string | null
          created_at: string
          followers: string[]
          following: string[]
          id: string
          location: string | null
          name: string
          photo_url: string
          pinned_tweet: string | null
          theme: string | null
          total_photos: number
          total_tweets: number
          updated_at: string | null
          username: string
          verified: boolean
          website: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_conversation_participant: { Args: { c: string }; Returns: boolean }
      manage_like: {
        Args: { p_like: boolean; p_tweet_id: string }
        Returns: undefined
      }
      manage_reply: {
        Args: { p_increment: boolean; p_tweet_id: string }
        Returns: undefined
      }
      manage_retweet: {
        Args: { p_retweet: boolean; p_tweet_id: string }
        Returns: undefined
      }
      record_post_view: { Args: { p_post_id: string }; Returns: undefined }
      username_taken: { Args: { p_username: string }; Returns: boolean }
      users_blocked: { Args: { a: string; b: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
