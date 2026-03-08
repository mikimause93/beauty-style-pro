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
      ad_campaigns: {
        Row: {
          active: boolean
          advertiser_id: string
          budget: number
          campaign_type: string
          clicks: number
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          impressions: number
          spent: number
          start_date: string
          target_url: string | null
          title: string
        }
        Insert: {
          active?: boolean
          advertiser_id: string
          budget?: number
          campaign_type?: string
          clicks?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          spent?: number
          start_date?: string
          target_url?: string | null
          title: string
        }
        Update: {
          active?: boolean
          advertiser_id?: string
          budget?: number
          campaign_type?: string
          clicks?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          spent?: number
          start_date?: string
          target_url?: string | null
          title?: string
        }
        Relationships: []
      }
      ar_filters: {
        Row: {
          active: boolean
          category: string
          created_at: string
          creator_id: string | null
          description: string | null
          featured: boolean
          filter_data: Json
          id: string
          name: string
          preview_image: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          creator_id?: string | null
          description?: string | null
          featured?: boolean
          filter_data?: Json
          id?: string
          name: string
          preview_image: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          creator_id?: string | null
          description?: string | null
          featured?: boolean
          filter_data?: Json
          id?: string
          name?: string
          preview_image?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      badges: {
        Row: {
          category: string
          created_at: string
          criteria: Json | null
          description: string
          icon: string
          id: string
          name: string
          rarity: string
        }
        Insert: {
          category: string
          created_at?: string
          criteria?: Json | null
          description: string
          icon: string
          id?: string
          name: string
          rarity?: string
        }
        Update: {
          category?: string
          created_at?: string
          criteria?: Json | null
          description?: string
          icon?: string
          id?: string
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      battle_votes: {
        Row: {
          battle_id: string
          created_at: string
          id: string
          qr_coin_amount: number
          user_id: string
          voted_for: string
        }
        Insert: {
          battle_id: string
          created_at?: string
          id?: string
          qr_coin_amount?: number
          user_id: string
          voted_for: string
        }
        Update: {
          battle_id?: string
          created_at?: string
          id?: string
          qr_coin_amount?: number
          user_id?: string
          voted_for?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_votes_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "live_battles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          client_id: string
          created_at: string
          end_time: string | null
          id: string
          notes: string | null
          professional_id: string
          service_id: string | null
          start_time: string
          status: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          booking_date: string
          client_id: string
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          professional_id: string
          service_id?: string | null
          start_time: string
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          booking_date?: string
          client_id?: string
          created_at?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          professional_id?: string
          service_id?: string | null
          start_time?: string
          status?: string
          total_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          active: boolean | null
          address: string | null
          bio: string | null
          branding_theme: Json | null
          business_name: string
          business_type: string
          categories: string[] | null
          certifications: Json | null
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          documents: Json | null
          email: string | null
          employee_count: number | null
          facebook: string | null
          featured: boolean | null
          id: string
          instagram: string | null
          latitude: number | null
          legal_name: string
          logo_url: string | null
          longitude: number | null
          metadata: Json | null
          phone: string | null
          rating: number | null
          review_count: number | null
          slug: string
          tax_code: string | null
          updated_at: string
          user_id: string
          vat_number: string
          verification_status: string | null
          verified: boolean | null
          website: string | null
          working_hours: Json | null
          zip_code: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          bio?: string | null
          branding_theme?: Json | null
          business_name: string
          business_type?: string
          categories?: string[] | null
          certifications?: Json | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          documents?: Json | null
          email?: string | null
          employee_count?: number | null
          facebook?: string | null
          featured?: boolean | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          legal_name: string
          logo_url?: string | null
          longitude?: number | null
          metadata?: Json | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          slug: string
          tax_code?: string | null
          updated_at?: string
          user_id: string
          vat_number: string
          verification_status?: string | null
          verified?: boolean | null
          website?: string | null
          working_hours?: Json | null
          zip_code?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          bio?: string | null
          branding_theme?: Json | null
          business_name?: string
          business_type?: string
          categories?: string[] | null
          certifications?: Json | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          documents?: Json | null
          email?: string | null
          employee_count?: number | null
          facebook?: string | null
          featured?: boolean | null
          id?: string
          instagram?: string | null
          latitude?: number | null
          legal_name?: string
          logo_url?: string | null
          longitude?: number | null
          metadata?: Json | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string
          tax_code?: string | null
          updated_at?: string
          user_id?: string
          vat_number?: string
          verification_status?: string | null
          verified?: boolean | null
          website?: string | null
          working_hours?: Json | null
          zip_code?: string | null
        }
        Relationships: []
      }
      challenge_donations: {
        Row: {
          amount: number
          challenge_id: string
          created_at: string
          donor_id: string
          id: string
          message: string | null
        }
        Insert: {
          amount?: number
          challenge_id: string
          created_at?: string
          donor_id: string
          id?: string
          message?: string | null
        }
        Update: {
          amount?: number
          challenge_id?: string
          created_at?: string
          donor_id?: string
          id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_donations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "transformation_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participations: {
        Row: {
          challenge_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          reward_claimed: boolean | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          reward_claimed?: boolean | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          reward_claimed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_votes: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          user_id: string
          vote_type?: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_votes_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "transformation_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          active: boolean | null
          challenge_type: string
          created_at: string
          description: string
          end_date: string
          featured: boolean | null
          icon: string | null
          id: string
          reward_badge: string | null
          reward_qr_coin: number
          start_date: string
          target_value: number
          title: string
        }
        Insert: {
          active?: boolean | null
          challenge_type: string
          created_at?: string
          description: string
          end_date: string
          featured?: boolean | null
          icon?: string | null
          id?: string
          reward_badge?: string | null
          reward_qr_coin?: number
          start_date: string
          target_value: number
          title: string
        }
        Update: {
          active?: boolean | null
          challenge_type?: string
          created_at?: string
          description?: string
          end_date?: string
          featured?: boolean | null
          icon?: string | null
          id?: string
          reward_badge?: string | null
          reward_qr_coin?: number
          start_date?: string
          target_value?: number
          title?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          created_at: string
          id: string
          message: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          attended: boolean | null
          event_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          attended?: boolean | null
          event_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          attended?: boolean | null
          event_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cover_image: string | null
          created_at: string
          creator_id: string
          description: string
          end_date: string
          event_type: string
          id: string
          is_online: boolean | null
          location: string | null
          max_participants: number | null
          participant_count: number | null
          price: number | null
          start_date: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          creator_id: string
          description: string
          end_date: string
          event_type: string
          id?: string
          is_online?: boolean | null
          location?: string | null
          max_participants?: number | null
          participant_count?: number | null
          price?: number | null
          start_date: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          creator_id?: string
          description?: string
          end_date?: string
          event_type?: string
          id?: string
          is_online?: boolean | null
          location?: string | null
          max_participants?: number | null
          participant_count?: number | null
          price?: number | null
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          ai_analysis: Json | null
          ai_match_score: number | null
          ai_recommended: boolean | null
          applicant_id: string
          cover_letter: string | null
          created_at: string
          cv_url: string | null
          employer_notes: string | null
          id: string
          interview_date: string | null
          job_post_id: string
          metadata: Json | null
          portfolio_urls: string[] | null
          rejection_reason: string | null
          responded_at: string | null
          status: string | null
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_match_score?: number | null
          ai_recommended?: boolean | null
          applicant_id: string
          cover_letter?: string | null
          created_at?: string
          cv_url?: string | null
          employer_notes?: string | null
          id?: string
          interview_date?: string | null
          job_post_id: string
          metadata?: Json | null
          portfolio_urls?: string[] | null
          rejection_reason?: string | null
          responded_at?: string | null
          status?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_match_score?: number | null
          ai_recommended?: boolean | null
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string
          cv_url?: string | null
          employer_notes?: string | null
          id?: string
          interview_date?: string | null
          job_post_id?: string
          metadata?: Json | null
          portfolio_urls?: string[] | null
          rejection_reason?: string | null
          responded_at?: string | null
          status?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_post_id_fkey"
            columns: ["job_post_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_posts: {
        Row: {
          application_count: number | null
          benefits: string[] | null
          business_id: string | null
          category: string
          created_at: string
          description: string
          employment_type: string
          expiration_date: string
          featured: boolean | null
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          metadata: Json | null
          professional_id: string | null
          required_skills: string[] | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          application_count?: number | null
          benefits?: string[] | null
          business_id?: string | null
          category: string
          created_at?: string
          description: string
          employment_type: string
          expiration_date: string
          featured?: boolean | null
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          metadata?: Json | null
          professional_id?: string | null
          required_skills?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          application_count?: number | null
          benefits?: string[] | null
          business_id?: string | null
          category?: string
          created_at?: string
          description?: string
          employment_type?: string
          expiration_date?: string
          featured?: boolean | null
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          metadata?: Json | null
          professional_id?: string | null
          required_skills?: string[] | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_posts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          created_at: string
          id: string
          leaderboard_type: string
          metadata: Json | null
          period: string
          rank: number | null
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leaderboard_type: string
          metadata?: Json | null
          period?: string
          rank?: number | null
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leaderboard_type?: string
          metadata?: Json | null
          period?: string
          rank?: number | null
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      live_battles: {
        Row: {
          category: string | null
          created_at: string
          ended_at: string | null
          host_a_id: string
          host_a_name: string
          host_a_thumbnail: string | null
          host_b_id: string
          host_b_name: string
          host_b_thumbnail: string | null
          id: string
          prize_pool: number
          score_a: number
          score_b: number
          status: string
          stream_id: string | null
          winner_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          ended_at?: string | null
          host_a_id: string
          host_a_name?: string
          host_a_thumbnail?: string | null
          host_b_id: string
          host_b_name?: string
          host_b_thumbnail?: string | null
          id?: string
          prize_pool?: number
          score_a?: number
          score_b?: number
          status?: string
          stream_id?: string | null
          winner_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          ended_at?: string | null
          host_a_id?: string
          host_a_name?: string
          host_a_thumbnail?: string | null
          host_b_id?: string
          host_b_name?: string
          host_b_thumbnail?: string | null
          id?: string
          prize_pool?: number
          score_a?: number
          score_b?: number
          status?: string
          stream_id?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_battles_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_invites: {
        Row: {
          bonus_awarded: boolean | null
          created_at: string
          id: string
          invited_id: string
          inviter_id: string
          stream_id: string
        }
        Insert: {
          bonus_awarded?: boolean | null
          created_at?: string
          id?: string
          invited_id: string
          inviter_id: string
          stream_id: string
        }
        Update: {
          bonus_awarded?: boolean | null
          created_at?: string
          id?: string
          invited_id?: string
          inviter_id?: string
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_invites_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_polls: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean | null
          options: Json
          question: string
          results: Json
          stream_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question: string
          results?: Json
          stream_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
          results?: Json
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_polls_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          interaction_goal: number | null
          is_public: boolean | null
          max_duration_minutes: number | null
          peak_viewers: number
          professional_id: string | null
          qr_coin_pool: number | null
          replay_cost: number | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          stream_key: string | null
          stream_url: string | null
          thumbnail_url: string | null
          title: string
          total_earnings: number
          total_tips: number
          total_views: number
          updated_at: string
          viewer_count: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          interaction_goal?: number | null
          is_public?: boolean | null
          max_duration_minutes?: number | null
          peak_viewers?: number
          professional_id?: string | null
          qr_coin_pool?: number | null
          replay_cost?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          stream_key?: string | null
          stream_url?: string | null
          thumbnail_url?: string | null
          title: string
          total_earnings?: number
          total_tips?: number
          total_views?: number
          updated_at?: string
          viewer_count?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          interaction_goal?: number | null
          is_public?: boolean | null
          max_duration_minutes?: number | null
          peak_viewers?: number
          professional_id?: string | null
          qr_coin_pool?: number | null
          replay_cost?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          stream_key?: string | null
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string
          total_earnings?: number
          total_tips?: number
          total_views?: number
          updated_at?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          message_type: string | null
          read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          message_type?: string | null
          read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          message_type?: string | null
          read?: boolean | null
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
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      playlists: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          station_id: string | null
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          station_id?: string | null
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          station_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "radio_stations"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "live_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          caption: string | null
          comment_count: number
          created_at: string
          id: string
          image_url: string | null
          like_count: number
          post_type: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          caption?: string | null
          comment_count?: number
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number
          post_type?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          caption?: string | null
          comment_count?: number
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number
          post_type?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          rating: number | null
          review_count: number | null
          seller_id: string
          stock: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          rating?: number | null
          review_count?: number | null
          seller_id: string
          stock?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          rating?: number | null
          review_count?: number | null
          seller_id?: string
          stock?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      professionals: {
        Row: {
          address: string | null
          business_name: string
          city: string | null
          created_at: string
          description: string | null
          hourly_rate: number | null
          id: string
          is_verified: boolean | null
          rating: number | null
          review_count: number | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name: string
          city?: string | null
          created_at?: string
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean | null
          rating?: number | null
          review_count?: number | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string | null
          created_at?: string
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean | null
          rating?: number | null
          review_count?: number | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          availability: Json | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          cv_url: string | null
          desired_categories: string[] | null
          display_name: string | null
          experience_years: number | null
          follower_count: number
          following_count: number
          id: string
          phone: string | null
          portfolio_urls: string[] | null
          qr_coins: number
          skills: string[] | null
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          availability?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          cv_url?: string | null
          desired_categories?: string[] | null
          display_name?: string | null
          experience_years?: number | null
          follower_count?: number
          following_count?: number
          id?: string
          phone?: string | null
          portfolio_urls?: string[] | null
          qr_coins?: number
          skills?: string[] | null
          updated_at?: string
          user_id: string
          user_type?: string
        }
        Update: {
          availability?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          cv_url?: string | null
          desired_categories?: string[] | null
          display_name?: string | null
          experience_years?: number | null
          follower_count?: number
          following_count?: number
          id?: string
          phone?: string | null
          portfolio_urls?: string[] | null
          qr_coins?: number
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          min_order: number | null
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order?: number | null
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_order?: number | null
          used_count?: number
        }
        Relationships: []
      }
      radio_stations: {
        Row: {
          active: boolean
          cover_image: string | null
          created_at: string
          description: string | null
          featured: boolean
          genre: string
          id: string
          language: string
          listener_count: number
          name: string
          stream_url: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cover_image?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          genre: string
          id?: string
          language?: string
          listener_count?: number
          name: string
          stream_url: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cover_image?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          genre?: string
          id?: string
          language?: string
          listener_count?: number
          name?: string
          stream_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_usage: number | null
          reward_qr_coin: number | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_usage?: number | null
          reward_qr_coin?: number | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_usage?: number | null
          reward_qr_coin?: number | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          claimed_at: string | null
          code_id: string
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          reward_claimed: boolean
        }
        Insert: {
          claimed_at?: string | null
          code_id: string
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          reward_claimed?: boolean
        }
        Update: {
          claimed_at?: string | null
          code_id?: string
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          reward_claimed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          client_id: string
          comment: string | null
          created_at: string
          id: string
          professional_id: string
          rating: number
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          professional_id: string
          rating: number
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          name: string
          price: number
          professional_id: string
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name: string
          price: number
          professional_id: string
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          price?: number
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      spin_results: {
        Row: {
          created_at: string
          id: string
          prize_description: string
          prize_type: string
          prize_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prize_description: string
          prize_type: string
          prize_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prize_description?: string
          prize_type?: string
          prize_value?: number
          user_id?: string
        }
        Relationships: []
      }
      stream_comments: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean
          message: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          message: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          message?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_comments_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_reactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_tips: {
        Row: {
          amount: number
          created_at: string
          id: string
          message: string | null
          stream_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          message?: string | null
          stream_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          message?: string | null
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_tips_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_viewers: {
        Row: {
          badges: string[] | null
          duration: number | null
          id: string
          interaction_score: number | null
          invited_count: number | null
          joined_at: string
          left_at: string | null
          qr_coin_earned: number | null
          stream_id: string
          user_id: string
        }
        Insert: {
          badges?: string[] | null
          duration?: number | null
          id?: string
          interaction_score?: number | null
          invited_count?: number | null
          joined_at?: string
          left_at?: string | null
          qr_coin_earned?: number | null
          stream_id: string
          user_id: string
        }
        Update: {
          badges?: string[] | null
          duration?: number | null
          id?: string
          interaction_score?: number | null
          invited_count?: number | null
          joined_at?: string
          left_at?: string | null
          qr_coin_earned?: number | null
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_viewers_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          accepts_bookings: boolean | null
          active: boolean | null
          avatar: string | null
          business_id: string
          can_manage_bookings: boolean | null
          can_manage_hr: boolean | null
          can_manage_services: boolean | null
          can_manage_team: boolean | null
          can_view_analytics: boolean | null
          created_at: string
          departments: string[] | null
          email: string | null
          id: string
          invited_at: string | null
          live_call_active: boolean | null
          metadata: Json | null
          name: string
          phone: string | null
          position: string | null
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepts_bookings?: boolean | null
          active?: boolean | null
          avatar?: string | null
          business_id: string
          can_manage_bookings?: boolean | null
          can_manage_hr?: boolean | null
          can_manage_services?: boolean | null
          can_manage_team?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string
          departments?: string[] | null
          email?: string | null
          id?: string
          invited_at?: string | null
          live_call_active?: boolean | null
          metadata?: Json | null
          name: string
          phone?: string | null
          position?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepts_bookings?: boolean | null
          active?: boolean | null
          avatar?: string | null
          business_id?: string
          can_manage_bookings?: boolean | null
          can_manage_hr?: boolean | null
          can_manage_services?: boolean | null
          can_manage_team?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string
          departments?: string[] | null
          email?: string | null
          id?: string
          invited_at?: string | null
          live_call_active?: boolean | null
          metadata?: Json | null
          name?: string
          phone?: string | null
          position?: string | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          artist: string
          audio_url: string
          cover_image: string | null
          created_at: string
          duration: number
          id: string
          play_count: number
          playlist_id: string
          title: string
        }
        Insert: {
          artist: string
          audio_url: string
          cover_image?: string | null
          created_at?: string
          duration: number
          id?: string
          play_count?: number
          playlist_id: string
          title: string
        }
        Update: {
          artist?: string
          audio_url?: string
          cover_image?: string | null
          created_at?: string
          duration?: number
          id?: string
          play_count?: number
          playlist_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      transformation_challenges: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          booking_count: number | null
          category: string
          comment_count: number | null
          created_at: string
          creator_id: string
          description: string | null
          estimated_duration: string | null
          estimated_price: number | null
          featured: boolean | null
          id: string
          process_video_url: string | null
          products_used: string[] | null
          qr_coin_received: number | null
          replicable: boolean | null
          status: string | null
          style_name: string | null
          technique: string | null
          title: string
          updated_at: string
          vote_count: number | null
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          booking_count?: number | null
          category?: string
          comment_count?: number | null
          created_at?: string
          creator_id: string
          description?: string | null
          estimated_duration?: string | null
          estimated_price?: number | null
          featured?: boolean | null
          id?: string
          process_video_url?: string | null
          products_used?: string[] | null
          qr_coin_received?: number | null
          replicable?: boolean | null
          status?: string | null
          style_name?: string | null
          technique?: string | null
          title: string
          updated_at?: string
          vote_count?: number | null
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          booking_count?: number | null
          category?: string
          comment_count?: number | null
          created_at?: string
          creator_id?: string
          description?: string | null
          estimated_duration?: string | null
          estimated_price?: number | null
          featured?: boolean | null
          id?: string
          process_video_url?: string | null
          products_used?: string[] | null
          qr_coin_received?: number | null
          replicable?: boolean | null
          status?: string | null
          style_name?: string | null
          technique?: string | null
          title?: string
          updated_at?: string
          vote_count?: number | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          _data?: Json
          _message: string
          _title: string
          _type?: string
          _user_id: string
        }
        Returns: undefined
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
