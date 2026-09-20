const customPresetsStorageKey = "deskplay-custom-presets";
const displayOrderStorageKey = "deskplay-display-order";
const settingsThemeStorageKey = "deskplay-theme";

document.addEventListener("DOMContentLoaded", async () => {
  const themeSelect = document.getElementById("theme-select");
  themeSelect.value = localStorage.getItem(settingsThemeStorageKey) || "dark";
  themeSelect.addEventListener("change", (event) => {
    window.setDeskplayTheme(event.target.value);
  });

  document
    .getElementById("reset-presets")
    .addEventListener("click", resetCustomPresets);
  document
    .getElementById("reset-display-order")
    .addEventListener("click", resetDisplayOrder);

  if (window.deskplayAPI?.getAppVersion) {
    const version = await window.deskplayAPI.getAppVersion();
    document.getElementById("app-version").textContent = `Version ${version}`;
  }
});

async function resetCustomPresets() {
  const confirmed = await window.confirmDeskplay("Delete all custom presets?", {
    title: "Reset custom presets",
    confirmLabel: "Reset",
  });
  if (!confirmed) {
    return;
  }

  localStorage.removeItem(customPresetsStorageKey);
  showStatus("Custom presets reset.");
}

async function resetDisplayOrder() {
  const confirmed = await window.confirmDeskplay(
    "Restore the detected display order?",
    { title: "Reset display order", confirmLabel: "Reset" },
  );
  if (!confirmed) {
    return;
  }

  localStorage.removeItem(displayOrderStorageKey);
  showStatus("Display order reset.");
}

function showStatus(message) {
  const status = document.getElementById("settings-status");
  status.textContent = message;
  window.setTimeout(() => {
    status.textContent = "";
  }, 3000);
}
