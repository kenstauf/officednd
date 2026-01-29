const ROOM_W = 110;
const ROOM_H = 64;
const ROOM_GAP = 30;
const ROOM_VARIATION = 12;
const WALL_THICKNESS = 2;
const INNER_WALL_INSET = 2;
const DOOR_GAP = 12;
const DETAIL_PADDING = 10;
const LABEL_FONT_SIZE = 12;

const COLOR_ROOM = "#d6d0c3";
const COLOR_ROOM_ALT = "#cfc8ba";
const COLOR_ROOM_BORDER = "#6b6b6b";
const COLOR_INNER_WALL = "#a39b8c";
const COLOR_CURRENT = "#9cc4ff";
const COLOR_CURRENT_OUTLINE = "#3f4a56";
const COLOR_LINE = "#8a8275";
const COLOR_TEXT = "#111111";
const COLOR_DETAIL = "#bfb7a8";

let canvas = null;
let ctx = null;
let panX = 0;
let panY = 0;
let isDragging = false;
let lastPointer = { x: 0, y: 0 };
let lastRenderState = null;
let lastRenderRooms = null;

const getRoomsArray = (roomsInput) => {
  if (!roomsInput) return [];
  if (Array.isArray(roomsInput)) return roomsInput;
  return Object.entries(roomsInput).map(([id, room]) => ({ id, ...room }));
};

const getRoomPixel = (room) => ({
  x: room.pos.x * (ROOM_W + ROOM_GAP),
  y: room.pos.y * (ROOM_H + ROOM_GAP),
});

const hashRoomId = (roomId = "") => {
  let hash = 0;
  for (let i = 0; i < roomId.length; i += 1) {
    hash = (hash * 31 + roomId.charCodeAt(i)) % 9973;
  }
  return hash;
};

const getRoomDimensions = (room) => {
  const hash = hashRoomId(room.id ?? "");
  const widthOffset = ((hash % 5) - 2) * (ROOM_VARIATION / 4);
  const heightOffset = (((Math.floor(hash / 5) % 5) - 2) * ROOM_VARIATION) / 5;
  return {
    width: ROOM_W + widthOffset,
    height: ROOM_H + heightOffset,
  };
};

const drawWallStroke = (x, y, width, height, exits, inset, gapSize) => {
  const left = x + inset;
  const top = y + inset;
  const right = x + width - inset;
  const bottom = y + height - inset;
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  ctx.beginPath();
  if (exits?.north) {
    ctx.moveTo(left, top);
    ctx.lineTo(centerX - gapSize / 2, top);
    ctx.moveTo(centerX + gapSize / 2, top);
    ctx.lineTo(right, top);
  } else {
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
  }

  if (exits?.south) {
    ctx.moveTo(left, bottom);
    ctx.lineTo(centerX - gapSize / 2, bottom);
    ctx.moveTo(centerX + gapSize / 2, bottom);
    ctx.lineTo(right, bottom);
  } else {
    ctx.moveTo(left, bottom);
    ctx.lineTo(right, bottom);
  }

  if (exits?.west) {
    ctx.moveTo(left, top);
    ctx.lineTo(left, centerY - gapSize / 2);
    ctx.moveTo(left, centerY + gapSize / 2);
    ctx.lineTo(left, bottom);
  } else {
    ctx.moveTo(left, top);
    ctx.lineTo(left, bottom);
  }

  if (exits?.east) {
    ctx.moveTo(right, top);
    ctx.lineTo(right, centerY - gapSize / 2);
    ctx.moveTo(right, centerY + gapSize / 2);
    ctx.lineTo(right, bottom);
  } else {
    ctx.moveTo(right, top);
    ctx.lineTo(right, bottom);
  }

  ctx.stroke();
};

