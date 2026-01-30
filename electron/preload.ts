const { contextBridge, ipcRenderer } = require('electron')

// Sketch 类型定义
interface Sketch {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
}

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

    // Sketchbook 文件管理 API
    getSketches: () => ipcRenderer.invoke('get-sketches'),
    createSketch: (name: string) => ipcRenderer.invoke('create-sketch', name),
    saveSketch: (id: string, code: string) => ipcRenderer.invoke('save-sketch', id, code),
    loadSketch: (id: string) => ipcRenderer.invoke('load-sketch', id),
    deleteSketch: (id: string) => ipcRenderer.invoke('delete-sketch', id),
    renameSketch: (oldId: string, newName: string) => ipcRenderer.invoke('rename-sketch', oldId, newName),

    // 变体草稿 API
    getVariants: (sketchId: string) => ipcRenderer.invoke('get-variants', sketchId),
    stageVariant: (sketchId: string, name?: string) => ipcRenderer.invoke('stage-variant', sketchId, name),
    loadVariant: (sketchId: string, variantId: string) => ipcRenderer.invoke('load-variant', sketchId, variantId),
    saveVariant: (sketchId: string, variantId: string, code: string) => ipcRenderer.invoke('save-variant', sketchId, variantId, code),
    deleteVariant: (sketchId: string, variantId: string) => ipcRenderer.invoke('delete-variant', sketchId, variantId),
    renameVariant: (sketchId: string, variantId: string, newName: string) => ipcRenderer.invoke('rename-variant', sketchId, variantId, newName),
    restoreVariant: (sketchId: string, variantId: string) => ipcRenderer.invoke('restore-variant', sketchId, variantId),
    showItemInFolder: (sketchId: string, itemId?: string) => ipcRenderer.invoke('show-item-in-folder', sketchId, itemId),

    // 回收站 API
    getBinItems: () => ipcRenderer.invoke('get-bin-items'),
    restoreBinItem: (id: string, type: string) => ipcRenderer.invoke('restore-bin-item', id, type),
    permanentDeleteBinItem: (id: string, type: string) => ipcRenderer.invoke('permanent-delete-bin-item', id, type),
    emptyBin: () => ipcRenderer.invoke('empty-bin'),

    // 星标 API
    getStarredSketches: () => ipcRenderer.invoke('get-starred-sketches'),
    toggleStarSketch: (sketchId: string) => ipcRenderer.invoke('toggle-star-sketch', sketchId),
})

export { }

// Type declarations for TypeScript
declare global {
    interface Sketch {
        id: string;
        name: string;
        createdAt: number;
        updatedAt: number;
    }

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

            // Sketchbook file management
            getSketches: () => Promise<{ success: boolean; sketches: Sketch[]; error?: string }>
            createSketch: (name: string) => Promise<{ success: boolean; sketch?: Sketch; error?: string }>
            saveSketch: (id: string, code: string) => Promise<{ success: boolean; error?: string }>
            loadSketch: (id: string) => Promise<{ success: boolean; code?: string; error?: string }>
            deleteSketch: (id: string) => Promise<{ success: boolean; error?: string }>
            renameSketch: (oldId: string, newName: string) => Promise<{ success: boolean; newId?: string; error?: string }>

            // Variant stash management
            getVariants: (sketchId: string) => Promise<{ success: boolean; variants: any[]; error?: string }>
            stageVariant: (sketchId: string, name?: string) => Promise<{ success: boolean; variant?: any; error?: string }>
            loadVariant: (sketchId: string, variantId: string) => Promise<{ success: boolean; code?: string; error?: string }>
            saveVariant: (sketchId: string, variantId: string, code: string) => Promise<{ success: boolean; error?: string }>
            deleteVariant: (sketchId: string, variantId: string) => Promise<{ success: boolean; error?: string }>
            renameVariant: (sketchId: string, variantId?: string, newName?: string) => Promise<{ success: boolean; error?: string }>
            restoreVariant: (sketchId: string, variantId: string) => Promise<{ success: boolean; error?: string }>
            showItemInFolder: (sketchId: string, itemId?: string) => Promise<{ success: boolean; error?: string }>

            // Bin (recycle bin) management
            getBinItems: () => Promise<{ success: boolean; items: any[]; error?: string }>
            restoreBinItem: (id: string, type: string) => Promise<{ success: boolean; error?: string }>
            permanentDeleteBinItem: (id: string, type: string) => Promise<{ success: boolean; error?: string }>
            emptyBin: () => Promise<{ success: boolean; error?: string }>

            // Starred sketches management
            getStarredSketches: () => Promise<{ success: boolean; starred: string[]; error?: string }>
            toggleStarSketch: (sketchId: string) => Promise<{ success: boolean; starred: string[]; isStarred: boolean; error?: string }>
        }
    }
}
