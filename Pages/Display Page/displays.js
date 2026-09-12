let selectedMonitor = null;

async function initDisplays() {
  const container = document.getElementById("displays-container");

  try {
    container.innerHTML = "<p>Detecting monitors...</p>";

    if (!window.deskplayAPI) {
      console.error("window.deskplayAPI is undefined!");
      return;
    }

    const monitors = await window.deskplayAPI.getDisplays();

    if (!monitors || monitors.length === 0) {
      container.innerHTML = "<p>No displays detected.</p>";
      return;
    }

    renderUI(getOrderedMonitors(monitors));
  } catch (error) {
    console.error("Failed to get displays:", error);
    container.innerHTML = `<p style="color: red;">Error detecting displays: ${error.message}</p>`;
  }
}

let selectedMonitorIndex = null;
const displayOrderStorageKey = "deskplay-display-order";
let draggedMonitorKey = null;
let suppressCardClick = false;

function getMonitorKey(monitor) {
  return `${monitor.Name}|${monitor.Type}`;
}

function getOrderedMonitors(monitors) {
  const savedOrder = JSON.parse(
    localStorage.getItem(displayOrderStorageKey) || "[]",
  );
  const monitorByKey = new Map(
    monitors.map((monitor) => [getMonitorKey(monitor), monitor]),
  );
  const orderedMonitors = savedOrder
    .map((key) => monitorByKey.get(key))
    .filter(Boolean);

  monitors.forEach((monitor) => {
    if (!savedOrder.includes(getMonitorKey(monitor))) {
      orderedMonitors.push(monitor);
    }
  });

  return orderedMonitors;
}

function saveMonitorOrder(monitors) {
  localStorage.setItem(
    displayOrderStorageKey,
    JSON.stringify(monitors.map((monitor) => getMonitorKey(monitor))),
  );
}

function renderUI(monitors) {
  const container = document.getElementById("displays-container");
  container.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "monitor-grid";

  const settingsPanel = document.createElement("div");
  settingsPanel.id = "settings-panel";
  settingsPanel.className = "settings-panel hidden";

  monitors.forEach((monitor) => {
    const card = document.createElement("div");
    card.className = "monitor-card";
    card.setAttribute("data-index", monitor.Index);
    card.setAttribute("draggable", "true");
    card.innerHTML = `
      <h3>${monitor.Name}</h3>
      <p>Display #${monitor.Index + 1} (${monitor.Type})</p>
    `;

    card.addEventListener("dragstart", (event) => {
      draggedMonitorKey = getMonitorKey(monitor);
      suppressCardClick = true;
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedMonitorKey);
    });

    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    card.addEventListener("drop", (event) => {
      event.preventDefault();

      const targetMonitorKey = getMonitorKey(monitor);
      if (!draggedMonitorKey || draggedMonitorKey === targetMonitorKey) {
        return;
      }

      const draggedMonitor = monitors.find(
        (item) => getMonitorKey(item) === draggedMonitorKey,
      );
      const targetIndex = monitors.findIndex(
        (item) => getMonitorKey(item) === targetMonitorKey,
      );

      if (!draggedMonitor || targetIndex === -1) {
        return;
      }

      monitors.splice(monitors.indexOf(draggedMonitor), 1);
      monitors.splice(targetIndex, 0, draggedMonitor);
      saveMonitorOrder(monitors);
      renderUI(monitors);
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      draggedMonitorKey = null;
      setTimeout(() => {
        suppressCardClick = false;
      }, 0);
    });

    card.addEventListener("click", () => {
      if (suppressCardClick) {
        return;
      }

      if (selectedMonitorIndex === monitor.Index) {
        selectedMonitorIndex = null;
        card.classList.remove("active");
        settingsPanel.classList.add("hidden");
        return;
      }

      selectedMonitorIndex = monitor.Index;

      document
        .querySelectorAll(".monitor-card")
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");

      openSettingsForMonitor(monitor, settingsPanel);
    });

    grid.appendChild(card);
  });

  container.appendChild(grid);
  container.appendChild(settingsPanel);
}

function openSettingsForMonitor(monitor, panel) {
  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="controls-list" id="controls-list"></div>
  `;

  const controlsList = panel.querySelector("#controls-list");

  if (monitor.Vcp) {
    Object.keys(monitor.Vcp).forEach((key) => {
      if (
        key.toLowerCase() === "input" ||
        key.toLowerCase() === "inputsource"
      ) {
        return;
      }

      const feature = monitor.Vcp[key];
      const controlGroup = document.createElement("div");
      controlGroup.className = "control-group";

      const label = document.createElement("label");
      label.innerHTML = `<strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> <span id="val-${key}">${feature.Current}</span>`;

      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0";
      slider.max = feature.Max || "100";
      slider.value = feature.Current;

      slider.addEventListener("input", (e) => {
        panel.querySelector(`#val-${key}`).textContent = e.target.value;
      });

      slider.addEventListener("change", async (e) => {
        const newValue = parseInt(e.target.value, 10);
        try {
          await window.deskplayAPI.setDisplay({
            index: monitor.Index,
            code: `0x${feature.Code.toString(16)}`,
            value: newValue,
            type: monitor.Type,
          });
        } catch (err) {
          console.error(`Error updating ${key}:`, err);
        }
      });

      controlGroup.appendChild(label);
      controlGroup.appendChild(slider);
      controlsList.appendChild(controlGroup);
    });
  } else {
    controlsList.innerHTML =
      "<p>No adjustable settings detected for this display.</p>";
  }
}

document.addEventListener("DOMContentLoaded", initDisplays);
