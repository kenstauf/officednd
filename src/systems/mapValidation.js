(() => {
  window.OfficeDnD = window.OfficeDnD || {};
  window.OfficeDnD.systems = window.OfficeDnD.systems || {};

window.OfficeDnD.systems.validateRoomPositions = (rooms) => {
  if (!rooms || typeof rooms !== "object") {
    console.warn("Map validation skipped: rooms data missing.");
    return;
  }

  const seenPositions = new Map();
  const roomEntries = Object.entries(rooms);
  let hasBrokenRoom = false;

  roomEntries.forEach(([roomId, room]) => {
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
})();