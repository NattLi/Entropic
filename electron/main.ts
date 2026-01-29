const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn, execFile } = require('child_process')
const fs = require('fs')
const os = require('os')

process.env.DIST = path.join(__dirname, '../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win = null
let runningProcess = null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// ========= 跨平台资源路径管理 =========

function getResourcePath(relativePath) {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, relativePath)
    } else {
        return path.join(__dirname, '..', 'resources', relativePath)
    }
}

function getPlatformJDKPath() {
    const platform = os.platform()
    const platformMap = {
        'win32': 'win',
        'darwin': 'mac',
        'linux': 'linux'
    }

    const platformDir = platformMap[platform] || 'win'
    const javaExe = platform === 'win32' ? 'java.exe' : 'java'
    const javacExe = platform === 'win32' ? 'javac.exe' : 'javac'

    return {
        jdkRoot: getResourcePath(`jdk/${platformDir}`),
        javaPath: getResourcePath(`jdk/${platformDir}/bin/${javaExe}`),
        javacPath: getResourcePath(`jdk/${platformDir}/bin/${javacExe}`)
    }
}

function getProcessingLibs() {
    const processingDir = getResourcePath('processing')

    if (!fs.existsSync(processingDir)) {
        return null
    }

    try {
        const jars = fs.readdirSync(processingDir)
            .filter(file => file.endsWith('.jar'))
            .map(file => path.join(processingDir, file))

        return jars.length > 0 ? jars.join(path.delimiter) : null
    } catch (error) {
        console.error('Error reading Processing libs:', error)
        return null
    }
}

// ========= 递归查找文件 =========

function findFileRecursive(dir, filename, maxDepth = 5, currentDepth = 0) {
    if (!fs.existsSync(dir) || currentDepth > maxDepth) {
        return null
    }

    try {
        const items = fs.readdirSync(dir)

        // 先在当前目录查找
        for (const item of items) {
            if (item === filename) {
                return path.join(dir, item)
            }
        }

        // 递归查找子目录
        for (const item of items) {
            const fullPath = path.join(dir, item)
            try {
                const stat = fs.statSync(fullPath)
                if (stat.isDirectory()) {
                    const found = findFileRecursive(fullPath, filename, maxDepth, currentDepth + 1)
                    if (found) return found
                }
            } catch (e) {
                // 跳过无法访问的目录
            }
        }
    } catch (error) {
        // 跳过错误
    }

    return null
}

function findJarsRecursive(dir, maxDepth = 3, currentDepth = 0) {
    const jars = []

    if (!fs.existsSync(dir) || currentDepth > maxDepth) {
        return jars
    }

    try {
        const items = fs.readdirSync(dir)

        for (const item of items) {
            const fullPath = path.join(dir, item)

            try {
                const stat = fs.statSync(fullPath)

                if (stat.isFile() && item.endsWith('.jar')) {
                    jars.push(fullPath)
                } else if (stat.isDirectory() && currentDepth < maxDepth) {
                    const subJars = findJarsRecursive(fullPath, maxDepth, currentDepth + 1)
                    jars.push(...subJars)
                }
            } catch (e) {
                // 跳过无法访问的文件/目录
            }
        }
    } catch (error) {
        // 跳过错误
    }

    return jars
}

// ========= Fallback: 查找系统 Processing（改进版） =========

function findSystemProcessing() {
    const platform = os.platform()

    const processingPaths = {
        win32: [
            'C:\\Program Files\\Processing',
            'C:\\Program Files (x86)\\Processing',
        ],
        darwin: [
            '/Applications/Processing.app/Contents',
        ],
        linux: [
            '/opt/processing',
            path.join(os.homedir(), 'processing'),
        ],
    }

    const paths = processingPaths[platform] || []

    for (const basePath of paths) {
        if (!fs.existsSync(basePath)) continue

        console.log(`Searching Processing in: ${basePath}`)

        // 递归查找 java.exe
        const javaExe = platform === 'win32' ? 'java.exe' : 'java'
        const javacExe = platform === 'win32' ? 'javac.exe' : 'javac'

        const javaPath = findFileRecursive(basePath, javaExe, 6)

        if (javaPath) {
            console.log(`Found Java: ${javaPath}`)

            const javacPath = findFileRecursive(path.dirname(javaPath), javacExe, 1)

            // 查找所有 JAR 文件
            const appDir = path.join(basePath, 'app')
            let jars = []

            if (fs.existsSync(appDir)) {
                jars = findJarsRecursive(appDir, 3)
                console.log(`Found ${jars.length} JAR files`)
            }

            if (jars.length > 0) {
                return {
                    javaPath,
                    javacPath: javacPath || null,
                    classpath: jars.join(path.delimiter),
                    basePath
                }
            }
        }
    }

    console.log('Processing not found in standard locations')
    return null
}

