# Mobile Testing Guide for iPhone

## Method 1: Test on Your iPhone with Local Dev Server

### Setup (One-time)

1. **Start dev server accessible to your iPhone:**

   ```bash
   gatsby develop --host 0.0.0.0
   ```

2. **Find your computer's local IP address:**

   ```bash
   # On macOS/Linux:
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # On Windows:
   ipconfig | findstr IPv4
   ```

   Look for something like `192.168.1.XXX`

3. **Access from iPhone:**
   - Make sure iPhone is on same WiFi network
   - Open Safari on iPhone
   - Navigate to: `http://YOUR_IP_ADDRESS:8000`
   - Example: `http://192.168.1.100:8000`

### Safari Remote Debugging (See real-time console errors)

1. **On iPhone:**

   - Settings → Safari → Advanced → Enable "Web Inspector"

2. **On Mac:**

   - Open Safari
   - Enable Develop menu: Safari → Preferences → Advanced → "Show Develop menu"
   - Connect iPhone via USB
   - Develop → [Your iPhone Name] → Select your site

3. **Now you can:**
   - Inspect elements on your iPhone
   - See console errors
   - Debug JavaScript issues
   - View network requests

---

## Method 2: Browser DevTools Simulation

### Chrome DevTools (Most Accurate)

1. Open site in Chrome
2. Press F12 or Cmd+Option+I (Mac)
3. Click device toggle icon (phone/tablet icon) or press Cmd+Shift+M
4. Select "iPhone 15 Pro Max" from dropdown
5. Refresh page to trigger viewport meta tag

**Important Settings:**

- Set zoom to 100%
- Enable "Show media queries" (3-dot menu in device toolbar)
- Enable "Show device frame" to see actual device size

### Firefox Responsive Design Mode

1. Press Cmd+Option+M (Mac) or Ctrl+Shift+M (Windows/Linux)
2. Select "iPhone 15 Pro Max" (or set to 430x932 resolution)
3. Enable "Touch simulation"

---

## Method 3: Automated Lighthouse Mobile Testing

Run from command line:

```bash
# Install Lighthouse
npm install -g lighthouse

# Test mobile performance
lighthouse https://brendantreed.com --preset=desktop --view
lighthouse https://brendantreed.com --preset=mobile --view

# Or test local dev server
gatsby develop &
lighthouse http://localhost:8000 --preset=mobile --view
```

---

## Method 4: Visual Debugging (Current Breakpoint Indicator)

I can add a temporary visual indicator to show:

- Current viewport width
- Which Media query is active (small/medium/large)
- Current theme (dark/light)

This helps identify exactly what's rendering on your device.

Would you like me to add this?

---

## Common Mobile Issues to Check

### Viewport Meta Tag (Should be present)

**Check in browser inspector:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

### CSS Media Queries

**Test if media queries are working:**

- Home page header should be **35px font** on mobile (<600px)
- Home page header should be **45px font** on desktop (>600px)

### JavaScript-based Responsive (react-media)

**Open console and check:**

```javascript
window.matchMedia("(max-width: 599px)").matches // true on mobile
```

### Dark Mode Class

**Check in inspector:**

```html
<html class="dark" lang="en">
  <!-- Should have "dark" class -->
</html>
```

---

## Quick Debug Commands

### Check current deployment

```bash
curl -I https://brendantreed.com | grep -i "x-nf-request-id"
```

### Test viewport from command line

```bash
# Chrome headless screenshot
google-chrome --headless --screenshot --window-size=430,932 https://brendantreed.com
```

---

## What to Look For

### Mobile Layout Checklist

- [ ] Text is readable size (not zoomed out)
- [ ] Navigation stacks vertically
- [ ] Content width fills screen (not narrow column)
- [ ] Touch targets are at least 44x44px
- [ ] No horizontal scrolling
- [ ] Images scale properly

### Dark Mode Checklist

- [ ] No flash of light theme on load
- [ ] Dark background (#032740) applied
- [ ] White text on dark background
- [ ] Theme toggle works
- [ ] Theme persists on navigation
- [ ] Respects iOS system preference

---

## Next Steps

1. Start dev server: `gatsby develop --host 0.0.0.0`
2. Find your IP: `ifconfig | grep "inet "`
3. Test on iPhone: `http://YOUR_IP:8000`
4. Enable Safari Web Inspector to see console
5. Take screenshots of issues and share viewport width

Let me know what you see!
