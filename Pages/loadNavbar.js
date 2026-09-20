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

function confirmDeskplay(
  message,
  { title = "Are you sure?", confirmLabel = "Confirm" } = {},
) {
  const modal = document.getElementById("deskplay-confirm-modal");
  if (!modal) {
    return Promise.resolve(false);
  }

  modal.querySelector(".confirm-modal-title").textContent = title;
  modal.querySelector(".confirm-modal-message").textContent = message;
  modal.querySelector(".confirm-modal-confirm").textContent = confirmLabel;
  modal.hidden = false;

  return new Promise((resolve) => {
    const cancelButton = modal.querySelector(".confirm-modal-cancel");
    const confirmButton = modal.querySelector(".confirm-modal-confirm");
    const close = (confirmed) => {
      modal.hidden = true;
      modal.removeEventListener("click", handleBackdropClick);
      document.removeEventListener("keydown", handleKeydown);
      cancelButton.removeEventListener("click", cancel);
      confirmButton.removeEventListener("click", confirm);
      resolve(confirmed);
    };
    const cancel = () => close(false);
    const confirm = () => close(true);
    const handleBackdropClick = (event) => {
      if (event.target === modal) {
        cancel();
      }
    };
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        cancel();
      }
    };

    cancelButton.addEventListener("click", cancel);
    confirmButton.addEventListener("click", confirm);
    modal.addEventListener("click", handleBackdropClick);
    document.addEventListener("keydown", handleKeydown);
    confirmButton.focus();
  });
}

window.confirmDeskplay = confirmDeskplay;

function setupUpdatePrompt() {
  if (!window.deskplayAPI?.onUpdateAvailable) {
    return;
  }

  window.deskplayAPI.onUpdateAvailable(({ version }) => {
    const modal = document.getElementById("deskplay-update-modal");
    const message = modal.querySelector(".update-modal-message");
    const laterButton = modal.querySelector(".update-modal-later");
    const updateButton = modal.querySelector(".update-modal-update");

    message.textContent = `DeskPlay ${version} is available. Update now or wait until the next time you open the app?`;
    laterButton.disabled = false;
    updateButton.disabled = false;
    updateButton.textContent = "Update now";
    modal.hidden = false;

    const close = () => {
      modal.hidden = true;
      laterButton.removeEventListener("click", close);
      updateButton.removeEventListener("click", update);
    };
    const update = async () => {
      laterButton.disabled = true;
      updateButton.disabled = true;
      updateButton.textContent = "Downloading...";
      try {
        await window.deskplayAPI.downloadUpdate();
      } catch (error) {
        console.error("Failed to download update:", error);
        message.textContent =
          "The update could not be downloaded. Try again next time.";
        updateButton.removeEventListener("click", update);
        updateButton.textContent = "Close";
        updateButton.disabled = false;
        updateButton.addEventListener("click", close, { once: true });
      }
    };

    laterButton.addEventListener("click", close);
    updateButton.addEventListener("click", update);
    updateButton.focus();
  });
}

// Script for loading the navbar into each page - injected into each HTML File.
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("navbar-container");
  if (!container) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div class="confirm-modal" id="deskplay-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" hidden>
        <div class="confirm-modal-content">
          <h2 class="confirm-modal-title" id="confirm-modal-title"></h2>
          <p class="confirm-modal-message"></p>
          <div class="confirm-modal-actions">
            <button class="confirm-modal-cancel" type="button">Cancel</button>
            <button class="confirm-modal-confirm" type="button"></button>
          </div>
        </div>
      </div>
      <div class="confirm-modal" id="deskplay-update-modal" role="dialog" aria-modal="true" aria-labelledby="update-modal-title" hidden>
        <div class="confirm-modal-content">
          <h2 class="confirm-modal-title" id="update-modal-title">Update available</h2>
          <p class="update-modal-message"></p>
          <div class="confirm-modal-actions">
            <button class="confirm-modal-cancel update-modal-later" type="button">Later</button>
            <button class="confirm-modal-confirm update-modal-update" type="button">Update now</button>
          </div>
        </div>
      </div>
    `,
  );

  setupUpdatePrompt();

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
