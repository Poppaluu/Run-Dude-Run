// test/utils/playerStorage.test.js
import { test, expect, describe, beforeEach } from '@jest/globals';
import { getPlayerId, setPlayerInfo, getNickname } from '../../src/utils/storage';

describe('player storage utils', () => {
    let store;

    beforeEach(() => {
        // localStorage mock
        store = {};
        global.localStorage = {
            getItem: jest.fn((key) => (key in store ? store[key] : null)),
            setItem: jest.fn((key, value) => {
                store[key] = String(value);
            }),
            clear: jest.fn(() => {
                store = {};
            }),
        };

        // crypto.randomUUID mock
        global.crypto = {
            randomUUID: jest.fn(() => 'test-uuid-123'),
        };
    });

    test('#1 If there is an existing player_id, just return it', () => {
        store['player_id'] = 'existing-uuid';

        const id = getPlayerId();

        expect(id).toBe('existing-uuid');
        expect(global.crypto.randomUUID).not.toHaveBeenCalled();
        expect(global.localStorage.setItem).not.toHaveBeenCalledWith('player_id', expect.any(String));
    });

    test('#2 If there is no player_id, create and return', () => {
        const id = getPlayerId();

        expect(id).toBe('test-uuid-123');
        expect(global.crypto.randomUUID).toHaveBeenCalledTimes(1);
        expect(global.localStorage.setItem).toHaveBeenCalledWith('player_id', 'test-uuid-123');
    });

    test('#3 setPlayerInfo will store nickname in localStorage', () => {
        setPlayerInfo('some-id', 'Alice');

        expect(global.localStorage.setItem).toHaveBeenCalledWith('player_nickname', 'Alice');
    });

    test('#4 getNickname will return nickname.', () => {
        store['player_nickname'] = 'Bob';

        expect(getNickname()).toBe('Bob');
    });

    test('#5 If there is no nickname, return an empty String', () => {
        expect(getNickname()).toBe('');
    });
});
