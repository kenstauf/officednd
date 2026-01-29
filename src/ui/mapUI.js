export const renderMap = (state) => {
  const mapElement = document.querySelector("#map");
  if (!mapElement) return;

  mapElement.textContent = `Map placeholder (Player: ${state.player.name})`;
};
