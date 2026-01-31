# Entropic Official Website Design Doc
**Reference Inspiration:** [Hyper.is](https://hyper.is)
**Tech Stack:** React + Vite (Static Build)

## 1. Design Philosophy: "Cyberpunk Minimalist"

Inspired by Hyper, the visual language should be:
*   **Deep Dark Background**: `#000000` or extremely dark grey `#1e1e1e`.
*   **Neon Accents**: Use the IDE's primary colors (Cyan/Magenta) for CTAs and highlights.
*   **Monospace Typography**: `JetBrains Mono` or similar coding fonts for headers to emphasize "Developer Tool" vibes.
*   **No Clutter**: Extremely generous whitespace (blackspace).

## 2. Page Structure (One Page Scroll)

### 2.1 Hero Section (The Hook)
*   **Visual**: Instead of a static screenshot, use a **Live Web-based Entropic Component** in the center.
    *   A simplified editor window running a sleek P5.js sketch (e.g., particles reacting to mouse).
    *   Caption: "This is Entropic. It runs code. It builds art."
*   **Headline**: "The Creative Coding IDE for the Future."
*   **CTA Button**:
    *   Primary: "Download for Windows" (Black button, Neon border, Glow effect).
    *   Secondary: "View on GitHub".

### 2.2 Feature Grid (The "Why")
*   *Layout*: 2x2 or 3x1 grid using "Bento Box" style (rounded corners, subtle borders).
*   **Features to Highlight**:
    *   **TypeScript/P5.js Hybrid**: "Type-safe creative coding."
    *   **Infinite Canvas**: "Think outside the text file." (Future feature tease).
    *   **Native Performance**: "Powered by Electron & WebGPU."
    *   **Plugin System**: "Extensible by design."

### 2.3 The "Vibe" Section (Interactive Break)
*   A full-width section with a trippy, shader-based background.
*   Text overlay: "Entropy is not disorder. It's possibility."

### 2.4 Footer
*   Simple links: GitHub, Twitter/X, Discord.
*   "Made with 🖤 by Natt & Entropic Team."

## 3. Implementation Plan (Vite + React)

### 3.1 Directory Structure
We will create a separate folder `entropic-site` (or repo) but since this is a static build, we can hypothetically host it anywhere.

### 3.2 Key Components
*   `Scene.tsx`: The P5.js background component.
*   `TerminalWindow.tsx`: A CSS-styled component mimicking the IDE window for screenshots/demos.
*   `NeonButton.tsx`: The signature CTA component.

### 3.3 Asset Strategy
*   Use **SVG** for all icons (crisp on high DPI).
*   Use **CSS Variables** for theming (easy to tweak the "Neon" colors globally).
*   **Font**: Embed a high-quality coding font subset.

## 4. Deployment
*   **Build**: `npm run build` -> `/dist` folder.
*   **Host**: Upload `/dist` contents to PHP Server (`public_html`).
*   **Routing**: Single `index.html`, no complex server config needed.
