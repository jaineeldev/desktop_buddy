# 🐾 DesktopBuddy

A cross-platform animated desktop mascot with personality and system stats.

---

## 🎯 What This Is

DesktopBuddy is a cute animated mascot that lives on your desktop. It reacts to what your computer is doing, displays system stats with personality, and interacts with you. It's built with a hybrid stack — a modern web frontend for the UI, and a C backend for low-level system access.

---

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI & Mascot | React + TypeScript + Framer Motion | Animations, components, mascot states |
| Desktop Shell | Electron + Vite | Frameless window, tray, OS integration |
| Styling | Tailwind CSS | Stat HUD, speech bubbles, settings panel |
| State | Zustand | Buddy mood/state machine |
| System Stats | C (native Node addon via `node-addon-api`) | CPU, RAM, temps |
| Persistence | electron-store | Settings, buddy name, preferences |
| Build | electron-vite | Unified Electron + Vite + TS build |

---

## 📂 Project Structure

```
desktopbuddy/
├── electron/
│   ├── main.ts              # Window creation, tray, IPC handlers
│   ├── preload.ts           # Secure contextBridge IPC
│   ├── tray.ts              # System tray setup
│   └── stats-bridge.ts      # Calls the C addon, exposes via IPC
├── src/
│   ├── components/
│   │   ├── Buddy/
│   │   │   ├── Buddy.tsx        # Main mascot component
│   │   │   ├── BuddyStates.ts   # State machine definition
│   │   │   └── animations.ts    # Framer Motion variants
│   │   ├── StatHUD/
│   │   │   └── StatHUD.tsx
│   │   └── SpeechBubble/
│   │       └── SpeechBubble.tsx
│   ├── hooks/
│   │   └── useSystemStats.ts
│   ├── stores/
│   │   └── buddyStore.ts
│   └── App.tsx
├── native/
│   ├── stats.c
│   ├── stats.h
│   └── binding.gyp
├── assets/
│   └── sprites/
└── electron.vite.config.ts
```

---

## 🗺️ Roadmap

### Phase 0 — C Fundamentals
> Before writing any app code, build a foundation in C.

- [ ] Complete CS50x Week 1–4 (free at cs50.harvard.edu)
- [ ] Understand variables, types, pointers, structs, `malloc`/`free`, file I/O
- [ ] Write a C program that reads `/proc/meminfo` and prints RAM usage to the terminal
- [ ] Write a C struct that holds `cpu_percent`, `ram_used_mb`, `ram_total_mb`
- [ ] Be able to explain what a pointer is and why C has no garbage collector

---

### Phase 1 — Project Scaffold
> Get a transparent, frameless Electron window on screen with a placeholder mascot.

- [ ] Scaffold with `electron-vite` (TypeScript template)
- [ ] Configure `BrowserWindow` for transparent + frameless + always-on-top
- [ ] Implement drag-to-move via mouse events
- [ ] Add system tray icon with show/hide/quit
- [ ] Render a placeholder mascot (a coloured shape is fine to start)

---

### Phase 2 — Mascot Animation System
> A living mascot with at least 3 animation states.

- [ ] Design or source a simple mascot sprite (CSS/SVG shapes are fine to start)
- [ ] Build a `BuddyStateMachine` with states: `idle`, `happy`, `sleepy`, `stressed`
- [ ] Use Framer Motion `variants` to drive state transitions
- [ ] Implement an idle loop — buddy breathes or bobs on a timer
- [ ] Click interaction triggers `happy` state + a speech bubble
- [ ] Build `SpeechBubble` component (appears, holds, fades out)

---

### Phase 3 — C Stats Module
> Write real C that reads system stats and exposes it to Electron.

- [ ] Set up `node-addon-api` in the project
- [ ] Write `stats.c` — reads `/proc/stat` for CPU usage
- [ ] Write `stats.c` — reads `/proc/meminfo` for RAM usage
- [ ] Compile to a `.node` native addon
- [ ] Create `stats-bridge.ts` — IPC handler that calls the C addon
- [ ] Create `useSystemStats` hook that polls via IPC every 2 seconds

---

### Phase 4 — Stat HUD
> The mascot shows a compact stats panel on click or hover.

- [ ] Build `StatHUD` component — expandable panel anchored to the mascot
- [ ] Display CPU %, RAM used/total, current time
- [ ] Animate in/out with Framer Motion `AnimatePresence`
- [ ] Mascot reacts to stats: high CPU → `stressed`, low RAM → `sleepy`

---

### Phase 5 — Personality & Dialogue
> The buddy says things, has a name, and notices stuff.

- [ ] User-configurable buddy name stored in `electron-store`
- [ ] Dialogue system: a pool of lines per mood state
- [ ] Buddy comments on stats contextually
- [ ] Time-aware greetings (morning / afternoon / evening / late night)
- [ ] Settings panel: name, scale, opacity, stat toggles

---

### Phase 6 — Cross-Platform Support
> Works on Linux, Windows, and macOS.

- [ ] Abstract stats module: `/proc` on Linux, Windows API on Windows
- [ ] Handle `#ifdef _WIN32` / `#ifdef __linux__` in C code
- [ ] Test tray behaviour across platforms
- [ ] Handle auto-start on login per OS
- [ ] Package with `electron-builder` for all targets

---

### Phase 7 — Customisation & Characters
> Multiple buddies, skins, and moddability.

- [ ] Design at least 2 full buddy characters
- [ ] JSON manifest per character: sprite paths + dialogue pools
- [ ] In-app character switcher
- [ ] Exportable/shareable config files

---

## 📖 Resources

- **C fundamentals:** [CS50x](https://cs50.harvard.edu/x)
- **C reference:** [Beej's Guide to C Programming](https://beej.us/guide/bgc/)
- **Electron:** [Electron Quick Start](https://www.electronjs.org/docs/latest/tutorial/quick-start)
- **Framer Motion:** [motion.dev/docs](https://motion.dev/docs)
- **Zustand:** [github.com/pmndrs/zustand](https://github.com/pmndrs/zustand)
- **Native addons:** [Node.js Addons Guide](https://nodejs.org/api/addons.html)

---

*Built by Jaineel — learning in public, one phase at a time.*