const drawRoomDetails = (x, y, width, height, room) => {
  const hash = hashRoomId(room.id ?? "");
  const detailCount = hash % 3 === 0 ? 2 : 1;
  const detailWidth = Math.min(18, Math.max(12, width / 5));
  const detailHeight = Math.min(10, Math.max(8, height / 5));
  const startX = x + DETAIL_PADDING;
  const startY = y + DETAIL_PADDING;

  ctx.fillStyle = COLOR_DETAIL;
  ctx.strokeStyle = COLOR_INNER_WALL;
  ctx.lineWidth = 1;

  for (let i = 0; i < detailCount; i += 1) {
    const offsetX = (hash % 2 === 0 ? 1 : -1) * i * (detailWidth + 6);
    const offsetY = i * (detailHeight + 4);
    const detailX = Math.min(
      x + width - DETAIL_PADDING - detailWidth,
      Math.max(x + DETAIL_PADDING, startX + offsetX),
    );
    const detailY = Math.min(
      y + height - DETAIL_PADDING - detailHeight,
      Math.max(y + DETAIL_PADDING, startY + offsetY),
    );
    ctx.fillRect(detailX, detailY, detailWidth, detailHeight);
    ctx.strokeRect(detailX, detailY, detailWidth, detailHeight);
  }
};

const resizeCanvasForDpr = () => {
  if (!canvas || !ctx) return { width: 0, height: 0, dpr: 1 };
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const scaledWidth = Math.max(1, Math.floor(width * dpr));
  const scaledHeight = Math.max(1, Math.floor(height * dpr));

  if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  return { width, height, dpr };
};

window.OfficeDnD.ui.resetMiniMapPan = () => {
  panX = 0;
  panY = 0;
};

const truncateLabel = (label, maxWidth) => {
  if (!ctx) return label;
  if (ctx.measureText(label).width <= maxWidth) {
    return label;
  }
  const ellipsis = "…";
  const ellipsisWidth = ctx.measureText(ellipsis).width;
  let truncated = label;
  while (truncated.length > 0) {
    truncated = truncated.slice(0, -1);
    if (ctx.measureText(truncated).width + ellipsisWidth <= maxWidth) {
      return `${truncated}${ellipsis}`;
    }
  }
  return label;
};

const isRoomDiscovered = (state, roomId) => {
  const discovered = state?.discoveredRooms ?? [];
  return discovered.includes(roomId);
};

const attachDragHandlers = (canvasEl) => {
  canvasEl.addEventListener("pointerdown", (event) => {
    isDragging = true;
    lastPointer = { x: event.clientX, y: event.clientY };
    canvasEl.setPointerCapture?.(event.pointerId);
    canvasEl.classList.add("dragging");
  });

  canvasEl.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    panX += dx;
    panY += dy;
    lastPointer = { x: event.clientX, y: event.clientY };
    if (lastRenderState && lastRenderRooms) {
      window.OfficeDnD.ui.renderMiniMap(lastRenderState, lastRenderRooms);
    }
  });

  const stopDrag = (event) => {
    if (!isDragging) return;
    isDragging = false;
    canvasEl.releasePointerCapture?.(event.pointerId);
    canvasEl.classList.remove("dragging");
  };

  canvasEl.addEventListener("pointerup", stopDrag);
  canvasEl.addEventListener("pointercancel", stopDrag);
  canvasEl.addEventListener("pointerleave", stopDrag);
};

window.OfficeDnD.ui.initMiniMap = (canvasEl) => {
  if (!canvasEl) return;
  canvas = canvasEl;
  ctx = canvasEl.getContext("2d");
  attachDragHandlers(canvasEl);
};

