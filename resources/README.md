# Processing 资源复制指南

由于 Processing 安装结构可能不同，请手动复制以下文件：

## Windows 平台（当前）

### 1. 复制 JDK
```powershell
# 复制整个 JDK 到 resources
xcopy "C:\Program Files\Processing\runtime" "C:\Users\Natt\Desktop\ProcessingIDE\resources\jdk\win\" /E /I /Y
```

### 2. 查找并复制 Processing 核心 JAR

运行以下命令找到所有 JAR 文件：
```powershell
Get-ChildItem "C:\Program Files\Processing" -Recurse -Filter "*.jar" | Select-Object FullName
```

**必需的 JAR 文件**（复制到 `resources/processing/`）：
- `core.jar` - Processing 核心 API
- `pde.jar` - Processing 开发环境库  
- `gluegen-rt.jar` - OpenGL 运行时
- `jogl-all.jar` - OpenGL 库
- `gluegen-rt-natives-windows-amd64.jar` - Windows native 库
- `jogl-all-natives-windows-amd64.jar` - Windows OpenGL native

## macOS 平台（未来）

从 Processing.app 复制：
```bash
cp -R /Applications/Processing.app/Contents/PlugIns/jdk* resources/jdk/mac/
cp /Applications/Processing.app/Contents/Java/core/library/*.jar resources/processing/
```

## Linux 平台（未来）

从 Processing 安装目录复制类似文件。

---

## 快捷方式

如果上面太复杂，简单做法：

1. **先不复制**，让代码回退到查找系统 Processing
2. **打包时再处理**跨平台资源
3. **开发阶段**使用系统 Processing（fallback 机制）
