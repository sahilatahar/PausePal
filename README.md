<div align="center">
  <img src="icons/icon128.png" alt="PausePal Logo" width="110" height="110" />
  <h1>PausePal</h1>
  <p><strong>Smart, customizable break reminder companion with transparent video animations.</strong></p>
</div>

---

## 🌟 Overview

**PausePal** is a lightweight, privacy-focused extension designed to help you maintain healthy habits while working on your computer. It delivers smooth, transparent character animations onto your screen to remind you to drink water, stretch, rest your eyes, and correct your posture.

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

1. Clone or download this repository to your computer:
    ```bash
    git clone https://github.com/sahilatahar/PausePal.git
    ```
2. Open your extension management page (`extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the folder containing this repository.
6. Pin **PausePal** to your toolbar for quick access!

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

## 💡 Inspiration & Credits

- Inspired by [hammyweb.online](https://hammyweb.online/).

---

## 🔒 Privacy & Permissions

PausePal runs 100% locally on your machine. No tracking, no external API calls, and no data leaves your device.

- `storage`: Saves your custom reminders and preferences locally.
- `alarms`: Schedules persistent, battery-efficient break timers.
- `scripting` & `activeTab`: Injects the transparent overlay when a scheduled reminder triggers.

---

## 📄 License

MIT License. Feel free to customize and enjoy healthy breaks!
