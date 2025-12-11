// src/utils/scoring.js

export function calculateScore(
    play_time,
    enemy_score) {
    const score = play_time * 2 + enemy_score;

    return Math.min(Math.max(0, score), Number.MAX_VALUE);  // ensure non-negative score
}
