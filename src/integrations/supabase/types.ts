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
      live_streams: {
        Row: {
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          peak_viewers: number
          professional_id: string | null
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
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          peak_viewers?: number
          professional_id?: string | null
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
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          peak_viewers?: number
          professional_id?: string | null
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
          duration: number | null
          id: string
          joined_at: string
          left_at: string | null
          stream_id: string
          user_id: string
        }
        Insert: {
          duration?: number | null
          id?: string
          joined_at?: string
          left_at?: string | null
          stream_id: string
          user_id: string
        }
        Update: {
          duration?: number | null
          id?: string
          joined_at?: string
          left_at?: string | null
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
      [_ in never]: never
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
