# 🔄 Entropic - Session Handover

> **项目名称**: Entropic (Entropy + Picture)  
> **定位**: A modern alternative to Processing IDE  
> **目标用户**: 设计师和艺术家（非程序员）  
> **更新日期**: 2026-01-30

---

## 🎯 项目概述

Entropic 是一个面向设计师和艺术家的 Processing IDE 替代品。

**理念**：熵（Entropy）代表混沌与随机，创意编程的本质正是从混沌中创造秩序。

**技术栈**：
- Electron + React + TypeScript
- Vite 构建
- Monaco Editor 代码编辑器
- 内置 Processing 运行时（无需用户安装 Processing）

---

## ✅ 已完成功能

- [x] Processing Sketch 运行/停止
- [x] 控制台输出 (Stdout/Stderr)
- [x] Monaco Editor 集成
- [x] **独立运行**（内置 JDK + Processing Core，用户无需安装）
- [x] **动态库检测**（解析 import 语句）
- [x] **Import 预处理器**（自动转换 PDE → Java）
- [x] **版本管理系统**（Variant Stash & Restore）
- [x] **回收站功能**（Bin System）
- [x] **Sketchbook 体验优化** (v0.4.0)
  - [x] 日期分组 (Today/Yesterday)
  - [x] 实时搜索过滤
  - [x] 星标置顶 (Star/Pin) & 后端存储
  - [x] 视觉层次优化
- [x] **串口扫描器 (Serial Port Scanner)** (v0.5.0) 🔌
  - [x] Tab 分页控制台 (Console/Serial)
  - [x] 一键扫描所有端口
  - [x] Processing 风格端口列表
  - [x] 实时数据预览

---

## 🔧 待完成功能

### P0 - 核心功能

1. **文件管理系统**
   - [ ] 新建项目、保存、打开
   - [ ] 项目列表（替换硬编码的 My Sketches）
   - [ ] IPC handlers: `create-project`, `save-file`, `open-project`

2. **发布到 GitHub Release**
   - [ ] 配置 electron-builder 输出 .exe / .dmg
   - [ ] GitHub Actions 自动构建
   - [ ] README 中的下载链接指向 Releases

### P1 - 体验优化

3. **库的一键安装**
   - 解析 Processing Library Index
   - 下载 .zip 并解压到 `resources/processing/`
   - 替换当前的"打开文件夹"方案

4. **资源优化**
   - 使用 `jlink` 精简 JDK 体积
   - 目标：整体安装包 < 200MB

5. **多语言支持 (i18n)** 🌍
   - 技术方案：`react-i18next`
   - 自动检测系统语言，支持手动切换
   - 目标语言：EN, 中文, 日本語, 한국어, ES, FR, DE, PT
   - 预估工时：3-4 天

6. ~~**Figma 风格菜单** 🍔~~ ✅ **已完成 v0.4.0**
   - ~~隐藏系统菜单栏，使用无框窗口~~
   - ~~左上角汉堡包菜单按钮 + 下拉菜单~~
   - ~~跨平台统一体验 (Windows/macOS)~~
   - ~~预估工时：1-2 天~~

### P2 - 未来功能

7. AI 代码助手
8. 云端同步
9. 内置示例库

---

## 📁 项目结构

```
entropic/
├── electron/           # Electron 主进程
│   ├── main.ts         # 主进程入口、IPC handlers
│   └── preload.ts      # 预加载脚本
├── src/                # React 前端
│   ├── App.tsx         # 主应用组件
│   ├── components/     # UI 组件
│   └── main.tsx        # 前端入口
├── resources/          # 内置资源
│   ├── processing-core/  # Processing 核心库
│   └── jdk/              # 各平台 JDK
├── package.json        # 项目配置（name: entropic）
└── README.md           # 项目介绍
```

---

## 🔑 关键文件

| 文件 | 说明 |
|------|------|
| `electron/main.ts` | Processing 运行逻辑、PDE→Java 转换、库检测 |
| `src/App.tsx` | 主 UI、库状态显示 |
| `src/components/Editor.tsx` | Monaco Editor 配置 |
| `PROJECT_PLAN.md` | 完整的项目规划文档（技术栈、设计方向等） |

---

## 🚀 下一步任务

**推荐从这里开始**：

1. ~~复制项目到 GitHub 仓库位置~~ ✅
2. ~~更新 GitHub 用户名~~ ✅ (README 已更新为 NattLi)
3. **提交初始版本到 GitHub**
4. **实现文件管理系统**（这是当前最大的缺失功能）
5. **发布首个 Release**（配置 electron-builder）

---

## 💡 设计参考

- **UX 参考**: Figma（简洁、下载即用）
- **界面风格**: 暗色主题、现代设计
- **目标**: 让设计师不需要懂命令行就能使用
