# Mobile Testing Guide

## Method 1: Test on Your iPhone

### Plain pages (no sensors)

1. **Start the dev server accessible to your iPhone:**

   ```bash
   npm run dev -- --host 0.0.0.0
   ```

2. **Find your computer's local IP address:**

   ```bash
   # On macOS/Linux:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

3. **Access from iPhone** (same WiFi): `http://YOUR_IP_ADDRESS:4321`

### Sensor pages (/headsup, /motion-test) — HTTPS required

`devicemotion` and `DeviceMotionEvent.requestPermission()` only work in a
secure context, so a plain `http://192.168.x.x` URL will not fire motion
events. Use one of:

- **Netlify live tunnel** (HTTPS URL proxying your local dev server):

  ```bash
  npx netlify dev --live
  ```

- **Branch deploy / PR deploy preview** — push the branch and use the
  Netlify preview URL.

### Debugging the game on-device

- Open `/motion-test` — a diagnostic harness over the same tilt hook the
  game uses: live pitch readout, zones, arm state, action log, and the
  tuning constants (defined in `src/hooks/useTiltControls.js`).
- Open `/headsup?debug` — in-game overlay with phase, permission, pitch,
  arm state, and audio state (AudioContext state, buffers loaded, mute,
  audio session type).
- No sound? Check in order: the 🔇/🔊 icon (mute persists in
  localStorage), the ringer/silent switch (the game opts into a playback
  audio session, but only on Safari 16.4+), and the `?debug` audio line.

### Safari Remote Debugging (real-time console)

1. **On iPhone:** Settings → Safari → Advanced → Enable "Web Inspector"
2. **On Mac:** Safari → Settings → Advanced → "Show features for web
   developers", connect iPhone via USB, then Develop → [Your iPhone] →
   select the page.

---

## Method 2: Browser DevTools Simulation

1. Open the site in Chrome, press F12, toggle the device toolbar
   (Cmd+Shift+M) and pick an iPhone preset.
2. Landscape/portrait toggling exercises the game's rotate gate.

Note: DevTools sensor emulation does **not** usefully emulate
`devicemotion` streams — tilt controls need real hardware. Keyboard
controls (← correct, → pass, space pause) cover the game flow on desktop.

---

## Method 3: Lighthouse

```bash
npm install -g lighthouse
lighthouse https://brendantreed.com --preset=mobile --view

# Or against the local dev server
npm run dev &
lighthouse http://localhost:4321 --preset=mobile --view
```

---

## Common Mobile Issues to Check

### Viewport Meta Tags

- Site pages (`BaseLayout.astro`):

  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ```

- Game pages (`GameLayout.astro`) additionally disable zoom and use the
  full dynamic viewport:

  ```html
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
  />
  ```

### CSS Media Queries

- Home page header should be **35px font** on mobile (<600px), **45px**
  on desktop.

### Dark Mode

```html
<html class="dark" lang="en">
  <!-- "dark" class set before paint by the inline script -->
</html>
```

---

## Mobile Layout Checklist

- [ ] Text is readable size (not zoomed out)
- [ ] Navigation stacks vertically
- [ ] No horizontal scrolling
- [ ] Touch targets are at least 44x44px
- [ ] Images scale properly

## Game Checklist (on-device)

- [ ] Motion permission prompt appears only after tapping Start
- [ ] Tilt down = correct, tilt up = pass; one nod = one action
- [ ] Sounds play (with ringer on silent too, Safari 16.4+)
- [ ] Screen stays awake for a full round
- [ ] No layout jump when the URL bar collapses
- [ ] Portrait shows the rotate prompt; rotating back resumes
