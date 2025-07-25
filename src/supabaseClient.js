// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Usa las variables de entorno definidas en .env.local
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
