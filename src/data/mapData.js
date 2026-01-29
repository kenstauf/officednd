// Deprecated: map visualization now uses room.pos from rooms.js to avoid desync.
window.OfficeDnD.data.mapGrid = [
  ["BR", "HW", "HW", "SC", "SC"],
  ["BR", "HW", "SF", "SF", "SC"],
  ["JR", "JR", "SF", "MO", "MO"],
  ["JR", null, "SF", "MO", "MO"],
  ["JR", null, "SF", "MO", "MO"],
];

window.OfficeDnD.data.roomDefs = {
  BR: {
    name: "Break Room",
    description: "The smell of burnt coffee hangs in the air.",
  },
  HW: {
    name: "Hallway",
    description: "A quiet corridor lined with motivational posters.",
  },
  SF: {
    name: "Open Office",
    description: "Keyboards clatter as deadlines loom.",
  },
  SC: {
    name: "Storage Closet",
    description: "Cleaning supplies tower like ancient relics.",
  },
  JR: {
    name: "Conference Room",
    description: "A long table waits beneath a flickering projector.",
  },
  MO: {
    name: "IT Corner",
    description: "Server fans hum next to a jungle of cables.",
  },
};

window.OfficeDnD.data.getRoomDefinition = (code) =>
  window.OfficeDnD.data.roomDefs[code] ?? {
    name: "Empty Office",
    description: "Desks sit abandoned under the glow of monitors.",
  };
