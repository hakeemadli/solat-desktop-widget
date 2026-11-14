# Solat Widget — User Manual

Everything you need to run and use **Solat Widget**, a small always-on-top card
that shows Malaysian prayer times from the official JAKIM e-Solat timetable.

For the technical internals, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 1. What it is

Solat Widget is a small window that floats over your desktop and shows:

- the **next prayer** and a live countdown to it,
- today's full timetable (Imsak, Subuh, Syuruk, Zohor, Asar, Maghrib, Isyak),
- today's Gregorian and Hijri dates,
- a reminder notification before each prayer, if you want it.

Times come straight from JAKIM's e-Solat API for the zone you choose, so they
match the official timetable, the mosque's printed schedule and apps like
eSolat/eDoa.

**Requirements:** Windows 10 or 11. It works fully offline for a while thanks
to a local cache, but it needs internet to refresh.

---

## 2. Installing

Two options come with each release:

| File | Use it when |
|---|---|
| `SolatWidget-1.0.0-portable.exe` | You want it now, no installation. Just double-click it. |
| `Solat Widget Setup 1.0.0.exe` | You want a Start-menu/desktop shortcut and "Mula bersama Windows" to work properly. |

Because the builds are not code-signed, the **first** launch shows a
SmartScreen message:

> *Windows protected your PC — Microsoft Defender SmartScreen prevented an
> unrecognized app from starting.*

Click **More info → Run anyway**. This is normal for any unsigned personal
build and only appears on first launch.

### First run

1. The widget appears in the **bottom-right corner** of your desktop.
2. It automatically guesses your JAKIM zone from your network location — for
   example, an IP in Kuala Lumpur resolves to `WLY01`.
3. It fetches the timetable and starts counting down.

