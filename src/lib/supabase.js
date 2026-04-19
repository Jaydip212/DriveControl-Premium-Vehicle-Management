import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Replace with your actual Supabase URL and Anon Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth Helpers
export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export const signOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
}
