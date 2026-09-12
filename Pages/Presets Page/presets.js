document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("presetsGrid");

  try {
    const response = await fetch("presets.json");
    if (!response.ok) {
      throw new Error(`Unable to load presets (${response.status})`);
    }

    const presets = await response.json();

    presets.forEach((preset) => {
      const card = document.createElement("div");
      card.className = "preset-card";

      card.innerHTML = `
        <div>
          <div class="preset-title">${preset.name}</div>
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
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load presets:", err);
    grid.innerHTML = "<p>Unable to load presets.</p>";
  }
});

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
    status.textContent = `Applied to ${monitors.length} display${monitors.length === 1 ? "" : "s"}.`;
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
