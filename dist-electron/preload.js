"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  onMessage: (callback) => {
    ipcRenderer.on("main-process-message", (_event, message) => callback(message));
  }
});
contextBridge.exposeInMainWorld("processingAPI", {
  checkInstalled: () => ipcRenderer.invoke("check-processing"),
  runSketch: (code, name) => ipcRenderer.invoke("run-sketch", code, name),
  stopSketch: () => ipcRenderer.invoke("stop-sketch"),
  onOutput: (callback) => {
    ipcRenderer.on("sketch-output", callback);
  },
  removeOutputListener: () => {
    ipcRenderer.removeAllListeners("sketch-output");
  },
  checkLibrary: (libName) => ipcRenderer.invoke("check-library", libName),
  openLibraryFolder: () => ipcRenderer.invoke("open-library-folder")
});
