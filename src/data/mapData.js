const rooms = {
  "0,0": {
    name: "Break Room",
    description: "The smell of burnt coffee hangs in the air.",
    objects: ["Coffee Machine", "Vending Machine"],
    npcs: [],
  },
  "1,0": {
    name: "Hallway",
    description: "A quiet corridor lined with motivational posters.",
    objects: [],
    npcs: [],
  },
  "1,1": {
    name: "Open Office",
    description: "Keyboards clatter as deadlines loom.",
    objects: ["Stapler", "Whiteboard"],
    npcs: ["Overworked Analyst"],
  },
  "0,1": {
    name: "Conference Room",
    description: "A long table waits beneath a flickering projector.",
    objects: ["Projector"],
    npcs: ["Mysterious Consultant"],
  },
  "2,1": {
    name: "Storage Closet",
    description: "Cleaning supplies tower like ancient relics.",
    objects: ["Locked Locker", "Mop Bucket"],
    npcs: [],
  },
  "2,0": {
    name: "IT Corner",
    description: "Server fans hum next to a jungle of cables.",
    objects: ["Ethernet Cable"],
    npcs: ["IT Gremlin"],
  },
};

const defaultRoom = {
  name: "Empty Office",
  description: "Desks sit abandoned under the glow of monitors.",
  objects: [],
  npcs: [],
};

export const getRoom = (x, y) => {
  const key = `${x},${y}`;
  return rooms[key] ?? defaultRoom;
};

export const mapRooms = rooms;
