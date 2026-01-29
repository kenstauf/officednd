(() => {
  const rooms = {
    breakRoom: {
      name: "Break Room",
      description: "The smell of burnt coffee hangs in the air.",
      pos: { x: -1, y: 0 },
      objects: ["coffee urn", "microwave", "stack of mugs"],
      npcs: ["Pat from Payroll"],
      exits: {
        east: "hallway",
      },
    },
    hallway: {
      name: "Hallway",
      description: "A quiet corridor lined with motivational posters.",
      pos: { x: 0, y: 0 },
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
      pos: { x: 1, y: 0 },
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
      pos: { x: 0, y: 1 },
      objects: ["box of toner", "mop bucket"],
      npcs: [],
      exits: {
        north: "hallway",
      },
    },
    itCorner: {
      name: "IT Corner",
      description: "Server fans hum next to a jungle of cables.",
      pos: { x: 1, y: 1 },
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
      pos: { x: 0, y: -1 },
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
    discoveredRooms: [],
    log: [],
  };

  const MAX_LOG_ENTRIES = 50;
  const MINI_MAP_CELL = 26;
  const MINI_MAP_GAP = 8;
  const MINI_MAP_ROOM_W = MINI_MAP_CELL * 1.2;
  const MINI_MAP_ROOM_H = MINI_MAP_CELL * 0.9;
  const MINI_MAP_ROOM_VARIATION = 6;
  const MINI_MAP_VIEW_W = 320;
  const MINI_MAP_VIEW_H = 180;
  const MINI_MAP_PAN_LIMIT_RATIO = 0.4;
  const MINI_MAP_WALL_THICKNESS = 2;
  const MINI_MAP_INNER_WALL_INSET = 2;
  const MINI_MAP_DOOR_GAP = 10;
  const MINI_MAP_DETAIL_PADDING = 8;
  const MINI_MAP_LABEL_FONT_SIZE = 11;
  const MINI_MAP_COLOR_ROOM = "#d6d0c3";
  const MINI_MAP_COLOR_ROOM_ALT = "#cfc8ba";
  const MINI_MAP_COLOR_ROOM_BORDER = "#6b6b6b";
  const MINI_MAP_COLOR_INNER_WALL = "#a39b8c";
  const MINI_MAP_COLOR_CURRENT = "#9cc4ff";
  const MINI_MAP_COLOR_CURRENT_OUTLINE = "#3f4a56";
  const MINI_MAP_COLOR_LINE = "#8a8275";
  const MINI_MAP_COLOR_TEXT = "#111111";
  const MINI_MAP_COLOR_DETAIL = "#bfb7a8";

  let miniMapCanvas = null;
  let miniMapCtx = null;
  let miniMapPanX = 0;
  let miniMapPanY = 0;
  let miniMapDragging = false;
  let miniMapLastPointer = { x: 0, y: 0 };
  let miniMapDpr = 1;

  const validateRoomPositions = (roomsData) => {
    if (!roomsData || typeof roomsData !== "object") {
      console.warn("Map validation skipped: rooms data missing.");
      return;
    }

    const seenPositions = new Map();
    let hasBrokenRoom = false;

    Object.entries(roomsData).forEach(([roomId, room]) => {
      if (!room?.pos) {
        console.warn(`Room "${roomId}" is missing pos data.`);
        hasBrokenRoom = true;
        return;
      }

      const { x, y } = room.pos;
      const hasValidNumbers = Number.isFinite(x) && Number.isFinite(y);

      if (!hasValidNumbers) {
        console.warn(`Room "${roomId}" has invalid pos coordinates.`, room.pos);
        hasBrokenRoom = true;
        return;
      }

      const key = `${x},${y}`;
      if (seenPositions.has(key)) {
        console.warn(
          `Rooms "${seenPositions.get(key)}" and "${roomId}" share position ${key}.`,
        );
      } else {
        seenPositions.set(key, roomId);
      }
    });

    if (hasBrokenRoom) {
      console.warn("Map validation found missing or invalid room positions.");
    }
  };

  const getMiniMapPixel = (room) => ({
    x: room.pos.x * (MINI_MAP_CELL + MINI_MAP_GAP),
    y: room.pos.y * (MINI_MAP_CELL + MINI_MAP_GAP),
  });

  const hashRoomId = (roomId = "") => {
    let hash = 0;
    for (let i = 0; i < roomId.length; i += 1) {
      hash = (hash * 31 + roomId.charCodeAt(i)) % 9973;
    }
    return hash;
  };

  const getMiniMapRoomDimensions = (room) => {
    const hash = hashRoomId(room.id ?? "");
    const widthOffset =
      ((hash % 5) - 2) * (MINI_MAP_ROOM_VARIATION / 4);
    const heightOffset =
      (((Math.floor(hash / 5) % 5) - 2) * MINI_MAP_ROOM_VARIATION) / 5;
    return {
      width: MINI_MAP_ROOM_W + widthOffset,
      height: MINI_MAP_ROOM_H + heightOffset,
    };
  };

  const drawMiniMapWallStroke = (x, y, width, height, exits, inset, gapSize) => {
    const left = x + inset;
    const top = y + inset;
    const right = x + width - inset;
    const bottom = y + height - inset;
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;

    miniMapCtx.beginPath();
    if (exits?.north) {
      miniMapCtx.moveTo(left, top);
      miniMapCtx.lineTo(centerX - gapSize / 2, top);
      miniMapCtx.moveTo(centerX + gapSize / 2, top);
      miniMapCtx.lineTo(right, top);
    } else {
      miniMapCtx.moveTo(left, top);
      miniMapCtx.lineTo(right, top);
    }

    if (exits?.south) {
      miniMapCtx.moveTo(left, bottom);
      miniMapCtx.lineTo(centerX - gapSize / 2, bottom);
      miniMapCtx.moveTo(centerX + gapSize / 2, bottom);
      miniMapCtx.lineTo(right, bottom);
    } else {
      miniMapCtx.moveTo(left, bottom);
      miniMapCtx.lineTo(right, bottom);
    }

    if (exits?.west) {
      miniMapCtx.moveTo(left, top);
      miniMapCtx.lineTo(left, centerY - gapSize / 2);
      miniMapCtx.moveTo(left, centerY + gapSize / 2);
      miniMapCtx.lineTo(left, bottom);
    } else {
      miniMapCtx.moveTo(left, top);
      miniMapCtx.lineTo(left, bottom);
    }

    if (exits?.east) {
      miniMapCtx.moveTo(right, top);
      miniMapCtx.lineTo(right, centerY - gapSize / 2);
      miniMapCtx.moveTo(right, centerY + gapSize / 2);
      miniMapCtx.lineTo(right, bottom);
    } else {
      miniMapCtx.moveTo(right, top);
      miniMapCtx.lineTo(right, bottom);
    }

    miniMapCtx.stroke();
  };

  const drawMiniMapDetails = (x, y, width, height, room) => {
    const hash = hashRoomId(room.id ?? "");
    const detailCount = hash % 3 === 0 ? 2 : 1;
    const detailWidth = Math.min(14, Math.max(10, width / 5));
    const detailHeight = Math.min(8, Math.max(6, height / 5));
    const startX = x + MINI_MAP_DETAIL_PADDING;
    const startY = y + MINI_MAP_DETAIL_PADDING;

    miniMapCtx.fillStyle = MINI_MAP_COLOR_DETAIL;
    miniMapCtx.strokeStyle = MINI_MAP_COLOR_INNER_WALL;
    miniMapCtx.lineWidth = 1;

    for (let i = 0; i < detailCount; i += 1) {
      const offsetX = (hash % 2 === 0 ? 1 : -1) * i * (detailWidth + 4);
      const offsetY = i * (detailHeight + 3);
      const detailX = Math.min(
        x + width - MINI_MAP_DETAIL_PADDING - detailWidth,
        Math.max(x + MINI_MAP_DETAIL_PADDING, startX + offsetX),
      );
      const detailY = Math.min(
        y + height - MINI_MAP_DETAIL_PADDING - detailHeight,
        Math.max(y + MINI_MAP_DETAIL_PADDING, startY + offsetY),
      );
      miniMapCtx.fillRect(detailX, detailY, detailWidth, detailHeight);
      miniMapCtx.strokeRect(detailX, detailY, detailWidth, detailHeight);
    }
  };

  const truncateMiniMapLabel = (label, maxWidth) => {
    if (miniMapCtx.measureText(label).width <= maxWidth) {
      return label;
    }
    const ellipsis = "…";
    const ellipsisWidth = miniMapCtx.measureText(ellipsis).width;
    let truncated = label;
    while (truncated.length > 0) {
      truncated = truncated.slice(0, -1);
      if (miniMapCtx.measureText(truncated).width + ellipsisWidth <= maxWidth) {
        return `${truncated}${ellipsis}`;
      }
    }
    return label;
  };

  const isRoomDiscovered = (state, roomId) =>
    state.discoveredRooms.includes(roomId);

  const attachMiniMapDragHandlers = (canvasEl) => {
    canvasEl.addEventListener("pointerdown", (event) => {
      miniMapDragging = true;
      miniMapLastPointer = { x: event.clientX, y: event.clientY };
      canvasEl.setPointerCapture?.(event.pointerId);
      canvasEl.classList.add("dragging");
    });

    canvasEl.addEventListener("pointermove", (event) => {
      if (!miniMapDragging) return;
      const dx = event.clientX - miniMapLastPointer.x;
      const dy = event.clientY - miniMapLastPointer.y;
      miniMapPanX += dx;
      miniMapPanY += dy;
      clampMiniMapPan();
      miniMapLastPointer = { x: event.clientX, y: event.clientY };
      renderMiniMap(gameState);
    });

    const stopDrag = (event) => {
      if (!miniMapDragging) return;
      miniMapDragging = false;
      canvasEl.releasePointerCapture?.(event.pointerId);
      canvasEl.classList.remove("dragging");
    };

    canvasEl.addEventListener("pointerup", stopDrag);
    canvasEl.addEventListener("pointercancel", stopDrag);
    canvasEl.addEventListener("pointerleave", stopDrag);
  };

  const getMiniMapViewport = () => {
    if (!miniMapCanvas) {
      return { width: MINI_MAP_VIEW_W, height: MINI_MAP_VIEW_H };
    }
    const rect = miniMapCanvas.getBoundingClientRect();
    return {
      width: rect.width || MINI_MAP_VIEW_W,
      height: rect.height || MINI_MAP_VIEW_H,
    };
  };

  const sizeMiniMapCanvas = () => {
    if (!miniMapCanvas) return;
    const wrapper = miniMapCanvas.parentElement;
    const availableWidth = wrapper?.clientWidth
      ? wrapper.clientWidth - 4
      : MINI_MAP_VIEW_W;
    const targetWidth = Math.min(
      MINI_MAP_VIEW_W,
      Math.max(220, availableWidth),
    );
    const targetHeight = Math.round(
      targetWidth * (MINI_MAP_VIEW_H / MINI_MAP_VIEW_W),
    );
    miniMapDpr = window.devicePixelRatio || 1;
    miniMapCanvas.style.width = `${targetWidth}px`;
    miniMapCanvas.style.height = `${targetHeight}px`;
    miniMapCanvas.width = Math.round(targetWidth * miniMapDpr);
    miniMapCanvas.height = Math.round(targetHeight * miniMapDpr);
    if (miniMapCtx) {
      miniMapCtx.setTransform(miniMapDpr, 0, 0, miniMapDpr, 0, 0);
    }
  };

  const clampMiniMapPan = () => {
    const viewport = getMiniMapViewport();
    const limitX = viewport.width * MINI_MAP_PAN_LIMIT_RATIO;
    const limitY = viewport.height * MINI_MAP_PAN_LIMIT_RATIO;
    miniMapPanX = Math.max(-limitX, Math.min(limitX, miniMapPanX));
    miniMapPanY = Math.max(-limitY, Math.min(limitY, miniMapPanY));
  };

  const resetMiniMapPan = () => {
    miniMapPanX = 0;
    miniMapPanY = 0;
  };

  const initMiniMap = () => {
    miniMapCanvas = document.querySelector("#miniMap");
    if (!miniMapCanvas) return;
    miniMapCtx = miniMapCanvas.getContext("2d");
    attachMiniMapDragHandlers(miniMapCanvas);
    sizeMiniMapCanvas();
    window.addEventListener("resize", () => {
      sizeMiniMapCanvas();
      renderMiniMap(gameState);
    });
  };

  const renderMiniMap = (state = gameState) => {
    if (!miniMapCtx || !miniMapCanvas) return;

    const currentRoom = rooms[state.currentRoomId];
    if (!currentRoom?.pos) return;

    const viewport = getMiniMapViewport();
    miniMapCtx.clearRect(0, 0, viewport.width, viewport.height);

    const currentPixel = getMiniMapPixel(currentRoom);
    const centerX = viewport.width / 2 + miniMapPanX;
    const centerY = viewport.height / 2 + miniMapPanY;

    miniMapCtx.lineWidth = 1.5;
    miniMapCtx.strokeStyle = MINI_MAP_COLOR_LINE;

    const drawnConnections = new Set();

    Object.entries(rooms).forEach(([roomId, room]) => {
      if (!room?.pos) return;
      if (!isRoomDiscovered(state, roomId) && roomId !== state.currentRoomId) {
        return;
      }
      const roomPixel = getMiniMapPixel(room);
      const roomCenter = {
        x: roomPixel.x - currentPixel.x + centerX,
        y: roomPixel.y - currentPixel.y + centerY,
      };

      Object.values(room.exits ?? {}).forEach((neighborId) => {
        const neighbor = rooms[neighborId];
        if (!neighbor?.pos) return;
        const neighborDiscovered =
          isRoomDiscovered(state, neighborId) ||
          neighborId === state.currentRoomId;
        if (!neighborDiscovered) return;

        const key = [roomId, neighborId].sort().join("|");
        if (drawnConnections.has(key)) return;
        drawnConnections.add(key);

        const neighborPixel = getMiniMapPixel(neighbor);
        const neighborCenter = {
          x: neighborPixel.x - currentPixel.x + centerX,
          y: neighborPixel.y - currentPixel.y + centerY,
        };

        miniMapCtx.beginPath();
        miniMapCtx.moveTo(roomCenter.x, roomCenter.y);
        miniMapCtx.lineTo(neighborCenter.x, neighborCenter.y);
        miniMapCtx.stroke();
      });
    });

    miniMapCtx.font = `${MINI_MAP_LABEL_FONT_SIZE}px "MS Sans Serif", "Tahoma", "Verdana", sans-serif`;
    miniMapCtx.textAlign = "center";
    miniMapCtx.textBaseline = "middle";

    Object.entries(rooms).forEach(([roomId, room]) => {
      if (!room?.pos) return;
      const isCurrent = roomId === state.currentRoomId;
      const discovered = isRoomDiscovered(state, roomId) || isCurrent;
      if (!discovered) return;
      const roomPixel = getMiniMapPixel(room);
      const { width: roomWidth, height: roomHeight } =
        getMiniMapRoomDimensions({ ...room, id: roomId });
      const drawX = roomPixel.x - currentPixel.x + centerX - roomWidth / 2;
      const drawY = roomPixel.y - currentPixel.y + centerY - roomHeight / 2;

      const fillColor = isCurrent
        ? MINI_MAP_COLOR_CURRENT
        : hashRoomId(roomId) % 2 === 0
          ? MINI_MAP_COLOR_ROOM
          : MINI_MAP_COLOR_ROOM_ALT;
      miniMapCtx.fillStyle = fillColor;
      miniMapCtx.fillRect(drawX, drawY, roomWidth, roomHeight);

      miniMapCtx.strokeStyle = MINI_MAP_COLOR_ROOM_BORDER;
      miniMapCtx.lineWidth = isCurrent
        ? MINI_MAP_WALL_THICKNESS + 0.5
        : MINI_MAP_WALL_THICKNESS;
      drawMiniMapWallStroke(
        drawX,
        drawY,
        roomWidth,
        roomHeight,
        room.exits,
        0,
        MINI_MAP_DOOR_GAP,
      );

      miniMapCtx.strokeStyle = MINI_MAP_COLOR_INNER_WALL;
      miniMapCtx.lineWidth = 1;
      drawMiniMapWallStroke(
        drawX,
        drawY,
        roomWidth,
        roomHeight,
        room.exits,
        MINI_MAP_INNER_WALL_INSET,
        MINI_MAP_DOOR_GAP - 2,
      );

      if (!isCurrent && roomWidth > 48 && roomHeight > 32) {
        drawMiniMapDetails(drawX, drawY, roomWidth, roomHeight, {
          ...room,
          id: roomId,
        });
      }

      if (isCurrent) {
        miniMapCtx.strokeStyle = MINI_MAP_COLOR_CURRENT_OUTLINE;
        miniMapCtx.lineWidth = MINI_MAP_WALL_THICKNESS + 1;
        drawMiniMapWallStroke(
          drawX - 2,
          drawY - 2,
          roomWidth + 4,
          roomHeight + 4,
          room.exits,
          0,
          MINI_MAP_DOOR_GAP,
        );
      }

      if (room.name && discovered) {
        miniMapCtx.fillStyle = MINI_MAP_COLOR_TEXT;
        const maxTextWidth = roomWidth - 10;
        const label = truncateMiniMapLabel(room.name, maxTextWidth);
        miniMapCtx.fillText(label, drawX + roomWidth / 2, drawY + roomHeight / 2);
      }
    });
  };

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
    if (!gameState.discoveredRooms.includes(nextRoomId)) {
      gameState.discoveredRooms.push(nextRoomId);
    }
    return { ok: true, roomId: nextRoomId, direction: normalized };
  };

  const COMMAND_HELP =
    'Available commands: help, look, go <direction>, move <direction>. Directions: north/south/east/west (n/s/e/w).';

  const handleMovement = (direction) => {
    const result = tryMove(direction);
    if (result.ok) {
      const destination = rooms[result.roomId];
      logAction(`You go ${result.direction} to ${destination.name}.`);
      resetMiniMapPan();
      renderSurroundings(gameState);
      renderMiniMap(gameState);
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
    renderMiniMap(gameState);
  };

  const initializeGame = () => {
    initMiniMap();
    if (!gameState.discoveredRooms.includes(gameState.currentRoomId)) {
      gameState.discoveredRooms.push(gameState.currentRoomId);
    }
    const isDev =
      ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (isDev) {
      validateRoomPositions(rooms);
    }

    renderAll();
    const room = rooms[gameState.currentRoomId];
    if (room) {
      logAction(`Entered: ${room.name} — ${room.description}`);
    }
    setupCommandBar();
  };

  initializeGame();
})();
