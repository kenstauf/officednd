import { gameState } from "./state.js";
import { rooms } from "./data/rooms.js";
import { renderInventory } from "./ui/inventoryUI.js";
import { renderStats } from "./ui/statsUI.js";
import { renderLog, logEvent } from "./ui/logUI.js";
import { setupCommandBar } from "./ui/commandBarUI.js";
import { renderSurroundings } from "./ui/surroundingsUI.js";
import { initMiniMap, renderMiniMap } from "./ui/miniMapUI.js";
import { validateRoomPositions } from "./systems/mapValidation.js";

const renderAll = () => {
  renderStats(gameState);
  renderInventory(gameState);
  renderLog(gameState);
  renderSurroundings(gameState);
  renderMiniMap(gameState, rooms);
};

const initializeGame = () => {
  const miniMapCanvas = document.querySelector("#miniMap");
  initMiniMap(miniMapCanvas);

  const isDev =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isDev) {
    validateRoomPositions(rooms);
  }

  renderAll();
  const room = rooms[gameState.currentRoomId];
  if (room) {
    logEvent(`Entered: ${room.name} — ${room.description}`);
  }
  setupCommandBar();
};

initializeGame();
