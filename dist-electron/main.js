"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn, execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
process.env.DIST = path.join(__dirname, "../dist");
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
let win = null;
let runningProcess = null;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function getResourcePath(relativePath) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, relativePath);
  } else {
    return path.join(__dirname, "..", "resources", relativePath);
  }
}
function getPlatformJDKPath() {
  const platform = os.platform();
  const platformMap = {
    "win32": "win",
    "darwin": "mac",
    "linux": "linux"
  };
  const platformDir = platformMap[platform] || "win";
  const javaExe = platform === "win32" ? "java.exe" : "java";
  const javacExe = platform === "win32" ? "javac.exe" : "javac";
  return {
    jdkRoot: getResourcePath(`jdk/${platformDir}`),
    javaPath: getResourcePath(`jdk/${platformDir}/bin/${javaExe}`),
    javacPath: getResourcePath(`jdk/${platformDir}/bin/${javacExe}`)
  };
}
function getProcessingLibs() {
  const processingDir = getResourcePath("processing");
  if (!fs.existsSync(processingDir)) {
    return null;
  }
  try {
    const jars = fs.readdirSync(processingDir).filter((file) => file.endsWith(".jar")).map((file) => path.join(processingDir, file));
    return jars.length > 0 ? jars.join(path.delimiter) : null;
  } catch (error) {
    console.error("Error reading Processing libs:", error);
    return null;
  }
}
function findFileRecursive(dir, filename, maxDepth = 5, currentDepth = 0) {
  if (!fs.existsSync(dir) || currentDepth > maxDepth) {
    return null;
  }
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item === filename) {
        return path.join(dir, item);
      }
    }
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const found = findFileRecursive(fullPath, filename, maxDepth, currentDepth + 1);
          if (found) return found;
        }
      } catch (e) {
      }
    }
  } catch (error) {
  }
  return null;
}
function findJarsRecursive(dir, maxDepth = 3, currentDepth = 0) {
  const jars = [];
  if (!fs.existsSync(dir) || currentDepth > maxDepth) {
    return jars;
  }
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && item.endsWith(".jar")) {
          jars.push(fullPath);
        } else if (stat.isDirectory() && currentDepth < maxDepth) {
          const subJars = findJarsRecursive(fullPath, maxDepth, currentDepth + 1);
          jars.push(...subJars);
        }
      } catch (e) {
      }
    }
  } catch (error) {
  }
  return jars;
}
function findSystemProcessing() {
  const platform = os.platform();
  const processingPaths = {
    win32: [
      "C:\\Program Files\\Processing",
      "C:\\Program Files (x86)\\Processing"
    ],
    darwin: [
      "/Applications/Processing.app/Contents"
    ],
    linux: [
      "/opt/processing",
      path.join(os.homedir(), "processing")
    ]
  };
  const paths = processingPaths[platform] || [];
  for (const basePath of paths) {
    if (!fs.existsSync(basePath)) continue;
    console.log(`Searching Processing in: ${basePath}`);
    const javaExe = platform === "win32" ? "java.exe" : "java";
    const javacExe = platform === "win32" ? "javac.exe" : "javac";
    const javaPath = findFileRecursive(basePath, javaExe, 6);
    if (javaPath) {
      console.log(`Found Java: ${javaPath}`);
      const javacPath = findFileRecursive(path.dirname(javaPath), javacExe, 1);
      const appDir = path.join(basePath, "app");
      let jars = [];
      if (fs.existsSync(appDir)) {
        jars = findJarsRecursive(appDir, 3);
        console.log(`Found ${jars.length} JAR files`);
      }
      if (jars.length > 0) {
        return {
          javaPath,
          javacPath: javacPath || null,
          classpath: jars.join(path.delimiter),
          basePath
        };
      }
    }
  }
  console.log("Processing not found in standard locations");
  return null;
}
function convertPdeToJava(pdeCode, className) {
  let processedCode = pdeCode.replace(/^(\s*)void\s+/gm, "$1public void ");
  const lines = processedCode.split("\n");
  const indentedLines = lines.map((line) => "  " + line);
  const indentedCode = indentedLines.join("\n");
  const hasSetup = /void\s+setup\s*\(/.test(pdeCode);
  const hasDraw = /void\s+draw\s*\(/.test(pdeCode);
  const hasSettings = /void\s+settings\s*\(/.test(pdeCode);
  let javaCode = `import processing.core.*;
import processing.data.*;
import processing.event.*;
import processing.opengl.*;

import java.util.*;

public class ${className} extends PApplet {

${indentedCode}
`;
  if (!hasSettings) {
    javaCode += `
  public void settings() {
    size(800, 600);
  }
`;
  }
  if (!hasSetup) {
    javaCode += `
  public void setup() {
  }
`;
  }
  if (!hasDraw) {
    javaCode += `
  public void draw() {
  }
`;
  }
  javaCode += `
  public static void main(String[] args) {
    PApplet.main("${className}");
  }
}
`;
  return javaCode;
}
async function compileAndRunSketch(code, sketchName, javaPath, javacPath, classpath) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(os.tmpdir(), "processing-studio", sketchName);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const javaCode = convertPdeToJava(code, sketchName);
    const javaFile = path.join(tempDir, `${sketchName}.java`);
    fs.writeFileSync(javaFile, javaCode, "utf8");
    if (win && !win.isDestroyed()) {
      win.webContents.send("sketch-output", {
        type: "stdout",
        data: "✓ Preprocessing completed"
      });
    }
    if (!javacPath || !fs.existsSync(javacPath)) {
      if (win && !win.isDestroyed()) {
        win.webContents.send("sketch-output", {
          type: "stdout",
          data: "⚠️ javac not found, attempting direct execution..."
        });
      }
      runJavaSketch(javaPath, classpath, tempDir, sketchName, resolve, reject);
      return;
    }
    const javacArgs = [
      "-encoding",
      "UTF-8",
      "-cp",
      classpath,
      "-d",
      tempDir,
      javaFile
    ];
    if (win && !win.isDestroyed()) {
      win.webContents.send("sketch-output", {
        type: "stdout",
        data: "⚙️ Compiling..."
      });
    }
    const compileProcess = spawn(javacPath, javacArgs);
    let compileError = "";
    compileProcess.stderr.on("data", (data) => {
      compileError += data.toString();
      if (win && !win.isDestroyed()) {
        win.webContents.send("sketch-output", {
          type: "stderr",
          data: data.toString()
        });
      }
    });
    compileProcess.on("close", (code2) => {
      if (code2 !== 0) {
        if (win && !win.isDestroyed()) {
          win.webContents.send("sketch-output", {
            type: "stderr",
            data: `❌ Compilation failed (exit code ${code2})`
          });
        }
        reject({ error: compileError, type: "compile-error" });
        return;
      }
      if (win && !win.isDestroyed()) {
        win.webContents.send("sketch-output", {
          type: "stdout",
          data: "✓ Compilation succeeded"
        });
      }
      runJavaSketch(javaPath, classpath, tempDir, sketchName, resolve, reject);
    });
  });
}
function runJavaSketch(javaPath, classpath, tempDir, sketchName, resolve, reject) {
  const fullClasspath = classpath + path.delimiter + tempDir;
  const javaArgs = [
    "-cp",
    fullClasspath,
    sketchName
  ];
  if (win && !win.isDestroyed()) {
    win.webContents.send("sketch-output", {
      type: "stdout",
      data: "🚀 Launching sketch..."
    });
  }
  runningProcess = spawn(javaPath, javaArgs);
  runningProcess.stdout.on("data", (data) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send("sketch-output", {
        type: "stdout",
        data: data.toString()
      });
    }
  });
  runningProcess.stderr.on("data", (data) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send("sketch-output", {
        type: "stderr",
        data: data.toString()
      });
    }
  });
  runningProcess.on("error", (error) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send("sketch-output", {
        type: "stderr",
        data: `❌ Runtime error: ${error.message}`
      });
    }
    runningProcess = null;
    reject({ error: error.message, type: "runtime-error" });
  });
  runningProcess.on("close", (code) => {
    runningProcess = null;
    if (win && !win.isDestroyed()) {
      const message = code === 0 ? "✓ Sketch finished" : `Sketch exited with code ${code}`;
      win.webContents.send("sketch-output", {
        type: "stdout",
        data: message
      });
    }
  });
  resolve({ success: true, message: "Sketch started" });
}
function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: "#1E1E2E",
    titleBarStyle: "default"
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("check-processing", async () => {
  try {
    const { javaPath, javacPath } = getPlatformJDKPath();
    const processingLibs = getProcessingLibs();
    if (fs.existsSync(javaPath) && processingLibs) {
      return {
        installed: true,
        path: javaPath,
        mode: "bundled",
        hasCompiler: fs.existsSync(javacPath)
      };
    }
    const systemProcessing = findSystemProcessing();
    if (systemProcessing) {
      return {
        installed: true,
        path: systemProcessing.javaPath,
        mode: "system",
        hasCompiler: !!systemProcessing.javacPath
      };
    }
    return {
      installed: false,
      path: null,
      error: "Please install Processing or add libraries to resources/processing/"
    };
  } catch (error) {
    return { installed: false, path: null, error: error.message };
  }
});
ipcMain.handle("run-sketch", async (event, code, sketchName) => {
  try {
    if (runningProcess) {
      try {
        const platform = os.platform();
        if (platform === "win32") {
          spawn("taskkill", ["/pid", runningProcess.pid, "/f", "/t"]);
        } else {
          runningProcess.kill("SIGTERM");
        }
      } catch (e) {
        console.error("Error killing previous process:", e);
      }
      runningProcess = null;
    }
    const { javaPath, javacPath } = getPlatformJDKPath();
    let processingLibs = getProcessingLibs();
    let useJava = javaPath;
    let useJavac = javacPath;
    let useClasspath = processingLibs;
    if (!fs.existsSync(javaPath) || !processingLibs) {
      const systemProcessing = findSystemProcessing();
      if (!systemProcessing) {
        if (win && !win.isDestroyed()) {
          win.webContents.send("sketch-output", {
            type: "stderr",
            data: "❌ Processing not found. Please ensure Processing is installed."
          });
        }
        return {
          success: false,
          error: "Processing not found. Please ensure Processing is installed or add JARs to resources/processing/"
        };
      }
      useJava = systemProcessing.javaPath;
      useJavac = systemProcessing.javacPath;
      useClasspath = systemProcessing.classpath;
      if (win && !win.isDestroyed()) {
        win.webContents.send("sketch-output", {
          type: "stdout",
          data: `✓ Using system Processing: ${systemProcessing.basePath}`
        });
      }
    } else {
      if (win && !win.isDestroyed()) {
        win.webContents.send("sketch-output", {
          type: "stdout",
          data: "✓ Using bundled Processing runtime"
        });
      }
    }
    return await compileAndRunSketch(code, sketchName, useJava, useJavac, useClasspath);
  } catch (error) {
    return {
      success: false,
      error: error.error || error.message,
      type: error.type || "unknown"
    };
  }
});
ipcMain.handle("stop-sketch", async () => {
  if (runningProcess) {
    try {
      const platform = os.platform();
      if (platform === "win32") {
        spawn("taskkill", ["/pid", runningProcess.pid, "/f", "/t"]);
      } else {
        runningProcess.kill("SIGTERM");
      }
      runningProcess = null;
      return { success: true, stopped: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: true, stopped: false };
});
app.whenReady().then(createWindow);
