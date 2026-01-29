import { rooms } from "../data/rooms.js";
import { gameState } from "../state.js";

const directionAliases = {
  n: "north",
  s: "south",
  e: "east",
  w: "west",
};

export const normalizeDirection = (value) => {
  if (!value) return null;
  const direction = value.toLowerCase().trim();
  if (directionAliases[direction]) return directionAliases[direction];
  if (["north", "south", "east", "west"].includes(direction)) {
    return direction;
  }
  return null;
};

export const moveToRoom = (roomId) => {
  if (!rooms[roomId]) {
    return { ok: false, reason: "You can't go that way." };
  }

  gameState.currentRoomId = roomId;
  if (!gameState.discoveredRooms.includes(roomId)) {
    gameState.discoveredRooms.push(roomId);
  }
  return { ok: true, roomId };
};

export const tryMove = (direction) => {
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
