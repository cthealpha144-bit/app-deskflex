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

function resetCustomPresets() {
  if (!confirm("Delete all custom presets?")) {
    return;
  }

  localStorage.removeItem(customPresetsStorageKey);
  showStatus("Custom presets reset.");
}

function resetDisplayOrder() {
  if (!confirm("Restore the detected display order?")) {
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
