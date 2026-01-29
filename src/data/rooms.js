export const rooms = {
  breakRoom: {
    name: "Break Room",
    description: "The smell of burnt coffee hangs in the air.",
    objects: ["coffee urn", "microwave", "stack of mugs"],
    npcs: ["Pat from Payroll"],
    exits: {
      east: "hallway",
    },
  },
  hallway: {
    name: "Hallway",
    description: "A quiet corridor lined with motivational posters.",
    objects: ["bulletin board", "water cooler"],
    npcs: [],
    exits: {
      west: "breakRoom",
      east: "openOffice",
      north: "conferenceRoom",
      south: "storageCloset",
    },
  },
  openOffice: {
    name: "Open Office",
    description: "Keyboards clatter as deadlines loom.",
    objects: ["desk cluster", "printer", "messy sticky notes"],
    npcs: ["Devon the Developer"],
    exits: {
      west: "hallway",
      south: "itCorner",
    },
  },
  storageCloset: {
    name: "Storage Closet",
    description: "Cleaning supplies tower like ancient relics.",
    objects: ["box of toner", "mop bucket"],
    npcs: [],
    exits: {
      north: "hallway",
    },
  },
  itCorner: {
    name: "IT Corner",
    description: "Server fans hum next to a jungle of cables.",
    objects: ["spare laptop", "tangle of ethernet"],
    npcs: ["Morgan the IT Lead"],
    exits: {
      north: "openOffice",
      west: "conferenceRoom",
    },
  },
  conferenceRoom: {
    name: "Conference Room",
    description: "A long table waits beneath a flickering projector.",
    objects: ["whiteboard", "half-used marker"],
    npcs: ["Jules the Manager"],
    exits: {
      south: "hallway",
      east: "itCorner",
    },
  },
};
