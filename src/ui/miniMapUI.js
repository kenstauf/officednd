const CELL = 28;
const GAP = 10;
const ROOM_W = CELL * 1.2;
const ROOM_H = CELL * 0.9;

const COLOR_BG = "#0b0f14";
const COLOR_ROOM = "#56606b";
const COLOR_ROOM_DARK = "#3b424a";
const COLOR_CURRENT = "#4da3ff";
const COLOR_OUTLINE = "#c7d2fe";
const COLOR_LINE = "#1f2937";

let canvas = null;
let ctx = null;
let panX = 0;
let panY = 0;
let isDragging = false;
let lastPointer = { x: 0, y: 0 };

const getRoomsArray = (roomsInput) => {
  if (!roomsInput) return [];
  if (Array.isArray(roomsInput)) return roomsInput;
  return Object.entries(roomsInput).map(([id, room]) => ({ id, ...room }));
};

const getRoomPixel = (room) => ({
  x: room.pos.x * (CELL + GAP),
  y: room.pos.y * (CELL + GAP),
});

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

  const rooms = getRoomsArray(roomsInput);
  const currentRoom = rooms.find((room) => room.id === state.currentRoomId);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!currentRoom?.pos) return;

  const currentPixel = getRoomPixel(currentRoom);
  const centerX = canvas.width / 2 + panX;
  const centerY = canvas.height / 2 + panY;

  ctx.lineWidth = 2;
  ctx.strokeStyle = COLOR_LINE;

  const drawnConnections = new Set();

  rooms.forEach((room) => {
    if (!room?.pos) return;
    const roomPixel = getRoomPixel(room);
    const roomCenter = {
      x: roomPixel.x - currentPixel.x + centerX,
      y: roomPixel.y - currentPixel.y + centerY,
    };

    Object.values(room.exits ?? {}).forEach((neighborId) => {
      const neighbor = rooms.find((entry) => entry.id === neighborId);
      if (!neighbor?.pos) return;

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

  rooms.forEach((room) => {
    if (!room?.pos) return;
    const roomPixel = getRoomPixel(room);
    const drawX = roomPixel.x - currentPixel.x + centerX - ROOM_W / 2;
    const drawY = roomPixel.y - currentPixel.y + centerY - ROOM_H / 2;
    const isCurrent = room.id === state.currentRoomId;

    ctx.fillStyle = isCurrent ? COLOR_CURRENT : COLOR_ROOM;
    ctx.fillRect(drawX, drawY, ROOM_W, ROOM_H);

    if (!isCurrent) {
      ctx.fillStyle = COLOR_ROOM_DARK;
      ctx.fillRect(drawX + 2, drawY + 2, ROOM_W - 4, ROOM_H - 4);
    }

    if (isCurrent) {
      ctx.strokeStyle = COLOR_OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(drawX - 2, drawY - 2, ROOM_W + 4, ROOM_H + 4);
    }
  });
};
