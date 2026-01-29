import { mapGrid } from "./data/mapData.js";
import { buildRegions } from "./systems/regionBuilder.js";

const { cellToRegion, regions, regionNeighbors } = buildRegions(mapGrid);

const mapWidth = mapGrid[0]?.length ?? 0;
const mapHeight = mapGrid.length;
const startingRegionId = cellToRegion[0]?.[0] ?? 0;

export const gameState = {
  player: {
    hp: 12,
    str: 3,
    dex: 2,
    int: 4,
    cha: 3,
    inventory: [],
  },
  map: {
    width: mapWidth,
    height: mapHeight,
    grid: mapGrid,
    cellToRegion,
    regions,
    regionNeighbors,
    currentRegionId: startingRegionId,
  },
  log: [],
};
