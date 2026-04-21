import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types matching our DB schema
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number: string | null
  created_at: string
}

export interface Event {
  id: string
  creator_id: string
  date: string
  time: string
  location: string
  total_swipes: number
  phone_number: string
  created_at: string
  // Joined fields
  creator?: User
  join_count?: number
}

export interface Join {
  id: string
  event_id: string
  user_id: string
  joined_at: string
}
