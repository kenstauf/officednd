(() => {
  const rooms = {
    breakRoom: {
      name: "Break Room",
      description: "The smell of burnt coffee hangs in the air.",
      objects: ["coffee urn", "microwave", "stack of mugs"],
      npcs: ["Pat from Payroll"],
      exits: {
        east: "hallway",
      },
    },
    hallway: {
      name: "Hallway",
      description: "A quiet corridor lined with motivational posters.",
      objects: ["bulletin board", "water cooler"],
      npcs: [],
      exits: {
        west: "breakRoom",
        east: "openOffice",
        north: "conferenceRoom",
        south: "storageCloset",
      },
    },
    openOffice: {
      name: "Open Office",
      description: "Keyboards clatter as deadlines loom.",
      objects: ["desk cluster", "printer", "messy sticky notes"],
      npcs: ["Devon the Developer"],
      exits: {
        west: "hallway",
        south: "itCorner",
      },
    },
    storageCloset: {
      name: "Storage Closet",
      description: "Cleaning supplies tower like ancient relics.",
      objects: ["box of toner", "mop bucket"],
      npcs: [],
      exits: {
        north: "hallway",
      },
    },
    itCorner: {
      name: "IT Corner",
      description: "Server fans hum next to a jungle of cables.",
      objects: ["spare laptop", "tangle of ethernet"],
      npcs: ["Morgan the IT Lead"],
      exits: {
        north: "openOffice",
        west: "conferenceRoom",
      },
    },
    conferenceRoom: {
      name: "Conference Room",
      description: "A long table waits beneath a flickering projector.",
      objects: ["whiteboard", "half-used marker"],
      npcs: ["Jules the Manager"],
      exits: {
        south: "hallway",
        east: "itCorner",
      },
    },
  };

  const gameState = {
    player: {
      hp: 12,
      str: 3,
      dex: 2,
      int: 4,
      cha: 3,
      inventory: [],
    },
    currentRoomId: "breakRoom",
    log: [],
  };

  const MAX_LOG_ENTRIES = 50;

  const renderActionLog = (state = gameState) => {
    const logElement = document.querySelector("#action-log");
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

  const logAction = (text) => {
    gameState.log.unshift(text);
    if (gameState.log.length > MAX_LOG_ENTRIES) {
      gameState.log.splice(MAX_LOG_ENTRIES);
    }
    renderActionLog(gameState);
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

  const renderList = (titleText, items, container) => {
    const title = document.createElement("h4");
    title.textContent = titleText;
    container.appendChild(title);

    const list = document.createElement("ul");
    list.className = "log-list";

    if (!items.length) {
      const empty = document.createElement("li");
      empty.textContent = "(none)";
      list.appendChild(empty);
    } else {
      items.forEach((itemText) => {
        const item = document.createElement("li");
        item.textContent = itemText;
        list.appendChild(item);
      });
    }

    container.appendChild(list);
  };

  const getRoomSummary = (roomId) => {
    const room = rooms[roomId];
    if (!room) {
      return "You are somewhere unfamiliar.";
    }

    const exits = Object.entries(room.exits ?? {}).map(
      ([direction, destination]) =>
        `${direction} to ${rooms[destination]?.name ?? destination}`,
    );

    const objects = room.objects.length ? room.objects.join(", ") : "none";
    const npcs = room.npcs.length ? room.npcs.join(", ") : "none";
    const exitsText = exits.length ? exits.join(", ") : "none";

    return `${room.name} — ${room.description} Objects: ${objects}. NPCs: ${npcs}. Exits: ${exitsText}.`;
  };

  const renderSurroundings = (state = gameState) => {
    const infoElement = document.querySelector("#room-info");
    if (!infoElement) return;

    infoElement.innerHTML = "";

    const room = rooms[state.currentRoomId];
    if (!room) {
      infoElement.textContent = "Room data unavailable.";
      return;
    }

    const title = document.createElement("h3");
    title.textContent = room.name;
    infoElement.appendChild(title);

    const description = document.createElement("p");
    description.textContent = room.description;
    infoElement.appendChild(description);

    renderList("Objects", room.objects, infoElement);
    renderList("NPCs", room.npcs, infoElement);

    const exits = Object.entries(room.exits ?? {}).map(
      ([direction, destination]) =>
        `${direction.toUpperCase()}: ${rooms[destination]?.name ?? destination}`,
    );
    renderList("Exits", exits, infoElement);
  };

  const directionAliases = {
    n: "north",
    s: "south",
    e: "east",
    w: "west",
  };

  const normalizeDirection = (value) => {
    if (!value) return null;
    const direction = value.toLowerCase().trim();
    if (directionAliases[direction]) return directionAliases[direction];
    if (["north", "south", "east", "west"].includes(direction)) {
      return direction;
    }
    return null;
  };

  const tryMove = (direction) => {
    const normalized = normalizeDirection(direction);
    if (!normalized) {
      return { ok: false, reason: "You can't go that way." };
    }

    const currentRoom = rooms[gameState.currentRoomId];
    if (!currentRoom) {
      return { ok: false, reason: "You can't go that way." };
    }

    const nextRoomId = currentRoom.exits?.[normalized];
    if (!nextRoomId) {
      return { ok: false, reason: "You can't go that way." };
    }

    gameState.currentRoomId = nextRoomId;
    return { ok: true, roomId: nextRoomId, direction: normalized };
  };

  const COMMAND_HELP =
    'Available commands: help, look, go <direction>, move <direction>. Directions: north/south/east/west (n/s/e/w).';

  const handleMovement = (direction) => {
    const result = tryMove(direction);
    if (result.ok) {
      const destination = rooms[result.roomId];
      logAction(`You go ${result.direction} to ${destination.name}.`);
      renderSurroundings(gameState);
      return;
    }
    logAction(result.reason ?? "You can't go that way.");
  };

  const handleCommand = (rawCommand) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    logAction(`> ${trimmed}`);

    const [command, ...args] = trimmed.split(/\s+/);
    const normalizedCommand = command.toLowerCase();

    if (normalizedCommand === "help") {
      logAction(COMMAND_HELP);
      return;
    }

    if (normalizedCommand === "look") {
      logAction(getRoomSummary(gameState.currentRoomId));
      return;
    }

    if (normalizedCommand === "go" || normalizedCommand === "move") {
      const direction = args[0];
      handleMovement(direction);
      return;
    }

    logAction('Unknown command. Type "help".');
  };

  const setupCommandBar = () => {
    const form = document.querySelector("#command-form");
    const input = document.querySelector("#command-input");
    if (!form || !input) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      handleCommand(input.value);
      input.value = "";
      input.focus();
    });

    input.focus();
  };

  const renderAll = () => {
    renderStats(gameState);
    renderInventory(gameState);
    renderActionLog(gameState);
    renderSurroundings(gameState);
  };

  const initializeGame = () => {
    renderAll();
    const room = rooms[gameState.currentRoomId];
    if (room) {
      logAction(`Entered: ${room.name} — ${room.description}`);
    }
    setupCommandBar();
  };

  initializeGame();
})();
