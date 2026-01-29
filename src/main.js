import { gameState } from "./state.js";
import { renderMap } from "./ui/mapUI.js";
import { renderInventory } from "./ui/inventoryUI.js";
import { renderStats } from "./ui/statsUI.js";
import { renderLog } from "./ui/logUI.js";

const initializeGame = () => {
  renderMap(gameState);
  renderStats(gameState);
  renderInventory(gameState);
  renderLog(gameState);
};

initializeGame();
