import { getRoom } from "../data/mapData.js";
import { movePlayer, isAdjacent } from "../systems/movement.js";
import { logEvent } from "./logUI.js";

const buildRoomLog = (x, y) => {
  const room = getRoom(x, y);
  logEvent(`Entered: ${room.name} — ${room.description}`);
  const objects = room.objects.length > 0 ? room.objects.join(", ") : "None";
  const npcs = room.npcs.length > 0 ? room.npcs.join(", ") : "None";
  logEvent(`Objects: ${objects}`);
  logEvent(`NPCs: ${npcs}`);
};

export const logRoomEntry = (x, y) => {
  buildRoomLog(x, y);
};

export const renderMap = (state, onAfterMove) => {
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
          logEvent("Too far.");
          return;
        }

        const result = movePlayer(x, y);
        if (result.ok) {
          buildRoomLog(x, y);
          if (typeof onAfterMove === "function") {
            onAfterMove();
          }
        } else if (result.reason) {
          logEvent(result.reason);
        }
      });

      mapElement.appendChild(cell);
    }
  }
};
