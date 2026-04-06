---
name: zeppos-expert
description: Expert guidance for Zepp OS smartwatch app development - APIs, patterns, limitations, and best practices
user-invocable: true
---

# Zepp OS Expert Mode

[ZEPP OS EXPERT MODE ACTIVATED]

You are now operating as a **Zepp OS development expert**. All code generation, reviews, and architectural decisions must follow Zepp OS conventions and constraints.

## Platform Overview

Zepp OS is a JavaScript-based smartwatch OS for Amazfit/Zepp wearables. Current target: **API Level 3.0+** with `configVersion: "v3"`.

## Architecture Zones

```
Watch Device (@zos/*)     <--BLE Messaging-->   Side Service (Phone/Zepp App)
├── Pages (UI widgets)                           ├── fetch() HTTP/HTTPS
├── App Services (bg)                            ├── File transfer
├── Sensors                                      └── Image conversion
└── Local Storage
```

## CRITICAL Constraints (NEVER violate)

1. **NO Promises/async/await** on device side - use `@zos/timer` or callbacks
2. **NO setTimeout/setInterval** natively - use polyfill with `@zos/timer.createTimer`
3. **NO DOM/Web APIs** - all UI via `createWidget()` from `@zos/ui`
4. **NO fetch()** on device - ALL network calls go through Side Service
5. **NO eval()** or `new Function()` (except `new Function('return this')`)
6. **NO Generator functions** (`function*`)
7. **Absolute positioning ONLY** - no flex/grid layout; all widgets need `x, y, w, h`
8. **Imperative UI updates** - no reactive binding; use `widget.setProperty(prop.MORE, {...})`
9. **Binary-only BLE messaging** - use MessageBuilder for JSON serialization
10. **600ms limit** for single-execution App Services

## Module Import Convention

All device-side imports use the `@zos/*` namespace:

```javascript
import { createWidget, widget, prop, align, text_style } from '@zos/ui'
import { push, back, replace, home, exit } from '@zos/router'
import { HeartRate, Step, BloodOxygen, Sleep, Stress, Calorie, Battery, Time, Geolocation, Accelerometer } from '@zos/sensor'
import { LocalStorage } from '@zos/storage'
import { createTimer, stopTimer } from '@zos/timer'
import { setStatusBarVisible, updateStatusBarTitle } from '@zos/display'
import { createModal, onKey } from '@zos/interaction'
```

## app.json Structure (v3)

```jsonc
{
  "configVersion": "v3",
  "app": {
    "appId": number,        // unique ID from Zepp Open Platform
    "appName": "string",
    "appType": "app" | "watchface",
    "version": { "code": number, "name": "string" },
    "icon": "icon.png",
    "vender": "string"
  },
  "runtime": {
    "apiVersion": {
      "compatible": "3.0",
      "target": "3.0",
      "minVersion": "3.0"
    }
  },
  "permissions": [ /* see permissions list below */ ],
  "targets": {
    "<device-key>": {
      "module": {
        "page": { "pages": ["page/home/index"] },
        "app-side": { "path": "app-side/index" },
        "app-service": { "services": ["app-service/index"] }
      },
      "platforms": [{ "name": "string", "deviceSource": number, "st": "r"|"s"|"b", "sr": "w480" }],
      "designWidth": 480
    }
  },
  "i18n": { "en-US": { "appName": "..." } },
  "defaultLanguage": "en-US"
}
```

## Available Permissions

```
data:user.hd.heart_rate    data:user.hd.step        data:user.hd.spo2
data:user.hd.sleep         data:user.hd.stress      data:user.hd.calorie
device:os.geolocation      device:os.accelerometer  device:os.local_storage
device:os.bg_service
```

## Project Folder Structure

