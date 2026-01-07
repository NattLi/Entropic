const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    onMessage: (callback: (message: string) => void) => {
        ipcRenderer.on('main-process-message', (_event: any, message: any) => callback(message))
    },
})

contextBridge.exposeInMainWorld('processingAPI', {
    checkInstalled: () => ipcRenderer.invoke('check-processing'),
    runSketch: (code: string, name: string) => ipcRenderer.invoke('run-sketch', code, name),
    stopSketch: () => ipcRenderer.invoke('stop-sketch'),
    onOutput: (callback: (event: any, data: any) => void) => {
        ipcRenderer.on('sketch-output', callback)
    },
    removeOutputListener: () => {
        ipcRenderer.removeAllListeners('sketch-output')
    },
    checkLibrary: (libName: string) => ipcRenderer.invoke('check-library', libName),
    openLibraryFolder: () => ipcRenderer.invoke('open-library-folder'),
})

export { }

// Type declarations for TypeScript
declare global {
    interface Window {
        electronAPI: {
            onMessage: (callback: (message: string) => void) => void
        }
        processingAPI: {
            checkInstalled: () => Promise<{ installed: boolean; path?: string; error?: string }>
            runSketch: (code: string, name: string) => Promise<{ success: boolean; message?: string; error?: string }>
            stopSketch: () => Promise<{ success: boolean; stopped: boolean }>
            onOutput: (callback: (event: any, data: { type: string; data: string }) => void) => void
            removeOutputListener: () => void
            checkLibrary: (libName: string) => Promise<boolean>
            openLibraryFolder: () => Promise<void>
        }
    }
}
