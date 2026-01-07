import { useState, useEffect, useRef } from 'react'
import './App.css'
import Editor from './components/Editor'

function App() {
    const [isRunning, setIsRunning] = useState(false)
    const [consoleOutput, setConsoleOutput] = useState<string[]>(['Ready to create! 🚀'])
    const [processingInstalled, setProcessingInstalled] = useState<boolean | null>(null)
    const editorRef = useRef<any>(null)

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
                        <Editor ref={editorRef} />
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
                        <div className="library-item">
                            <span>Sound</span>
                            <span className="status-badge success">✓</span>
                        </div>
                        <div className="library-item">
                            <span>Video</span>
                            <span className="status-badge success">✓</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
