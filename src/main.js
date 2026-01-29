const OfficeDnD = window.OfficeDnD;
const gameState = OfficeDnD.state.gameState;
const rooms = OfficeDnD.data.rooms;

const renderAll = () => {
  OfficeDnD.ui.renderStats(gameState);
  OfficeDnD.ui.renderInventory(gameState);
  OfficeDnD.ui.renderLog(gameState);
  OfficeDnD.ui.renderSurroundings(gameState);
  OfficeDnD.ui.renderMiniMap(gameState, rooms);
};

const setupMiniMapResize = () => {
  if (typeof window === "undefined") return;
  window.addEventListener("resize", () => {
    OfficeDnD.ui.renderMiniMap(gameState, rooms);
  });
};

const initializeGame = () => {
  const miniMapCanvas = document.querySelector("#miniMap");
  OfficeDnD.ui.initMiniMap(miniMapCanvas);
  setupMiniMapResize();

  if (!gameState.discoveredRooms.includes(gameState.currentRoomId)) {
    gameState.discoveredRooms.push(gameState.currentRoomId);
  }

  const isDev =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isDev) {
    OfficeDnD.systems.validateRoomPositions(rooms);
  }

  renderAll();
  const room = rooms[gameState.currentRoomId];
  if (room) {
    OfficeDnD.ui.logEvent(`Entered: ${room.name} — ${room.description}`);
  }
  OfficeDnD.ui.setupCommandBar();
};

initializeGame();
