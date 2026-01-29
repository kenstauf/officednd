import { gameState } from "../state.js";

const MAX_LOG_ENTRIES = 50;

export const renderLog = (state = gameState) => {
  const logElement = document.querySelector("#action-log");
  if (!logElement) return;

  logElement.innerHTML = "";
  const list = document.createElement("ul");
  list.className = "log-list";

  state.log.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "log-entry";
    item.textContent = entry;
    list.appendChild(item);
  });

  logElement.appendChild(list);
};

export const logEvent = (text) => {
  gameState.log.unshift(text);
  if (gameState.log.length > MAX_LOG_ENTRIES) {
    gameState.log.splice(MAX_LOG_ENTRIES);
  }
  renderLog(gameState);
};
