const themeStorageKey = "deskplay-theme";

function getStoredTheme() {
  try {
    return localStorage.getItem(themeStorageKey) || "dark";
  } catch (error) {
    console.warn("Unable to read saved theme:", error);
    return "dark";
  }
}

function applyTheme(theme = getStoredTheme()) {
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia?.("(prefers-color-scheme: light)")?.matches
        ? "light"
        : "dark"
      : theme;

  document.documentElement.dataset.theme = resolvedTheme;
}

function setTheme(theme) {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch (error) {
    console.warn("Unable to save theme:", error);
  }
  applyTheme(theme);
}

window.setDeskplayTheme = setTheme;
try {
  applyTheme();
} catch (error) {
  console.warn("Unable to apply saved theme:", error);
}

// Script for loading the navbar into each page - injected into each HTML File.
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("navbar-container");
  if (!container) return;

  const activePage = container.getAttribute("data-active");

  const navbarHTML = `
    <nav class="dock-container">
      <div class="dock">
        <button class="dock-btn ${activePage === "presets" ? "active" : ""}" onclick="location.href='../Presets Page/presets.html'">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M7 5.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" />
            <path d="M4.012 7.26a2.005 2.005 0 0 0 -1.012 1.737v10c0 1.1 .9 2 2 2h10c.75 0 1.158 -.385 1.5 -1" />
            <path d="M11 7h5" />
            <path d="M11 10h6" />
            <path d="M11 13h3" />
          </svg>
        </button>

        <button class="dock-btn ${activePage === "displays" ? "active" : ""}" onclick="location.href='../Display Page/displays.html'">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M3 5a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1v-10" />
            <path d="M7 20h10" />
            <path d="M9 16v4" />
            <path d="M15 16v4" />
          </svg>
        </button>

        <button class="dock-btn ${activePage === "settings" ? "active" : ""}" onclick="location.href='../Settings Page/settings.html'">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 6a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M4 6l8 0" />
            <path d="M16 6l4 0" />
            <path d="M6 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M4 12l2 0" />
            <path d="M10 12l10 0" />
            <path d="M15 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
            <path d="M4 18l11 0" />
            <path d="M19 18l1 0" />
          </svg>
        </button>
      </div>
    </nav>
  `;

  container.innerHTML = navbarHTML;
});
