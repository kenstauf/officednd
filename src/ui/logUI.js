export const renderLog = (state) => {
  const logElement = document.querySelector("#log");
  if (!logElement) return;

  logElement.textContent = state.log.join("\n");
};