window.OfficeDnD.ui.renderMiniMap = (state, roomsInput) => {
  if (!ctx || !canvas) return;
  lastRenderState = state;
  lastRenderRooms = roomsInput;

  const rooms = getRoomsArray(roomsInput);
  const currentRoom = rooms.find((room) => room.id === state.currentRoomId);

  const { width, height } = resizeCanvasForDpr();
  ctx.clearRect(0, 0, width, height);

  if (!currentRoom?.pos) return;

  const currentPixel = getRoomPixel(currentRoom);
  const centerX = width / 2 + panX;
  const centerY = height / 2 + panY;

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = COLOR_LINE;

  const drawnConnections = new Set();

  rooms.forEach((room) => {
    if (!room?.pos) return;
    if (!isRoomDiscovered(state, room.id) && room.id !== state.currentRoomId) {
      return;
    }
    const roomPixel = getRoomPixel(room);
    const roomCenter = {
      x: roomPixel.x - currentPixel.x + centerX,
      y: roomPixel.y - currentPixel.y + centerY,
    };

    Object.values(room.exits ?? {}).forEach((neighborId) => {
      const neighbor = rooms.find((entry) => entry.id === neighborId);
      if (!neighbor?.pos) return;
      const neighborDiscovered =
        isRoomDiscovered(state, neighbor.id) ||
        neighbor.id === state.currentRoomId;
      if (!neighborDiscovered) return;

      const key = [room.id, neighborId].sort().join("|");
      if (drawnConnections.has(key)) return;
      drawnConnections.add(key);

      const neighborPixel = getRoomPixel(neighbor);
      const neighborCenter = {
        x: neighborPixel.x - currentPixel.x + centerX,
        y: neighborPixel.y - currentPixel.y + centerY,
      };

      ctx.beginPath();
      ctx.moveTo(roomCenter.x, roomCenter.y);
      ctx.lineTo(neighborCenter.x, neighborCenter.y);
      ctx.stroke();
    });
  });

  ctx.font = `${LABEL_FONT_SIZE}px "MS Sans Serif", "Tahoma", "Verdana", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  rooms.forEach((room) => {
    if (!room?.pos) return;
    const isCurrent = room.id === state.currentRoomId;
    const discovered = isRoomDiscovered(state, room.id) || isCurrent;
    if (!discovered) return;
    const roomPixel = getRoomPixel(room);
    const { width: roomWidth, height: roomHeight } = getRoomDimensions(room);
    const drawX = roomPixel.x - currentPixel.x + centerX - roomWidth / 2;
    const drawY = roomPixel.y - currentPixel.y + centerY - roomHeight / 2;

    const fillColor = isCurrent
      ? COLOR_CURRENT
      : hashRoomId(room.id ?? "") % 2 === 0
        ? COLOR_ROOM
        : COLOR_ROOM_ALT;
    ctx.fillStyle = fillColor;
    ctx.fillRect(drawX, drawY, roomWidth, roomHeight);

    ctx.strokeStyle = COLOR_ROOM_BORDER;
    ctx.lineWidth = isCurrent ? WALL_THICKNESS + 0.5 : WALL_THICKNESS;
    drawWallStroke(drawX, drawY, roomWidth, roomHeight, room.exits, 0, DOOR_GAP);

    ctx.strokeStyle = COLOR_INNER_WALL;
    ctx.lineWidth = 1;
    drawWallStroke(
      drawX,
      drawY,
      roomWidth,
      roomHeight,
      room.exits,
      INNER_WALL_INSET,
      DOOR_GAP - 2,
    );

    if (!isCurrent && roomWidth > 60 && roomHeight > 42) {
      drawRoomDetails(drawX, drawY, roomWidth, roomHeight, room);
    }

    if (isCurrent) {
      ctx.strokeStyle = COLOR_CURRENT_OUTLINE;
      ctx.lineWidth = WALL_THICKNESS + 1;
      drawWallStroke(
        drawX - 3,
        drawY - 3,
        roomWidth + 6,
        roomHeight + 6,
        room.exits,
        0,
        DOOR_GAP,
      );
    }

    if (room.name && discovered) {
      ctx.fillStyle = COLOR_TEXT;
      const maxTextWidth = roomWidth - 12;
      const label = truncateLabel(room.name, maxTextWidth);
      ctx.fillText(label, drawX + roomWidth / 2, drawY + roomHeight / 2);
    }
  });
};
