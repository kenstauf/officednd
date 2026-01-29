const rooms = window.OfficeDnD.data.rooms;
const gameState = window.OfficeDnD.state.gameState;

const COMMAND_HELP =
  'Available commands: help, look, go <direction>, move <direction>. Directions: north/south/east/west (n/s/e/w).';

const handleMovement = (direction) => {
  const result = window.OfficeDnD.systems.tryMove(direction);
  if (result.ok) {
    const destination = rooms[result.roomId];
    window.OfficeDnD.ui.logEvent(`You go ${result.direction} to ${destination.name}.`);
    window.OfficeDnD.ui.resetMiniMapPan();
    window.OfficeDnD.ui.renderSurroundings(gameState);
    window.OfficeDnD.ui.renderMiniMap(gameState, rooms);
    return;
  }
  window.OfficeDnD.ui.logEvent(result.reason ?? "You can't go that way.");
};

const handleCommand = (rawCommand) => {
  const trimmed = rawCommand.trim();
  if (!trimmed) return;

  window.OfficeDnD.ui.logEvent(`> ${trimmed}`);

  const [command, ...args] = trimmed.split(/\s+/);
  const normalizedCommand = command.toLowerCase();

  if (normalizedCommand === "help") {
    window.OfficeDnD.ui.logEvent(COMMAND_HELP);
    return;
  }

  if (normalizedCommand === "look") {
    window.OfficeDnD.ui.logEvent(
      window.OfficeDnD.ui.getRoomSummary(gameState.currentRoomId),
    );
    return;
  }

  if (normalizedCommand === "go" || normalizedCommand === "move") {
    const direction = args[0];
    handleMovement(direction);
    return;
  }

  window.OfficeDnD.ui.logEvent('Unknown command. Type "help".');
};

window.OfficeDnD.ui.setupCommandBar = () => {
  const form = document.querySelector("#command-form");
  const input = document.querySelector("#command-input");
  if (!form || !input) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleCommand(input.value);
    input.value = "";
    input.focus();
  });

  input.focus();
};
