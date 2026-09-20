# DeskPlay

DeskPlay is a lightweight, open-source Windows desktop application built with Electron that allows you to control your monitors' hardware settings directly from your desktop.


## Features

- **Instant Display Presets:** Quickly toggle between 6 activity profiles (*Standard, FPS / Gaming, Cinema / Movie, Reading, Night, Vivid*).
- **Direct DDC/CI & WMI Control:** Hardware-level adjustment of monitor brightness and contrast using `DisplaysDetector.exe`.
- **Multi-Monitor Support:** Seamlessly handles multi-display desktop setups.
- **Modern UI:** Clean, responsive HTML/JS interface with dedicated pages for displays, presets, and settings.
- **Auto-Updates:** Integrated background updates so you're always running the latest version.

## Getting Started

Requirements 
- Windows 10 / 11
- Monitors with **DDC/CI** enabled in their physical OSD menu options

### Installation
1. Download the latest installer from https://deskplay.cstuartday.workers.dev
2. Run `DeskPlay-Setup-[Version Number].exe` and follow the on-screen setup prompts.

## Built With

- **Electron** – Framework
- **Node.js** –  Process handling + IPC bridge
- **HTML5 / CSS3 / JavaScript** – Rendering Logic + UI
- **DDC/CI / WMI** – Display communication with Hardware
