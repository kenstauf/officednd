(() => {
  window.OfficeDnD = window.OfficeDnD || {};
  window.OfficeDnD.ui = window.OfficeDnD.ui || {};
const gameState = window.OfficeDnD.state.gameState;

const MAX_LOG_ENTRIES = 50;

window.OfficeDnD.ui.renderLog = (state = gameState) => {
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

window.OfficeDnD.ui.logEvent = (text) => {
  gameState.log.unshift(text);
  if (gameState.log.length > MAX_LOG_ENTRIES) {
    gameState.log.splice(MAX_LOG_ENTRIES);
  }
  window.OfficeDnD.ui.renderLog(gameState);
};
})();