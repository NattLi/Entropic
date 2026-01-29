// Type declarations for window.processingAPI
export { }

declare global {
    interface Sketch {
        id: string;
        name: string;
        createdAt: number;
        updatedAt: number;
    }

    interface Window {
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
        }
    }
}
