import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import Editor from './components/Editor'

// Sketch 类型定义
interface Sketch {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
}

// 变体类型定义
interface Variant {
    id: string;
    name: string;
    timestamp: number;
}

// 默认代码模板（仅在无任何 sketch 时显示）
const WELCOME_CODE = `// 欢迎来到 Entropic！
// Welcome to Entropic!
// 
// 点击左侧 "+ New Sketch" 创建你的第一个项目
// Click "+ New Sketch" on the left to create your first project

void setup() {
  size(800, 600);
  background(30);
}

void draw() {
  fill(random(100, 255), random(100, 255), random(100, 255), 150);
  noStroke();
  circle(mouseX, mouseY, random(20, 50));
}
`

function App() {
    const [isRunning, setIsRunning] = useState(false)
    const [consoleOutput, setConsoleOutput] = useState<string[]>(['Ready to create! 🚀'])
    const [processingInstalled, setProcessingInstalled] = useState<boolean | null>(null)
    const [detectedLibs, setDetectedLibs] = useState<{ name: string; installed: boolean }[]>([])
    const editorRef = useRef<any>(null)

    // Sketchbook 状态
    const [sketches, setSketches] = useState<Sketch[]>([])
    const [currentSketch, setCurrentSketch] = useState<Sketch | null>(null)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // Debounce timer for library check
    const checkTimerRef = useRef<any>(null)

    // 重命名状态
    const [renamingSketch, setRenamingSketch] = useState<string | null>(null)
    const [renameValue, setRenameValue] = useState('')

    // 变体草稿状态
    const [expandedSketches, setExpandedSketches] = useState<Set<string>>(new Set())
    const [variants, setVariants] = useState<Map<string, Variant[]>>(new Map())
    const [renamingVariant, setRenamingVariant] = useState<{ sketchId: string, variantId: string } | null>(null)
    const [variantRenameValue, setVariantRenameValue] = useState('')
    // 当前活动的 stash (null = 编辑主文件)
    const [activeVariantId, setActiveVariantId] = useState<string | null>(null)

    /**
     * 生成默认 Sketch 名称
     * 格式: YYYYMMDD_XX (例如: 20260129_01)
     */
    const generateDefaultName = useCallback(() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const dateStr = `${year}${month}${day}`
        const prefix = `${dateStr}_`

        // 查找今天已有的 sketch 数量，确定序号
        const todaySketches = sketches.filter(s => s.name.startsWith(prefix))
        let maxNum = 0
        todaySketches.forEach(s => {
            const match = s.name.match(new RegExp(`^${prefix}(\\d+)$`))
            if (match) {
                maxNum = Math.max(maxNum, parseInt(match[1], 10))
            }
        })

        const nextNum = String(maxNum + 1).padStart(2, '0')
        return `${prefix}${nextNum}`
    }, [sketches])

    // 加载 Sketchbook
    const loadSketches = useCallback(async () => {
        if (!window.processingAPI) return

        const result = await window.processingAPI.getSketches()
        if (result.success) {
            setSketches(result.sketches)

            // 如果有 sketches 且没有选中的，选择第一个
            if (result.sketches.length > 0 && !currentSketch) {
                const first = result.sketches[0]
                setCurrentSketch(first)
                const loadResult = await window.processingAPI.loadSketch(first.id)
                if (loadResult.success && loadResult.code && editorRef.current) {
                    editorRef.current.setCode(loadResult.code)
                }
            }
        }
    }, [currentSketch])

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

        // 加载 Sketchbook
        loadSketches()

        // 监听 Processing 输出
        if (window.processingAPI) {
            window.processingAPI.onOutput((_event: any, data: { type: string; data: string }) => {
                addToConsole(data.data, data.type === 'stderr' ? 'error' : 'info')
            })
        }

        // 监听 Ctrl+S 保存
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                handleSave()
            }
        }
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            if (window.processingAPI) {
                window.processingAPI.removeOutputListener()
            }
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [loadSketches])

    const checkLibraries = async (code: string) => {
        if (!window.processingAPI) return;

        // Extract imports
        const importRegex = /^\s*import\s+([^;]+);/gm
        const imports: string[] = []
        let match
        while ((match = importRegex.exec(code)) !== null) {
            let lib = match[1].split('.')[0]
            if (lib === 'processing') {
                lib = match[1].split('.')[1]
            }
            if (lib === '*') continue;

            if (!imports.includes(lib)) {
                imports.push(lib)
            }
        }

        if (imports.length === 0) {
            setDetectedLibs([])
            return
        }

        const statuses = await Promise.all(imports.map(async (lib) => {
            const installed = await window.processingAPI.checkLibrary(lib)
            return { name: lib, installed }
        }))

        setDetectedLibs(statuses)
    }

    const handleEditorChange = (value: string) => {
        setHasUnsavedChanges(true)

        if (checkTimerRef.current) clearTimeout(checkTimerRef.current)
        checkTimerRef.current = setTimeout(() => {
            checkLibraries(value)
        }, 1000)
    }

    const addToConsole = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '▶'
        setConsoleOutput(prev => [...prev, `${prefix} ${message}`])
    }

    // 保存当前 sketch (或 stash)
    const handleSave = async () => {
        if (!currentSketch || !editorRef.current || !window.processingAPI) return

        const code = editorRef.current.getCode()
        let result

        if (activeVariantId) {
            // 保存到 stash 文件
            result = await window.processingAPI.saveVariant(currentSketch.id, activeVariantId, code)
            if (result.success) {
                setHasUnsavedChanges(false)
                addToConsole(`✓ Saved stash \"${activeVariantId}\"`, 'success')
            } else {
                addToConsole(`Failed to save stash: ${result.error}`, 'error')
            }
        } else {
            // 保存到主文件
            result = await window.processingAPI.saveSketch(currentSketch.id, code)
            if (result.success) {
                setHasUnsavedChanges(false)
                addToConsole(`✓ Saved \"${currentSketch.name}\"`, 'success')
            } else {
                addToConsole(`Failed to save: ${result.error}`, 'error')
            }
        }
    }

    // 创建新 sketch（直接创建，无需弹窗）
    const handleCreateSketch = async () => {
        if (!window.processingAPI) return

        const autoName = generateDefaultName()
        const result = await window.processingAPI.createSketch(autoName)

        if (result.success && result.sketch) {
            // 刷新列表
            await loadSketches()

            // 选中新创建的 sketch
            setCurrentSketch(result.sketch)

            // 加载代码
            const loadResult = await window.processingAPI.loadSketch(result.sketch.id)
            if (loadResult.success && loadResult.code && editorRef.current) {
                editorRef.current.setCode(loadResult.code)
            }

            addToConsole(`✓ Created "${result.sketch.name}"`, 'success')
        } else {
            addToConsole(`Failed to create: ${result.error}`, 'error')
        }
    }

    // 删除 sketch
    const handleDeleteSketch = async (sketch: Sketch, e: React.MouseEvent) => {
        e.stopPropagation() // 阻止触发选中

        if (!window.processingAPI) return

        const confirmed = window.confirm(`Delete "${sketch.name}"?`)
        if (!confirmed) return

        const result = await (window.processingAPI as any).deleteSketch(sketch.id)
        if (result.success) {
            addToConsole(`🗑️ Deleted "${sketch.name}"`, 'success')
            await loadSketches()

            // 如果删除的是当前项目，清空选中
            if (currentSketch?.id === sketch.id) {
                setCurrentSketch(null)
            }
        } else {
            addToConsole(`Failed to delete: ${result.error}`, 'error')
        }
    }

    // 开始重命名
    const handleStartRename = (sketch: Sketch, e: React.MouseEvent) => {
        e.stopPropagation()
        setRenamingSketch(sketch.id)
        setRenameValue(sketch.name)
    }

    // 执行重命名
    const handleRename = async () => {
        if (!renamingSketch || !renameValue.trim() || !window.processingAPI) {
            setRenamingSketch(null)
            return
        }

        const result = await (window.processingAPI as any).renameSketch(renamingSketch, renameValue.trim())
        if (result.success) {
            addToConsole(`✏️ Renamed to "${renameValue.trim()}"`, 'success')
            await loadSketches()

            // 更新当前选中的项目 ID
            if (currentSketch?.id === renamingSketch) {
                setCurrentSketch({ ...currentSketch, id: result.newId, name: result.newId })
            }
        } else {
            addToConsole(`Failed to rename: ${result.error}`, 'error')
        }

        setRenamingSketch(null)
    }

    // ========================================
    // 变体草稿相关操作
    // ========================================

    // 加载某个 sketch 的变体列表
    const loadVariants = async (sketchId: string) => {
        if (!window.processingAPI) return
        const result = await (window.processingAPI as any).getVariants(sketchId)
        if (result.success) {
            setVariants(prev => new Map(prev).set(sketchId, result.variants))
        }
    }

    // 展开/收起 sketch 的变体列表
    const toggleExpand = async (sketchId: string) => {
        const newExpanded = new Set(expandedSketches)
        if (newExpanded.has(sketchId)) {
            newExpanded.delete(sketchId)
        } else {
            newExpanded.add(sketchId)
            // 首次展开时加载变体列表
            if (!variants.has(sketchId)) {
                await loadVariants(sketchId)
            }
        }
        setExpandedSketches(newExpanded)
    }

    // 暂存当前代码为新变体
    const handleStageVariant = async () => {
        if (!currentSketch || !window.processingAPI || !editorRef.current) return

        // 先保存当前代码
        await handleSave()

        const result = await (window.processingAPI as any).stageVariant(currentSketch.id)
        if (result.success) {
            addToConsole(`📌 Staged as "${result.variant.name}"`, 'success')
            await loadVariants(currentSketch.id)
            // 确保展开
            setExpandedSketches(prev => new Set(prev).add(currentSketch.id))
        } else {
            addToConsole(`Failed to stage: ${result.error}`, 'error')
        }
    }

    // 加载变体代码到编辑器 (设为活动 stash)
    const handleLoadVariant = async (sketchId: string, variantId: string) => {
        if (!window.processingAPI || !editorRef.current) return

        const result = await (window.processingAPI as any).loadVariant(sketchId, variantId)
        if (result.success) {
            editorRef.current.setCode(result.code)
            setActiveVariantId(variantId) // 设置当前活动 stash
            setHasUnsavedChanges(false) // 刚加载的代码是已保存状态
            addToConsole(`📖 Editing stash ${variantId}`, 'success')
        } else {
            addToConsole(`Failed to load stash: ${result.error}`, 'error')
        }
    }

    // 删除变体
    const handleDeleteVariant = async (sketchId: string, variantId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!window.processingAPI) return

        const confirmed = window.confirm(`Delete stash ${variantId}?`)
        if (!confirmed) return

        const result = await (window.processingAPI as any).deleteVariant(sketchId, variantId)
        if (result.success) {
            addToConsole(`🗑️ Deleted variant ${variantId}`, 'success')
            await loadVariants(sketchId)
        } else {
            addToConsole(`Failed to delete variant: ${result.error}`, 'error')
        }
    }

    // 开始重命名变体
    const handleStartRenameVariant = (sketchId: string, variantId: string, currentName: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setRenamingVariant({ sketchId, variantId })
        setVariantRenameValue(currentName)
    }

    // 执行变体重命名
    const handleRenameVariant = async () => {
        if (!renamingVariant || !variantRenameValue.trim() || !window.processingAPI) {
            setRenamingVariant(null)
            return
        }

        const result = await (window.processingAPI as any).renameVariant(
            renamingVariant.sketchId,
            renamingVariant.variantId,
            variantRenameValue.trim()
        )
        if (result.success) {
            addToConsole(`✏️ Variant renamed`, 'success')
            await loadVariants(renamingVariant.sketchId)
        } else {
            addToConsole(`Failed to rename variant: ${result.error}`, 'error')
        }

        setRenamingVariant(null)
    }

    // 切换 sketch
    const handleSelectSketch = async (sketch: Sketch) => {
        if (currentSketch?.id === sketch.id) return

        // 如果有未保存的更改，提示保存
        if (hasUnsavedChanges && currentSketch) {
            const shouldSave = window.confirm(`Save changes to "${currentSketch.name}"?`)
            if (shouldSave) {
                await handleSave()
            }
        }

        setCurrentSketch(sketch)
        setActiveVariantId(null) // 切换 sketch 时回到编辑主文件

        // 加载代码
        if (window.processingAPI) {
            const result = await window.processingAPI.loadSketch(sketch.id)
            if (result.success && result.code && editorRef.current) {
                editorRef.current.setCode(result.code)
                setHasUnsavedChanges(false)
            }
        }
    }

    const handleRun = async () => {
        if (!editorRef.current) return

        // 自动保存
        if (hasUnsavedChanges && currentSketch) {
            await handleSave()
        }

        const code = editorRef.current.getCode()
        if (!code.trim()) {
            addToConsole('Please write some code first!', 'error')
            return
        }

        setIsRunning(true)
        addToConsole('Starting sketch...', 'info')

        try {
            const sketchName = currentSketch?.id || 'Untitled'
            const result = await window.processingAPI.runSketch(code, sketchName)
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
                    <h1 className="app-title">✨ Entropic</h1>
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
                        {sketches.length === 0 ? (
                            <div className="empty-state" style={{ padding: '10px', opacity: 0.5 }}>
                                No sketches yet
                            </div>
                        ) : (
                            sketches.map(sketch => (
                                <div key={sketch.id}>
                                    {/* 主 sketch 项目 */}
                                    <div
                                        className={`project-item ${currentSketch?.id === sketch.id ? 'active' : ''}`}
                                        onClick={() => handleSelectSketch(sketch)}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation()
                                            handleStartRename(sketch, e)
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            const menu = document.createElement('div')
                                            menu.className = 'context-menu'
                                            menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:9999;`
                                            menu.innerHTML = `
                                                <div class="context-menu-item" data-action="rename">✏️ Rename</div>
                                                <div class="context-menu-item" data-action="delete">🗑️ Delete</div>
                                            `
                                            document.body.appendChild(menu)
                                            const handleClick = (ev: MouseEvent) => {
                                                const target = ev.target as HTMLElement
                                                const action = target.dataset.action
                                                if (action === 'rename') handleStartRename(sketch, e as any)
                                                else if (action === 'delete') handleDeleteSketch(sketch, e as any)
                                                menu.remove()
                                                document.removeEventListener('click', handleClick)
                                            }
                                            setTimeout(() => document.addEventListener('click', handleClick), 0)
                                        }}
                                    >
                                        {renamingSketch === sketch.id ? (
                                            <input
                                                type="text"
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onBlur={handleRename}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRename()
                                                    if (e.key === 'Escape') setRenamingSketch(null)
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                style={{
                                                    flex: 1, background: 'var(--bg-primary)',
                                                    border: '1px solid var(--accent-primary)',
                                                    color: 'var(--text-primary)', padding: '4px 8px',
                                                    borderRadius: '4px', fontSize: '14px', width: '100%'
                                                }}
                                            />
                                        ) : (
                                            <>
                                                {/* 展开/收起按钮 */}
                                                <span
                                                    onClick={(e) => { e.stopPropagation(); toggleExpand(sketch.id) }}
                                                    style={{ cursor: 'pointer', marginRight: '4px', fontSize: '10px' }}
                                                >
                                                    {expandedSketches.has(sketch.id) ? '▼' : '▶'}
                                                </span>
                                                <span style={{ flex: 1 }}>🎨 {sketch.name}</span>
                                                {currentSketch?.id === sketch.id && hasUnsavedChanges && (
                                                    <span style={{ opacity: 0.5 }}>●</span>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* 变体列表（手风琴展开） */}
                                    {expandedSketches.has(sketch.id) && (
                                        <div className="variants-list" style={{ paddingLeft: '20px' }}>
                                            {/* Working 状态 */}
                                            {currentSketch?.id === sketch.id && hasUnsavedChanges && (
                                                <div className="variant-item working" style={{
                                                    padding: '6px 10px', fontSize: '13px', opacity: 0.8,
                                                    color: 'var(--accent-secondary)'
                                                }}>
                                                    ├─ Working ●
                                                </div>
                                            )}

                                            {/* 变体列表 */}
                                            {(variants.get(sketch.id) || []).map(variant => (
                                                <div
                                                    key={variant.id}
                                                    className={`variant-item ${activeVariantId === variant.id ? 'active' : ''}`}
                                                    style={{
                                                        padding: '6px 10px', fontSize: '13px',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center'
                                                    }}
                                                    onClick={() => handleLoadVariant(sketch.id, variant.id)}
                                                    onDoubleClick={(e) => handleStartRenameVariant(sketch.id, variant.id, variant.name, e)}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        const menu = document.createElement('div')
                                                        menu.className = 'context-menu'
                                                        menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:9999;`
                                                        menu.innerHTML = `
                                                            <div class="context-menu-item" data-action="rename">✏️ Rename</div>
                                                            <div class="context-menu-item" data-action="delete">🗑️ Delete</div>
                                                        `
                                                        document.body.appendChild(menu)
                                                        const handleClick = (ev: MouseEvent) => {
                                                            const target = ev.target as HTMLElement
                                                            const action = target.dataset.action
                                                            if (action === 'rename') handleStartRenameVariant(sketch.id, variant.id, variant.name, e as any)
                                                            else if (action === 'delete') handleDeleteVariant(sketch.id, variant.id, e as any)
                                                            menu.remove()
                                                            document.removeEventListener('click', handleClick)
                                                        }
                                                        setTimeout(() => document.addEventListener('click', handleClick), 0)
                                                    }}
                                                >
                                                    {renamingVariant?.sketchId === sketch.id && renamingVariant?.variantId === variant.id ? (
                                                        <input
                                                            type="text"
                                                            value={variantRenameValue}
                                                            onChange={(e) => setVariantRenameValue(e.target.value)}
                                                            onBlur={handleRenameVariant}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleRenameVariant()
                                                                if (e.key === 'Escape') setRenamingVariant(null)
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            autoFocus
                                                            style={{
                                                                flex: 1, background: 'var(--bg-primary)',
                                                                border: '1px solid var(--accent-primary)',
                                                                color: 'var(--text-primary)', padding: '2px 6px',
                                                                borderRadius: '4px', fontSize: '12px'
                                                            }}
                                                        />
                                                    ) : (
                                                        <span style={{ flex: 1 }}>├─ {variant.id}: {variant.name}</span>
                                                    )}
                                                </div>
                                            ))}

                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-new" onClick={handleCreateSketch}>
                            + New Sketch
                        </button>
                        <button
                            className="btn btn-stash"
                            onClick={handleStageVariant}
                            disabled={!currentSketch}
                            title="Stash current code"
                        >
                            + Stash
                        </button>
                    </div>
                </div>

                {/* Center: Editor + Console (Vertical Split) */}
                <div className="center-panel">
                    {/* Editor */}
                    <div className="editor-container">
                        <Editor
                            ref={editorRef}
                            onChange={handleEditorChange}
                            defaultValue={sketches.length === 0 ? WELCOME_CODE : undefined}
                        />
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
