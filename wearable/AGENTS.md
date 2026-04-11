# Wearable — Zepp OS App

ZeppCompanion wearable app for Amazfit smartwatches. Zepp OS 3.0+ API, round display (480px), target device: **Amazfit Active 2 NFC (Round)**.

## Architecture

- **Runtime**: Zepp OS Mini App (JavaScript, no Node.js, no ES modules)
- **Framework**: `@zeppos/zml` (ZML base classes)
- **API version**: 3.0 compatible
- **Target**: `gt` (round display), `designWidth: 480`
- **appId**: 20001

## File Structure

```
wearable/
├── app.js                  # App entry (BaseApp, globalData, preferences)
├── app.json                # App manifest (pages, permissions, targets)
├── app-side/index.js       # Side Service (phone companion, BLE messaging)
├── setting/index.js        # Settings page (Zepp app)
├── shared/protocol.js      # Shared protocol constants
├── components/
│   └── mascot-widget.js    # Animated mascot component (frame-based)
├── page/gt/                # Device pages (round display)
│   ├── home/               # Home page with mascot + nav buttons
│   ├── training-select/    # Training type selector
│   ├── pre-training/       # Pre-training countdown with mascot
│   ├── active-training/    # Active training (HR, timer, companion messages)
│   ├── training-summary/   # Post-training summary
│   └── settings/           # On-device settings
├── utils/
│   ├── companion-engine.js # Companion message logic
│   ├── audio-player.js     # TTS audio playback
│   ├── preferences.js      # User preferences (localStorage)
│   └── theme.js            # Theme/color constants
├── assets/gt.r/            # Round display assets
│   ├── mascot/             # Mascot sprite frames (feliz, neutro, triste, hablar)
│   └── icon_*.png          # Navigation icons
└── page/i18n/              # Translations (en-US, es-ES .po files)
```

## Key Conventions

- Page files MUST use `.page.js` suffix (e.g., `index.page.js`)
- Layout files use `.page.r.layout.js` suffix (round display)
- Assets go in `assets/gt.r/` for round target
- All pages export `Page({ ... })` with `onInit`, `build`, `onDestroy`
- Widget z-order matters — later widgets render on top
- No `import`/`export` ES modules — use Zepp OS module system

## Build & Deploy

### Prerequisites
- Zeus CLI installed globally (`npm i -g @nickhealthy/zeus-cli` or similar)
- Zepp app running on phone, paired with watch

### Commands (run from `wearable/` directory)

| Command | Description |
|---------|-------------|
| `zeus build` | Build the app (check for compile errors) |
| `zeus preview` | Preview on simulator (interactive device selector) |
| `./install.sh` | **Build + install on physical watch via bridge** |

### install.sh

Expect script that automates `zeus bridge` interactive session:
1. Spawns `zeus bridge`
2. Waits for `bridge$` prompt
3. Sends `connect` (connects to Zepp app on phone)
4. Waits for "successfully connected" confirmation
5. Sends `install -t "Amazfit Active 2 NFC (Round)"` (builds + installs)
6. Waits 30s for install to complete, then exits

**Always run `zeus build` first** to catch compile errors before deploying.

## Permissions

```json
["data:os.device.info", "data:user.hd.heart_rate", "device:os.local_storage", "device:os.geolocation", "device:os.media"]
```

## Agent Notes

- Zepp OS has severe memory constraints — minimize widget count and asset sizes
- `zeus preview` and `zeus bridge` are interactive — use `expect` for automation
- The mascot uses frame-by-frame PNG animation, not GIF/video
- Side Service (`app-side/`) runs on the phone, communicates via BLE with device pages
- Test on physical device via `./install.sh` — simulator may not reflect real behavior
