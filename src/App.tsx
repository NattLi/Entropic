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

// 回收站项目类型定义
interface BinItem {
    id: string;
    type: 'sketch' | 'variant';
    name: string;
    sketchId?: string; // 仅 variant 有
    deletedAt: number;
}

// 默认代码模板（仅在无任何 sketch 时显示）
const WELCOME_CODE = `// ✨ Entropic - Order from Chaos
// Meaning: Generating patterns from randomness

float[] x, y;  // Position
float[] angle; // Direction
color[] c;     // Color
int num = 1000; // Particle count

void setup() {
  size(800, 600);
  background(10);
  noStroke();
  
  x = new float[num];
  y = new float[num];
  angle = new float[num];
  c = new color[num];
  
  for(int i=0; i<num; i++) {
    x[i] = random(width);
    y[i] = random(height);
    angle[i] = random(TWO_PI);
    // Neon colors born from chaos
    c[i] = color(
      random(50, 150),
      random(100, 255),
      255, 
      100
    );
  }
}

void draw() {
  // Semi-transparent background for trails
  fill(10, 20);
  rect(0, 0, width, height);
  
  for(int i=0; i<num; i++) {
    // Flow field based on Perlin Noise (Entropy)
    float n = noise(x[i]*0.005, y[i]*0.005, frameCount*0.005);
    angle[i] += map(n, 0, 1, -0.1, 0.1);
    
    x[i] += cos(angle[i]) * 2;
    y[i] += sin(angle[i]) * 2;
    
    // Wrap around edges
    if(x[i] < 0) x[i] = width;
    if(x[i] > width) x[i] = 0;
    if(y[i] < 0) y[i] = height;
    if(y[i] > height) y[i] = 0;
    
    fill(c[i]);
    circle(x[i], y[i], 2);
  }
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
    const [unsavedWorkingCopyBuffer, setUnsavedWorkingCopyBuffer] = useState<Map<string, string>>(new Map()) // 暂存未保存的 Working Copy
    const [isTransitioning, setIsTransitioning] = useState(false) // 切换过渡状态

    // 回收站状态
    const [binItems, setBinItems] = useState<BinItem[]>([])
    const [isBinExpanded, setIsBinExpanded] = useState(false)

    // Toast Notification
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false })
    const toastTimerRef = useRef<any>(null)

    const showToast = (message: string) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        setToast({ message, visible: true })
        toastTimerRef.current = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }))
        }, 1500)
    }

    /**
     * 生成默认 Sketch 名称
     * 格式: S_YYYYMMDD_XX (例如: S_20260129_01)
     */
    const generateDefaultName = useCallback(() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const dateStr = `${year}${month}${day}`
        const prefix = `S_${dateStr}_`

        // 查找今天已有的 sketch 数量，确定序号
        // 匹配格式: S_YYYYMMDD_XX
        let maxNum = 0
        sketches.forEach(s => {
            const match = s.name.match(new RegExp(`^${prefix}(\\d+)$`))
            if (match) {
                maxNum = Math.max(maxNum, parseInt(match[1], 10))
            }
        })

        let nextNum = maxNum + 1
        let candidateName = `${prefix}${String(nextNum).padStart(2, '0')}`

        // 双重保险：确保生成的名称真的不存在
        while (sketches.some(s => s.name === candidateName)) {
            nextNum++
            candidateName = `${prefix}${String(nextNum).padStart(2, '0')}`
        }

        return candidateName
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
            setActiveVariantId(null) // 明确进入 Working Copy

            // 单一展开模式：只展开新创建的项目
            setExpandedSketches(new Set([result.sketch!.id]))

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

    // 展开/收起 sketch 的变体列表 (单一展开模式 - 只保留一个展开)
    const toggleExpand = async (sketchId: string) => {
        if (expandedSketches.has(sketchId)) {
            // 已展开，则收起
            setExpandedSketches(new Set())
        } else {
            // 未展开，则展开并收起其他所有
            const newExpanded = new Set([sketchId])
            // 首次展开时加载变体列表
            if (!variants.has(sketchId)) {
                await loadVariants(sketchId)
            }
            setExpandedSketches(newExpanded)
        }
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

        // 确保 currentSketch 是对的 (防止跨项目点击变体导致的错乱)
        if (currentSketch?.id !== sketchId) {
            const sketch = sketches.find(s => s.id === sketchId)
            if (sketch) setCurrentSketch(sketch)
        }

        // 如果当前是在 Working Copy，且有未保存更改，先暂存到 buffer
        if (activeVariantId === null && currentSketch?.id === sketchId && editorRef.current) {
            const currentCode = editorRef.current.getCode()
            setUnsavedWorkingCopyBuffer(prev => new Map(prev).set(sketchId, currentCode))
            console.log('Buffered unsaved working copy')
        }

        setIsTransitioning(true)
        // 给一个短暂的延时，让模糊动画生效，也给用户一种"加载切换"的实感
        await new Promise(resolve => setTimeout(resolve, 400))

        const result = await (window.processingAPI as any).loadVariant(sketchId, variantId)
        if (result.success) {
            editorRef.current.setCode(result.code)
            setActiveVariantId(variantId) // 设置当前活动 stash

            // 强制重置未保存状态，防止 onChange 竞态导致误判
            setTimeout(() => setHasUnsavedChanges(false), 50)

            // 查找变体名称用于提示
            const variantName = variants.get(sketchId)?.find(v => v.id === variantId)?.name || variantId

            addToConsole(`📖 Viewing stash "${variantName}"`, 'success')
            showToast(`📖 Viewing "${variantName}"`)
        } else {
            addToConsole(`Failed to load stash: ${result.error}`, 'error')
        }

        // 稍作延迟再移除模糊，确保界面已更新
        setTimeout(() => setIsTransitioning(false), 200)
    }

    // 恢复 stash 到主文件
    const handleRestoreStash = async () => {
        if (!currentSketch || !activeVariantId || !window.processingAPI || !editorRef.current) return

        const confirmed = window.confirm(`Restore "${activeVariantId}" to Working Copy? This will overwrite the current main code.`)
        if (!confirmed) return

        const result = await (window.processingAPI as any).restoreVariant(currentSketch.id, activeVariantId)
        if (result.success) {
            // 清除 buffer，因为用户选择覆盖
            setUnsavedWorkingCopyBuffer(prev => {
                const next = new Map(prev)
                next.delete(currentSketch.id)
                return next
            })

            // 恢复后重新加载主文件 (Working Copy)
            await handleSelectSketch(currentSketch)
            showToast('♻️ Restored to Working Copy')
            addToConsole(`♻️ Restored stash "${activeVariantId}" to Working Copy`, 'success')
        } else {
            addToConsole(`Failed to restore: ${result.error}`, 'error')
        }
    }



    // 删除变体
    const handleDeleteVariant = async (sketchId: string, variantId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!window.processingAPI) return

        const variantName = variants.get(sketchId)?.find(v => v.id === variantId)?.name || variantId
        const confirmed = window.confirm(`Delete stash "${variantName}"?`)
        if (!confirmed) return

        // 检查是否正在删除当前活动的 stash
        const isDeletingActiveStash = activeVariantId === variantId

        const result = await (window.processingAPI as any).deleteVariant(sketchId, variantId)
        if (result.success) {
            addToConsole(`🗑️ Moved "${variantName}" to Bin`, 'success')
            await loadVariants(sketchId)

            // 如果删除的是当前活动的 stash，切换回 Working Copy
            if (isDeletingActiveStash && currentSketch) {
                // 显示 Toast 提示
                showToast(`📝 Switched to Working Copy`)

                // 启动模糊过渡动画
                setIsTransitioning(true)

                // 清除活动 stash 状态
                setActiveVariantId(null)

                try {
                    // 加载主文件代码
                    const loadResult = await window.processingAPI.loadSketch(currentSketch.id)
                    if (loadResult.success && editorRef.current) {
                        // Editor 组件暴露的是 setCode 方法
                        editorRef.current.setCode(loadResult.code || '')
                        setHasUnsavedChanges(false)
                    }
                } catch (err) {
                    console.error('Error loading code:', err)
                }

                // 延迟后关闭模糊效果
                await new Promise(resolve => setTimeout(resolve, 500))
                setIsTransitioning(false)
            }
        } else {
            addToConsole(`Failed to delete stash: ${result.error}`, 'error')
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
        // 如果点击的是当前 sketch 的 Working Copy (即 activeVariantId 为 null 时再次点击)，不做任何事
        if (currentSketch?.id === sketch.id && activeVariantId === null) return

        // 如果是从 variant 切换回 main (同一个 sketch)，提示
        if (currentSketch?.id === sketch.id && activeVariantId !== null) {
            showToast('🏠 Returned to Working Copy')
        }

        // 如果有未保存的更改，自动保存到 Working Copy
        if (hasUnsavedChanges && currentSketch) {
            await handleSave()
            showToast(`✔ Auto-saved "${currentSketch.name}"`)
        }

        setIsTransitioning(true)
        await new Promise(resolve => setTimeout(resolve, 400))

        // 加载代码
        if (window.processingAPI) {
            // 检查是否有 buffer
            if (unsavedWorkingCopyBuffer.has(sketch.id)) {
                // 有暂存的未保存代码，优先加载
                const bufferedCode = unsavedWorkingCopyBuffer.get(sketch.id)!
                if (editorRef.current) {
                    editorRef.current.setCode(bufferedCode)
                    setHasUnsavedChanges(true) // 标记为未保存

                    setCurrentSketch(sketch)
                    setActiveVariantId(null)

                    showToast('📝 Resumed edits')
                }
            } else {
                // 没有 buffer，从硬盘加载
                const result = await window.processingAPI.loadSketch(sketch.id)
                if (result.success && result.code && editorRef.current) {
                    editorRef.current.setCode(result.code)
                    setHasUnsavedChanges(false)

                    setCurrentSketch(sketch) // 成功加载后再切换状态
                    setActiveVariantId(null) // 切换 sketch 时回到编辑主文件
                } else {
                    addToConsole(`Failed to load working copy: ${result.error}`, 'error')
                    return // 如果加载失败，中断切换
                }
            }
        }

        setTimeout(() => setIsTransitioning(false), 200)
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

    // ========================================
    // 回收站相关操作
    // ========================================

    // 加载回收站项目
    const loadBinItems = async () => {
        if (!window.processingAPI) return
        const result = await window.processingAPI.getBinItems()
        if (result.success) {
            setBinItems(result.items)
        }
    }

    // 切换回收站展开/收起
    const toggleBin = async () => {
        if (!isBinExpanded) {
            await loadBinItems()
        }
        setIsBinExpanded(!isBinExpanded)
    }

    // 从回收站恢复项目
    const handleRestoreFromBin = async (item: BinItem) => {
        if (!window.processingAPI) return
        const result = await window.processingAPI.restoreBinItem(item.id, item.type)
        if (result.success) {
            addToConsole(`♻️ Restored "${item.name}" from Bin`, 'success')
            showToast(`♻️ Restored "${item.name}"`)
            await loadBinItems()
            await loadSketches()
            // 如果恢复的是 variant，重新加载对应 sketch 的变体列表
            if (item.type === 'variant' && item.sketchId) {
                await loadVariants(item.sketchId)
            }
        } else {
            addToConsole(`Failed to restore: ${result.error}`, 'error')
        }
    }

    // 彻底删除回收站项目
    const handlePermanentDelete = async (item: BinItem) => {
        if (!window.processingAPI) return
        const confirmed = window.confirm(`Permanently delete "${item.name}"? This cannot be undone.`)
        if (!confirmed) return

        const result = await window.processingAPI.permanentDeleteBinItem(item.id, item.type)
        if (result.success) {
            addToConsole(`🗑️ Permanently deleted "${item.name}"`, 'success')
            await loadBinItems()
        } else {
            addToConsole(`Failed to delete: ${result.error}`, 'error')
        }
    }

    // 清空回收站
    const handleEmptyBin = async () => {
        if (!window.processingAPI) return
        if (binItems.length === 0) {
            showToast('Bin is already empty')
            return
        }
        const confirmed = window.confirm(`Empty the bin? This will permanently delete ${binItems.length} item(s).`)
        if (!confirmed) return

        const result = await window.processingAPI.emptyBin()
        if (result.success) {
            addToConsole(`🗑️ Emptied bin (${binItems.length} items)`, 'success')
            showToast('🗑️ Bin emptied')
            await loadBinItems()
        } else {
            addToConsole(`Failed to empty bin: ${result.error}`, 'error')
        }
    }

    // 格式化删除时间
    const formatDeletedAt = (timestamp: number) => {
        const now = Date.now()
        const diff = now - timestamp
        const days = Math.floor(diff / (24 * 60 * 60 * 1000))
        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        if (days < 30) return `${days} days ago`
        return `${30 - Math.floor((timestamp - (now - 30 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))} days left`
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
                                        onClick={async () => {
                                            // 展开风琴并加载 Working Copy
                                            if (!expandedSketches.has(sketch.id)) {
                                                await toggleExpand(sketch.id)
                                            }
                                            handleSelectSketch(sketch)
                                        }}
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
                                                <div class="context-menu-item" data-action="reveal">📂 Reveal in Folder</div>
                                                <div class="context-menu-item" data-action="delete">🗑️ Delete</div>
                                            `
                                            document.body.appendChild(menu)
                                            const handleClick = (ev: MouseEvent) => {
                                                const target = ev.target as HTMLElement
                                                const action = target.dataset.action
                                                if (action === 'rename') handleStartRename(sketch, e as any)
                                                else if (action === 'delete') handleDeleteSketch(sketch, e as any)
                                                else if (action === 'reveal') window.processingAPI.showItemInFolder(sketch.id)
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
                                            {/* Working Copy (主文件) 固定项 */}
                                            <div
                                                className={`variant-item ${activeVariantId === null ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleSelectSketch(sketch)
                                                }}
                                                style={{
                                                    padding: '6px 10px', fontSize: '13px',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                    fontWeight: activeVariantId === null ? 600 : 400,
                                                    color: activeVariantId === null ? 'var(--accent-primary)' : 'inherit',
                                                    borderLeft: activeVariantId === null ? '2px solid var(--accent-primary)' : '2px solid transparent'
                                                }}
                                            >
                                                <span style={{ flex: 1 }}>📝 Working Copy</span>
                                            </div>

                                            {/* 变体列表 */}
                                            {(variants.get(sketch.id) || []).map(variant => (
                                                <div
                                                    key={variant.id}
                                                    className={`variant-item ${activeVariantId === variant.id ? 'active' : ''}`}
                                                    style={{
                                                        padding: '6px 10px', fontSize: '13px',
                                                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                        fontWeight: activeVariantId === variant.id ? 600 : 400,
                                                        color: activeVariantId === variant.id ? 'var(--accent-success)' : 'inherit',
                                                        borderLeft: activeVariantId === variant.id ? '2px solid var(--accent-success)' : '2px solid transparent',
                                                        background: activeVariantId === variant.id ? 'rgba(0, 230, 118, 0.1)' : 'transparent'
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
                                                            <div class="context-menu-item" data-action="reveal">📂 Reveal in Folder</div>
                                                            <div class="context-menu-item" data-action="delete">🗑️ Delete</div>
                                                        `
                                                        document.body.appendChild(menu)
                                                        const handleClick = (ev: MouseEvent) => {
                                                            const target = ev.target as HTMLElement
                                                            const action = target.dataset.action
                                                            if (action === 'rename') handleStartRenameVariant(sketch.id, variant.id, variant.name, e as any)
                                                            else if (action === 'delete') handleDeleteVariant(sketch.id, variant.id, e as any)
                                                            else if (action === 'reveal') window.processingAPI.showItemInFolder(sketch.id, variant.id)
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
                                                        <span style={{ flex: 1 }}>├─ {variant.name}</span>
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
                    </div>

                    {/* 回收站区域 */}
                    <div className="bin-section" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        <div
                            className="bin-header"
                            onClick={toggleBin}
                            style={{
                                display: 'flex', alignItems: 'center', cursor: 'pointer',
                                padding: '6px 8px', borderRadius: '4px',
                                background: isBinExpanded ? 'rgba(255,255,255,0.05)' : 'transparent'
                            }}
                        >
                            <span style={{ marginRight: '6px', fontSize: '10px' }}>
                                {isBinExpanded ? '▼' : '▶'}
                            </span>
                            <span style={{ flex: 1 }}>🗑️ Bin</span>
                            {binItems.length > 0 && (
                                <span style={{ opacity: 0.5, fontSize: '12px' }}>{binItems.length}</span>
                            )}
                        </div>

                        {isBinExpanded && (
                            <div className="bin-items" style={{ paddingLeft: '8px', marginTop: '8px' }}>
                                {binItems.length === 0 ? (
                                    <div style={{ padding: '8px', opacity: 0.5, fontSize: '13px' }}>
                                        Bin is empty
                                    </div>
                                ) : (
                                    <>
                                        {binItems.map(item => (
                                            <div
                                                key={`${item.type}-${item.id}`}
                                                className="bin-item"
                                                style={{
                                                    padding: '6px 10px', fontSize: '13px',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                    opacity: 0.7, borderRadius: '4px',
                                                    marginBottom: '2px'
                                                }}
                                                onContextMenu={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    const menu = document.createElement('div')
                                                    menu.className = 'context-menu'
                                                    menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:9999;`
                                                    menu.innerHTML = `
                                                        <div class="context-menu-item" data-action="restore">♻️ Restore</div>
                                                        <div class="context-menu-item" data-action="delete">🗑️ Delete Permanently</div>
                                                    `
                                                    document.body.appendChild(menu)
                                                    const handleClick = (ev: MouseEvent) => {
                                                        const target = ev.target as HTMLElement
                                                        const action = target.dataset.action
                                                        if (action === 'restore') handleRestoreFromBin(item)
                                                        else if (action === 'delete') handlePermanentDelete(item)
                                                        menu.remove()
                                                        document.removeEventListener('click', handleClick)
                                                    }
                                                    setTimeout(() => document.addEventListener('click', handleClick), 0)
                                                }}
                                            >
                                                <span style={{ marginRight: '6px' }}>
                                                    {item.type === 'sketch' ? '🎨' : '📌'}
                                                </span>
                                                <span style={{ flex: 1 }}>{item.name}</span>
                                                <span style={{ opacity: 0.4, fontSize: '11px' }}>
                                                    {formatDeletedAt(item.deletedAt)}
                                                </span>
                                            </div>
                                        ))}

                                        {binItems.length > 0 && (
                                            <button
                                                className="btn"
                                                onClick={handleEmptyBin}
                                                style={{
                                                    marginTop: '8px', width: '100%',
                                                    fontSize: '12px', padding: '6px 8px',
                                                    opacity: 0.7
                                                }}
                                            >
                                                Empty Bin
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Center: Editor + Console (Vertical Split) */}
                <div className="center-panel">
                    {/* Editor */}
                    <div
                        className="editor-container"
                        style={{
                            transition: 'filter 0.6s ease, opacity 0.6s ease',
                            filter: isTransitioning ? 'blur(6px)' : 'none',
                            opacity: isTransitioning ? 0.8 : 1,
                            pointerEvents: isTransitioning ? 'none' : 'auto'
                        }}
                    >
                        <Editor
                            ref={editorRef}
                            onChange={handleEditorChange}
                            defaultValue={sketches.length === 0 ? WELCOME_CODE : undefined}
                        />



                        <button
                            className="btn btn-floating-stash"
                            onClick={activeVariantId ? handleRestoreStash : handleStageVariant}
                            disabled={!currentSketch}
                            title={activeVariantId ? "Restore this stash to Working Copy" : "Stash this version"}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '20px',
                                zIndex: 10,
                                padding: '6px 12px',
                                fontSize: '12px',
                                background: activeVariantId ? 'rgba(0, 230, 118, 0.1)' : 'rgba(0, 212, 255, 0.1)',
                                border: activeVariantId ? '1px solid var(--accent-success)' : '1px solid var(--accent-primary)',
                                color: activeVariantId ? 'var(--accent-success)' : 'var(--accent-primary)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                opacity: 0.8
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1'
                                e.currentTarget.style.background = activeVariantId ? 'rgba(0, 230, 118, 0.2)' : 'rgba(0, 212, 255, 0.2)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '0.8'
                                e.currentTarget.style.background = activeVariantId ? 'rgba(255, 100, 100, 0.1)' : 'rgba(0, 212, 255, 0.1)'
                            }}
                        >
                            {activeVariantId ? '↺ Restore this stash' : '+ Stash this version'}
                        </button>
                    </div>

                    {/* Toast Notification - 放在 editor-container 外面以避免被模糊 */}
                    <div style={{
                        position: 'absolute',
                        top: '35%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(30, 30, 46, 0.95)',
                        border: '1px solid var(--accent-primary)',
                        color: 'var(--accent-primary)',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        zIndex: 1000,
                        pointerEvents: 'none',
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
                        opacity: toast.visible ? 1 : 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                        fontSize: '15px',
                        fontWeight: 500
                    }}>
                        {toast.message}
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
