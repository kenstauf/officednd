import { gameState } from "./state.js";
import { renderMap, logRoomEntry } from "./ui/mapUI.js";
import { renderInventory } from "./ui/inventoryUI.js";
import { renderStats } from "./ui/statsUI.js";
import { renderLog } from "./ui/logUI.js";

const renderAll = () => {
  renderMap(gameState, renderAll);
  renderStats(gameState);
  renderInventory(gameState);
  renderLog(gameState);
};

const initializeGame = () => {
  renderAll();
  logRoomEntry(gameState.map.currentRegionId, gameState);
};

initializeGame();
