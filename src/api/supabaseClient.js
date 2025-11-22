import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";

// Supabase client for public use (safe for client-side)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
