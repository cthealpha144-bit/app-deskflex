const customPresetsStorageKey = "deskplay-custom-presets";

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("presetsGrid");

  try {
    const response = await fetch("presets.json");
    if (!response.ok) {
      throw new Error(`Unable to load presets (${response.status})`);
    }

    const presets = await response.json();
    const customPresets = getCustomPresets();

    presets.forEach((preset) => {
      grid.appendChild(createPresetCard(preset));
    });
    customPresets.forEach((preset) => {
      grid.appendChild(createPresetCard(preset, true));
    });

    grid.appendChild(createPresetButton());
  } catch (err) {
    console.error("Failed to load presets:", err);
    grid.innerHTML = "<p>Unable to load presets.</p>";
  }
});

function createPresetCard(preset, isCustom = false) {
  const card = document.createElement("div");
  card.className = `preset-card${isCustom ? " custom-preset-card" : ""}`;

  card.innerHTML = `
    ${isCustom ? '<button class="preset-delete-button" type="button" aria-label="Delete preset" title="Delete preset">x</button>' : ""}
    <div>
      <div class="preset-title" data-preset-name>${preset.name}</div>
      <div class="preset-values">
        Brightness: ${preset.settings.brightness}% | Contrast: ${preset.settings.contrast}%
      </div>
      <div class="preset-status" aria-live="polite"></div>
    </div>
    <button class="btn-apply" type="button">
      Apply Preset
    </button>
  `;

  card.querySelector(".btn-apply").addEventListener("click", () => {
    applyPreset(preset, card);
  });

  if (isCustom) {
    card
      .querySelector(".preset-delete-button")
      .addEventListener("click", () => deleteCustomPreset(preset, card));
  }

  return card;
}

function createPresetButton() {
  const card = document.createElement("div");
  card.className = "preset-card preset-create-card";
  card.innerHTML = `
    <button class="preset-create-button" type="button" aria-label="Create preset" title="Create preset">+</button>
  `;

  card
    .querySelector(".preset-create-button")
    .addEventListener("click", () => openPresetForm(card));
  return card;
}

function getCustomPresets() {
  try {
    return JSON.parse(localStorage.getItem(customPresetsStorageKey) || "[]");
  } catch (error) {
    console.error("Failed to load custom presets:", error);
    return [];
  }
}

function openPresetForm(card) {
  card.innerHTML = `
    <form class="preset-create-form">
      <input class="preset-name-input" name="name" type="text" placeholder="Preset name" aria-label="Preset name" required maxlength="40" />
      <input type="number" name="brightness" min="0" max="100" placeholder="Brightness" aria-label="Brightness" required />
      <input type="number" name="contrast" min="0" max="100" placeholder="Contrast" aria-label="Contrast" required />
      <div class="preset-form-actions">
        <button class="btn-apply" type="submit">Save</button>
        <button class="preset-cancel-button" type="button">Cancel</button>
      </div>
    </form>
  `;

  const form = card.querySelector(".preset-create-form");
  form.querySelector(".preset-name-input").focus();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCustomPreset(new FormData(form), card);
  });
  form.querySelector(".preset-cancel-button").addEventListener("click", () => {
    card.innerHTML = `<button class="preset-create-button" type="button" aria-label="Create preset" title="Create preset">+</button>`;
    card
      .querySelector(".preset-create-button")
      .addEventListener("click", () => openPresetForm(card));
  });
}

function saveCustomPreset(formData, card) {
  const name = formData.get("name").trim();
  const brightness = Number(formData.get("brightness"));
  const contrast = Number(formData.get("contrast"));

  if (!name || !Number.isInteger(brightness) || !Number.isInteger(contrast)) {
    return;
  }

  const preset = { name, settings: { brightness, contrast } };
  const customPresets = getCustomPresets();
  customPresets.push(preset);
  localStorage.setItem(customPresetsStorageKey, JSON.stringify(customPresets));
  card.before(createPresetCard(preset, true));
  card.innerHTML = `<button class="preset-create-button" type="button" aria-label="Create preset" title="Create preset">+</button>`;
  card
    .querySelector(".preset-create-button")
    .addEventListener("click", () => openPresetForm(card));
}

async function deleteCustomPreset(preset, card) {
  const confirmed = await window.confirmDeskplay(
    `Delete the preset "${preset.name}"?`,
    { title: "Delete preset", confirmLabel: "Delete" },
  );
  if (!confirmed) {
    return;
  }

  const customPresets = getCustomPresets();
  const presetIndex = customPresets.findIndex(
    (item) =>
      item.name === preset.name &&
      item.settings.brightness === preset.settings.brightness &&
      item.settings.contrast === preset.settings.contrast,
  );

  if (presetIndex !== -1) {
    customPresets.splice(presetIndex, 1);
    localStorage.setItem(
      customPresetsStorageKey,
      JSON.stringify(customPresets),
    );
  }

  card.remove();
}

async function applyPreset(preset, card) {
  const button = card.querySelector(".btn-apply");
  const status = card.querySelector(".preset-status");

  if (!window.deskplayAPI) {
    status.textContent = "Display controls are unavailable.";
    return;
  }

  button.disabled = true;
  status.textContent = "Applying...";

  try {
    const monitors = await window.deskplayAPI.getDisplays();
    const updates = [];

    monitors.forEach((monitor) => {
      const features = Object.entries(monitor.Vcp || {});
      const brightness = findFeature(features, "brightness");
      const contrast = findFeature(features, "contrast");

      if (brightness) {
        updates.push(
          setFeature(monitor, brightness, preset.settings.brightness),
        );
      }
      if (contrast) {
        updates.push(setFeature(monitor, contrast, preset.settings.contrast));
      }
    });

    if (updates.length === 0) {
      throw new Error("No brightness or contrast controls were found.");
    }

    await Promise.all(updates);
    const successMessage = `Applied to ${monitors.length} display${monitors.length === 1 ? "" : "s"}.`;
    status.textContent = successMessage;
    window.setTimeout(() => {
      if (status.textContent === successMessage) {
        status.textContent = "";
      }
    }, 4500);
  } catch (error) {
    console.error(`Failed to apply ${preset.name}:`, error);
    status.textContent = error.message || "Could not apply preset.";
  } finally {
    button.disabled = false;
  }
}

function findFeature(features, name) {
  return features.find(([key]) => key.toLowerCase() === name);
}

function setFeature(monitor, [, feature], value) {
  return window.deskplayAPI.setDisplay({
    index: monitor.Index,
    code: `0x${feature.Code.toString(16)}`,
    value,
    type: monitor.Type,
  });
}