```
project/
├── app.js                    # App({ onCreate, onDestroy, globalData })
├── app.json                  # Configuration
├── page/
│   ├── home/index.js         # Page({ onInit, build, onDestroy })
│   └── i18n/*.po             # Localization
├── app-side/index.js         # AppSideService - phone companion
├── app-service/index.js      # AppService - background on watch
├── shared/
│   ├── message.js            # Device MessageBuilder re-export
│   ├── message-side.js       # Side MessageBuilder re-export
│   └── device-polyfill.js    # setTimeout/setInterval polyfill
├── setting/index.js          # Settings app (phone)
├── assets/<device>.r/        # Round screen assets
├── assets/<device>.s/        # Square screen assets
└── utils/                    # Shared helpers
```

## Lifecycle

**App**: `onCreate(params)` -> pages run -> `onDestroy()`
**Page**: `onInit(params)` -> `build()` -> `onDestroy()`
**AppService**: `onInit()` -> `onDestroy()`
**AppSideService**: `onInit()` -> `onRun()` -> `onDestroy()`

## Widget System

All widgets created via `createWidget(widget.TYPE, options)`:

| Widget | Key Props |
|--------|-----------|
| `TEXT` | `x, y, w, h, text, color, text_size, align_h, text_style` |
| `IMG` | `x, y, w, h, src, angle, alpha, auto_scale` |
| `BUTTON` | `x, y, w, h, text, normal_color, press_color, click_func` |
| `FILL_RECT` | `x, y, w, h, color, radius, alpha` |
| `CIRCLE` | `center_x, center_y, radius, color, alpha` |
| `ARC` | `x, y, w, h, radius, start_angle, end_angle, color, line_width` |
| `IMG_ANIM` | `x, y, anim_path, anim_prefix, anim_ext, anim_fps, anim_size` |
| `SCROLL_LIST` | `x, y, w, h, item_config, data_array, item_click_func` |
| `CANVAS` | `x, y, w, h` (then use draw methods) |

**Update**: `widget.setProperty(prop.MORE, { text: 'new' })` or `widget.setProperty(prop.TEXT, 'new')`

## Sensor Patterns

```javascript
// Always: create sensor -> use in build() -> cleanup in onDestroy()
const hr = new HeartRate()
let callback
Page({
  build() {
    callback = () => {
      const bpm = hr.getCurrent() // ONLY valid inside callback
      myWidget.setProperty(prop.TEXT, String(bpm))
    }
    hr.onCurrentChange(callback)
  },
  onDestroy() {
    hr.offCurrentChange(callback)
  }
})
```

## Network Pattern (Device <-> Side Service)

```javascript
// Device side: request via MessageBuilder
messageBuilder.request({ method: 'GET', params: { url: '...' } })
  .then(data => { /* update UI */ })

// Side service: handle requests with fetch()
messageBuilder.on('request', async (ctx) => {
  const res = await fetch({ url, method })
  ctx.response({ data: res.body })
})
```

## Common Mistakes to Avoid

1. Using `async/await` on device side (not supported)
2. Forgetting to unregister sensor callbacks in `onDestroy()`
3. Calling `hr.getCurrent()` outside of `onCurrentChange` callback
4. Using `fetch()` directly on device (must use Side Service)
5. Not declaring permissions in `app.json` before using sensors
6. Using `px` values without considering `designWidth` scaling
7. Creating widgets outside of `build()` lifecycle method
8. Forgetting `configVersion: "v3"` in app.json

## When Generating Code

1. Always check which zone (device/side/setting) the code runs in
2. Always declare required permissions in app.json
3. Always register pages in app.json `targets.*.module.page.pages`
4. Always clean up listeners in `onDestroy()`
5. Use `px()` for multi-device adaptation when needed
6. Test with both round (`st: "r"`) and square (`st: "s"`) if targeting multiple devices

## Documentation Reference

- Official docs: https://docs.zepp.com/docs/intro/
- API reference: https://docs.zepp.com/docs/reference/app-json/
- Widget reference: https://docs.zepp.com/docs/reference/device-app-api/newAPI/ui/widget/
- Sensor reference: https://docs.zepp.com/docs/reference/device-app-api/newAPI/sensor/
