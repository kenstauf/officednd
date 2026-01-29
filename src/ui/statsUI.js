export const renderStats = (state) => {
  const statsElement = document.querySelector("#stats");
  if (!statsElement) return;

  statsElement.textContent = `HP: ${state.player.health}/${state.player.maxHealth}`;
};
