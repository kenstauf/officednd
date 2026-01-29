import { gameState } from "../state.js";

export const isAdjacent = (from, to) => {
  const deltaX = Math.abs(from.x - to.x);
  const deltaY = Math.abs(from.y - to.y);
  return deltaX + deltaY === 1;
};

export const movePlayer = (toX, toY) => {
  const { width, height, currentRoom } = gameState.map;
  const destination = { x: toX, y: toY };

  if (toX < 0 || toY < 0 || toX >= width || toY >= height) {
    return { ok: false, reason: "Out of bounds." };
  }

  if (!isAdjacent(currentRoom, destination)) {
    return { ok: false, reason: "Too far." };
  }

  gameState.map.currentRoom = destination;
  return { ok: true };
};
