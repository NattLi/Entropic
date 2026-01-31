# Changelog

All notable changes to Entropic will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-01-31

### Added
- **File Management System** 📂:
    - Create new sketches with default code template
    - Save/Load sketch files (`.pde`)
    - Delete sketches (soft delete to Bin)
    - Rename sketches with Java-safe name validation
    - Sketchbook directory: `~/Documents/Entropic/sketches/`
    - IPC handlers: `create-sketch`, `save-sketch`, `load-sketch`, `delete-sketch`, `rename-sketch`, `get-sketches`

## [0.5.1] - 2026-01-30

### Improved
- **Serial Scanner UI Polish**:
    - **VS Code Style Tabs**: Replaced underlined tabs with pill-shaped, vertically centered buttons matching VS Code Terminal style.
    - **Clean Icons**: Replaced text buttons with minimalist SVG icons for Clear and Copy actions.
    - **Alignment**: Fixed header height and button alignment for a pixel-perfect layout.
- **Scanning UX**:
    - **Loading State**: Added "Scanning for devices..." feedback with artificial delay (800ms) to confirm refresh action.
    - **Auto-Clear**: Port list is cleared immediately when starting a scan to provide better visual feedback.

## [0.5.0] - 2026-01-30

### Added
- **Serial Port Scanner**:
    - Integrated Tabbed Console/Serial interface
    - "Scan All Ports" functionality to detect active devices
    - Processing-style port list display (e.g., `[0] COM3`)
    - Real-time data preview for active ports
    - Copy port path to clipboard
- **Editor Improvements**:
    - Updated default "Welcome" sketch for better Java compatibility
    - Fixed `color` type issues (switched to `int`)
    - Fixed float literal precision issues (added `f` suffix)

## [0.4.0] - 2026-01-30

### Added
- **Sketchbook UX Improvements**:
    - Date grouping (Today, Yesterday, specific dates)
    - Real-time search filtering with clear button
    - Star/Pin feature with backend persistence (`.starred.json`)
    - Starred sketches grouped at top of list
    - Visual hierarchy: active item accent border, inactive opacity reduction
- **Figma-style Hamburger Menu**:
    - Modern nested submenu design with hover-reveal behavior
    - File menu: New Sketch, Save
    - Edit menu: Undo, Redo, Cut, Copy, Paste, Select All
    - View menu: Developer Tools
    - Help menu: Open Libraries Folder, Version info
    - System menu bar hidden (`autoHideMenuBar: true`)

### Changed
- **Neutral Dark Theme**: Replaced purple-tinted theme with neutral gray/black color scheme
    - Better for designers' color perception ("white balance")
    - Monaco Editor now uses VS Code-like syntax colors
    - Updated accent colors from cyan/pink to blue tones
- **UI Polish**: Fixed "Open Libraries Folder" button styling (removed white background)

## [0.3.5] - 2026-01-30

### Improved
- **Single Accordion Mode**: Only one project accordion can be expanded at a time, reducing visual clutter
- **Auto-Save on Switch**: Switching projects now auto-saves unsaved changes to Working Copy (no confirmation dialog)
- **Simplified UI**: Removed triangle expand/collapse icons; clicking project title opens accordion + loads Working Copy

## [0.3.0] - 2026-01-30

### Added
- **Bin (Recycle Bin) Feature**: Soft deletion for Sketches and Stashes
    - Deleted items are moved to `.bin/` folder instead of permanent deletion
    - 30-day automatic cleanup of expired items on app startup
    - Collapsible Bin section in sidebar with item count badge
    - Right-click context menu: Restore / Delete Permanently
    - "Empty Bin" button to clear all items at once
    - Time-since-deletion display for each item (Today, Yesterday, X days ago)
- **UX Enhancement**: When deleting an active stash, automatically switches to Working Copy with blur transition animation and Toast notification

### Fixed
- Editor blur animation now properly clears after stash deletion (was stuck due to incorrect API call)

## [0.2.0] - 2026-01-29

### Added
- **Standalone Build Support**: Bundled JDK (Windows/Mac) and Processing Core libraries resources.
- **Library Auto-Detection**: Real-time parsing of `import` statements with UI feedback ("Installed" or "Install").
- **Mac Compatibility**: Verified cross-platform resource bundling.
- **Variant Stash System**:
    - Replaced "Git Branching" model with "Backup/Restore" model (`main.pde` is Working Copy).
    - Added floating "Stash / Restore" button.
    - Added accordion UI for managing stashes.
    - Added rename/delete context menus for stashes.
    - Added blur transparency transition effects (0.6s) for context switching.
- **Reveal in Folder**: Added context menu option to open Sketches and Stashes in system file explorer.
- **Safety**: Added unsaved changes buffer to prevent data loss when switching between views.
- Initial project setup with Electron + React + TypeScript + Vite
- Monaco Editor integration for code editing
- Processing 4.x core integration with Java compilation
- Real-time console output display
- Modern UI with vertical layout
- Copy and clear buttons for console
- System Processing detection (automatic fallback)
- UTF-8 encoding support
- Cross-platform resource path management
- Settings() method support for Processing 4.x

### Fixed
- **Critical**: `import` statements are now correctly extracted to the top of the generated Java file, fixing "illegal start of type" errors for complex sketches.
- **Typos**: Fixed type errors in Editor.tsx.
- Java compilation encoding issues (GBK to UTF-8)
- Public method modifier handling for Processing methods
- size() method placement in settings()
- Recursive file search for Processing detection

### Technical Details
- Built complete .pde to .java conversion pipeline
- Implemented proper indentation and method signature handling
- Added support for 132 Processing JAR libraries
- Configured javac with UTF-8 encoding parameter

## [0.1.0] - 2026-01-07

### Added
- 🎉 First working alpha release!
- Successfully compiles and runs Processing sketches
- Beautiful modern UI inspired by Processing IDE
- Live console with color-coded output
- Automatic Processing installation detection

---

**Note**: This project is in active development. Features and APIs may change.
