(() => {
  window.OfficeDnD = window.OfficeDnD || {};
  window.OfficeDnD.data = window.OfficeDnD.data || {};

  window.OfficeDnD.data.rooms = {
    hallway: {
      name: "Hallway",
      description: "A quiet corridor lined with motivational posters.",
      pos: { x: 0, y: 0 },
      objects: ["bulletin board", "water cooler"],
      npcs: [],
      exits: {
        west: "breakRoom",
        east: "openOffice",
        north: "conferenceRoom",
        south: "storageCloset",
      },
    },

    breakRoom: {
      name: "Break Room",
      description: "The smell of burnt coffee hangs in the air.",
      pos: { x: -1, y: 0 },
      objects: ["coffee urn", "microwave", "stack of mugs"],
      npcs: ["Pat from Payroll"],
      exits: {
        east: "hallway",
      },
    },

    openOffice: {
      name: "Open Office",
      description: "Keyboards clatter as deadlines loom.",
      pos: { x: 1, y: 0 },
      objects: ["desk cluster", "printer", "messy sticky notes"],
      npcs: ["Devon the Developer"],
      exits: {
        west: "hallway",
        south: "itCorner",
      },
    },

    conferenceRoom: {
      name: "Conference Room",
      description: "A long table waits beneath a flickering projector.",
      pos: { x: 0, y: -1 }, // north of hallway
      objects: ["whiteboard", "half-used marker"],
      npcs: ["Jules the Manager"],
      exits: {
        south: "hallway",
      },
    },

    storageCloset: {
      name: "Storage Closet",
      description: "Cleaning supplies tower like ancient relics.",
      pos: { x: 0, y: 1 }, // south of hallway
      objects: ["box of toner", "mop bucket"],
      npcs: [],
      exits: {
        north: "hallway",
        east: "itCorner",
      },
    },

    itCorner: {
      name: "IT Corner",
      description: "Server fans hum next to a jungle of cables.",
      pos: { x: 1, y: 1 }, // south of openOffice, east of storageCloset
      objects: ["spare laptop", "tangle of ethernet"],
      npcs: ["Morgan the IT Lead"],
      exits: {
        north: "openOffice",
        west: "storageCloset",
      },
    },
  };
})();
