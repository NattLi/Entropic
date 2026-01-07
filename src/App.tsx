import { useState, useEffect, useRef } from 'react'
import './App.css'
import Editor from './components/Editor'

function App() {
    const [isRunning, setIsRunning] = useState(false)
    const [consoleOutput, setConsoleOutput] = useState<string[]>(['Ready to create! 🚀'])
    const [processingInstalled, setProcessingInstalled] = useState<boolean | null>(null)
    const [detectedLibs, setDetectedLibs] = useState<{ name: string; installed: boolean }[]>([])
    const editorRef = useRef<any>(null)

    // Debounce timer for library check
    const checkTimerRef = useRef<any>(null)

    useEffect(() => {
        // 检查 Processing 是否安装
        const checkProcessing = async () => {
            if (window.processingAPI) {
                const result = await window.processingAPI.checkInstalled()
                setProcessingInstalled(result.installed)
                if (!result.installed) {
                    addToConsole('⚠️ Processing not found. Please install Processing from https://processing.org/download', 'error')
                }
            }
        }
        checkProcessing()

        // 监听 Processing 输出
        if (window.processingAPI) {
            window.processingAPI.onOutput((_event: any, data: { type: string; data: string }) => {
                addToConsole(data.data, data.type === 'stderr' ? 'error' : 'info')
            })
        }

        return () => {
            if (window.processingAPI) {
                window.processingAPI.removeOutputListener()
            }
        }
    }, [])

    const checkLibraries = async (code: string) => {
        if (!window.processingAPI) return;

        // Extract imports
        const importRegex = /^\s*import\s+([^;]+);/gm
        const imports: string[] = []
        let match
        while ((match = importRegex.exec(code)) !== null) {
            // match[1] 是类似 'processing.serial.*' 或 'controlP5.*'
            // 我们取第一个部分作为库名，或者完整包名
            // 简单策略：取 'processing.xxx' 的 xxx，或者 'xxxxx.*' 的 xxxx
            let lib = match[1].split('.')[0]
            if (lib === 'processing') {
                lib = match[1].split('.')[1] // serial, video etc
            }
            if (lib === '*') continue; // ignore import *

            // 去重
            if (!imports.includes(lib)) {
                imports.push(lib)
            }
        }

        if (imports.length === 0) {
            setDetectedLibs([])
            return
        }

        // Check status for each
        const statuses = await Promise.all(imports.map(async (lib) => {
            const installed = await window.processingAPI.checkLibrary(lib)
            return { name: lib, installed }
        }))

        setDetectedLibs(statuses)
    }

    const handleEditorChange = (value: string) => {
        if (checkTimerRef.current) clearTimeout(checkTimerRef.current)
        checkTimerRef.current = setTimeout(() => {
            checkLibraries(value)
        }, 1000) // Debounce 1s
    }

    const addToConsole = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '▶'
        setConsoleOutput(prev => [...prev, `${prefix} ${message}`])
    }

    const handleRun = async () => {
        if (!editorRef.current) return

        const code = editorRef.current.getCode()
        if (!code.trim()) {
            addToConsole('Please write some code first!', 'error')
            return
        }

        setIsRunning(true)
        addToConsole('Starting sketch...', 'info')

        try {
            const result = await window.processingAPI.runSketch(code, 'Welcome')
            if (result.success) {
                addToConsole('Sketch is running! 🎨', 'success')
            } else {
                addToConsole(`Error: ${result.error}`, 'error')
                setIsRunning(false)
            }
        } catch (error: any) {
            addToConsole(`Failed to run: ${error.message}`, 'error')
            setIsRunning(false)
        }
    }

    const handleStop = async () => {
        try {
            const result = await window.processingAPI.stopSketch()
            if (result.success) {
                addToConsole('Sketch stopped', 'info')
            }
        } catch (error: any) {
            addToConsole(`Failed to stop: ${error.message}`, 'error')
        }
        setIsRunning(false)
    }

    const handleCopyConsole = () => {
        const consoleText = consoleOutput.join('\n')
        navigator.clipboard.writeText(consoleText)
        addToConsole('✓ Console output copied to clipboard', 'success')
    }

    const handleClearConsole = () => {
        setConsoleOutput(['Console cleared'])
    }

    const handleOpenLibs = async () => {
        if (window.processingAPI) {
            await window.processingAPI.openLibraryFolder()
        }
    }

    return (
        <div className="app">
            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-left">
                    <h1 className="app-title">✨ Processing Studio</h1>
                    <span className="subtitle">For Designers & Artists</span>
                </div>
                <div className="toolbar-right">
                    <button
                        className="btn btn-primary"
                        onClick={handleRun}
                        disabled={isRunning || processingInstalled === false}
                    >
                        ▶️ Run
                    </button>
                    <button
                        className="btn"
                        onClick={handleStop}
                        disabled={!isRunning}
                    >
                        🛑 Stop
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Sidebar */}
                <div className="sidebar">
                    <h3>📁 My Sketches</h3>
                    <div className="project-list">
                        <div className="project-item active">
                            <span>🎨 Welcome</span>
                        </div>
                    </div>
                    <button className="btn btn-new">+ New Sketch</button>
                </div>

                {/* Center: Editor + Console (Vertical Split) */}
                <div className="center-panel">
                    {/* Editor */}
                    <div className="editor-container">
                        <Editor ref={editorRef} onChange={handleEditorChange} />
                    </div>

                    {/* Console */}
                    <div className="console-container">
                        <div className="console-header">
                            <h4>📊 Console</h4>
                            <div className="console-actions">
                                <button className="btn-icon" onClick={handleClearConsole} title="Clear console">
                                    🗑️
                                </button>
                                <button className="btn-icon" onClick={handleCopyConsole} title="Copy to clipboard">
                                    📋
                                </button>
                            </div>
                        </div>
                        <div className="console">
                            {consoleOutput.map((line, index) => (
                                <p key={index} className={`console-text ${line.startsWith('❌') ? 'error' : line.startsWith('✅') ? 'success' : ''}`}>
                                    {line}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Libraries */}
                <div className="right-panel">
                    <div className="panel-section">
                        <h4>📚 Libraries</h4>
                        {detectedLibs.length === 0 ? (
                            <div className="empty-state">
                                <span style={{ opacity: 0.5 }}>No Library Needed</span>
                            </div>
                        ) : (
                            detectedLibs.map((lib, idx) => (
                                <div key={idx} className="library-item">
                                    <span>{lib.name}</span>
                                    {lib.installed ? (
                                        <span className="status-badge success">✅ Installed</span>
                                    ) : (
                                        <button
                                            className="btn-text"
                                            style={{ color: '#ff79c6', cursor: 'pointer', border: '1px solid #ff79c6', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', background: 'transparent' }}
                                            onClick={handleOpenLibs}
                                        >
                                            👉 Install
                                        </button>
                                    )}
                                </div>
                            ))
                        )}

                        {/* 总是显示打开库文件夹的入口，方便用户管理 */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                            <button className="btn-text" onClick={handleOpenLibs} style={{ opacity: 0.7, fontSize: '12px' }}>📂 Open Libraries Folder</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
