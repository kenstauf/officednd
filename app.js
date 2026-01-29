(() => {
  const mapGrid = [
    ["BR", "HW", "HW", "SC", "SC"],
    ["BR", "HW", "SF", "SF", "SC"],
    ["JR", "JR", "SF", "MO", "MO"],
    ["JR", null, "SF", "MO", "MO"],
    ["JR", null, "SF", "MO", "MO"],
  ];

  const roomDefs = {
    BR: {
      name: "Break Room",
      description: "The smell of burnt coffee hangs in the air.",
    },
    HW: {
      name: "Hallway",
      description: "A quiet corridor lined with motivational posters.",
    },
    SF: {
      name: "Open Office",
      description: "Keyboards clatter as deadlines loom.",
    },
    SC: {
      name: "Storage Closet",
      description: "Cleaning supplies tower like ancient relics.",
    },
    JR: {
      name: "Conference Room",
      description: "A long table waits beneath a flickering projector.",
    },
    MO: {
      name: "IT Corner",
      description: "Server fans hum next to a jungle of cables.",
    },
  };

  const getRoomDefinition = (code) =>
    roomDefs[code] ?? {
      name: "Empty Office",
      description: "Desks sit abandoned under the glow of monitors.",
    };

  const buildRegions = (grid) => {
    const height = grid.length;
    const width = grid[0]?.length ?? 0;
    const cellToRegion = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null),
    );
    const regions = [];

    const inBounds = (x, y) => y >= 0 && y < height && x >= 0 && x < width;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const code = grid[y][x];
        if (!code || cellToRegion[y][x] !== null) {
          continue;
        }

        const regionId = regions.length;
        const stack = [{ x, y }];
        const cells = [];
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        let anchorCell = { x, y };

        while (stack.length > 0) {
          const current = stack.pop();
          if (!current) break;
          const { x: cx, y: cy } = current;
          if (!inBounds(cx, cy)) continue;
          if (cellToRegion[cy][cx] !== null) continue;
          if (grid[cy][cx] !== code) continue;

          cellToRegion[cy][cx] = regionId;
          cells.push({ x: cx, y: cy });

          if (cy < anchorCell.y || (cy === anchorCell.y && cx < anchorCell.x)) {
            anchorCell = { x: cx, y: cy };
          }

          minX = Math.min(minX, cx);
          maxX = Math.max(maxX, cx);
          minY = Math.min(minY, cy);
          maxY = Math.max(maxY, cy);

          stack.push(
            { x: cx + 1, y: cy },
            { x: cx - 1, y: cy },
            { x: cx, y: cy + 1 },
            { x: cx, y: cy - 1 },
          );
        }

        regions.push({
          code,
          cells,
          bounds: {
            minX,
            maxX,
            minY,
            maxY,
          },
          anchorCell,
        });
      }
    }

    const neighborSets = Array.from({ length: regions.length }, () => new Set());

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const regionId = cellToRegion[y][x];
        if (regionId === null) continue;

        const neighbors = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
        ];

        neighbors.forEach(({ x: nx, y: ny }) => {
          if (!inBounds(nx, ny)) return;
          const neighborId = cellToRegion[ny][nx];
          if (neighborId === null || neighborId === regionId) return;
          neighborSets[regionId].add(neighborId);
        });
      }
    }

    const regionNeighbors = neighborSets.map((set) => Array.from(set));

    return {
      cellToRegion,
      regions,
      regionNeighbors,
    };
  };

  const { cellToRegion, regions, regionNeighbors } = buildRegions(mapGrid);

  const mapWidth = mapGrid[0]?.length ?? 0;
  const mapHeight = mapGrid.length;
  const startingRegionId = cellToRegion[0]?.[0] ?? 0;

  const gameState = {
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
    actionLog: [],
  };

  const MAX_LOG_ENTRIES = 50;

  const renderActionLog = (state = gameState) => {
    const logElement = document.querySelector("#action-log");
    if (!logElement) return;

    logElement.innerHTML = "";
    const list = document.createElement("ul");
    list.className = "log-list";

    state.actionLog.forEach((entry) => {
      const item = document.createElement("li");
      item.className = "log-entry";
      item.textContent = entry;
      list.appendChild(item);
    });

    logElement.appendChild(list);
    logElement.scrollTop = 0;
  };

  const logAction = (text) => {
    gameState.actionLog.unshift(text);
    if (gameState.actionLog.length > MAX_LOG_ENTRIES) {
      gameState.actionLog.splice(MAX_LOG_ENTRIES);
    }
    renderActionLog(gameState);
  };

  const isNeighborRegion = (fromRegionId, toRegionId) => {
    const neighbors = gameState.map.regionNeighbors[fromRegionId] ?? [];
    return neighbors.includes(toRegionId);
  };

  const movePlayer = (toRegionId) => {
    const { regions: mapRegions, currentRegionId } = gameState.map;

    if (toRegionId === null || toRegionId === undefined) {
      return { ok: false, reason: "Out of bounds." };
    }

    if (!mapRegions[toRegionId]) {
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

  const getNeighborRegions = (regionId) => {
    const neighbors = gameState.map.regionNeighbors[regionId] ?? [];
    return neighbors.map((neighborId) => {
      const region = gameState.map.regions[neighborId];
      return {
        id: neighborId,
        code: region.code,
        room: getRoomDefinition(region.code),
      };
    });
  };

  const renderRoomInfo = (regionId) => {
    const infoElement = document.querySelector("#room-info");
    if (!infoElement) return;

    infoElement.innerHTML = "";

    const region = gameState.map.regions[regionId];
    if (!region) return;

    const roomData = getRoomDefinition(region.code);

    const title = document.createElement("h3");
    title.textContent = `${roomData.name} (${region.code})`;
    infoElement.appendChild(title);

    const description = document.createElement("p");
    description.textContent = roomData.description;
    infoElement.appendChild(description);

    const actionsTitle = document.createElement("h4");
    actionsTitle.textContent = "Neighboring Regions";
    infoElement.appendChild(actionsTitle);

    const actionsList = document.createElement("ul");
    actionsList.className = "log-list";

    const moves = getNeighborRegions(regionId);
    if (moves.length === 0) {
      const item = document.createElement("li");
      item.textContent = "(none)";
      actionsList.appendChild(item);
    } else {
      moves.forEach(({ code, room }) => {
        const item = document.createElement("li");
        item.textContent = `${room.name} (${code})`;
        actionsList.appendChild(item);
      });
    }
    infoElement.appendChild(actionsList);
  };

  const logRoomEntry = (regionId) => {
    const region = gameState.map.regions[regionId];
    if (!region) return;
    const room = getRoomDefinition(region.code);
    logAction(`Entered: ${room.name} — ${room.description}`);
  };

  const renderMap = (state, onAfterMove) => {
    const mapElement = document.querySelector("#map");
    if (!mapElement) return;

    mapElement.innerHTML = "";
    mapElement.classList.add("map-grid");
    mapElement.style.gridTemplateColumns = `repeat(${state.map.width}, minmax(0, 1fr))`;

    const regionCells = Array.from({ length: state.map.regions.length }, () => []);
    let hoveredRegionId = null;

    const setHoveredRegion = (regionId) => {
      if (hoveredRegionId === regionId) return;
      if (hoveredRegionId !== null) {
        regionCells[hoveredRegionId].forEach((cell) =>
          cell.classList.remove("hovered"),
        );
      }
      hoveredRegionId = regionId;
      if (regionId !== null) {
        regionCells[regionId].forEach((cell) => cell.classList.add("hovered"));
      }
    };

    for (let y = 0; y < state.map.height; y += 1) {
      for (let x = 0; x < state.map.width; x += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "map-cell";

        const regionId = state.map.cellToRegion[y][x];

        if (regionId === null) {
          cell.classList.add("empty");
          cell.disabled = true;
          mapElement.appendChild(cell);
          continue;
        }

        const region = state.map.regions[regionId];
        const isCurrent = regionId === state.map.currentRegionId;
        const isNeighbor = isNeighborRegion(state.map.currentRegionId, regionId);

        if (isCurrent) {
          cell.classList.add("active");
        } else if (isNeighbor) {
          cell.classList.add("adjacent");
        } else {
          cell.classList.add("inactive");
        }

        if (
          region.anchorCell.x === x &&
          region.anchorCell.y === y
        ) {
          const label = document.createElement("span");
          label.className = "map-label";
          label.textContent = getRoomDefinition(region.code).name;
          cell.appendChild(label);
        }

        const rightNeighbor = state.map.cellToRegion[y][x + 1];
        const leftNeighbor = state.map.cellToRegion[y][x - 1];
        const downNeighbor = state.map.cellToRegion[y + 1]?.[x];
        const upNeighbor = state.map.cellToRegion[y - 1]?.[x];

        if (rightNeighbor === regionId) cell.classList.add("no-right");
        if (leftNeighbor === regionId) cell.classList.add("no-left");
        if (downNeighbor === regionId) cell.classList.add("no-bottom");
        if (upNeighbor === regionId) cell.classList.add("no-top");

        cell.addEventListener("mouseenter", () => setHoveredRegion(regionId));
        cell.addEventListener("mouseleave", () => setHoveredRegion(null));

        cell.addEventListener("click", () => {
          if (regionId === state.map.currentRegionId) {
            return;
          }

          if (!isNeighbor) {
            logAction("Too far.");
            return;
          }

          const result = movePlayer(regionId);
          if (result.ok) {
            logRoomEntry(regionId);
            if (typeof onAfterMove === "function") {
              onAfterMove();
            }
          } else if (result.reason && result.reason !== "Already here.") {
            logAction(result.reason);
          }
        });

        regionCells[regionId].push(cell);
        mapElement.appendChild(cell);
      }
    }
  };

  const renderInventory = (state) => {
    const inventoryElement = document.querySelector("#inventory");
    if (!inventoryElement) return;

    inventoryElement.innerHTML = "";

    const list = document.createElement("ul");
    list.className = "inventory-list";

    if (state.player.inventory.length === 0) {
      const item = document.createElement("li");
      item.textContent = "(empty)";
      list.appendChild(item);
    } else {
      state.player.inventory.forEach((inventoryItem) => {
        const item = document.createElement("li");
        item.textContent = inventoryItem;
        list.appendChild(item);
      });
    }

    inventoryElement.appendChild(list);
  };

  const renderStats = (state) => {
    const statsElement = document.querySelector("#stats");
    if (!statsElement) return;

    statsElement.innerHTML = "";

    const list = document.createElement("ul");
    list.className = "stats-list";

    const entries = [
      ["HP", state.player.hp],
      ["STR", state.player.str],
      ["DEX", state.player.dex],
      ["INT", state.player.int],
      ["CHA", state.player.cha],
    ];

    entries.forEach(([label, value]) => {
      const item = document.createElement("li");
      item.textContent = `${label}: ${value}`;
      list.appendChild(item);
    });

    statsElement.appendChild(list);
  };

  const renderAll = () => {
    renderMap(gameState, renderAll);
    renderStats(gameState);
    renderInventory(gameState);
    renderActionLog(gameState);
    renderRoomInfo(gameState.map.currentRegionId);
  };

  const initializeGame = () => {
    renderAll();
    logRoomEntry(gameState.map.currentRegionId);
  };

  initializeGame();
})();