If it picked the wrong zone, see [§6 Changing your zone](#6-changing-your-zone).

---

## 3. The main screen

![Main widget view](images/widget.png)

| # | Element | What it means |
|---|---|---|
| 1 | ☾ **SOLAT** | Title. The whole card is draggable from anywhere except buttons |
| 2 | `WLY01` chip | Your current JAKIM zone — click it to change zone |
| 3 | Pin | Toggle "always on top" (glows green when pinned) |
| 4 | Sliders | Open the settings panel |
| 5 | `—` | Hide the widget into the system tray |
| 6 | `×` | Close the app completely (it does **not** hide to tray) |
| 7 | **SETERUSNYA** | Header for the next prayer |
| 8 | **Maghrib** + `18:58` | The prayer that is next, and its time today |
| 9 | `00:27:39` | Live countdown to that prayer |
| 10 | Thin progress bar | How far through the current prayer window you are (Asar → Maghrib) |
| 11 | `Asar 16:22 → Maghrib 18:58` | The prayer window you are currently in |
| 12 | `Sabtu, 14 Nov 2026 · 4 Jamadilakhir 1448` | Today's date and the Hijri date |
| 13 | `📍 Kuala Lumpur, Wilayah Persekutuan` | The location your zone was detected from |
| 14 | Prayer rows | Today's timetable; ✓ marks prayers that have passed; the highlighted row is the next prayer |
| 15 | `Data 18:30` | When the data was last resolved; `cache` means it came from the local cache |

### Reading the times

- **Imsak** and **Syuruk** are *informational* — they are not prayers. Imsak is
  ~10 minutes before Subuh; Syuruk is sunrise. You can hide both in settings.
- The five that count as prayers are **Subuh, Zohor, Asar, Maghrib, Isyak**.
  The countdown only ever targets one of these five.
- **After Isyak**, the widget automatically counts down to *tomorrow's* Subuh.

### Different looks

![Widget variants](images/variants.png)

Left: the default 24-hour display with Imsak and Syuruk visible.
Right: 12-hour format (`PG` = pagi/AM, `PTG` = petang/PM) with Imsak and Syuruk
hidden. Both are settings.

---

## 4. Status badges and the footer

The last line of the card tells you how fresh the data is:

| Text | Meaning |
|---|---|
| `Data 16:25` | Fetched live from JAKIM at 16:25 |
| `Data 16:25 · cache` | Loaded from the local cache (normal after a restart within 6 hours) |
| `Data 16:25 · cache · offline` | The live fetch failed and the timetable shown is the last cached one — check your internet connection |
| `Data 16:25 · waktu MYT` | Your PC's clock is not in Malaysia Time (UTC+8); times are still shown in Malaysian time |
| `Mengambil data JAKIM…` | Fetching right now |
| An error message | The API could not be reached or the response was invalid |

There is also a small `Cache` badge in the hero area whenever the timetable is
coming from the cache rather than a live fetch.

---

## 5. The tray icon

The widget lives in the **system tray** (bottom-right, next to the clock):

- **Left-click** the icon → show/hide the widget.
- **Hover** it → the tooltip shows the next prayer and live countdown.
- **Right-click** it → a menu with:

```
Subuh 05:48 (07:12:03)      ← live countdown
Zon: WLY01 · Kuala Lumpur
──────────────────────────
Tunjuk Widget
Muat Semula Data
──────────────────────────
Sentiasa di Atas        ✓
Mula Bersama Windows
Notifikasi Azan         ✓
──────────────────────────
Keluar
```

> **Windows 11 tip:** new tray icons start hidden inside the overflow menu (the
> `^` chevron next to the clock). Click the chevron and drag the widget's
> crescent icon onto the taskbar if you want it permanently visible.

`—` on the card and the tray both hide the widget; only `×` (or *Keluar*)
actually exits it.

---

## 6. Changing your zone

Click the **zone chip** (`WLY01`) or the sliders icon to open settings:

![Settings panel](images/settings.png)

In **ZON JAKIM**:

1. Type in the search box — it matches zone code, state name and district
   names (`ampang`, `kuala lumpur`, `wly`, …).
2. Click a row to switch immediately. The widget refetches for that zone.
3. Or click **Kesan lokasi saya** to re-run the automatic detection and see
   which location it resolved (`Dikesan: Kuala Lumpur, Wilayah Persekutuan → WLY01`).

All 60 official JAKIM zones are available. The automatic detection is
city-level, so near a state border it may be one district off — just pick
manually in that case. Your choice is remembered; the app does not re-detect
on later launches.

---

## 7. Settings explained

| Control | What it does |
|---|---|
| **Kesan lokasi saya** | Re-detect your zone from your IP address |
| **Zon search + list** | Pick any of the 60 zones manually |
| **Notifikasi sebelum azan** | Turn the reminder toasts on/off |
| **Masa awal** | How long before the azan you get notified: tepat waktu, 5, 10, 15, 20 or 30 minutes |
| **Sentiasa di atas** | Pin the card above all other windows |
| **Tunjuk Imsak** | Show/hide the Imsak row |
| **Tunjuk Syuruk** | Show/hide the Syuruk row |
| **Format 12 jam** | `18:58` ↔ `6:58 PTG` |
| **Mula bersama Windows** | Launch the widget (hidden in the tray) at login — *only available on the installed/portable build, not in dev mode* |
| **Ke tray** | Hide the card now |
| **Keluar** | Quit the app |

Settings apply instantly and are saved to
`%APPDATA%\solat-desktop-widget\config.json`.

---

## 8. Prayer notifications

- You get one Windows notification per prayer, by default **10 minutes
  before** the azan, e.g. *"Maghrib 10 minit lagi — Maghrib 18:58 · WLY01 ·
  Kuala Lumpur"*.
- It fires **once**. Closing the widget, restarting Windows or the app will not
  re-trigger it for the same prayer.
- Clicking the notification brings the widget back up.
- If you do not see notifications: check **Settings → System → Notifications**
  for "Solat Widget", and make sure **Focus Assist / Do Not Disturb** is not
  silencing them.

---

## 9. Everyday actions

| Action | How |
|---|---|
| Move the widget | Drag it from any empty area (the whole card is a handle) |
| Force a data refresh | `Muat semula` in the footer, or the tray menu |
| Hide it for a while | `—`, the tray icon, or *Ke tray* in settings |
| Bring it back | Click the tray icon |
| Quit for good | `×` or *Keluar* in settings, or *Keluar* in the tray menu |
| Open it again | Run the exe again — a second copy will not start; the existing widget is shown instead |

Its position is remembered between sessions. If a monitor is unplugged and the
widget lands off-screen, it re-anchors itself to the bottom-right.

---

## 10. Troubleshooting

| Problem | Cause & fix |
|---|---|
| `offline` badge / no times | No internet, or JAKIM is unreachable. The widget keeps showing the last cached timetable. Check your connection and click `Muat semula` |
| Wrong zone after first run | IP geolocation is approximate. Open settings → search for your state/district → click the row |
| Widget not staying on top | The pin toggle is off (pin icon in the header, or *Sentiasa di atas* in settings) |
| No notifications | Check Windows notification settings for "Solat Widget", Focus Assist, and that *Notifikasi sebelum azan* is on |
| Tray icon missing | Windows 11 hides new icons in the `^` overflow — drag it out (§5) |
| Times differ from my phone app | Confirm the zone matches your district (§6); also confirm your device clock/timezone is correct |
| Widget disappeared entirely | It is in the tray — click the tray icon. If the icon is gone, run the exe again |
| Widget stuck on "Mengambil data JAKIM…" | The e-Solat API may be down. It will retry automatically every 3 hours and at midnight |

---

## 11. Privacy and data

**What leaves your computer:**

1. HTTPS requests to `e-solat.gov.my` (the JAKIM timetable) — no personal data
   beyond your IP, which is inherent to any web request.
2. One HTTPS/HTTP request to an IP geolocation service (ipwho.is → ipapi.co →
   ip-api.com) — only when detecting your zone.

**What is stored on your computer:**

```
%APPDATA%\solat-desktop-widget\
├─ config.json      your settings (zone, toggles, window position)
└─ data\*.json      cached JAKIM responses
```

No accounts, no telemetry, no analytics. Deleting that folder resets the widget
to first-run state.

---

## 12. Uninstalling

- **Installer build:** Windows Settings → Apps → *Solat Widget* → Uninstall.
- **Portable build:** delete `SolatWidget-1.0.0-portable.exe`.
- Then optionally delete `%APPDATA%\solat-desktop-widget\` to remove your
  settings and cache.

---

## 13. FAQ

**Is this the official JAKIM app?**
No. It is an unofficial widget that reads JAKIM's own e-Solat API, so the times
are the official ones, but the app itself is not affiliated with JAKIM.

**Does it need internet?**
To refresh, yes. A cached timetable keeps working without it and is marked
`offline` until it can refresh.

**Why is my zone different from my friend's?**
JAKIM splits each state into districts. Subuh and Maghrib can differ by a
minute or two between them. Pick the zone for your district (§6).

**Can I use it outside Malaysia?**
The widget works, but automatic zone detection only applies to Malaysian IPs.
Choose your zone manually. If your PC's clock is not on UTC+8, times are still
displayed in Malaysian time and marked `waktu MYT`.

**Does it update itself?**
No. It refreshes the *timetable* automatically (midnight, every 3 hours, on
launch), but the app itself is updated by downloading a new build.
