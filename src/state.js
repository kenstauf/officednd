(() => {
window.OfficeDnD = window.OfficeDnD || {};
window.OfficeDnD.state = window.OfficeDnD.state || {};
window.OfficeDnD.data = window.OfficeDnD.data || {};
window.OfficeDnD.systems = window.OfficeDnD.systems || {};
window.OfficeDnD.ui = window.OfficeDnD.ui || {};

window.OfficeDnD.state.gameState = {
  player: {
    hp: 12,
    str: 3,
    dex: 2,
    int: 4,
    cha: 3,
    inventory: [],
  },
  currentRoomId: "breakRoom",
  log: [],
  discoveredRooms: [],
};
})();