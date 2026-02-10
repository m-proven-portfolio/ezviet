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
      book_assets: {
        Row: {
          alt_text: string | null
          book_id: string
          created_at: string | null
          dpi: number | null
          file_name: string
          file_size: number | null
          file_type: string
          height: number | null
          id: string
          storage_path: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          book_id: string
          created_at?: string | null
          dpi?: number | null
          file_name: string
          file_size?: number | null
          file_type: string
          height?: number | null
          id?: string
          storage_path: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          book_id?: string
          created_at?: string | null
          dpi?: number | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          height?: number | null
          id?: string
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "book_assets_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_chapters: {
        Row: {
          book_id: string
          content: Json
          created_at: string | null
          id: string
          number: number
          objectives: string[] | null
          subtitle: string | null
          summary: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          book_id: string
          content?: Json
          created_at?: string | null
          id?: string
          number: number
          objectives?: string[] | null
          subtitle?: string | null
          summary?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          book_id?: string
          content?: Json
          created_at?: string | null
          id?: string
          number?: number
          objectives?: string[] | null
          subtitle?: string | null
          summary?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_series: {
        Row: {
          cover_image_path: string | null
          created_at: string | null
          description: string | null
          id: string
          slug: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_path?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_path?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      book_vocabulary_refs: {
        Row: {
          base_text: string | null
          block_id: string | null
          book_id: string
          card_id: string
          chapter_id: string | null
          created_at: string | null
          id: string
          target_text: string | null
        }
        Insert: {
          base_text?: string | null
          block_id?: string | null
          book_id: string
          card_id: string
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          target_text?: string | null
        }
        Update: {
          base_text?: string | null
          block_id?: string | null
          book_id?: string
          card_id?: string
          chapter_id?: string | null
          created_at?: string | null
          id?: string
          target_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_vocabulary_refs_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_vocabulary_refs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_vocabulary_refs_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "book_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          back_matter: Json | null
          base_lang: string
          cover_image_path: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          front_matter: Json | null
          id: string
          isbn: string | null
          level: string
          published_at: string | null
          series_id: string | null
          series_order: number | null
          slug: string
          status: string
          subtitle: string | null
          target_lang: string
          target_region: string | null
          template_id: string
          title: string
          trim_size: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          author?: string
          back_matter?: Json | null
          base_lang?: string
          cover_image_path?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          front_matter?: Json | null
          id?: string
          isbn?: string | null
          level?: string
          published_at?: string | null
          series_id?: string | null
          series_order?: number | null
          slug: string
          status?: string
          subtitle?: string | null
          target_lang?: string
          target_region?: string | null
          template_id?: string
          title: string
          trim_size?: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          author?: string
          back_matter?: Json | null
          base_lang?: string
          cover_image_path?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          front_matter?: Json | null
          id?: string
          isbn?: string | null
          level?: string
          published_at?: string | null
          series_id?: string | null
          series_order?: number | null
          slug?: string
          status?: string
          subtitle?: string | null
          target_lang?: string
          target_region?: string | null
          template_id?: string
          title?: string
          trim_size?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "book_series"
            referencedColumns: ["id"]
          },
        ]
      }
      card_queue: {
        Row: {
          card_id: string | null
          category_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          english: string
          id: string
          notes: string | null
          status: string | null
          vietnamese: string
        }
        Insert: {
          card_id?: string | null
          category_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          english: string
          id?: string
          notes?: string | null
          status?: string | null
          vietnamese: string
        }
        Update: {
          card_id?: string | null
          category_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          english?: string
          id?: string
          notes?: string | null
          status?: string | null
          vietnamese?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_queue_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_queue_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_queue_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_songs: {
        Row: {
          album: string | null
          artist: string | null
          card_id: string
          cover_image_path: string | null
          created_at: string | null
          duration_seconds: number | null
          file_size: number | null
          genre: string | null
          genres: string[] | null
          id: string
          is_primary: boolean | null
          learning_goal: string | null
          level: number | null
          lyrics_enhanced: Json | null
          lyrics_lrc: string | null
          lyrics_plain: string | null
          mime_type: string | null
          parent_song_id: string | null
          purpose: string | null
          slug: string
          sort_order: number | null
          storage_path: string
          timing_offset: number | null
          title: string
          updated_at: string | null
          variation_label: string | null
          year: number | null
        }
        Insert: {
          album?: string | null
          artist?: string | null
          card_id: string
          cover_image_path?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          genre?: string | null
          genres?: string[] | null
          id?: string
          is_primary?: boolean | null
          learning_goal?: string | null
          level?: number | null
          lyrics_enhanced?: Json | null
          lyrics_lrc?: string | null
          lyrics_plain?: string | null
          mime_type?: string | null
          parent_song_id?: string | null
          purpose?: string | null
          slug: string
          sort_order?: number | null
          storage_path: string
          timing_offset?: number | null
          title: string
          updated_at?: string | null
          variation_label?: string | null
          year?: number | null
        }
        Update: {
          album?: string | null
          artist?: string | null
          card_id?: string
          cover_image_path?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          genre?: string | null
          genres?: string[] | null
          id?: string
          is_primary?: boolean | null
          learning_goal?: string | null
          level?: number | null
          lyrics_enhanced?: Json | null
          lyrics_lrc?: string | null
          lyrics_plain?: string | null
          mime_type?: string | null
          parent_song_id?: string | null
          purpose?: string | null
          slug?: string
          sort_order?: number | null
          storage_path?: string
          timing_offset?: number | null
          title?: string
          updated_at?: string | null
          variation_label?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "card_songs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_songs_parent_song_id_fkey"
            columns: ["parent_song_id"]
            isOneToOne: false
            referencedRelation: "card_songs"
            referencedColumns: ["id"]
          },
        ]
      }
      card_terms: {
        Row: {
          audio_path: string | null
          audio_source: string | null
          card_id: string
          created_at: string | null
          generated_by_ai: boolean | null
          id: string
          ipa: string | null
          lang: string
          phonetic_helper: string | null
          prompt_version: string | null
          region: string | null
          reviewed_by_admin: boolean | null
          romanization: string | null
          text: string
        }
        Insert: {
          audio_path?: string | null
          audio_source?: string | null
          card_id: string
          created_at?: string | null
          generated_by_ai?: boolean | null
          id?: string
          ipa?: string | null
          lang: string
          phonetic_helper?: string | null
          prompt_version?: string | null
          region?: string | null
          reviewed_by_admin?: boolean | null
          romanization?: string | null
          text: string
        }
        Update: {
          audio_path?: string | null
          audio_source?: string | null
          card_id?: string
          created_at?: string | null
          generated_by_ai?: boolean | null
          id?: string
          ipa?: string | null
          lang?: string
          phonetic_helper?: string | null
          prompt_version?: string | null
          region?: string | null
          reviewed_by_admin?: boolean | null
          romanization?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_terms_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          category_id: string | null
          created_at: string | null
          difficulty: number | null
          id: string
          image_path: string
          meta_description: string | null
          show_north: boolean | null
          slug: string
          sort_order: number | null
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          difficulty?: number | null
          id?: string
          image_path: string
          meta_description?: string | null
          show_north?: boolean | null
          slug: string
          sort_order?: number | null
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          difficulty?: number | null
          id?: string
          image_path?: string
          meta_description?: string | null
          show_north?: boolean | null
          slug?: string
          sort_order?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          target_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          target_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          target_count?: number | null
        }
        Relationships: []
      }
      classroom_assignments: {
        Row: {
          classroom_id: string
          content_ids: string[]
          content_type: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          classroom_id: string
          content_ids: string[]
          content_type: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          classroom_id?: string
          content_ids?: string[]
          content_type?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_assignments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_enrollments: {
        Row: {
          classroom_id: string
          enrolled_at: string | null
          id: string
          status: string | null
          student_id: string
        }
        Insert: {
          classroom_id: string
          enrolled_at?: string | null
          id?: string
          status?: string | null
          student_id: string
        }
        Update: {
          classroom_id?: string
          enrolled_at?: string | null
          id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_enrollments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_progress: {
        Row: {
          assignment_id: string
          completed_at: string | null
          content_id: string
          id: string
          progress_data: Json | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          content_id: string
          id?: string
          progress_data?: Json | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          content_id?: string
          id?: string
          progress_data?: Json | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_progress_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "classroom_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_progress_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          join_code: string
          name: string
          settings: Json | null
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          join_code?: string
          name: string
          settings?: Json | null
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          join_code?: string
          name?: string
          settings?: Json | null
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_cards: {
        Row: {
          category_id: string | null
          created_at: string | null
          difficulty: number | null
          generated_by_ai: boolean | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          prompt_used: string | null
          prompt_version: string | null
          scene_image_path: string
          slug: string
          title: string
          title_vi: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          difficulty?: number | null
          generated_by_ai?: boolean | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          prompt_used?: string | null
          prompt_version?: string | null
          scene_image_path: string
          slug: string
          title: string
          title_vi?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          difficulty?: number | null
          generated_by_ai?: boolean | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          prompt_used?: string | null
          prompt_version?: string | null
          scene_image_path?: string
          slug?: string
          title?: string
          title_vi?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_cards_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_lines: {
        Row: {
          audio_path: string | null
          audio_source: string | null
          conversation_card_id: string
          created_at: string | null
          english: string
          id: string
          romanization: string | null
          sort_order: number
          speaker: string
          speaker_vi: string | null
          vietnamese: string
        }
        Insert: {
          audio_path?: string | null
          audio_source?: string | null
          conversation_card_id: string
          created_at?: string | null
          english: string
          id?: string
          romanization?: string | null
          sort_order?: number
          speaker: string
          speaker_vi?: string | null
          vietnamese: string
        }
        Update: {
          audio_path?: string | null
          audio_source?: string | null
          conversation_card_id?: string
          created_at?: string | null
          english?: string
          id?: string
          romanization?: string | null
          sort_order?: number
          speaker?: string
          speaker_vi?: string | null
          vietnamese?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_lines_conversation_card_id_fkey"
            columns: ["conversation_card_id"]
            isOneToOne: false
            referencedRelation: "conversation_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      label_learning_history: {
        Row: {
          attempts: number | null
          best_streak: number | null
          correct_count: number | null
          created_at: string | null
          current_matching_mode: string | null
          ease_factor: number | null
          first_seen_at: string | null
          id: string
          interval_days: number | null
          label_id: string
          label_set_id: string
          last_hints_used: string[] | null
          last_match_type: string | null
          last_reviewed_at: string | null
          last_score: number | null
          last_time_ms: number | null
          next_review_at: string | null
          repetition_count: number | null
          streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          best_streak?: number | null
          correct_count?: number | null
          created_at?: string | null
          current_matching_mode?: string | null
          ease_factor?: number | null
          first_seen_at?: string | null
          id?: string
          interval_days?: number | null
          label_id: string
          label_set_id: string
          last_hints_used?: string[] | null
          last_match_type?: string | null
          last_reviewed_at?: string | null
          last_score?: number | null
          last_time_ms?: number | null
          next_review_at?: string | null
          repetition_count?: number | null
          streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          best_streak?: number | null
          correct_count?: number | null
          created_at?: string | null
          current_matching_mode?: string | null
          ease_factor?: number | null
          first_seen_at?: string | null
          id?: string
          interval_days?: number | null
          label_id?: string
          label_set_id?: string
          last_hints_used?: string[] | null
          last_match_type?: string | null
          last_reviewed_at?: string | null
          last_score?: number | null
          last_time_ms?: number | null
          next_review_at?: string | null
          repetition_count?: number | null
          streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "label_learning_history_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_learning_history_label_set_id_fkey"
            columns: ["label_set_id"]
            isOneToOne: false
            referencedRelation: "label_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_learning_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      label_set_progress: {
        Row: {
          attempts: number | null
          best_score: number | null
          best_time_seconds: number | null
          completed_at: string | null
          first_attempted_at: string | null
          id: string
          label_set_id: string
          labels_attempted: number | null
          labels_correct: number | null
          labels_explored: number | null
          last_attempted_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          best_score?: number | null
          best_time_seconds?: number | null
          completed_at?: string | null
          first_attempted_at?: string | null
          id?: string
          label_set_id: string
          labels_attempted?: number | null
          labels_correct?: number | null
          labels_explored?: number | null
          last_attempted_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          best_score?: number | null
          best_time_seconds?: number | null
          completed_at?: string | null
          first_attempted_at?: string | null
          id?: string
          label_set_id?: string
          labels_attempted?: number | null
          labels_correct?: number | null
          labels_explored?: number | null
          last_attempted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "label_set_progress_label_set_id_fkey"
            columns: ["label_set_id"]
            isOneToOne: false
            referencedRelation: "label_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_set_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      label_sets: {
        Row: {
          category_id: string | null
          created_at: string | null
          created_by: string | null
          default_accent: string | null
          description: string | null
          difficulty: string | null
          id: string
          image_url: string
          instructions: string | null
          intensity_config: Json | null
          is_published: boolean | null
          slug: string
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          default_accent?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url: string
          instructions?: string | null
          intensity_config?: Json | null
          is_published?: boolean | null
          slug: string
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          default_accent?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url?: string
          instructions?: string | null
          intensity_config?: Json | null
          is_published?: boolean | null
          slug?: string
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "label_sets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          accent: string | null
          audio_url: string | null
          card_id: string | null
          created_at: string | null
          english: string
          hints: string[] | null
          id: string
          label_set_id: string
          pronunciation: string | null
          romanization: string | null
          sort_order: number | null
          tts_hint: string | null
          vietnamese: string
          x: number
          y: number
        }
        Insert: {
          accent?: string | null
          audio_url?: string | null
          card_id?: string | null
          created_at?: string | null
          english: string
          hints?: string[] | null
          id?: string
          label_set_id: string
          pronunciation?: string | null
          romanization?: string | null
          sort_order?: number | null
          tts_hint?: string | null
          vietnamese: string
          x: number
          y: number
        }
        Update: {
          accent?: string | null
          audio_url?: string | null
          card_id?: string | null
          created_at?: string | null
          english?: string
          hints?: string[] | null
          id?: string
          label_set_id?: string
          pronunciation?: string | null
          romanization?: string | null
          sort_order?: number | null
          tts_hint?: string | null
          vietnamese?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "labels_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "labels_label_set_id_fkey"
            columns: ["label_set_id"]
            isOneToOne: false
            referencedRelation: "label_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_history: {
        Row: {
          card_id: string
          first_viewed_at: string | null
          id: string
          last_viewed_at: string | null
          mastery_level: number | null
          times_viewed: number | null
          user_id: string
        }
        Insert: {
          card_id: string
          first_viewed_at?: string | null
          id?: string
          last_viewed_at?: string | null
          mastery_level?: number | null
          times_viewed?: number | null
          user_id: string
        }
        Update: {
          card_id?: string
          first_viewed_at?: string | null
          id?: string
          last_viewed_at?: string | null
          mastery_level?: number | null
          times_viewed?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lrc_achievements: {
        Row: {
          achievement_type: string
          earned_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_type: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_type?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lrc_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lrc_contributors: {
        Row: {
          accuracy_rate: number
          best_streak: number
          created_at: string
          id: string
          level: number
          lines_synced: number
          songs_synced: number
          total_points: number
          trust_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_rate?: number
          best_streak?: number
          created_at?: string
          id?: string
          level?: number
          lines_synced?: number
          songs_synced?: number
          total_points?: number
          trust_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_rate?: number
          best_streak?: number
          created_at?: string
          id?: string
          level?: number
          lines_synced?: number
          songs_synced?: number
          total_points?: number
          trust_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lrc_contributors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lrc_edits: {
        Row: {
          context_after: Json | null
          context_before: Json | null
          created_at: string
          delta_magnitude: number | null
          edit_type: string
          id: string
          line_index: number
          new_text: string | null
          new_timestamp: number | null
          original_text: string | null
          original_timestamp: number | null
          song_id: string
          submission_id: string | null
          user_id: string
        }
        Insert: {
          context_after?: Json | null
          context_before?: Json | null
          created_at?: string
          delta_magnitude?: number | null
          edit_type: string
          id?: string
          line_index: number
          new_text?: string | null
          new_timestamp?: number | null
          original_text?: string | null
          original_timestamp?: number | null
          song_id: string
          submission_id?: string | null
          user_id: string
        }
        Update: {
          context_after?: Json | null
          context_before?: Json | null
          created_at?: string
          delta_magnitude?: number | null
          edit_type?: string
          id?: string
          line_index?: number
          new_text?: string | null
          new_timestamp?: number | null
          original_text?: string | null
          original_timestamp?: number | null
          song_id?: string
          submission_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lrc_edits_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "card_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrc_edits_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "lrc_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrc_edits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lrc_review_queue: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          created_at: string
          escalated_by: string | null
          escalation_reason: string | null
          id: string
          lines_changed: number
          negative_vote_ratio: number
          priority_score: number
          queue_status: string
          submission_id: string
          submitter_trust_score: number
          updated_at: string
          vote_count: number
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string
          escalated_by?: string | null
          escalation_reason?: string | null
          id?: string
          lines_changed?: number
          negative_vote_ratio?: number
          priority_score?: number
          queue_status?: string
          submission_id: string
          submitter_trust_score?: number
          updated_at?: string
          vote_count?: number
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string
          escalated_by?: string | null
          escalation_reason?: string | null
          id?: string
          lines_changed?: number
          negative_vote_ratio?: number
          priority_score?: number
          queue_status?: string
          submission_id?: string
          submitter_trust_score?: number
          updated_at?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "lrc_review_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrc_review_queue_escalated_by_fkey"
            columns: ["escalated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrc_review_queue_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "lrc_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      lrc_submissions: {
        Row: {
          accuracy_score: number | null
          auto_approved: boolean | null
          best_streak: number
          created_at: string
          id: string
          impact_score: number | null
          lines_changed: number | null
          lines_count: number
          points_earned: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          song_id: string
          status: string
          submission_type: string | null
          timing_data: Json
          user_id: string
          user_rating: string | null
        }
        Insert: {
          accuracy_score?: number | null
          auto_approved?: boolean | null
          best_streak?: number
          created_at?: string
          id?: string
          impact_score?: number | null
          lines_changed?: number | null
          lines_count?: number
          points_earned?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          song_id: string
          status?: string
          submission_type?: string | null
          timing_data: Json
          user_id: string
          user_rating?: string | null
        }
        Update: {
          accuracy_score?: number | null
          auto_approved?: boolean | null
          best_streak?: number
          created_at?: string
          id?: string
          impact_score?: number | null
          lines_changed?: number | null
          lines_count?: number
          points_earned?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          song_id?: string
          status?: string
          submission_type?: string | null
          timing_data?: Json
          user_id?: string
          user_rating?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lrc_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrc_submissions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "card_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrc_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lrc_version_history: {
        Row: {
          change_summary: string | null
          change_type: string
          changed_by: string
          cloned_from_song_id: string | null
          created_at: string
          id: string
          lyrics_lrc: string
          song_id: string
          submission_id: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          change_type: string
          changed_by: string
          cloned_from_song_id?: string | null
          created_at?: string
          id?: string
          lyrics_lrc: string
          song_id: string
          submission_id?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          change_type?: string
          changed_by?: string
          cloned_from_song_id?: string | null
          created_at?: string
          id?: string
          lyrics_lrc?: string
          song_id?: string
          submission_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "lrc_version_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrc_version_history_cloned_from_song_id_fkey"
            columns: ["cloned_from_song_id"]
            isOneToOne: false
            referencedRelation: "card_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrc_version_history_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "card_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrc_version_history_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "lrc_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      lrc_votes: {
        Row: {
          accuracy_score_at_vote: number | null
          created_at: string
          edit_submission_id: string | null
          id: string
          song_id: string
          user_id: string
          vote_date: string
          vote_type: string
        }
        Insert: {
          accuracy_score_at_vote?: number | null
          created_at?: string
          edit_submission_id?: string | null
          id?: string
          song_id: string
          user_id: string
          vote_date?: string
          vote_type: string
        }
        Update: {
          accuracy_score_at_vote?: number | null
          created_at?: string
          edit_submission_id?: string | null
          id?: string
          song_id?: string
          user_id?: string
          vote_date?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lrc_votes_edit_submission_id_fkey"
            columns: ["edit_submission_id"]
            isOneToOne: false
            referencedRelation: "lrc_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrc_votes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "card_songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lrc_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cards_mastered: number | null
          cards_viewed: number | null
          created_at: string | null
          current_streak: number | null
          display_name: string | null
          email: string | null
          experience_level: string | null
          first_seen_at: string | null
          id: string
          is_admin: boolean | null
          is_moderator: boolean | null
          last_active_at: string | null
          learning_goal: string | null
          longest_streak: number | null
          onboarding_completed: boolean | null
          subscription_tier: string | null
          total_sessions: number | null
          updated_at: string | null
          username: string
          vip_expires_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cards_mastered?: number | null
          cards_viewed?: number | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          email?: string | null
          experience_level?: string | null
          first_seen_at?: string | null
          id: string
          is_admin?: boolean | null
          is_moderator?: boolean | null
          last_active_at?: string | null
          learning_goal?: string | null
          longest_streak?: number | null
          onboarding_completed?: boolean | null
          subscription_tier?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          username: string
          vip_expires_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cards_mastered?: number | null
          cards_viewed?: number | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          email?: string | null
          experience_level?: string | null
          first_seen_at?: string | null
          id?: string
          is_admin?: boolean | null
          is_moderator?: boolean | null
          last_active_at?: string | null
          learning_goal?: string | null
          longest_streak?: number | null
          onboarding_completed?: boolean | null
          subscription_tier?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          username?: string
          vip_expires_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tone_exercises: {
        Row: {
          base_word: string
          created_at: string
          difficulty: number
          id: string
          is_active: boolean
          tone_variants: Json
          updated_at: string
        }
        Insert: {
          base_word: string
          created_at?: string
          difficulty?: number
          id?: string
          is_active?: boolean
          tone_variants: Json
          updated_at?: string
        }
        Update: {
          base_word?: string
          created_at?: string
          difficulty?: number
          id?: string
          is_active?: boolean
          tone_variants?: Json
          updated_at?: string
        }
        Relationships: []
      }
      tone_gym_progress: {
        Row: {
          best_streak: number
          correct_answers: number
          created_at: string
          current_difficulty: number
          current_streak: number
          id: string
          last_practiced_at: string | null
          pair_accuracy: Json
          tone_accuracy: Json
          total_exercises: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          correct_answers?: number
          created_at?: string
          current_difficulty?: number
          current_streak?: number
          id?: string
          last_practiced_at?: string | null
          pair_accuracy?: Json
          tone_accuracy?: Json
          total_exercises?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          correct_answers?: number
          created_at?: string
          current_difficulty?: number
          current_streak?: number
          id?: string
          last_practiced_at?: string | null
          pair_accuracy?: Json
          tone_accuracy?: Json
          total_exercises?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tone_gym_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          cards_viewed: number | null
          created_at: string | null
          device_type: string | null
          ended_at: string | null
          id: string
          last_activity_at: string
          pages_visited: number | null
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          cards_viewed?: number | null
          created_at?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          last_activity_at?: string
          pages_visited?: number | null
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          cards_viewed?: number | null
          created_at?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          last_activity_at?: string
          pages_visited?: number | null
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vq_levels: {
        Row: {
          base_dong_reward: number | null
          created_at: string | null
          description: string | null
          energy_cost: number | null
          id: string
          level_data: Json
          level_number: number
          slug: string
          status: string | null
          title_en: string
          title_vi: string
          updated_at: string | null
          version: number | null
          world_id: string
        }
        Insert: {
          base_dong_reward?: number | null
          created_at?: string | null
          description?: string | null
          energy_cost?: number | null
          id?: string
          level_data: Json
          level_number: number
          slug: string
          status?: string | null
          title_en: string
          title_vi: string
          updated_at?: string | null
          version?: number | null
          world_id: string
        }
        Update: {
          base_dong_reward?: number | null
          created_at?: string | null
          description?: string | null
          energy_cost?: number | null
          id?: string
          level_data?: Json
          level_number?: number
          slug?: string
          status?: string | null
          title_en?: string
          title_vi?: string
          updated_at?: string | null
          version?: number | null
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vq_levels_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "vq_worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      vq_player_stats: {
        Row: {
          created_at: string | null
          current_energy: number | null
          current_streak: number | null
          current_world_id: string | null
          energy_last_regen: string | null
          id: string
          levels_completed: number | null
          longest_streak: number | null
          max_energy: number | null
          total_conversations: number | null
          total_dong: number | null
          translator_uses_total: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_energy?: number | null
          current_streak?: number | null
          current_world_id?: string | null
          energy_last_regen?: string | null
          id?: string
          levels_completed?: number | null
          longest_streak?: number | null
          max_energy?: number | null
          total_conversations?: number | null
          total_dong?: number | null
          translator_uses_total?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_energy?: number | null
          current_streak?: number | null
          current_world_id?: string | null
          energy_last_regen?: string | null
          id?: string
          levels_completed?: number | null
          longest_streak?: number | null
          max_energy?: number | null
          total_conversations?: number | null
          total_dong?: number | null
          translator_uses_total?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vq_player_stats_current_world_id_fkey"
            columns: ["current_world_id"]
            isOneToOne: false
            referencedRelation: "vq_worlds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vq_player_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vq_progress: {
        Row: {
          best_score: number | null
          checkpoint_data: Json | null
          choices_made: Json | null
          completed_at: string | null
          dong_earned: number | null
          id: string
          last_played_at: string | null
          level_id: string
          started_at: string | null
          status: string | null
          translator_uses: number | null
          user_id: string
        }
        Insert: {
          best_score?: number | null
          checkpoint_data?: Json | null
          choices_made?: Json | null
          completed_at?: string | null
          dong_earned?: number | null
          id?: string
          last_played_at?: string | null
          level_id: string
          started_at?: string | null
          status?: string | null
          translator_uses?: number | null
          user_id: string
        }
        Update: {
          best_score?: number | null
          checkpoint_data?: Json | null
          choices_made?: Json | null
          completed_at?: string | null
          dong_earned?: number | null
          id?: string
          last_played_at?: string | null
          level_id?: string
          started_at?: string | null
          status?: string | null
          translator_uses?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vq_progress_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "vq_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vq_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vq_worlds: {
        Row: {
          cover_image_path: string | null
          created_at: string | null
          description: string | null
          difficulty: number | null
          id: string
          is_active: boolean | null
          name_en: string
          name_vi: string
          slug: string
          sort_order: number | null
          unlock_requirements: Json | null
          updated_at: string | null
        }
        Insert: {
          cover_image_path?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: number | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_vi: string
          slug: string
          sort_order?: number | null
          unlock_requirements?: Json | null
          updated_at?: string | null
        }
        Update: {
          cover_image_path?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: number | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_vi?: string
          slug?: string
          sort_order?: number | null
          unlock_requirements?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_energy_regen: {
        Args: {
          p_current_energy: number
          p_last_regen: string
          p_max_energy: number
        }
        Returns: number
      }
      end_user_session: { Args: { p_session_id: string }; Returns: undefined }
      generate_join_code: { Args: never; Returns: string }
      get_admin_stats: { Args: never; Returns: Json }
      get_assignment_completion_stats: {
        Args: { p_assignment_id: string }
        Returns: {
          completed_count: number
          completion_percentage: number
          total_students: number
        }[]
      }
      get_classroom_enrollment_count: {
        Args: { p_classroom_id: string }
        Returns: number
      }
      get_daily_active_users: {
        Args: { p_days_back?: number }
        Returns: {
          active_users: number
          activity_date: string
          new_users: number
          returning_users: number
        }[]
      }
      get_retention_cohorts: {
        Args: { p_weeks_back?: number }
        Returns: {
          cohort_week: string
          retained_week_1: number
          retained_week_2: number
          retained_week_3: number
          retained_week_4: number
          total_users: number
        }[]
      }
      get_user_engagement_summary: {
        Args: never
        Returns: {
          active_30_days: number
          active_7_days: number
          active_today: number
          avg_cards_viewed: number
          avg_sessions_per_user: number
          total_users: number
        }[]
      }
      get_user_stats: {
        Args: { p_user_id?: string; p_username?: string }
        Returns: Json
      }
      increment_conversation_view_count: {
        Args: { p_slug: string }
        Returns: undefined
      }
      increment_label_set_view: { Args: { p_slug: string }; Returns: undefined }
      increment_view_count: { Args: { card_slug: string }; Returns: undefined }
      init_vq_player_stats: { Args: { p_user_id: string }; Returns: string }
      name_to_username: { Args: { input_name: string }; Returns: string }
      recalculate_all_user_stats: { Args: never; Returns: undefined }
      record_card_view: {
        Args: { p_card_id: string; p_user_id: string }
        Returns: Json
      }
      record_label_answers: {
        Args: { p_answers: Json; p_label_set_id: string; p_user_id: string }
        Returns: Json
      }
      record_label_quiz_attempt: {
        Args: {
          p_correct: number
          p_label_set_id: string
          p_time_seconds: number
          p_total: number
          p_user_id: string
        }
        Returns: Json
      }
      start_user_session: {
        Args: {
          p_device_type?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      update_label_exploration: {
        Args: {
          p_label_set_id: string
          p_labels_explored: number
          p_user_id: string
        }
        Returns: undefined
      }
      update_session_activity: {
        Args: { p_cards_viewed?: number; p_session_id: string }
        Returns: undefined
      }
      vietnamese_to_slug: { Args: { input_text: string }; Returns: string }
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

// ============================================================================
// Custom Helper Type Aliases
// These provide convenient shortcuts for commonly-used table types
// ============================================================================

/** Category row type */
export type Category = Database['public']['Tables']['categories']['Row'];

/** Card song row type */
export type CardSong = Database['public']['Tables']['card_songs']['Row'];

/** Card queue row type */
export type CardQueue = Database['public']['Tables']['card_queue']['Row'];

/** Profile row type */
export type Profile = Database['public']['Tables']['profiles']['Row'];

/** Card term row type */
export type CardTerm = Database['public']['Tables']['card_terms']['Row'];

/** Card row with its terms joined, optionally with category and songs */
export type CardWithTerms = Database['public']['Tables']['cards']['Row'] & {
  terms: CardTerm[];
  category?: Category | null;
  songs?: CardSong[];
};
