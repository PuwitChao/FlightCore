# ✈️ Flight Core — Operational Memory Trainer

[![Web Application](https://img.shields.io/badge/Platform-Web-blue?style=flat-square)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-None-emerald?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blueviolet?style=flat-square)](#)
[![Responsive: Mobile First](https://img.shields.io/badge/Responsive-Mobile%20First-cyan?style=flat-square)](#)

**Flight Core** is a high-fidelity, high-pressure cognitive training application designed to sharpen the operational recall and scan patterns of pilots, aerospace engineers, and flight deck enthusiasts. It provides an offline-first, zero-dependency, ultra-lightweight environment optimized for mobile touchscreens.

The user interface has been engineered with **premium minimalist dark-mode aesthetics** (inspired by modern iOS dashboard layouts, Apple Weather, and clean financial systems) featuring translucent glassmorphic components, high-legibility Inter typography, and precise tactile responses.

---

## 🕹️ Live Demo
Deployable with absolute **zero compilation or build steps**. Run it locally or host it globally on **GitHub Pages** or **Cloudflare Pages** in seconds by pointing to the root repository folder.

---

## 🧠 Training Modules

Flight Core challenges different aspects of aviation-specific cognitive throughput in exactly **8-Round Cycles**:

1. **📋 Checklist Sequencing**: Masters ordered procedure recall under load. Features dynamic sizing (3 to 6 tasks depending on your streak) and injects procedural distractors to prevent mechanical clicking.
2. **🎛️ Instrument Scanning**: Simulates an active panel of 4 to 8 active gauges (IAS, ALT, N1, EGT, Fuel Flow, Oil Pressure, VIB, BAT). Viewports are briefly visible during briefing and completely blanked during test phases, requiring highly accurate numerical recall.
3. **🎙️ ATC Communications**: Exercises auditory/verbal data retention. Displays rapid, complex clearance transmissions consisting of Callsigns, Facilities, Freqs, and Squawks. Features a custom mobile-first numeric/text selector designed for high-speed touch interfaces.
4. **⚠️ Emergency Diagnostics**: Sharpens crisis management. Simulates compound failure states requiring rapid association between Symptoms $\rightarrow$ Fault System Isolation $\rightarrow$ Action Response protocols.

---

## ⚙️ Core Architecture & Mechanics

### 1. Dynamic Difficulty Scaling
To maintain a high-quality cognitive training slope, the game engine automatically calculates your active difficulty level dynamically based on your correct streak:

$$\text{Level} = 1 + \lfloor \frac{\text{Streak}}{2} \rfloor$$

* Higher levels scale checklists (up to 6 elements), spawn more active instruments (up to 8 detailed gauges), shorten briefing study windows, and inject complex speed, heading, and wind parameters into ATC strings.

### 2. Diverse Module Distribution ("No 3x Repeat" Rule)
To prevent fatigue and guarantee robust training across all modules, the system implements an internal tracking filter. If a module is chosen twice consecutively, the game engine guarantees it will be filtered out on the third draw, ensuring a highly diverse training session.

### 3. Client-Side Web Audio Synthesizer
Uses the modern native **Web Audio API** to compile and synthesize operational cockpit chime registers and alert indicators directly in-browser. Zero audio asset downloads are required, keeping the application entirely offline-ready.

---

## 📱 Visual Philosophy & Mobile Design

* **True Black OLED Backgrounds (`#000000`)** - Deep, high-contrast, premium mobile visual foundation that conserves battery power on modern smartphones.
* **Sleek Glassmorphic Elements** - Translucent card overlays utilizing deep blurs (`backdrop-filter: blur(20px)`) and microscopic border highlights (`rgba(255, 255, 255, 0.08)`).
* **Inter Typography** - Beautiful sans-serif visual hierarchy built on font weights and precise line-heights, completely free of glowing CRT shadows or monospace noise.
* **Strict Tactile Focus** - Button sizes and touch targets are locked to $\ge 48\text{dp}$ heights with dynamic active scale effects (`transform: scale(0.97)`) for simulated haptic response.

---

## 🚀 GitHub Pages & Cloudflare Pages Setup

Because Flight Core is built entirely on standard Web specs (Vanilla HTML5, modern CSS3 variables, and ES6 JS), it can be deployed to static hosting providers for free in less than a minute.

### 1. Deploying to GitHub Pages
1. Go to your repository on GitHub (`https://github.com/PuwitChao/FlightCore`).
2. Click **Settings** $\rightarrow$ **Pages** (under the Code and automation section).
3. Under **Build and deployment**:
   * **Source**: Deploy from a branch
   * **Branch**: Select `main` and path `/ (root)`
4. Click **Save**. Within 30 seconds, your site will be live at `https://<YOUR_USERNAME>.github.io/FlightCore/`!

### 2. Deploying to Cloudflare Pages (The Zero-Config Model)
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/) and head to **Workers & Pages**.
2. Click **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
3. Select your `FlightCore` repository.
4. Set up the Build Configuration:
   * **Framework Preset**: None (Static site)
   * **Build Command**: *Leave blank* (No build steps required!)
   * **Build Output Directory**: `./` (Root directory contains your code assets)
5. Click **Save and Deploy**. Cloudflare compiles your global edge CDN distribution instantly!

---

## 📂 Project File Structure
* [`index.html`](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/index.html) - Structural framework, markup screens, dynamic dials, and integrated keypad containers.
* [`styles.css`](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/styles.css) - Premium minimalist design tokens, responsive typography rules, glassmorphism overlays, and iOS tactile button styles.
* [`app.js`](file:///D:/Documents/Personal_Project/Google_AG/FlightCore/app.js) - RNG data engines, difficulty loop controllers, Web Audio synth triggers, and interactive SVG run metrics charts.

---

## 📜 License
This project is licensed under the MIT License. Feel free to fork, adapt, and fly.
