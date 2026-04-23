export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      kid_progress: {
        Row: {
          user_id: string;
          learned_letters: string[];
          learned_numbers: number[];
          completed_words: string[];
          math_high_score: number;
          total_stars: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          learned_letters?: string[];
          learned_numbers?: number[];
          completed_words?: string[];
          math_high_score?: number;
          total_stars?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          learned_letters?: string[];
          learned_numbers?: number[];
          completed_words?: string[];
          math_high_score?: number;
          total_stars?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          theme_preference: 'light' | 'dark';
          hidden_connection_requests: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          theme_preference?: 'light' | 'dark';
          hidden_connection_requests?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          theme_preference?: 'light' | 'dark';
          hidden_connection_requests?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      connections: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          status: 'pending' | 'accepted';
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          status?: 'pending' | 'accepted';
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          status?: 'pending' | 'accepted';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'connections_sender_id_fkey';
            columns: ['sender_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'connections_recipient_id_fkey';
            columns: ['recipient_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      chats: {
        Row: {
          id: string;
          participants: string[];
          updated_at: string;
        };
        Insert: {
          id?: string;
          participants: string[];
          updated_at?: string;
        };
        Update: {
          id?: string;
          participants?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          content: string;
          read_by: string[];
          liked_by: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          content: string;
          read_by?: string[];
          liked_by?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          sender_id?: string;
          content?: string;
          read_by?: string[];
          liked_by?: string[];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_chat_id_fkey';
            columns: ['chat_id'];
            referencedRelation: 'chats';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            referencedRelation: 'user_profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
