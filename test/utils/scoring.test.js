// test/utils/scoring.test.js
import { test, expect } from '@jest/globals';
import { calculateScore } from '../../src/utils/scoring.js';

test('#1 Happy Path', () => {
    const result = calculateScore(
        100, // play_time
        5,   // hits
        3,   // pickups
        10,  // max_speed
        15,  // max_jump_power
        2    // health_left
    );

    expect(result).toBe(243);
});
test('#2 Edge Case : When Input become too large', () => {
    const result = calculateScore(
        100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000, // play_time
        5,   // hits
        3,   // pickups
        10,  // max_speed
        15,  // max_jump_power
        2    // health_left
    );

    expect(result).toBe( 2e+95); // should be the maximum value of Number Class
});

test('#2 Edge Case : When Input become too large', () => {
    const result = calculateScore(
        100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000, // play_time
        5,   // hits
        3,   // pickups
        10,  // max_speed
        15,  // max_jump_power
        2    // health_left
    );

    expect(result).toBe( 2e+95); // should be the maximum value of Number Class
});