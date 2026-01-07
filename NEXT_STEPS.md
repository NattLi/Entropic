# Session Handover - 2026-01-07

## 🚀 Current State
- **Core Functionality**:
    - [x] Processing Sketch Run/Stop
    - [x] Console Output (Stdout/Stderr)
    - [x] Monaco Editor Integration
    - [x] **Standalone Execution** (No local Processing required)
    - [x] **Dynamic Library Detection**
    - [x] **Import Fix** (Preprocessor correctly handles imports now)

- **Environment**:
    - **Development**: Windows (Primary)
    - **Build Target**: MacOS (via copying files from Windows, or using the `dir` output)
    - **Resource Path**: `resources/` contains `processing-core` and `jdk` for both Win/Mac.

## 🐛 Known Issues / To-Do
1.  **File Management (Critical)**:
    - The "My Sketches" list is currently hardcoded static HTML.
    - **Next Task Implementation**: Implement `Open`, `Save`, `New Project` functionality.
    - Need to hook up `electron/main.ts` file system dialogs.

2.  **Mac Verification v2**:
    - We verified the build works on Mac, but we updated the code significantly since then.
    - **Next Step**: User needs to copy updated source to Mac and run `npm run build` again. Then verify `import` heavy sketches work.

3.  **Resource Optimization**:
    - Currently, we download the full JDKs. We might want to use `jlink` to slim them down if the app size is too big (>500MB).

## 📄 Files Changed Today
- `electron/main.ts`: Added `convertPdeToJava` fix (import extraction) + Library detection IPC.
- `electron/preload.ts`: Added `checkLibrary` API.
- `src/App.tsx`: Added Library UI + Logic.
- `src/components/Editor.tsx`: Added `onChange` support.
- `CHANGELOG.md`: Updated.

## 📌 Starting Point for Next Session
Start by tackling **File Management**. We need a real project structure, not just a single in-memory buffer.
1. Define a Project structure (folder with .pde).
2. Create `ipcMain` handlers for `create-project`, `save-file`, `open-project`.
3. Update UI to listing real files.
