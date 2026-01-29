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
    actionLog: [],
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
  };

  const logAction = (text) => {
    gameState.actionLog.push(text);
    if (gameState.actionLog.length > MAX_LOG_ENTRIES) {
      gameState.actionLog.splice(
        0,
        gameState.actionLog.length - MAX_LOG_ENTRIES,
      );
    }
    renderActionLog(gameState);
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

  const getAdjacentRooms = (x, y) => {
    const options = [];
    for (let row = 0; row < gameState.map.height; row += 1) {
      for (let col = 0; col < gameState.map.width; col += 1) {
        if (isAdjacent({ x, y }, { x: col, y: row })) {
          options.push({ x: col, y: row, room: getRoom(col, row) });
        }
      }
    }
    return options;
  };

  const renderRoomInfo = (roomData, position) => {
    const infoElement = document.querySelector("#room-info");
    if (!infoElement) return;

    infoElement.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = roomData.name;
    infoElement.appendChild(title);

    const description = document.createElement("p");
    description.textContent = roomData.description;
    infoElement.appendChild(description);

    const objectsTitle = document.createElement("h4");
    objectsTitle.textContent = "Objects";
    infoElement.appendChild(objectsTitle);

    const objectsList = document.createElement("ul");
    objectsList.className = "log-list";
    if (roomData.objects.length === 0) {
      const item = document.createElement("li");
      item.textContent = "(none)";
      objectsList.appendChild(item);
    } else {
      roomData.objects.forEach((objectName) => {
        const item = document.createElement("li");
        item.textContent = objectName;
        objectsList.appendChild(item);
      });
    }
    infoElement.appendChild(objectsList);

    const npcsTitle = document.createElement("h4");
    npcsTitle.textContent = "NPCs";
    infoElement.appendChild(npcsTitle);

    const npcsList = document.createElement("ul");
    npcsList.className = "log-list";
    if (roomData.npcs.length === 0) {
      const item = document.createElement("li");
      item.textContent = "(none)";
      npcsList.appendChild(item);
    } else {
      roomData.npcs.forEach((npcName) => {
        const item = document.createElement("li");
        item.textContent = npcName;
        npcsList.appendChild(item);
      });
    }
    infoElement.appendChild(npcsList);

    if (position) {
      const actionsTitle = document.createElement("h4");
      actionsTitle.textContent = "Available Moves";
      infoElement.appendChild(actionsTitle);

      const actionsList = document.createElement("ul");
      actionsList.className = "log-list";
      const moves = getAdjacentRooms(position.x, position.y);
      if (moves.length === 0) {
        const item = document.createElement("li");
        item.textContent = "(none)";
        actionsList.appendChild(item);
      } else {
        moves.forEach(({ x, y, room }) => {
          const item = document.createElement("li");
          item.textContent = `${room.name} (${x},${y})`;
          actionsList.appendChild(item);
        });
      }
      infoElement.appendChild(actionsList);
    }
  };

  const logRoomEntry = (x, y) => {
    const room = getRoom(x, y);
    logAction(`Entered: ${room.name} — ${room.description}`);
    const objects = room.objects.length > 0 ? room.objects.join(", ") : "None";
    const npcs = room.npcs.length > 0 ? room.npcs.join(", ") : "None";
    logAction(`Objects: ${objects}`);
    logAction(`NPCs: ${npcs}`);
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
            logAction("Too far.");
            return;
          }

          const result = movePlayer(x, y);
          if (result.ok) {
            logRoomEntry(x, y);
            if (typeof onAfterMove === "function") {
              onAfterMove();
            }
          } else if (result.reason) {
            logAction(result.reason);
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
    renderActionLog(gameState);
    const { x, y } = gameState.map.currentRoom;
    renderRoomInfo(getRoom(x, y), { x, y });
  };

  const initializeGame = () => {
    renderAll();
    logRoomEntry(gameState.map.currentRoom.x, gameState.map.currentRoom.y);
  };

  initializeGame();
})();
