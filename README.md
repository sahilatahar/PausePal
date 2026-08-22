<div align="center">
  <img src="icons/icon128.png" alt="PausePal Logo" width="110" height="110" />
  <h1>PausePal</h1>
  <p><strong>Smart, customizable break reminder companion with transparent video animations.</strong></p>
</div>

---

## 🌟 Overview

**PausePal** is a lightweight, privacy-focused extension designed to help you maintain healthy habits while working on your computer. It delivers smooth, transparent character animations onto your screen to remind you to drink water, stretch, rest your eyes, and correct your posture.

---

## 🎬 Demo Video

<div align="center">
  <a href="https://www.youtube.com/watch?v=2pu8r9DSKEU" target="_blank" rel="noopener noreferrer">
    <img src="https://img.youtube.com/vi/2pu8r9DSKEU/maxresdefault.jpg" alt="PausePal Demo Video" width="480" style="max-width: 100%; border-radius: 8px;" />
  </a>
  <p><em>🎥 Click above to watch the quick demo on YouTube</em></p>
</div>

---

## ✨ Features

- **🕒 Multi-Reminder Manager**: Create, edit, and delete multiple custom reminders with real-time countdowns.
- **🔁 Flexible Scheduling Modes**:
    - **Recurring**: Automatically repeats every _X_ minutes (e.g. hydrate every 30 minutes).
    - **One-time**: Triggers once at your specified time and automatically removes itself after firing.
- **🧹 Automatic Cleanup**: Expired one-time reminders are pruned automatically to keep your reminder list clean.
- **📐 Customizable Animation Sizes**:
    - **Full Screen (100% Width)**: Giant immersive overlay across your viewport.
    - **Mid Size (540px)** & **Small Size (320px)**: Compact overlays.
- **📍 Corner Placement**: Position the animation in any corner (`Bottom-Right`, `Bottom-Left`, `Top-Right`, `Top-Left`, or `Center`).
- **🔁 Play Count & Loop Control**: Choose how many times the animation loops (`1x`, `2x`, `3x`, `5x`, or `Until Dismissed`).
- **🎨 Minimalist White Theme**: Clean, distraction-free aesthetic with solid white backgrounds, crisp typography, and zero gradients.
- **🔔 Notification Chimes**: Gentle audio bell when a reminder arrives (optional toggle).
- **⚡ High-Performance Video-to-Canvas Engine**: Decodes real alpha-channel WebM videos on an offscreen `<canvas>` with zero background battery drain or memory leaks.

---

## 🧘 Break Types Included

| Icon | Break Type            | Purpose                                                        |
| :--: | :-------------------- | :------------------------------------------------------------- |
|  🧘  | **Breathe & Reset**   | Take 3 deep breaths to reduce stress and reset focus           |
|  💧  | **Drink Water**       | Stay hydrated and maintain energy throughout your day          |
|  🪑  | **Posture Check**     | Straighten your back, relax your shoulders, and sit tall       |
|  👀  | **20-20-20 Eye Rest** | Look 20 feet away for 20 seconds to prevent digital eye strain |
|  🤸  | **Stretch & Move**    | Stand up, stretch arms, and relieve joint tension              |

---

## 🚀 Installation & Setup

### Option 1: Download from Releases (Recommended)

1. Download the latest `.zip` package from the **[Latest Release](https://github.com/sahilatahar/PausePal/releases/latest)**.
2. Extract the downloaded `.zip` file onto your computer.
3. Open your browser's extension page:
    - **Firefox**: Navigate to `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on...**, and select `manifest.json`.
    - **Chrome**: `chrome://extensions`
    - **Brave**: `brave://extensions`
    - **Edge**: `edge://extensions`
4. For Chromium browsers (Chrome/Brave/Edge), turn ON **Developer mode** and click **Load unpacked**, selecting the extracted `PausePal` folder.
5. Pin **PausePal** to your browser toolbar for quick access!

### Option 2: Clone via Git

```bash
git clone https://github.com/sahilatahar/PausePal.git
cd PausePal
```

Then load the cloned directory via **Load unpacked** (Chromium) or **Load Temporary Add-on** (Firefox) as described above.

You can also run or build for Firefox using npm:

```bash
npm run lint          # Run web-ext lint
npm run build:firefox # Build .zip artifact for Firefox
npm run dev:firefox   # Launch temporary Firefox instance with PausePal
```

---

## 📂 Project Structure

```
PausePal/
├── manifest.json         # Extension configuration & permissions
├── background.js         # Service worker for alarm scheduling & reminder state
├── content.js            # Video-to-canvas rendering engine & modal controller
├── content.css           # Scoped styling for overlay & corner modal
├── popup/
│   ├── index.html        # Clean white theme popup interface
│   ├── popup.css         # Minimalist stylesheet (no gradients)
│   └── popup.js          # Reminder CRUD, live countdown ticker & settings sync
├── videos/               # VP9 alpha-channel transparent WebM video files
│   ├── pausepal-breathe.webm
│   ├── pausepal-drink-water.webm
│   ├── pausepal-eye-break.webm
│   ├── pausepal-posture.webm
│   └── pausepal-stretch.webm
├── sounds/
│   └── chime.wav         # Gentle notification chime audio
└── icons/                # Extension icons with transparent rounded squircle corners
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    ├── icon128.png
    └── icon512.png
```

---

## 🗺️ Roadmap & Upcoming Features

- **🔥 Streaks & Daily Stats**: Daily completion logs, hydration counters, and habit streaks.
- **🤫 Smart Do-Not-Disturb**: Auto-pause reminders during video calls (Google Meet/Zoom) and fullscreen video playback.
- **🎨 Custom Companions & Audio**: Select alternative animal companions, customize chime sounds, or upload your own animations.
- **⏰ Overlay Snooze**: Quick 5-minute snooze option directly on the reminder modal.

---

## 💡 Inspiration & Credits

- Inspired by [hammyweb.online](https://hammyweb.online/).

---

## 🔒 Privacy & Permissions

PausePal runs 100% locally on your machine. No tracking, no external API calls, and no data leaves your device.

- `storage`: Saves your custom reminders and preferences locally.
- `alarms`: Schedules persistent, battery-efficient break timers.
- `scripting` & `activeTab`: Injects the transparent overlay when a scheduled reminder triggers.

---

## 🤝 Contributing

Contributions, issues, and feature requests are very welcome!

- **Issues**: Found a bug or have an idea? Please open an [Issue](https://github.com/sahilatahar/PausePal/issues).
- **Pull Requests**: Pull requests are actively accepted! **Please create an issue first** to discuss your proposed change or feature before submitting a pull request.

---

## 📄 License

MIT License. Feel free to customize and enjoy healthy breaks!
