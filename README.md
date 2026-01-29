# ✨ Entropic

<div align="center">

### A modern alternative to Processing IDE

**创意编程，从混沌中诞生秩序**

![Entropic](https://img.shields.io/badge/Processing-4.x-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Alpha-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

*Entropy + Picture = Entropic*

[**下载 Entropic**](#-下载) · [了解更多](#-这是什么)

</div>

---

## 🎨 这是什么？

**Entropic** 是一个现代化的 Processing IDE 替代品，为设计师和艺术家打造。

> 熵（Entropy）代表混沌与随机，而创意编程的本质正是从混沌中创造秩序。  
> **Entropic = Entropy + Picture**，用代码绘制从混沌中诞生的图像。

### 为什么选择 Entropic？

| | Entropic | 官方 Processing IDE |
|---|:---:|:---:|
| 🎯 现代界面 | ✅ | ❌ |
| ⚡ 即时反馈 | ✅ | ✅ |
| 💫 为设计师打造 | ✅ | ❌ |
| 🤖 AI 辅助（即将推出） | ✅ | ❌ |

---

## 📥 下载

<div align="center">

### 🚧 开发中

**首个发布版本即将推出！**

想要体验最新开发版本？克隆仓库并本地运行：

```bash
git clone https://github.com/NattLi/Entropic.git
cd Entropic
npm install
npm run dev
```

</div>

> 💡 正式版发布后，**下载即用**，无需安装任何依赖，打开就能开始创作！

---

## 🚀 3 分钟开始创作

### 1️⃣ 下载并安装

点击上方下载按钮，安装后打开 Entropic。

### 2️⃣ 试试这个

把下面的代码粘贴到编辑器：

```processing
void setup() {
  size(800, 600);
  background(20);
}

void draw() {
  // 半透明背景创造拖尾效果
  fill(20, 20, 20, 10);
  rect(0, 0, width, height);
  
  // 绘制跟随鼠标的圆圈
  fill(random(200, 255), random(100, 200), random(150, 255));
  noStroke();
  circle(mouseX, mouseY, random(10, 40));
}
```

### 3️⃣ 点击运行

点击 **▶️ Run** 按钮，移动鼠标，看看会发生什么！

---

## 💡 能用它做什么？

| 用途 | 描述 |
|------|------|
| 🎨 **生成艺术** | 创建独一无二的视觉作品 |
| 🎮 **交互装置** | 让你的作品对鼠标、键盘做出反应 |
| 📊 **动态图形** | 制作动画、数据可视化 |
| 🧪 **创意实验** | 快速验证视觉想法 |

---

## 🌟 界面预览

```
┌─────────────────────────────────────────┐
│  ✨ Entropic           ▶️ Run  🛑 Stop  │
├──────┬──────────────────────┬───────────┤
│      │                      │  📚 资源  │
│ 📁   │   🎨 代码编辑器        │           │
│ 我的  │                      │  Sound ✓  │
│ 作品  │   (在这里写代码...)    │  Video ✓  │
│      │                      │           │
│      ├──────────────────────┤           │
│      │  📊 控制台            │           │
│      │  (运行结果在这里)      │           │
└──────┴──────────────────────┴───────────┘
```

---

## 🎯 开发路线图

- [x] ✅ 基础代码编辑器
- [x] ✅ Processing 代码运行
- [ ] 🔜 内置示例库
- [ ] 🔜 AI 代码助手
- [ ] 🔜 作品云端同步

---

## 🤝 参与贡献

欢迎各种形式的贡献：

- 🎨 **设计师**：界面设计建议
- 📝 **作家**：文档和教程
- 💻 **开发者**：代码贡献

---

## 📄 开源协议

MIT License - 自由使用、修改、分享

---

<div align="center">

**从混沌中创造秩序，用代码绘制图像** ✨

Made with ❤️ for artists and designers

[开始使用](#-下载) · [报告问题](https://github.com/NattLi/Entropic/issues)

</div>
