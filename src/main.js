import { gameState } from "./state.js";
import { rooms } from "./data/rooms.js";
import { renderInventory } from "./ui/inventoryUI.js";
import { renderStats } from "./ui/statsUI.js";
import { renderLog, logEvent } from "./ui/logUI.js";
import { setupCommandBar } from "./ui/commandBarUI.js";
import { renderSurroundings } from "./ui/surroundingsUI.js";

const renderAll = () => {
  renderStats(gameState);
  renderInventory(gameState);
  renderLog(gameState);
  renderSurroundings(gameState);
};

const initializeGame = () => {
  renderAll();
  const room = rooms[gameState.currentRoomId];
  if (room) {
    logEvent(`Entered: ${room.name} — ${room.description}`);
  }
  setupCommandBar();
};

initializeGame();
