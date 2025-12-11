import { supabase } from "./supabaseClient.js";

/**
 * Get aggregated statistics for a specific player.
 * @param {string} playerId - UUID of the player.
 */
export async function fetchPlayerStats(playerId) {
    const { data, error } = await supabase
        .from("game_sessions")
        .select(`
            score,
            play_time
        `)
        .eq("player_id", playerId);

    if (error) console.error("Failed to fetch player stats:", error);

    // Optional: aggregate stats
    if (!error && data.length > 0) {
        const totalGames = data.length;
        const bestScore = Math.max(...data.map(s => s.score));
        const avgScore = Math.round(
            data.reduce((sum, s) => sum + s.score, 0) / totalGames
        );

        return {
            totalGames,
            bestScore,
            avgScore,
            rawSessions: data
        };
    }

    return { totalGames: 0, bestScore: 0, avgScore: 0, rawSessions: [] };
}