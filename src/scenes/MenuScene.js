import Phaser from "phaser";
import { getPlayerId, setPlayerInfo } from "../utils/storage.js";
import { NICKNAME_INPUT_STYLE } from "../config";
import { supabase } from "../api/supabaseClient";

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    async create() {

        //Block the canvas from stealing input focus
        this.game.canvas.setAttribute("tabindex", "-1");
        this.game.canvas.blur();

        const startGame = async () => {
            const nickname = nicknameInput.value.trim();
            if (!nickname) {
                alert("Please enter a nickname!");
                return;
            }

            const playerId = getPlayerId();
            setPlayerInfo(playerId, nickname);

            try {
                nicknameInput.remove();
            } catch (_) {}

            this.scene.start("GameScene");
        };

        // Title
        this.add.text(50, 40, "Run Dude Run!", {
            fontSize: "40px",
            fill: "#ffffff"
        });


        // Nickname input DOM
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

        // Enter key starts the game
        nicknameInput.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                await startGame();
            }
        });


        //Block Phaser key input while the input is focused
        window.addEventListener(
            "keydown",
            (e) => {
                if (document.activeElement === nicknameInput) {
                    // Prevent only the WASD keys from being passed to Phaser (if more key are used to operate game, we should put keys into it)
                    if (["w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
                        e.stopImmediatePropagation();
                    }
                }
            },
            true
        );

        // Start button
        const startButton = this.add.text(50, 220, "[ Start Game ]", {
            fontSize: "26px",
            fill: "#00ff00"
        }).setInteractive();

        startButton.on("pointerdown", async () => {
            await startGame();
        });

        // Leaderboard Section
        this.add.text(350, 120, "Leaderboard (Top 10)", {
            fontSize: "24px",
            fill: "#ffffff"
        });

        await this.refreshLeaderboard();

        this.events.on("wake", async () => {
            await this.refreshLeaderboard();
        });
    }



    // Leaderboard

    async refreshLeaderboard(limit = 10) {
        // Clear old texts
        if (this.leaderboardTexts) {
            this.leaderboardTexts.forEach(t => t.destroy());
        }
        this.leaderboardTexts = [];

        if (this.personalInfoTexts) {
            this.personalInfoTexts.forEach(t => t.destroy());
        }
        this.personalInfoTexts = [];

        const playerId = getPlayerId();

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

        //Top scores
        const top = data.slice(0, limit);

        const medals = ["🥇", "🥈", "🥉"];

        top.forEach((row, i) => {
            const nickname = row.players?.nickname || "Unknown";
            const score = row.score;

            const rankLabel = i < 3 ? medals[i] : `${i + 1}.`;

            const style = {
                fontSize: "20px",
                fill: "#ffffff"
            };

            const text = this.add.text(
                350,
                160 + i * 28,
                `${rankLabel} ${nickname} — ${score}`,
                style
            );

            this.leaderboardTexts.push(text);
        });

        // PB
        const myRuns = data.filter(row => row.player_id === playerId);

        const myBestScore = myRuns.length
            ? Math.max(...myRuns.map(r => r.score))
            : null;

        const myRank = data.findIndex(row => row.player_id === playerId) + 1;

        const bestScoreText = this.add.text(
            350,
            90,
            `Your Best: ${myBestScore ?? "-"}  |  Rank: ${myRank > 0 ? "#" + myRank : "-"}/${data.length}`,
            { fontSize: "20px", fill: "#ffffff" }
        );

        this.personalInfoTexts.push(bestScoreText);
    }
}
