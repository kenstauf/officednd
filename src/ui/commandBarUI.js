const OfficeDnD = window.OfficeDnD;
const rooms = OfficeDnD.data.rooms;
const gameState = OfficeDnD.state.gameState;

const COMMAND_HELP =
  'Available commands: help, look, go <direction>, move <direction>. Directions: north/south/east/west (n/s/e/w).';

const handleMovement = (direction) => {
  const result = OfficeDnD.systems.tryMove(direction);
  if (result.ok) {
    const destination = rooms[result.roomId];
    OfficeDnD.ui.logEvent(`You go ${result.direction} to ${destination.name}.`);
    OfficeDnD.ui.resetMiniMapPan();
    OfficeDnD.ui.renderSurroundings(gameState);
    OfficeDnD.ui.renderMiniMap(gameState, rooms);
    return;
  }
  OfficeDnD.ui.logEvent(result.reason ?? "You can't go that way.");
};

const handleCommand = (rawCommand) => {
  const trimmed = rawCommand.trim();
  if (!trimmed) return;

  OfficeDnD.ui.logEvent(`> ${trimmed}`);

  const [command, ...args] = trimmed.split(/\s+/);
  const normalizedCommand = command.toLowerCase();

  if (normalizedCommand === "help") {
    OfficeDnD.ui.logEvent(COMMAND_HELP);
    return;
  }

  if (normalizedCommand === "look") {
    OfficeDnD.ui.logEvent(
      OfficeDnD.ui.getRoomSummary(gameState.currentRoomId),
    );
    return;
  }

  if (normalizedCommand === "go" || normalizedCommand === "move") {
    const direction = args[0];
    handleMovement(direction);
    return;
  }

  OfficeDnD.ui.logEvent('Unknown command. Type "help".');
};

OfficeDnD.ui.setupCommandBar = () => {
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
