import { gameState } from "../state.js";

const MAX_LOG_ENTRIES = 50;

export const renderLog = (state = gameState) => {
  const logElement = document.querySelector("#log");
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
  gameState.log.push(text);
  if (gameState.log.length > MAX_LOG_ENTRIES) {
    gameState.log.splice(0, gameState.log.length - MAX_LOG_ENTRIES);
  }
  renderLog(gameState);
};
