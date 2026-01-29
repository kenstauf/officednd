(() => {
  window.OfficeDnD = window.OfficeDnD || {};
  window.OfficeDnD.ui = window.OfficeDnD.ui || {};

const buildRoomLog = (code) => {
  const room = window.OfficeDnD.data.getRoomDefinition(code);
  window.OfficeDnD.ui.logEvent(`Entered: ${room.name} — ${room.description}`);
};

window.OfficeDnD.ui.logRoomEntry = (regionId, state) => {
  const region = state.map.regions[regionId];
  if (!region) return;
  buildRoomLog(region.code);
};

const isAnchorCell = (region, x, y) =>
  region.anchorCell.x === x && region.anchorCell.y === y;

window.OfficeDnD.ui.renderMap = (state, onAfterMove) => {
  const mapElement = document.querySelector("#map");
  if (!mapElement) return;

  mapElement.innerHTML = "";
  mapElement.classList.add("map-grid");
  mapElement.style.gridTemplateColumns = `repeat(${state.map.width}, minmax(0, 1fr))`;

  const regionCells = Array.from({ length: state.map.regions.length }, () => []);
  let hoveredRegionId = null;

  const setHoveredRegion = (regionId) => {
    if (hoveredRegionId === regionId) return;
    if (hoveredRegionId !== null) {
      regionCells[hoveredRegionId].forEach((cell) =>
        cell.classList.remove("hovered"),
      );
    }
    hoveredRegionId = regionId;
    if (regionId !== null) {
      regionCells[regionId].forEach((cell) => cell.classList.add("hovered"));
    }
  };

  for (let y = 0; y < state.map.height; y += 1) {
    for (let x = 0; x < state.map.width; x += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "map-cell";

      const regionId = state.map.cellToRegion[y][x];

      if (regionId === null) {
        cell.classList.add("empty");
        cell.disabled = true;
        mapElement.appendChild(cell);
        continue;
      }

      const region = state.map.regions[regionId];
      const isCurrent = regionId === state.map.currentRegionId;
      const isNeighbor = window.OfficeDnD.systems.isNeighborRegion(
        state.map.currentRegionId,
        regionId,
      );

      if (isCurrent) {
        cell.classList.add("active");
      } else if (isNeighbor) {
        cell.classList.add("adjacent");
      } else {
        cell.classList.add("inactive");
      }

      if (isAnchorCell(region, x, y)) {
        const label = document.createElement("span");
        label.className = "map-label";
        label.textContent = getRoomDefinition(region.code).name;
        cell.appendChild(label);
      }

      const rightNeighbor = state.map.cellToRegion[y][x + 1];
      const leftNeighbor = state.map.cellToRegion[y][x - 1];
      const downNeighbor = state.map.cellToRegion[y + 1]?.[x];
      const upNeighbor = state.map.cellToRegion[y - 1]?.[x];

      if (rightNeighbor === regionId) cell.classList.add("no-right");
      if (leftNeighbor === regionId) cell.classList.add("no-left");
      if (downNeighbor === regionId) cell.classList.add("no-bottom");
      if (upNeighbor === regionId) cell.classList.add("no-top");

      cell.addEventListener("mouseenter", () => setHoveredRegion(regionId));
      cell.addEventListener("mouseleave", () => setHoveredRegion(null));

      cell.addEventListener("click", () => {
        if (regionId === state.map.currentRegionId) {
          return;
        }

        if (!isNeighbor) {
          window.OfficeDnD.ui.logEvent("Too far.");
          return;
        }

        const result = window.OfficeDnD.systems.movePlayer(regionId);
        if (result.ok) {
          buildRoomLog(region.code);
          if (typeof onAfterMove === "function") {
            onAfterMove();
          }
        } else if (result.reason && result.reason !== "Already here.") {
          window.OfficeDnD.ui.logEvent(result.reason);
        }
      });

      regionCells[regionId].push(cell);
      mapElement.appendChild(cell);
    }
  }
};
})();