const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const { execFile } = require("child_process");
const path = require("path");

const exePath = app.isPackaged
  ? path.join(process.resourcesPath, "DisplaysDetector.exe")
  : path.join(app.getAppPath(), "DisplaysDetector.exe");

let mainWindow;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 725,
    minHeight: 500,
    resizable: true,
    icon: path.join(__dirname, "../favicon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.removeMenu();
  mainWindow.loadFile("Pages/Display Page/displays.html");
}

ipcMain.handle("get-app-version", () => app.getVersion());

ipcMain.handle("download-update", async () => {
  await autoUpdater.downloadUpdate();
});

ipcMain.handle("get-displays", () => {
  return new Promise((resolve, reject) => {
    execFile(exePath, (error, stdout) => {
      if (error) {
        console.error("Error executing DisplaysDetector:", error);
        return reject(error);
      }
      try {
        const data = JSON.parse(stdout);
        resolve(data.monitors || []);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
});

ipcMain.handle("set-display", (event, { index, code, value, type = "DDC" }) => {
  return new Promise((resolve, reject) => {
    const args = ["set", index.toString(), code.toString(), value.toString()];
    if (type.toUpperCase() === "WMI") {
      args.push("WMI");
    }

    execFile(exePath, args, (error, stdout) => {
      if (error) {
        console.error("Error setting display feature:", error);
        return reject(error);
      }
      try {
        const result = JSON.parse(stdout);
        resolve(result.success);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
});

app.whenReady().then(() => {
  createWindow();

  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

autoUpdater.on("update-available", (info) => {
  mainWindow?.webContents.send("update-available", {
    version: info.version,
  });
});

autoUpdater.on("update-downloaded", () => {
  autoUpdater.quitAndInstall(false, true);
});
