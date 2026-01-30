# Changelog

All notable changes to Entropic will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
