import type { Database } from './database';

export type Chat = Database['public']['Tables']['chats']['Row'];
export type ChatInsert = Database['public']['Tables']['chats']['Insert'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export type Connection = Database['public']['Tables']['connections']['Row'];
export type ConnectionInsert = Database['public']['Tables']['connections']['Insert'];
export type ConnectionUpdate = Database['public']['Tables']['connections']['Update'];
