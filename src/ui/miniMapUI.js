const ROOM_W = 110;
const ROOM_H = 64;
const ROOM_GAP = 30;

const COLOR_BG = "#e9e1cf";
const COLOR_ROOM = "#d6d0c3";
const COLOR_ROOM_BORDER = "#6b6b6b";
const COLOR_CURRENT = "#7db3ff";
const COLOR_OUTLINE = "#3d4650";
const COLOR_LINE = "#8a8172";
const COLOR_TEXT = "#111111";

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
      renderMiniMap(lastRenderState, lastRenderRooms);
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

export const initMiniMap = (canvasEl) => {
  if (!canvasEl) return;
  canvas = canvasEl;
  ctx = canvasEl.getContext("2d");
  attachDragHandlers(canvasEl);
};

export const renderMiniMap = (state, roomsInput) => {
  if (!ctx || !canvas) return;
  lastRenderState = state;
  lastRenderRooms = roomsInput;

  const rooms = getRoomsArray(roomsInput);
  const currentRoom = rooms.find((room) => room.id === state.currentRoomId);

  const { width, height } = resizeCanvasForDpr();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, width, height);

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

  ctx.font = '12px "MS Sans Serif", "Tahoma", "Verdana", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  rooms.forEach((room) => {
    if (!room?.pos) return;
    const isCurrent = room.id === state.currentRoomId;
    const discovered = isRoomDiscovered(state, room.id) || isCurrent;
    if (!discovered) return;
    const roomPixel = getRoomPixel(room);
    const drawX = roomPixel.x - currentPixel.x + centerX - ROOM_W / 2;
    const drawY = roomPixel.y - currentPixel.y + centerY - ROOM_H / 2;

    ctx.fillStyle = isCurrent ? COLOR_CURRENT : COLOR_ROOM;
    ctx.fillRect(drawX, drawY, ROOM_W, ROOM_H);

    ctx.strokeStyle = COLOR_ROOM_BORDER;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(drawX, drawY, ROOM_W, ROOM_H);

    if (isCurrent) {
      ctx.strokeStyle = COLOR_OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(drawX - 3, drawY - 3, ROOM_W + 6, ROOM_H + 6);
    }

    if (room.name) {
      ctx.fillStyle = COLOR_TEXT;
      const maxTextWidth = ROOM_W - 12;
      const label = truncateLabel(room.name, maxTextWidth);
      ctx.fillText(label, drawX + ROOM_W / 2, drawY + ROOM_H / 2);
    }
  });
};
