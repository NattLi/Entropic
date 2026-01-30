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
        // 配置 Monaco Editor 主题 - 中性灰色调，不影响设计师的白平衡
        monaco.editor.defineTheme('creativity-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },  // 绿色注释
                { token: 'keyword', foreground: '569CD6' },   // 蓝色关键字
                { token: 'string', foreground: 'CE9178' },    // 橙色字符串
                { token: 'number', foreground: 'B5CEA8' },    // 浅绿数字
                { token: 'type', foreground: '4EC9B0' },      // 青色类型
                { token: 'function', foreground: 'DCDCAA' },  // 黄色函数
                { token: 'variable', foreground: '9CDCFE' },  // 浅蓝变量
            ],
            colors: {
                'editor.background': '#1E1E1E',
                'editor.foreground': '#D4D4D4',
                'editor.lineHighlightBackground': '#1E1E1E',
                'editorLineNumber.foreground': '#858585',
                'editorLineNumber.activeForeground': '#C6C6C6',
                'editor.selectionBackground': '#264F78',
                'editorIndentGuide.background': '#404040',
                'editorIndentGuide.activeBackground': '#707070',
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
