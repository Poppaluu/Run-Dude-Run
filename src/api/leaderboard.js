import { supabase } from "./supabaseClient.js";

/**
 * Create a new anonymous player.
 * @param {string} playerId - UUID stored on client.
 * @param {string} nickname - Chosen by the user.
 */
export async function registerPlayer(playerId, nickname) {
    const { data, error } = await supabase
        .from("players")
        .insert([{ id: playerId, nickname }])
        .select();

    if (error) console.error("Failed to register player:", error);
    return { data, error };
}

/**
 * Store a game session result.
 * @param {Object} sessionData - Gameplay result payload.
 */
export async function submitGameSession(sessionData) {
    const { data, error } = await supabase
        .from("game_sessions")
        .insert([sessionData])
        .select();

    if (error) console.error("Failed to submit session:", error);
    return { data, error };
}

/**
 * Fetch top scores from the leaderboard.
 * @param {number} limit - Number of entries to return.
 */
export async function fetchLeaderboard(limit = 20) {
    const { data, error } = await supabase
        .from("game_sessions")
        .select(
            `
      score,
      created_at,
      players (nickname)
      `
        )
        .order("score", { ascending: false })
        .limit(limit);

    if (error) console.error("Failed to fetch leaderboard:", error);
    return { data, error };
}