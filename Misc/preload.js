const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deskplayAPI", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getDisplays: () => ipcRenderer.invoke("get-displays"),
  setDisplay: (params) => ipcRenderer.invoke("set-display", params),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  onUpdateAvailable: (callback) =>
    ipcRenderer.on("update-available", (_event, info) => callback(info)),
});
