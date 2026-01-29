const rooms = window.OfficeDnD.data.rooms;
const gameState = window.OfficeDnD.state.gameState;

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

window.OfficeDnD.ui.getRoomSummary = (roomId) => {
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

window.OfficeDnD.ui.renderSurroundings = (state = gameState) => {
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
