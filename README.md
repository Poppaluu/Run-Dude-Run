# Run-Dude-Run
Repository for OSS course in the ITM major project. The purpose is for students to test the GitHub workflow

For developing the game, you will need Node.js. Please refer to the guide found: https://nodejs.org/en 

When the project is open for you, check that the node is correctly installed by running the code "node -v" and "npm -v" in the terminal.

Once the correct installation has been checked, first run "npm install" and then "npm run dev". This starts a local server in the address "http://localhost:5173/"

---

# Database Structure Overview (for Leaderboard & Game Statistics)

This project does not store personal user information.
All data is related only to **gameplay sessions**, such as scores and in-game statistics, without any real user accounts or sensitive information.

The database is designed to support:

* Leaderboards
* Gameplay session tracking
* Basic anonymous player identification (nickname + UUID)

The structure is lightweight and suitable for open-source projects where no server-side account management is required.

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
| ---------------- |-----------| ------------------------------------- |
| `id`             | serial    | Primary key                           |
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
  id serial primary key,
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

- Each browser automatically generates one UUID on first launch.

- This UUID is stored permanently in localStorage and reused on every session.

- Changing the nickname does not create a new player record — the UUID remains the same.

A new player is only created if the user clears browser storage or uses a different browser/device.

This design keeps the game entirely anonymous and does not require server-side authentication or user accounts.
It also prevents duplicate players, simplifies leaderboard management, and ensures privacy by avoiding any personal data storage.

---

## 4. Usage Summary

* The client generates a player UUID (stored locally).
* At the end of each game session, the client submits session results.
* The leaderboard simply queries top scores from `game_sessions`.
* Player nicknames are optional and can be displayed publicly.