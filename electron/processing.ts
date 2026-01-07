const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Processing 可能的安装路径
const PROCESSING_PATHS = {
    win32: [
        'C:\\Program Files\\Processing\\processing-java.exe',
        'C:\\Program Files (x86)\\Processing\\processing-java.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Processing', 'processing-java.exe'),
    ],
    darwin: [
        '/Applications/Processing.app/Contents/MacOS/processing-java',
        path.join(os.homedir(), 'Applications', 'Processing.app', 'Contents', 'MacOS', 'processing-java'),
    ],
    linux: [
        '/usr/bin/processing-java',
        '/usr/local/bin/processing-java',
        path.join(os.homedir(), 'processing', 'processing-java'),
    ],
};

let cachedProcessingPath = null;
let runningProcess = null;

/**
 * 查找 processing-java 可执行文件
 */
function findProcessingJava() {
    if (cachedProcessingPath) {
        return cachedProcessingPath;
    }

    const platform = os.platform();
    const paths = PROCESSING_PATHS[platform] || [];

    // 先检查 PATH 中是否有 processing-java
    const pathEnv = process.env.PATH || '';
    const pathDirs = pathEnv.split(platform === 'win32' ? ';' : ':');

    for (const dir of pathDirs) {
        const execPath = path.join(dir, platform === 'win32' ? 'processing-java.exe' : 'processing-java');
        if (fs.existsSync(execPath)) {
            cachedProcessingPath = execPath;
            return execPath;
        }
    }

    // 检查常见安装路径
    for (const checkPath of paths) {
        if (fs.existsSync(checkPath)) {
            cachedProcessingPath = checkPath;
            return checkPath;
        }
    }

    return null;
}

/**
 * 检查 Processing 是否已安装
 */
async function checkProcessingInstalled() {
    const processingPath = findProcessingJava();
    if (!processingPath) {
        return { installed: false, path: null };
    }

    return new Promise((resolve) => {
        execFile(processingPath, ['--help'], (error, stdout, stderr) => {
            if (error && error.code === 'ENOENT') {
                resolve({ installed: false, path: null });
            } else {
                resolve({ installed: true, path: processingPath });
            }
        });
    });
}

/**
 * 运行 Processing sketch
 */
async function runSketch(code, sketchName) {
    const processingPath = findProcessingJava();
    if (!processingPath) {
        throw new Error('Processing not found. Please install Processing from https://processing.org/download');
    }

    // 创建临时目录
    const tempDir = path.join(os.tmpdir(), 'processing-studio', sketchName);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // 保存代码为 .pde 文件
    const sketchFile = path.join(tempDir, `${sketchName}.pde`);
    fs.writeFileSync(sketchFile, code, 'utf8');

    // 停止之前的进程
    if (runningProcess) {
        stopSketch();
    }

    // 运行 processing-java
    return new Promise((resolve, reject) => {
        const args = ['--sketch=' + tempDir, '--run'];

        runningProcess = spawn(processingPath, args);

        let stdout = '';
        let stderr = '';

        runningProcess.stdout.on('data', (data) => {
            stdout += data.toString();
            // 实时发送输出（通过事件）
            if (runningProcess.sendOutput) {
                runningProcess.sendOutput('stdout', data.toString());
            }
        });

        runningProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            if (runningProcess.sendOutput) {
                runningProcess.sendOutput('stderr', data.toString());
            }
        });

        runningProcess.on('error', (error) => {
            reject({ error: error.message, type: 'spawn-error' });
        });

        runningProcess.on('close', (code) => {
            const process = runningProcess;
            runningProcess = null;

            if (code === 0) {
                resolve({ success: true, output: stdout });
            } else {
                reject({
                    error: stderr || stdout,
                    exitCode: code,
                    type: 'processing-error'
                });
            }
        });

        // 标记进程已启动
        resolve({ success: true, process: runningProcess, message: 'Sketch started' });
    });
}

/**
 * 停止正在运行的 sketch
 */
function stopSketch() {
    if (runningProcess) {
        try {
            if (os.platform() === 'win32') {
                // Windows: 使用 taskkill 强制终止进程树
                spawn('taskkill', ['/pid', runningProcess.pid, '/f', '/t']);
            } else {
                // Unix: 发送 SIGTERM
                runningProcess.kill('SIGTERM');

                // 如果 2 秒后还没结束，强制 SIGKILL
                setTimeout(() => {
                    if (runningProcess) {
                        runningProcess.kill('SIGKILL');
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Error stopping sketch:', error);
        }
        runningProcess = null;
        return true;
    }
    return false;
}

/**
 * 获取 Processing 安装指引
 */
function getInstallInstructions() {
    const platform = os.platform();

    if (platform === 'win32') {
        return 'Windows: Download Processing from https://processing.org/download and install it. Make sure to add Processing to your PATH during installation.';
    } else if (platform === 'darwin') {
        return 'macOS: Download Processing from https://processing.org/download and drag it to your Applications folder.';
    } else {
        return 'Linux: Download Processing from https://processing.org/download and extract it to your home directory.';
    }
}

/**
 * 设置输出回调
 */
function setOutputCallback(callback) {
    if (runningProcess) {
        runningProcess.sendOutput = callback;
    }
}

module.exports = {
    checkProcessingInstalled,
    runSketch,
    stopSketch,
    getInstallInstructions,
    setOutputCallback,
    findProcessingJava,
};
