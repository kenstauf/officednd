import { gameState } from "../state.js";

export const isNeighborRegion = (fromRegionId, toRegionId) => {
  const neighbors = gameState.map.regionNeighbors[fromRegionId] ?? [];
  return neighbors.includes(toRegionId);
};

export const movePlayer = (toRegionId) => {
  const { regions, currentRegionId } = gameState.map;

  if (toRegionId === null || toRegionId === undefined) {
    return { ok: false, reason: "Out of bounds." };
  }

  if (!regions[toRegionId]) {
    return { ok: false, reason: "Out of bounds." };
  }

  if (toRegionId === currentRegionId) {
    return { ok: false, reason: "Already here." };
  }

  if (!isNeighborRegion(currentRegionId, toRegionId)) {
    return { ok: false, reason: "Too far." };
  }

  gameState.map.currentRegionId = toRegionId;
  return { ok: true };
};
