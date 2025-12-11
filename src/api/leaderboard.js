import { supabase } from "./supabaseClient.js";

export async function submitGameSession(sessionData) {
  const { data, error } = await supabase
    .from("game_sessions")
    .insert([sessionData])
    .select();

  if (error) {
    console.error("Failed to insert game session:", error);
  }

  return { data, error };
}