// ========= Processing 编译核心 =========

function convertPdeToJava(pdeCode, className) {
    // 步骤1: 提取 import 语句
    const importRegex = /^\s*import\s+.*;\s*$/gm
    const userImports = pdeCode.match(importRegex) || []

    // 从源代码中移除 import 语句，只保留主体
    let codeBody = pdeCode.replace(importRegex, '')

    // 步骤2: 给所有 void 方法添加 public 修饰符
    let processedBody = codeBody.replace(/^(\s*)void\s+/gm, '$1public void ')

    // 步骤3: 给所有行添加2空格缩进
    const lines = processedBody.split('\n')
    const indentedLines = lines.map(line => '  ' + line)
    const indentedCode = indentedLines.join('\n')

    // 检查是否已经有 setup/draw/settings 函数
    const hasSetup = /void\s+setup\s*\(/.test(codeBody)
    const hasDraw = /void\s+draw\s*\(/.test(codeBody)
    const hasSettings = /void\s+settings\s*\(/.test(codeBody)

    // 步骤4: 构建完整的 Java 类
    let javaCode = `import processing.core.*;
import processing.data.*;
import processing.event.*;
import processing.opengl.*;

// 用户自定义 import
${userImports.join('\n')}

public class ${className} extends PApplet {

${indentedCode}
`

    // Processing 4.x 要求 size() 必须在 settings() 中
    if (!hasSettings) {
        javaCode += `
  public void settings() {
    size(800, 600);
  }
`
    }

    // 如果没有 setup，添加空的 setup
    if (!hasSetup) {
        javaCode += `
  public void setup() {
  }
`
    }

    // 如果没有 draw，添加空的 draw
    if (!hasDraw) {
        javaCode += `
  public void draw() {
  }
`
    }

    // 添加 main 方法
    javaCode += `
  public static void main(String[] args) {
    PApplet.main("${className}");
  }
}
`

    return javaCode
}

async function compileAndRunSketch(code, sketchName, javaPath, javacPath, classpath) {
    return new Promise((resolve, reject) => {
        // 1. 创建临时目录
        const tempDir = path.join(os.tmpdir(), 'processing-studio', sketchName)
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        // 2. 转换 .pde 到 .java
        const javaCode = convertPdeToJava(code, sketchName)
        const javaFile = path.join(tempDir, `${sketchName}.java`)
        fs.writeFileSync(javaFile, javaCode, 'utf8')

        // 发送转换成功消息
        if (win && !win.isDestroyed()) {
            win.webContents.send('sketch-output', {
                type: 'stdout',
                data: '✓ Preprocessing completed'
            })
        }

        // 3. 编译 .java 到 .class
        if (!javacPath || !fs.existsSync(javacPath)) {
            // 没有 javac，尝试直接用解释器运行（某些 Processing 版本支持）
            if (win && !win.isDestroyed()) {
                win.webContents.send('sketch-output', {
                    type: 'stdout',
                    data: '⚠️ javac not found, attempting direct execution...'
                })
            }
            runJavaSketch(javaPath, classpath, tempDir, sketchName, resolve, reject)
            return
        }

        const javacArgs = [
            '-encoding', 'UTF-8',
            '-cp', classpath,
            '-d', tempDir,
            javaFile
        ]

        if (win && !win.isDestroyed()) {
            win.webContents.send('sketch-output', {
                type: 'stdout',
                data: '⚙️ Compiling...'
            })
        }

        const compileProcess = spawn(javacPath, javacArgs)
        let compileError = ''

        compileProcess.stderr.on('data', (data) => {
            compileError += data.toString()
            if (win && !win.isDestroyed()) {
                win.webContents.send('sketch-output', {
                    type: 'stderr',
                    data: data.toString()
                })
            }
        })

        compileProcess.on('close', (code) => {
            if (code !== 0) {
                // 编译失败
                if (win && !win.isDestroyed()) {
                    win.webContents.send('sketch-output', {
                        type: 'stderr',
                        data: `❌ Compilation failed (exit code ${code})`
                    })
                }
                reject({ error: compileError, type: 'compile-error' })
                return
            }

            // 编译成功
            if (win && !win.isDestroyed()) {
                win.webContents.send('sketch-output', {
                    type: 'stdout',
                    data: '✓ Compilation succeeded'
                })
            }

            // 4. 运行编译后的类
            runJavaSketch(javaPath, classpath, tempDir, sketchName, resolve, reject)
        })
    })
}

function runJavaSketch(javaPath, classpath, tempDir, sketchName, resolve, reject) {
    // 运行 Java 类
    const fullClasspath = classpath + path.delimiter + tempDir
    const javaArgs = [
        '-cp', fullClasspath,
        sketchName
    ]

    if (win && !win.isDestroyed()) {
        win.webContents.send('sketch-output', {
            type: 'stdout',
            data: '🚀 Launching sketch...'
        })
    }

    runningProcess = spawn(javaPath, javaArgs)

    runningProcess.stdout.on('data', (data) => {
        if (win && !win.isDestroyed()) {
            win.webContents.send('sketch-output', {
                type: 'stdout',
                data: data.toString()
            })
        }
    })

    runningProcess.stderr.on('data', (data) => {
        if (win && !win.isDestroyed()) {
            win.webContents.send('sketch-output', {
                type: 'stderr',
                data: data.toString()
            })
        }
    })

    runningProcess.on('error', (error) => {
        if (win && !win.isDestroyed()) {
            win.webContents.send('sketch-output', {
                type: 'stderr',
                data: `❌ Runtime error: ${error.message}`
            })
        }
        runningProcess = null
        reject({ error: error.message, type: 'runtime-error' })
    })

    runningProcess.on('close', (code) => {
        runningProcess = null
        if (win && !win.isDestroyed()) {
            const message = code === 0
                ? '✓ Sketch finished'
                : `Sketch exited with code ${code}`

            win.webContents.send('sketch-output', {
                type: 'stdout',
                data: message
            })
        }
    })

    resolve({ success: true, message: 'Sketch started' })
}

// ========= Electron Window =========

function createWindow() {
    win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        backgroundColor: '#1E1E2E',
        titleBarStyle: 'default',
    })

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
        win.webContents.openDevTools()
    } else {
        win.loadFile(path.join(process.env.DIST, 'index.html'))
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// ========= Processing IPC Handlers =========

ipcMain.handle('check-processing', async () => {
    try {
        // 优先使用内嵌的 JDK
        const { javaPath, javacPath } = getPlatformJDKPath()
        const processingLibs = getProcessingLibs()

        if (fs.existsSync(javaPath) && processingLibs) {
            return {
                installed: true,
                path: javaPath,
                mode: 'bundled',
                hasCompiler: fs.existsSync(javacPath)
            }
        }

        // Fallback: 查找系统 Processing
        const systemProcessing = findSystemProcessing()
        if (systemProcessing) {
            return {
                installed: true,
                path: systemProcessing.javaPath,
                mode: 'system',
                hasCompiler: !!systemProcessing.javacPath
            }
        }

        return {
            installed: false,
            path: null,
            error: 'Please install Processing or add libraries to resources/processing/'
        }
    } catch (error) {
        return { installed: false, path: null, error: error.message }
    }
})

ipcMain.handle('run-sketch', async (event, code, sketchName) => {
    try {
        // 停止之前的进程
        if (runningProcess) {
            try {
                const platform = os.platform()
                if (platform === 'win32') {
                    spawn('taskkill', ['/pid', runningProcess.pid, '/f', '/t'])
                } else {
                    runningProcess.kill('SIGTERM')
                }
            } catch (e) {
                console.error('Error killing previous process:', e)
            }
            runningProcess = null
        }

        // 获取 Java 和 Processing 路径
        const { javaPath, javacPath } = getPlatformJDKPath()
        let processingLibs = getProcessingLibs()

        let useJava = javaPath
        let useJavac = javacPath
        let useClasspath = processingLibs

        // Fallback 到系统 Processing
        if (!fs.existsSync(javaPath) || !processingLibs) {
            const systemProcessing = findSystemProcessing()

            if (!systemProcessing) {
                if (win && !win.isDestroyed()) {
                    win.webContents.send('sketch-output', {
                        type: 'stderr',
                        data: '❌ Processing not found. Please ensure Processing is installed.'
                    })
                }

                return {
                    success: false,
                    error: 'Processing not found. Please ensure Processing is installed or add JARs to resources/processing/'
                }
            }

            useJava = systemProcessing.javaPath
            useJavac = systemProcessing.javacPath
            useClasspath = systemProcessing.classpath

            if (win && !win.isDestroyed()) {
                win.webContents.send('sketch-output', {
                    type: 'stdout',
                    data: `✓ Using system Processing: ${systemProcessing.basePath}`
                })
            }
        } else {
            if (win && !win.isDestroyed()) {
                win.webContents.send('sketch-output', {
                    type: 'stdout',
                    data: '✓ Using bundled Processing runtime'
                })
            }
        }

        // 编译并运行
        return await compileAndRunSketch(code, sketchName, useJava, useJavac, useClasspath)
    } catch (error) {
        return {
            success: false,
            error: error.error || error.message,
            type: error.type || 'unknown'
        }
    }
})

ipcMain.handle('stop-sketch', async () => {
    if (runningProcess) {
        try {
            const platform = os.platform()
            if (platform === 'win32') {
                spawn('taskkill', ['/pid', runningProcess.pid, '/f', '/t'])
            } else {
                runningProcess.kill('SIGTERM')
            }
            runningProcess = null
            return { success: true, stopped: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }
    return { success: true, stopped: false }
})

ipcMain.handle('check-library', async (event, libName) => {
    try {
        const platform = os.platform()
        // Determine library name from import (e.g., 'processing.serial' -> 'serial', 'controlP5' -> 'controlP5')
        // Processing libs usually share the name of the package.
        // We will look for exactly the jar name or directory.

        let targetName = libName;
        if (libName.startsWith('processing.')) {
            targetName = libName.split('.')[1]; // serial, video, sound
        }

        const processingDir = getResourcePath('processing')
        if (!fs.existsSync(processingDir)) return false;

        const items = fs.readdirSync(processingDir);

        // Strategy: Look for [targetName].jar OR [targetName] folder OR case-insensitive match
        const found = items.some(item => {
            const lowerItem = item.toLowerCase();
            const lowerTarget = targetName.toLowerCase();

            // Check for jar
            if (lowerItem === `${lowerTarget}.jar`) return true;
            // Check for folder
            if (lowerItem === lowerTarget && fs.statSync(path.join(processingDir, item)).isDirectory()) return true;

            // Fallback: Check if item *starts* with target (e.g. 'video' inside 'processing-video-1.0.jar' - simpler match)
            if (lowerItem.includes(lowerTarget)) return true;

            return false;
        });

        return found;
    } catch (e) {
        return false;
    }
})

ipcMain.handle('open-library-folder', async () => {
    const processingDir = getResourcePath('processing')
    if (!fs.existsSync(processingDir)) {
        fs.mkdirSync(processingDir, { recursive: true })
    }
    const { shell } = require('electron')
    await shell.openPath(processingDir)
})

// ========= Sketchbook 文件管理 =========

/**
 * 获取 Sketchbook 根目录
 * 默认路径：~/Documents/Entropic/sketches/
 */
function getSketchbookPath() {
    const documentsPath = app.getPath('documents')
    return path.join(documentsPath, 'Entropic', 'sketches')
}

/**
 * 确保 Sketchbook 目录存在
 */
function ensureSketchbookExists() {
    const sketchbookPath = getSketchbookPath()
    if (!fs.existsSync(sketchbookPath)) {
        fs.mkdirSync(sketchbookPath, { recursive: true })
    }
    return sketchbookPath
}

/**
 * 默认代码模板
 */
const DEFAULT_CODE = `// 欢迎来到创意编程的世界！
// Welcome to the world of creative coding!

void setup() {
  size(800, 600);
  background(30);
}

void draw() {
  // 用鼠标画彩色圆圈
  // Draw colorful circles with mouse
  fill(random(100, 255), random(100, 255), random(100, 255), 150);
  noStroke();
  circle(mouseX, mouseY, random(20, 50));
}
`

// 获取所有 sketches
ipcMain.handle('get-sketches', async () => {
    try {
        const sketchbookPath = ensureSketchbookExists()
        const items = fs.readdirSync(sketchbookPath)

        const sketches = []
        for (const item of items) {
            const itemPath = path.join(sketchbookPath, item)
            const stat = fs.statSync(itemPath)

            if (stat.isDirectory()) {
                // 查找 .pde 文件
                const pdeFile = path.join(itemPath, `${item}.pde`)
                if (fs.existsSync(pdeFile)) {
                    sketches.push({
                        id: item,
                        name: item,
                        createdAt: stat.birthtime.getTime(),
                        updatedAt: stat.mtime.getTime()
                    })
                }
            }
        }

        // 按更新时间排序（最新的在前）
        sketches.sort((a, b) => b.updatedAt - a.updatedAt)

        return { success: true, sketches }
    } catch (error) {
        return { success: false, error: error.message, sketches: [] }
    }
})

// 创建新 sketch
ipcMain.handle('create-sketch', async (event, name) => {
    try {
        const sketchbookPath = ensureSketchbookExists()

        // 清理名称（移除特殊字符，保留字母、数字、下划线和中文）
        let safeName = name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')

        // Java 类名不能以数字开头，如果是数字开头则添加前缀
        if (/^[0-9]/.test(safeName)) {
            safeName = 'S_' + safeName
        }

        // 如果名称为空，使用默认名称
        if (!safeName.trim()) {
            safeName = 'Untitled'
        }

        const sketchDir = path.join(sketchbookPath, safeName)

        // 检查是否已存在
        if (fs.existsSync(sketchDir)) {
            return { success: false, error: 'Sketch already exists' }
        }

        // 创建目录和文件
        fs.mkdirSync(sketchDir, { recursive: true })
        const pdeFile = path.join(sketchDir, `${safeName}.pde`)
        fs.writeFileSync(pdeFile, DEFAULT_CODE, 'utf8')

        const stat = fs.statSync(sketchDir)

        return {
            success: true,
            sketch: {
                id: safeName,
                name: safeName,
                createdAt: stat.birthtime.getTime(),
                updatedAt: stat.mtime.getTime()
            }
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// 保存 sketch
ipcMain.handle('save-sketch', async (event, id, code) => {
    try {
        const sketchbookPath = getSketchbookPath()
        const pdeFile = path.join(sketchbookPath, id, `${id}.pde`)

        if (!fs.existsSync(path.dirname(pdeFile))) {
            return { success: false, error: 'Sketch not found' }
        }

        fs.writeFileSync(pdeFile, code, 'utf8')

        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// 加载 sketch
ipcMain.handle('load-sketch', async (event, id) => {
    try {
        const sketchbookPath = getSketchbookPath()
        const pdeFile = path.join(sketchbookPath, id, `${id}.pde`)

        if (!fs.existsSync(pdeFile)) {
            return { success: false, error: 'Sketch not found' }
        }

        const code = fs.readFileSync(pdeFile, 'utf8')

        return { success: true, code }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// 删除 sketch
ipcMain.handle('delete-sketch', async (event, id) => {
    try {
        const sketchbookPath = getSketchbookPath()
        const sketchDir = path.join(sketchbookPath, id)

        if (!fs.existsSync(sketchDir)) {
            return { success: false, error: 'Sketch not found' }
        }

        // 递归删除目录
        fs.rmSync(sketchDir, { recursive: true, force: true })

        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// 重命名 sketch
ipcMain.handle('rename-sketch', async (event, oldId, newName) => {
    try {
        const sketchbookPath = getSketchbookPath()
        const oldDir = path.join(sketchbookPath, oldId)

        if (!fs.existsSync(oldDir)) {
            return { success: false, error: 'Sketch not found' }
        }

        // 清理新名称
        let safeName = newName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')
        if (/^[0-9]/.test(safeName)) {
            safeName = 'S_' + safeName
        }
        if (!safeName.trim()) {
            return { success: false, error: 'Invalid name' }
        }

        const newDir = path.join(sketchbookPath, safeName)

        // 检查新名称是否已存在
        if (fs.existsSync(newDir) && oldId !== safeName) {
            return { success: false, error: 'Name already exists' }
        }

        // 重命名目录
        fs.renameSync(oldDir, newDir)

        // 重命名 .pde 文件
        const oldPde = path.join(newDir, `${oldId}.pde`)
        const newPde = path.join(newDir, `${safeName}.pde`)
        if (fs.existsSync(oldPde)) {
            fs.renameSync(oldPde, newPde)
        }

        return { success: true, newId: safeName }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// ========================================
// 变体草稿功能 (Variant Drafts)
// ========================================

// 获取变体列表
ipcMain.handle('get-variants', async (event, sketchId) => {
    try {
        const sketchbookPath = getSketchbookPath()
        const variantsDir = path.join(sketchbookPath, sketchId, '.variants')
        const metaFile = path.join(sketchbookPath, sketchId, '.variants.json')

        if (!fs.existsSync(variantsDir)) {
            return { success: true, variants: [] }
        }

        // 读取元数据
        let meta = { variants: [] }
        if (fs.existsSync(metaFile)) {
            meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'))
        }

        return { success: true, variants: meta.variants }
    } catch (error) {
        return { success: false, error: error.message, variants: [] }
    }
})

// 暂存为新变体
ipcMain.handle('stage-variant', async (event, sketchId, name) => {
    try {
        const sketchbookPath = getSketchbookPath()
        const sketchDir = path.join(sketchbookPath, sketchId)
        const variantsDir = path.join(sketchDir, '.variants')
        const metaFile = path.join(sketchDir, '.variants.json')
        const mainPde = path.join(sketchDir, `${sketchId}.pde`)

        // 确保 .variants 目录存在
        if (!fs.existsSync(variantsDir)) {
            fs.mkdirSync(variantsDir, { recursive: true })
        }

        // 读取元数据
        let meta = { variants: [] }
        if (fs.existsSync(metaFile)) {
            meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'))
        }

        // 生成新 ID
        const nextNum = meta.variants.length + 1
        const variantId = `v${nextNum}`

        // 复制当前代码到变体
        const variantFile = path.join(variantsDir, `${variantId}.pde`)
        fs.copyFileSync(mainPde, variantFile)

        // 更新元数据
        meta.variants.push({
            id: variantId,
            name: name || `Stash ${nextNum}`,
            timestamp: Date.now()
        })
        fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2))

        return { success: true, variant: meta.variants[meta.variants.length - 1] }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// 加载变体代码
ipcMain.handle('load-variant', async (event, sketchId, variantId) => {
    try {
        const sketchbookPath = getSketchbookPath()
        const variantFile = path.join(sketchbookPath, sketchId, '.variants', `${variantId}.pde`)

        if (!fs.existsSync(variantFile)) {
            return { success: false, error: 'Variant not found' }
        }

        const code = fs.readFileSync(variantFile, 'utf-8')
        return { success: true, code }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// 保存变体代码
ipcMain.handle('save-variant', async (event, sketchId, variantId, code) => {
    try {
        const sketchbookPath = getSketchbookPath()
        const variantFile = path.join(sketchbookPath, sketchId, '.variants', `${variantId}.pde`)

        if (!fs.existsSync(variantFile)) {
            return { success: false, error: 'Variant not found' }
        }

        fs.writeFileSync(variantFile, code, 'utf-8')
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// 删除变体
ipcMain.handle('delete-variant', async (event, sketchId, variantId) => {
    try {
        const sketchbookPath = getSketchbookPath()
        const sketchDir = path.join(sketchbookPath, sketchId)
        const variantFile = path.join(sketchDir, '.variants', `${variantId}.pde`)
        const metaFile = path.join(sketchDir, '.variants.json')

        // 删除文件
        if (fs.existsSync(variantFile)) {
            fs.unlinkSync(variantFile)
        }

        // 更新元数据
        if (fs.existsSync(metaFile)) {
            let meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'))
            meta.variants = meta.variants.filter(v => v.id !== variantId)
            fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2))
        }

        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

// 重命名变体
ipcMain.handle('rename-variant', async (event, sketchId, variantId, newName) => {
    try {
        const sketchbookPath = getSketchbookPath()
        const metaFile = path.join(sketchbookPath, sketchId, '.variants.json')

        if (!fs.existsSync(metaFile)) {
            return { success: false, error: 'Metadata not found' }
        }

        let meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'))
        const variant = meta.variants.find(v => v.id === variantId)
        if (!variant) {
            return { success: false, error: 'Variant not found' }
        }

        variant.name = newName
        fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2))

        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
})

app.whenReady().then(createWindow)
