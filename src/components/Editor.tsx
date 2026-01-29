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

// @ts-ignore
const Editor = forwardRef((props: any, ref: any) => {
    const editorRef = useRef<any>(null)
    const { onChange, defaultValue } = props

    useImperativeHandle(ref, () => ({
        getCode: () => {
            return editorRef.current?.getValue() || ''
        },
        setCode: (code: string) => {
            editorRef.current?.setValue(code)
        }
    }))

    const handleEditorWillMount = (monaco: any) => {
        // 配置 Monaco Editor 主题 -在此处定义以避免加载时的闪烁
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
                'editor.background': '#1E1E2E',
                'editor.foreground': '#E0E0E0',
                'editor.lineHighlightBackground': '#1E1E2E', // 与背景一致，避免首行"底色不对"的视觉问题
                'editorLineNumber.foreground': '#6B6B7B',
                'editorLineNumber.activeForeground': '#00D9FF',
                'editor.selectionBackground': '#363650',
                'editorIndentGuide.background': '#363650',
                'editorIndentGuide.activeBackground': '#00D9FF',
            },
        })
    }

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor
    }

    const handleEditorChange = (value: string | undefined) => {
        if (onChange && value !== undefined) {
            onChange(value)
        }
    }

    return (
        <div className="editor-wrapper">

            <MonacoEditor
                height="100%"
                defaultLanguage="java"
                defaultValue={defaultValue || DEFAULT_CODE}
                theme="creativity-dark"
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                onChange={handleEditorChange}
                options={{
                    fontSize: 14,
                    lineHeight: 22,
                    fontFamily: "'Fira Code', 'Consolas', monospace",
                    fontLigatures: true,

                    // 层级划线
                    // renderIndentGuides: true,
                    // guides: {
                    //    indentation: true,
                    //    highlightActiveIndentation: true
                    // },

                    // 简化界面
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    renderLineHighlight: 'none', // 彻底关闭行高亮渲染
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
