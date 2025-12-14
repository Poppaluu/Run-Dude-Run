import Phaser from "phaser";
import { registerPlayer } from "../api/leaderboard.js";
import { setPlayerInfo } from "../utils/storage.js"; // playerId 저장은 더 이상 쓰지 않는 방향 권장
import { NICKNAME_INPUT_STYLE } from "../config";
import { supabase } from "../api/supabaseClient";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    async create() {
        // -------------------------------------------------
        // 1) Block the canvas from stealing input focus
        // -------------------------------------------------
        this.game.canvas.setAttribute("tabindex", "-1");
        this.game.canvas.blur();

        // --------------------------
        // Title
        // --------------------------
        this.add.text(50, 40, "Run Dude Run!", {
            fontSize: "40px",
            fill: "#ffffff",
        });

        // --------------------------
        // Nickname input DOM
        // --------------------------
        const nicknameInput = document.createElement("input");
        nicknameInput.type = "text";
        nicknameInput.placeholder = "Enter nickname";
        nicknameInput.style.position = "absolute";
        nicknameInput.style.top = NICKNAME_INPUT_STYLE.top;
        nicknameInput.style.left = NICKNAME_INPUT_STYLE.left;
        nicknameInput.style.fontSize = NICKNAME_INPUT_STYLE.fontSize;
        nicknameInput.style.zIndex = NICKNAME_INPUT_STYLE.zIndex;

        document.body.appendChild(nicknameInput);
        nicknameInput.focus();

        setTimeout(() => {
            nicknameInput.focus();
            nicknameInput.select();
        }, 150);

        // ============================
        // Start game unified function
        // ============================
        const startGame = async () => {
            const nickname = nicknameInput.value.trim();
            if (!nickname) {
                alert("Please enter a nickname!");
                return;
            }

            // IMPORTANT:
            // registerPlayer() uses auth.uid() internally as the player id.
            // Do NOT use getPlayerId() anymore (it can mismatch auth.uid()).
            const { data, error } = await registerPlayer(nickname);
            if (error) {
                console.error("registerPlayer failed:", error);
                alert("Failed to register player. Check console.");
                return;
            }

            // Optional: store nickname locally (but do not store a separate playerId)
            // If your setPlayerInfo currently requires (playerId, nickname),
            // change it to store only nickname or ignore the first argument.
            try {
                setPlayerInfo(null, nickname);
            } catch (_) {}

            try {
                nicknameInput.remove();
            } catch (_) {}

            this.scene.start("GameScene");
        };

        nicknameInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await startGame();
            }
        });

        window.addEventListener(
            "keydown",
            (e) => {
                if (document.activeElement === nicknameInput) {
                    if (["w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
                        e.stopImmediatePropagation();
                    }
                }
            },
            true
        );

        // --------------------------
        // Start button
        // --------------------------
        const startButton = this.add
            .text(50, 220, "[ Start Game ]", {
                fontSize: "26px",
                fill: "#00ff00",
            })
            .setInteractive();

        startButton.on("pointerdown", async () => {
            await startGame();
        });

        // --------------------------
        // Leaderboard Section
        // --------------------------
        this.add.text(350, 120, "Leaderboard (Top 10)", {
            fontSize: "24px",
            fill: "#ffffff",
        });

        await this.refreshLeaderboard(10);

        this.events.on("wake", async () => {
            await this.refreshLeaderboard(10);
        });
    }

    // ==================================================================
    // Leaderboard
    // ==================================================================
    async refreshLeaderboard(limit = 10) {
        if (this.leaderboardTexts) {
            this.leaderboardTexts.forEach((t) => t.destroy());
        }
        this.leaderboardTexts = [];

        // Get my auth uid (consistent with DB player_id)
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        const myPlayerId = user?.id ?? null;
        if (userError) {
            console.error("Failed to get user:", userError);
        }

        // Since you chose A-model (one row per player_id),
        // there is no need to dedupe by player_id anymore.
        // Also: nested `players(nickname)` requires a FK relationship:
        // game_sessions.player_id -> players.id
        const { data, error } = await supabase
            .from("game_sessions")
            .select(`
        player_id,
        score,
        players (nickname)
      `)
            .order("score", { ascending: false });

        if (error) {
            console.error("Failed to fetch leaderboard:", error);
            return;
        }

        const rows = data ?? [];

        // PERSONAL INFO
        let myRank = null;
        let myBestScore = null;

        if (myPlayerId) {
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].player_id === myPlayerId) {
                    myRank = i + 1;
                    myBestScore = rows[i].score;
                    break;
                }
            }
        }

        if (this.personalInfoTexts) {
            this.personalInfoTexts.forEach((t) => t.destroy());
        }
        this.personalInfoTexts = [];

        const baseY = 170;
        const bestScoreText = this.add.text(
            350,
            baseY - 80,
            `Your Best: ${myBestScore ?? "-"} points & Your Rank: ${
                myRank ? "#" + myRank : "-"
            }/${rows.length}`,
            { fontSize: "20px", fill: "#ffffff" }
        );
        this.personalInfoTexts.push(bestScoreText);

        // TOP N
        const top = rows.slice(0, limit);
        const medals = ["🥇", "🥈", "🥉"];

        top.forEach((row, i) => {
            const nickname =
                row.players?.nickname ||
                (row.player_id ? row.player_id.slice(0, 8) : "Unknown");
            const score = row.score;

            const rankLabel = i < 3 ? medals[i] : `${i + 1}.`;

            const style = { fontSize: "20px", fill: "#ffffff" };

            const isMe = myPlayerId && row.player_id === myPlayerId;
            if (isMe) style.fill = "#ffff00";

            const text = this.add.text(
                350,
                160 + i * 28,
                `${rankLabel} ${nickname} — ${score}`,
                style
            );

            if (isMe) {
                const bg = this.add
                    .rectangle(350 - 10, 160 + i * 28 + 10, 330, 26, 0xffff00, 0.25)
                    .setOrigin(0, 0.5);
                text.setDepth(1);
                this.leaderboardTexts.push(bg);
            }

            this.leaderboardTexts.push(text);
        });
    }
}
import Phaser from "phaser";
import { registerPlayer } from "../api/leaderboard.js";
import { setPlayerInfo } from "../utils/storage.js"; // playerId 저장은 더 이상 쓰지 않는 방향 권장
import { NICKNAME_INPUT_STYLE } from "../config";
import { supabase } from "../api/supabaseClient";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    async create() {
        // -------------------------------------------------
        // 1) Block the canvas from stealing input focus
        // -------------------------------------------------
        this.game.canvas.setAttribute("tabindex", "-1");
        this.game.canvas.blur();

        // --------------------------
        // Title
        // --------------------------
        this.add.text(50, 40, "Run Dude Run!", {
            fontSize: "40px",
            fill: "#ffffff",
        });

        // --------------------------
        // Nickname input DOM
        // --------------------------
        const nicknameInput = document.createElement("input");
        nicknameInput.type = "text";
        nicknameInput.placeholder = "Enter nickname";
        nicknameInput.style.position = "absolute";
        nicknameInput.style.top = NICKNAME_INPUT_STYLE.top;
        nicknameInput.style.left = NICKNAME_INPUT_STYLE.left;
        nicknameInput.style.fontSize = NICKNAME_INPUT_STYLE.fontSize;
        nicknameInput.style.zIndex = NICKNAME_INPUT_STYLE.zIndex;

        document.body.appendChild(nicknameInput);
        nicknameInput.focus();

        setTimeout(() => {
            nicknameInput.focus();
            nicknameInput.select();
        }, 150);

        // ============================
        // Start game unified function
        // ============================
        const startGame = async () => {
            const nickname = nicknameInput.value.trim();
            if (!nickname) {
                alert("Please enter a nickname!");
                return;
            }

            // IMPORTANT:
            // registerPlayer() uses auth.uid() internally as the player id.
            // Do NOT use getPlayerId() anymore (it can mismatch auth.uid()).
            const { data, error } = await registerPlayer(nickname);
            if (error) {
                console.error("registerPlayer failed:", error);
                alert("Failed to register player. Check console.");
                return;
            }

            // Optional: store nickname locally (but do not store a separate playerId)
            // If your setPlayerInfo currently requires (playerId, nickname),
            // change it to store only nickname or ignore the first argument.
            try {
                setPlayerInfo(null, nickname);
            } catch (_) {}

            try {
                nicknameInput.remove();
            } catch (_) {}

            this.scene.start("GameScene");
        };

        nicknameInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await startGame();
            }
        });

        window.addEventListener(
            "keydown",
            (e) => {
                if (document.activeElement === nicknameInput) {
                    if (["w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
                        e.stopImmediatePropagation();
                    }
                }
            },
            true
        );

        // --------------------------
        // Start button
        // --------------------------
        const startButton = this.add
            .text(50, 220, "[ Start Game ]", {
                fontSize: "26px",
                fill: "#00ff00",
            })
            .setInteractive();

        startButton.on("pointerdown", async () => {
            await startGame();
        });

        // --------------------------
        // Leaderboard Section
        // --------------------------
        this.add.text(350, 120, "Leaderboard (Top 10)", {
            fontSize: "24px",
            fill: "#ffffff",
        });

        await this.refreshLeaderboard(10);

        this.events.on("wake", async () => {
            await this.refreshLeaderboard(10);
        });
    }

    // ==================================================================
    // Leaderboard
    // ==================================================================
    async refreshLeaderboard(limit = 10) {
        if (this.leaderboardTexts) {
            this.leaderboardTexts.forEach((t) => t.destroy());
        }
        this.leaderboardTexts = [];

        // Get my auth uid (consistent with DB player_id)
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        const myPlayerId = user?.id ?? null;
        if (userError) {
            console.error("Failed to get user:", userError);
        }

        // Since you chose A-model (one row per player_id),
        // there is no need to dedupe by player_id anymore.
        // Also: nested `players(nickname)` requires a FK relationship:
        // game_sessions.player_id -> players.id
        const { data, error } = await supabase
            .from("game_sessions")
            .select(`
        player_id,
        score,
        players (nickname)
      `)
            .order("score", { ascending: false });

        if (error) {
            console.error("Failed to fetch leaderboard:", error);
            return;
        }

        const rows = data ?? [];

        // PERSONAL INFO
        let myRank = null;
        let myBestScore = null;

        if (myPlayerId) {
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].player_id === myPlayerId) {
                    myRank = i + 1;
                    myBestScore = rows[i].score;
                    break;
                }
            }
        }

        if (this.personalInfoTexts) {
            this.personalInfoTexts.forEach((t) => t.destroy());
        }
        this.personalInfoTexts = [];

        const baseY = 170;
        const bestScoreText = this.add.text(
            350,
            baseY - 80,
            `Your Best: ${myBestScore ?? "-"} points & Your Rank: ${
                myRank ? "#" + myRank : "-"
            }/${rows.length}`,
            { fontSize: "20px", fill: "#ffffff" }
        );
        this.personalInfoTexts.push(bestScoreText);

        // TOP N
        const top = rows.slice(0, limit);
        const medals = ["🥇", "🥈", "🥉"];

        top.forEach((row, i) => {
            const nickname =
                row.players?.nickname ||
                (row.player_id ? row.player_id.slice(0, 8) : "Unknown");
            const score = row.score;

            const rankLabel = i < 3 ? medals[i] : `${i + 1}.`;

            const style = { fontSize: "20px", fill: "#ffffff" };

            const isMe = myPlayerId && row.player_id === myPlayerId;
            if (isMe) style.fill = "#ffff00";

            const text = this.add.text(
                350,
                160 + i * 28,
                `${rankLabel} ${nickname} — ${score}`,
                style
            );

            if (isMe) {
                const bg = this.add
                    .rectangle(350 - 10, 160 + i * 28 + 10, 330, 26, 0xffff00, 0.25)
                    .setOrigin(0, 0.5);
                text.setDepth(1);
                this.leaderboardTexts.push(bg);
            }

            this.leaderboardTexts.push(text);
        });
    }
}
