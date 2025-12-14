<h1 align="center">Run-Dude-Run</h1>

<p align="center">
  Simple runner game for the OSS course Practice </p>


[![GitHub stars](https://img.shields.io/github/stars/Poppaluu/Run-Dude-Run?style=flat-square)](https://github.com/Poppaluu/Run-Dude-Run/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Poppaluu/Run-Dude-Run?style=flat-square)](https://github.com/Poppaluu/Run-Dude-Run/network/members)
[![GitHub issues](https://img.shields.io/github/issues/Poppaluu/Run-Dude-Run?style=flat-square)](https://github.com/Poppaluu/Run-Dude-Run/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/Poppaluu/Run-Dude-Run?style=flat-square)](https://github.com/Poppaluu/Run-Dude-Run/commits/main)
[![License](https://img.shields.io/github/license/Poppaluu/Run-Dude-Run?style=flat-square)](https://github.com/Poppaluu/Run-Dude-Run/blob/main/LICENSE)

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Phaser](https://img.shields.io/badge/Phaser-0E7490?logo=phaser&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)

- **Game Engine:** Phaser 3 
- **Build / Dev Server:** Vite 
- **Backend as a Service:** Supabase 
- **Testing:** Jest
- **Package Manager:** npm
---
Repository for OSS course in the ITM major project. The purpose is for students to test the GitHub workflow.

For developing the game, you will need Node.js. Please refer to the guide found: https://nodejs.org/en

## Download & Installation

1. Install **Node.js** from the official website: https://nodejs.org/en
2. Download this repository:
   - Click **Code → Download ZIP** in GitHub and extract it, or  
   - Clone it with:

     ```bash
     git clone https://github.com/Poppaluu/Run-Dude-Run.git
     ```

3. Open a terminal in the project root folder.
4. Check that Node.js and npm are correctly installed:
   ```bash
   node -v
   npm -v
    ```

5. Install dependencies:

   ```bash
   npm install
   ```

## Usage Example

1. Start the development server:

   ```bash
   npm run dev
   ```

2. After the server starts, open the URL shown in the terminal
   (by default `http://localhost:5173/`) in your web browser.

3. Play a game session in the browser. Scores and gameplay statistics from each session
   are stored and later used for the leaderboard and game statistics.

>You can play through this [GitHub Page](https://poppaluu.github.io/Run-Dude-Run/)

---

# Database Structure Overview (for Leaderboard & Game Statistics)

This project does not store personal user information.
All data is related only to **gameplay sessions**, such as scores and in-game statistics, without any real user accounts or sensitive information. You can also use your own database refering the structure guide below.

The database is designed to support:

* Leaderboards
* Gameplay session tracking
* Basic anonymous player identification (nickname + UUID)

The structure is lightweight and suitable for open-source projects where no server-side account management is required. The current website (GitHub Page) uses Supabase. To learn more, see the official document https://supabase.com/docs 

You can adjust the database and custom whatever you want.

---

## 1. Player Identification

Players are represented only by a **locally generated UUID** and an optional **nickname**.
No emails, passwords, or personal information are collected.

### `players` Table

Stores anonymous player records for leaderboard display.

| Column       | Type      | Description              |
| ------------ | --------- | ------------------------ |
| `id`         | uuid (PK) | Unique player identifier |
| `nickname`   | text      | Player's display name    |
| `created_at` | timestamp | Registration timestamp   |

```sql
create table players (
  id uuid primary key,
  nickname text not null,
  created_at timestamp default now()
);
```

---

## 2. Game Session Records

A new record is created each time a game session ends.
These values are generated only from **in-game character status** (health, speed, jumps, etc.) and contain no personal data.

### `game_sessions` Table

Tracks per-session gameplay results.

| Column           | Type      | Description                           |
| ---------------- | --------- | ------------------------------------- |
  | `id`             | int    | Primary key                           |
| `player_id`      | uuid      | FK → players.id                       |
| `score`          | int       | Final game score                      |
| `play_time`      | int       | Survival duration (seconds)           |
| `hits`           | int       | Number of enemy collisions            |
| `pickups`        | int       | Number of pickups collected           |
| `max_speed`      | int       | Maximum speed reached (optional)      |
| `max_jump_power` | int       | Maximum jump power reached (optional) |
| `health_left`    | int       | Remaining health at the end           |
| `created_at`     | timestamp | Session end timestamp                 |

```sql
create table game_sessions (
  id int primary key,
  player_id uuid references players(id) on delete cascade,
  score int not null,
  play_time int,
  hits int,
  pickups int,
  max_speed int,
  max_jump_power int,
  health_left int,
  created_at timestamp default now()
);
```

---

## 3. Client-Side Identity Model (Single-Browser Single-Player Design)

This project uses a **single-browser**, **single-player identity model**:

* Each browser automatically generates one UUID on first launch.
* This UUID is stored permanently in localStorage and reused on every session.
* Changing the nickname does not create a new player record — the UUID remains the same.

A new player is only created if the user clears browser storage or uses a different browser/device.

This design keeps the game entirely anonymous and does not require server-side authentication or user accounts.
It also prevents duplicate players, simplifies leaderboard management, and ensures privacy by avoiding any personal data storage.

---

## 4. Usage Summary

* The client generates a player UUID (stored locally).
* At the end of each game session, the client submits session results.
* The leaderboard simply queries top scores from `game_sessions`.
* Player nicknames are optional and can be displayed publicly.
