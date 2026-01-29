(() => {
  window.OfficeDnD = window.OfficeDnD || {};
const gameState = window.OfficeDnD.state.gameState;
const rooms = window.OfficeDnD.data.rooms;

const renderAll = () => {
  window.OfficeDnD.ui.renderStats(gameState);
  window.OfficeDnD.ui.renderInventory(gameState);
  window.OfficeDnD.ui.renderLog(gameState);
  window.OfficeDnD.ui.renderSurroundings(gameState);
  window.OfficeDnD.ui.renderMiniMap(gameState, rooms);
};

const setupMiniMapResize = () => {
  if (typeof window === "undefined") return;
  window.addEventListener("resize", () => {
    window.OfficeDnD.ui.renderMiniMap(gameState, rooms);
  });
};

const initializeGame = () => {
  const miniMapCanvas = document.querySelector("#miniMap");
  window.OfficeDnD.ui.initMiniMap(miniMapCanvas);
  setupMiniMapResize();

  if (!gameState.discoveredRooms.includes(gameState.currentRoomId)) {
    gameState.discoveredRooms.push(gameState.currentRoomId);
  }

  const isDev =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isDev) {
    window.OfficeDnD.systems.validateRoomPositions(rooms);
  }

  renderAll();
  const room = rooms[gameState.currentRoomId];
  if (room) {
    window.OfficeDnD.ui.logEvent(`Entered: ${room.name} — ${room.description}`);
  }
  window.OfficeDnD.ui.setupCommandBar();
};

initializeGame();
})();