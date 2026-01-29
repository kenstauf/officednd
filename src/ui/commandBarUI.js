import { rooms } from "../data/rooms.js";
import { gameState } from "../state.js";
import { tryMove } from "../systems/movement.js";
import { logEvent } from "./logUI.js";
import { getRoomSummary, renderSurroundings } from "./surroundingsUI.js";

const COMMAND_HELP =
  'Available commands: help, look, go <direction>, move <direction>. Directions: north/south/east/west (n/s/e/w).';

const handleMovement = (direction) => {
  const result = tryMove(direction);
  if (result.ok) {
    const destination = rooms[result.roomId];
    logEvent(`You go ${result.direction} to ${destination.name}.`);
    renderSurroundings(gameState);
    return;
  }
  logEvent(result.reason ?? "You can't go that way.");
};

const handleCommand = (rawCommand) => {
  const trimmed = rawCommand.trim();
  if (!trimmed) return;

  logEvent(`> ${trimmed}`);

  const [command, ...args] = trimmed.split(/\s+/);
  const normalizedCommand = command.toLowerCase();

  if (normalizedCommand === "help") {
    logEvent(COMMAND_HELP);
    return;
  }

  if (normalizedCommand === "look") {
    logEvent(getRoomSummary(gameState.currentRoomId));
    return;
  }

  if (normalizedCommand === "go" || normalizedCommand === "move") {
    const direction = args[0];
    handleMovement(direction);
    return;
  }

  logEvent('Unknown command. Type "help".');
};

export const setupCommandBar = () => {
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
