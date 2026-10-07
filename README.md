# YouTube Speed Controller

A lightweight browser extension designed to override YouTube's standard 2.0x playback speed limit, unlocking fine-grained playback controls from 0.5x up to 6.0x. Built with an accessible interface, global hotkeys, and persistent storage, it ensures your preferred viewing speeds carry seamlessly across all YouTube videos, navigation events, and open tabs.

---

## 🚀 Core Functionality & Usefulness

* **Extended Speed Range:** Overrides default player limitations to support playback speeds from 0.5x up to 6.0x.


* **Persistent Playback Memory:** Saves the active speed to browser storage and automatically applies it to newly loaded videos, autoplay queues, and separate tabs.


* **Single-Click Presets & Step Adjustments:** Features dedicated 1.0x, 1.5x, 2.5x, and 3.5x preset buttons, rapid `+0.5x` / `-0.5x` bump buttons, and a smooth `0.1x` slider.


* **Real-Time Duration Estimate:** Displays a dynamic calculation showing exactly how long a 10-minute video segment will take to complete at the current playback speed.


* **Customizable Range Bounds:** An expandable settings panel allows users to tailor the slider's minimum and maximum boundaries anywhere within the 0.5x–6.0x absolute limits.



---

## ⌨️ Keyboard Shortcuts

Keyboard shortcuts work directly on YouTube pages without interfering with search bars or comment fields:

| Shortcut | Action | Scope |
| --- | --- | --- |
| `Ctrl + Shift + Y` | Toggle extension popup| Global browser command|
| `Shift + >` (or `Shift + .`) | Increase playback speed by `+0.5x`<br> | Active YouTube video|
| `Shift + <` (or `Shift + ,`) | Decrease playback speed by `-0.5x`<br> | Active YouTube video|

Shortcuts automatically ignore keystrokes inside `<input>`, `<textarea>`, and `contenteditable` elements to prevent accidental speed changes while typing.

---

## 🛠️ Technical Architecture

* **Engine:** Pure Vanilla JavaScript, HTML5, and CSS (zero third-party dependencies or bundlers).


* **Cross-Browser Compatibility:** Implements standard API normalization (`typeof browser !== "undefined" ? browser : chrome`) to support Firefox and Chromium-based browsers natively.


* **SPA-Resilient Hooking:** Utilizes a `MutationObserver` attached to `document.documentElement` alongside `loadeddata` and `playing` lifecycle listeners, guaranteeing playback rate enforcement through YouTube's single-page client transitions.


* **Storage & Messaging:** Uses `storage.local` to sync state across windows and `tabs.sendMessage` to broadcast real-time speed adjustments directly to the active video player.



---

## 📦 Installation

### Official Firefox Release

Install directly from the Mozilla Add-ons directory:

* **Firefox Add-ons Store:** [YouTube Speed Control](https://addons.mozilla.org/en-US/firefox/addon/yt-speed-control-fvat/)

### Developer / Unpacked Installation

#### Mozilla Firefox

1. Navigate to `about:debugging#/runtime/this-firefox` in the address bar.
2. Click **Load Temporary Add-on...**
3. Select `manifest.json` from the repository directory.



#### Google Chrome / Chromium (Brave, Edge, Opera)

1. Navigate to `chrome://extensions/` in the address bar.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the extension root folder.

---

## 📱 Extension Interface 

<img width="250" height="375" alt="image" src="https://github.com/user-attachments/assets/1a9a6ae0-2989-4250-a2ab-b37d32ca81ed" />
