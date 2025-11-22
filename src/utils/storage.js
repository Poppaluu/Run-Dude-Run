// Creates UUID if not exists
export function getPlayerId() {
    let id = localStorage.getItem("player_id");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("player_id", id);
    }
    return id;
}

// Save nickname + UUID together
export function setPlayerInfo(id, nickname) {
    localStorage.setItem("player_nickname", nickname);
}

export function getNickname() {
    return localStorage.getItem("player_nickname") || "";
}
