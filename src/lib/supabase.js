import { createClient } from '@supabase/supabase-js'
// Kunci publishable aman di browser karena data dilindungi login + RLS. Jangan pernah memakai kunci secret/service_role di sini.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://zobrfumhdpnpmwsdmpyl.supabase.co'
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_bHItQjKGDV8ZWinEM2G-JQ_OdYTmvuI'
export const supabase = createClient(url, key)
