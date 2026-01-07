import { forwardRef, useImperativeHandle, useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'
import './Editor.css'

// 默认的 Processing 代码模板
const DEFAULT_CODE = `// 欢迎来到创意编程的世界！
// 你可以直接开始编辑这段代码，或者描述你想做什么

void setup() {
  size(800, 600);  // 设置画布大小
  background(255); // 白色背景
}

void draw() {
  // 在这里画你的创意！
  // 提示：试试 ellipse(mouseX, mouseY, 50, 50)
  
}
`

const Editor = forwardRef((props, ref) => {
    const editorRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
        getCode: () => {
            return editorRef.current?.getValue() || ''
        }
    }))

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor

        // 配置 Monaco Editor 主题和选项
        monaco.editor.defineTheme('creativity-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6272A4', fontStyle: 'italic' },
                { token: 'keyword', foreground: 'FF79C6' },
                { token: 'string', foreground: 'F1FA8C' },
                { token: 'number', foreground: 'BD93F9' },
                { token: 'type', foreground: '50FA7B' },
            ],
            colors: {
                'editor.background': '#1A1A28',
                'editor.foreground': '#E0E0E0',
                'editor.lineHighlightBackground': '#2A2A3E',
                'editorLineNumber.foreground': '#6B6B7B',
                'editorLineNumber.activeForeground': '#00D9FF',
                'editor.selectionBackground': '#363650',
                'editorIndentGuide.background': '#363650',
                'editorIndentGuide.activeBackground': '#00D9FF',
            },
        })
        monaco.editor.setTheme('creativity-dark')
    }

    return (
        <div className="editor-wrapper">
            <div className="editor-header">
                <span className="editor-title">🎨 Welcome.pde</span>
                <span className="editor-status">Unsaved</span>
            </div>
            <MonacoEditor
                height="100%"
                defaultLanguage="java"
                defaultValue={DEFAULT_CODE}
                onMount={handleEditorDidMount}
                options={{
                    fontSize: 14,
                    lineHeight: 22,
                    fontFamily: "'Fira Code', 'Consolas', monospace",
                    fontLigatures: true,

                    // 层级划线
                    renderIndentGuides: true,
                    guides: {
                        indentation: true,
                        highlightActiveIndentation: true
                    },

                    // 简化界面
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    smoothScrolling: true,

                    // 辅助功能
                    autoClosingBrackets: 'always',
                    autoClosingQuotes: 'always',
                    formatOnPaste: true,
                    suggestOnTriggerCharacters: true,

                    // 滚动条
                    scrollbar: {
                        vertical: 'auto',
                        horizontal: 'auto',
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                    },
                }}
            />
        </div>
    )
})

Editor.displayName = 'Editor'

export default Editor
