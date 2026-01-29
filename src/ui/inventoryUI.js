(() => {
  window.OfficeDnD = window.OfficeDnD || {};
  window.OfficeDnD.ui = window.OfficeDnD.ui || {};

window.OfficeDnD.ui.renderInventory = (state) => {
  const inventoryElement = document.querySelector("#inventory");
  if (!inventoryElement) return;

  inventoryElement.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = "Inventory";
  inventoryElement.appendChild(title);

  const list = document.createElement("ul");
  list.className = "inventory-list";

  if (state.player.inventory.length === 0) {
    const item = document.createElement("li");
    item.textContent = "(empty)";
    list.appendChild(item);
  } else {
    state.player.inventory.forEach((inventoryItem) => {
      const item = document.createElement("li");
      item.textContent = inventoryItem;
      list.appendChild(item);
    });
  }

  inventoryElement.appendChild(list);
};
})();