(() => {
  window.OfficeDnD = window.OfficeDnD || {};
  window.OfficeDnD.systems = window.OfficeDnD.systems || {};
const rooms = window.OfficeDnD.data.rooms;
const gameState = window.OfficeDnD.state.gameState;

const directionAliases = {
  n: "north",
  s: "south",
  e: "east",
  w: "west",
};

window.OfficeDnD.systems.normalizeDirection = (value) => {
  if (!value) return null;
  const direction = value.toLowerCase().trim();
  if (directionAliases[direction]) return directionAliases[direction];
  if (["north", "south", "east", "west"].includes(direction)) {
    return direction;
  }
  return null;
};

window.OfficeDnD.systems.moveToRoom = (roomId) => {
  if (!rooms[roomId]) {
    return { ok: false, reason: "You can't go that way." };
  }

  gameState.currentRoomId = roomId;
  if (!gameState.discoveredRooms.includes(roomId)) {
    gameState.discoveredRooms.push(roomId);
  }
  return { ok: true, roomId };
};

window.OfficeDnD.systems.tryMove = (direction) => {
  const normalized = window.OfficeDnD.systems.normalizeDirection(direction);
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
})();