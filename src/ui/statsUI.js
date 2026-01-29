(() => {
  window.OfficeDnD = window.OfficeDnD || {};
  window.OfficeDnD.ui = window.OfficeDnD.ui || {};

window.OfficeDnD.ui.renderStats = (state) => {
  const statsElement = document.querySelector("#stats");
  if (!statsElement) return;

  statsElement.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = "Stats";
  statsElement.appendChild(title);

  const list = document.createElement("ul");
  list.className = "stats-list";

  const entries = [
    ["HP", state.player.hp],
    ["STR", state.player.str],
    ["DEX", state.player.dex],
    ["INT", state.player.int],
    ["CHA", state.player.cha],
  ];

  entries.forEach(([label, value]) => {
    const item = document.createElement("li");
    item.textContent = `${label}: ${value}`;
    list.appendChild(item);
  });

  statsElement.appendChild(list);
};
})();