import Phaser from "phaser";
import { registerPlayer, fetchLeaderboard } from "../api/leaderboard.js";
import { getPlayerId, setPlayerInfo } from "../utils/storage.js";
import {NICKNAME_INPUT_STYLE} from "../config";


/**
 *
 * Add this scene for receiving user input
 */
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super("MenuScene");
    }

    async create() {
        this.add.text(50, 40, "Run Dude Run!", {
            fontSize: "40px",
            fill: "#ffffff"
        });

        // --- UI: Nickname Input ---
        const nicknameLabel = this.add.text(50, 120, "Nickname:", {
            fontSize: "20px",
            fill: "#ffffff"
        });

        const nicknameInput = document.createElement("input");
        nicknameInput.type = "text";
        nicknameInput.placeholder = "Enter nickname";
        nicknameInput.style.position = "absolute";
        nicknameInput.style.top = NICKNAME_INPUT_STYLE.top;
        nicknameInput.style.left = NICKNAME_INPUT_STYLE.left;
        nicknameInput.style.fontSize = NICKNAME_INPUT_STYLE.fontSize;
        nicknameInput.style.zIndex = NICKNAME_INPUT_STYLE.zIndex;
        document.body.appendChild(nicknameInput);

        // --- UI: Start Button ---
        const startButton = this.add.text(50, 220, "[ Start Game ]", {
            fontSize: "26px",
            fill: "#00ff00"
        }).setInteractive();

        startButton.on("pointerdown", async () => {
            const nickname = nicknameInput.value.trim();
            if (!nickname) {
                alert("Please enter a nickname!");
                return;
            }

            // Save nickname + UUID locally
            const playerId = getPlayerId();
            setPlayerInfo(playerId, nickname);

            // Register player to DB (only first time)
            await registerPlayer(playerId, nickname);

            // Remove UI input from DOM
            nicknameInput.remove();

            this.scene.start("GameScene");
        });

        // --- Leaderboard Section ---
        this.add.text(350, 120, "Leaderboard (Top 10)", {
            fontSize: "24px",
            fill: "#ffffff"
        });

        const { data, error } = await fetchLeaderboard(10);
        if (error) {
            console.error("Failed to load leaderboard:", error);
            return;
        }

        data.forEach((row, i) => {
            const nickname = row.players?.nickname || "Unknown";
            const score = row.score;

            this.add.text(
                350,
                160 + i * 24,
                `${i + 1}. ${nickname} — ${score}`,
                { fontSize: "20px", fill: "#ffffff" }
            );
        });

        this.scene.start('MenuScene');
    }
}
