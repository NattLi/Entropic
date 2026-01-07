// Type declarations for window.processingAPI
export { }

declare global {
    interface Window {
        processingAPI: {
            checkInstalled: () => Promise<{ installed: boolean; path?: string; error?: string }>
            runSketch: (code: string, name: string) => Promise<{ success: boolean; message?: string; error?: string }>
            stopSketch: () => Promise<{ success: boolean; stopped: boolean }>
            onOutput: (callback: (event: any, data: { type: string; data: string }) => void) => void
            removeOutputListener: () => void
        }
    }
}
