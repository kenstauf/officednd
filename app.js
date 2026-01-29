(() => {
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
      width: 5,
      height: 5,
      currentRoom: {
        x: 0,
        y: 0,
      },
    },
    log: [],
  };

  const rooms = {
    "0,0": {
      name: "Break Room",
      description: "The smell of burnt coffee hangs in the air.",
      objects: ["Coffee Machine", "Vending Machine"],
      npcs: [],
    },
    "1,0": {
      name: "Hallway",
      description: "A quiet corridor lined with motivational posters.",
      objects: [],
      npcs: [],
    },
    "1,1": {
      name: "Open Office",
      description: "Keyboards clatter as deadlines loom.",
      objects: ["Stapler", "Whiteboard"],
      npcs: ["Overworked Analyst"],
    },
    "0,1": {
      name: "Conference Room",
      description: "A long table waits beneath a flickering projector.",
      objects: ["Projector"],
      npcs: ["Mysterious Consultant"],
    },
    "2,1": {
      name: "Storage Closet",
      description: "Cleaning supplies tower like ancient relics.",
      objects: ["Locked Locker", "Mop Bucket"],
      npcs: [],
    },
    "2,0": {
      name: "IT Corner",
      description: "Server fans hum next to a jungle of cables.",
      objects: ["Ethernet Cable"],
      npcs: ["IT Gremlin"],
    },
  };

  const defaultRoom = {
    name: "Empty Office",
    description: "Desks sit abandoned under the glow of monitors.",
    objects: [],
    npcs: [],
  };

  const getRoom = (x, y) => {
    const key = `${x},${y}`;
    return rooms[key] ?? defaultRoom;
  };

  const MAX_LOG_ENTRIES = 50;

  const renderLog = (state = gameState) => {
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

  const logEvent = (text) => {
    gameState.log.push(text);
    if (gameState.log.length > MAX_LOG_ENTRIES) {
      gameState.log.splice(0, gameState.log.length - MAX_LOG_ENTRIES);
    }
    renderLog(gameState);
  };

  const isAdjacent = (from, to) => {
    const deltaX = Math.abs(from.x - to.x);
    const deltaY = Math.abs(from.y - to.y);
    return deltaX + deltaY === 1;
  };

  const movePlayer = (toX, toY) => {
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

  const buildRoomLog = (x, y) => {
    const room = getRoom(x, y);
    logEvent(`Entered: ${room.name} — ${room.description}`);
    const objects = room.objects.length > 0 ? room.objects.join(", ") : "None";
    const npcs = room.npcs.length > 0 ? room.npcs.join(", ") : "None";
    logEvent(`Objects: ${objects}`);
    logEvent(`NPCs: ${npcs}`);
  };

  const logRoomEntry = (x, y) => {
    buildRoomLog(x, y);
  };

  const renderMap = (state, onAfterMove) => {
    const mapElement = document.querySelector("#map");
    if (!mapElement) return;

    mapElement.innerHTML = "";
    mapElement.classList.add("map-grid");

    for (let y = 0; y < state.map.height; y += 1) {
      for (let x = 0; x < state.map.width; x += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "map-cell";
        cell.textContent = `${x},${y}`;

        const isCurrent =
          state.map.currentRoom.x === x && state.map.currentRoom.y === y;
        const adjacent = isAdjacent(state.map.currentRoom, { x, y });

        if (isCurrent) {
          cell.classList.add("active");
        } else if (adjacent) {
          cell.classList.add("adjacent");
        } else {
          cell.classList.add("inactive");
        }

        cell.addEventListener("click", () => {
          if (!adjacent) {
            logEvent("Too far.");
            return;
          }

          const result = movePlayer(x, y);
          if (result.ok) {
            buildRoomLog(x, y);
            if (typeof onAfterMove === "function") {
              onAfterMove();
            }
          } else if (result.reason) {
            logEvent(result.reason);
          }
        });

        mapElement.appendChild(cell);
      }
    }
  };

  const renderInventory = (state) => {
    const inventoryElement = document.querySelector("#inventory");
    if (!inventoryElement) return;

    inventoryElement.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = "Inventory";
    inventoryElement.appendChild(title);

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

    const title = document.createElement("h2");
    title.textContent = "Stats";
    statsElement.appendChild(title);

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
    renderLog(gameState);
  };

  const initializeGame = () => {
    renderAll();
    logRoomEntry(gameState.map.currentRoom.x, gameState.map.currentRoom.y);
  };

  initializeGame();
})();
