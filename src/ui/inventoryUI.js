export const renderInventory = (state) => {
  const inventoryElement = document.querySelector("#inventory");
  if (!inventoryElement) return;

  inventoryElement.textContent = `Inventory placeholder (${state.player.gold} gold)`;
};
