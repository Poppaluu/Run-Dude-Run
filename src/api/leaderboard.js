import { supabase } from "./supabaseClient.js";

/**
 * Ensure the client has an authenticated session.
 * Uses anonymous auth if there is no session yet.
 * This is required so auth.uid() exists for UPDATE policies.
 */
async function ensureAnonAuth() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error("Failed to get session:", sessionError);
        throw sessionError;
    }
    if (session) return session;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
        console.error("Anonymous sign-in failed:", error);
        throw error;
    }
    return data.session;
}

/**
 * Get the current authenticated user's id (auth.uid()).
 */
async function getAuthedPlayerId() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error("Failed to get user:", error);
        throw error;
    }
    if (!user) {
        throw new Error("No authenticated user. Call ensureAnonAuth() first.");
    }
    return user.id;
}

/**
 * Create or update an anonymous player profile.
 * NOTE:
 * - We do NOT trust a caller-provided playerId for updates.
 * - We always bind the player id to auth.uid().
 *
 * @param {string} nickname - Chosen by the user.
 */
export async function registerPlayer(nickname) {
    // 0) Ensure anonymous login exists
    await ensureAnonAuth();

    // 1) Bind playerId to auth.uid()
    const playerId = await getAuthedPlayerId();

    // 2) Check existing nickname for this player
    const { data: existing, error: selectError } = await supabase
        .from("players")
        .select("nickname")
        .eq("id", playerId)
        .maybeSingle();

    if (selectError) {
        console.error("Failed to check existing player:", selectError);
        return { data: null, error: selectError };
    }

    // 3) If no player row exists, create it
    if (!existing) {
        const { data, error } = await supabase
            .from("players")
            .insert([{ id: playerId, nickname: nickname }])
            .select()
            .maybeSingle();

        if (error) console.error("Failed to register player:", error);
        return { data, error };
    }

    // 4) If nickname unchanged, do nothing
    if (existing.nickname === nickname) {
        return { data: existing, error: null };
    }

    // 5) Update nickname (latest name)
    const { data, error } = await supabase
        .from("players")
        .update({ nickname })
        .eq("id", playerId)
        .select()
        .maybeSingle();

    if (error) console.error("Failed to update nickname:", error);
    return { data, error };
}

/**
 * Store ONLY the best score per player in DB (one row per player_id).
 * Requires:
 * - UNIQUE(player_id) on public.game_sessions
 * - RLS: UPDATE allowed only when player_id = auth.uid()
 *
 * Data logic preserved:
 * 1) Read current best for this player.
 * 2) If new score is not higher -> no-op.
 * 3) If new score is higher (or no row) -> upsert.
 *
 * @param {Object} sessionData - Gameplay result payload.
 */
export async function submitGameSession(sessionData) {
    // 0) Ensure anonymous login exists
    await ensureAnonAuth();

    // 1) Force player_id = auth.uid() (do NOT trust sessionData.player_id)
    const playerId = await getAuthedPlayerId();
    const newScore = sessionData.score ?? 0;

    // 2) Load current best (single row by design)
    const { data: existing, error: selectError } = await supabase
        .from("game_sessions")
        .select("player_id, score")
        .eq("player_id", playerId)
        .maybeSingle();

    if (selectError) {
        console.error("Failed to fetch existing best session:", selectError);
        return { data: null, error: selectError };
    }

    const existingScore = existing?.score ?? 0;
    const isNewHighScore = !existing || newScore > existingScore;

    // 3) If not a new best, do nothing
    if (!isNewHighScore) {
        return { data: existing, error: null };
    }

    // 4) Upsert best record (insert if missing, update if exists)
    // IMPORTANT:
    // - INSERT is allowed by your "public insert" policy
    // - UPDATE is allowed only if player_id == auth.uid(), which we guarantee here
    const bestPayload = {
        player_id: playerId,
        play_time: sessionData.play_time,
        hits: sessionData.hits,
        pickups: sessionData.pickups,
        max_speed: sessionData.max_speed,
        max_jump_power: sessionData.max_jump_power,
        health_left: sessionData.health_left,
        score: newScore,
    };

    const { data, error } = await supabase
        .from("game_sessions")
        .upsert(bestPayload, { onConflict: "player_id" })
        .select()
        .maybeSingle();

    if (error) console.error("Failed to upsert best game session:", error);
    return { data, error };
}

/**
 * Optional helper: fetch leaderboard (public select assumed).
 * If you also want nicknames, you'll typically join via a view or a separate query.
 */
export async function fetchLeaderboard(limit = 50) {
    const { data, error } = await supabase
        .from("leaderboard")
        .select("player_id, display_name, score")
        .order("score", { ascending: false })
        .limit(limit);

    if (error) console.error("Failed to fetch leaderboard:", error);
    return { data, error };
}

