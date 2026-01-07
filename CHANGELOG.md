# Changelog

All notable changes to Processing Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Electron + React + TypeScript + Vite
- Monaco Editor integration for code editing
- Processing 4.x core integration with Java compilation
- Real-time console output display
- Modern UI with vertical layout (editor above, console below)
- Copy and clear buttons for console
- System Processing detection (automatic fallback)
- UTF-8 encoding support for Chinese comments
- Cross-platform resource path management
- Settings() method support for Processing 4.x compatibility

### Fixed
- Java compilation encoding issues (GBK to UTF-8)
- Public method modifier handling for Processing methods
- size() method placement in settings() instead of setup()
- Recursive file search for Processing installation detection

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
