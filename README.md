# ✨ Entropic

<div align="center">

### A modern alternative to Processing IDE

**Creative Coding: Order born from Chaos**

![Entropic](https://img.shields.io/badge/Processing-4.x-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Alpha-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

*Entropy + Picture = Entropic*

[**Download Entropic**](#-download) · [Learn More](#-what-is-it)

</div>

---

## 🎨 What is it?

**Entropic** is a modern Processing IDE tailored for designers and artists.

> **Entropy** represents chaos and randomness, while creative coding is the essence of creating order from chaos.
> **Entropic = Entropy + Picture**, using code to draw images born from chaos.

### Why Entropic?

| | Entropic | Official Processing IDE |
|---|:---:|:---:|
| 🎯 Modern UI | ✅ | ❌ |
| ⚡ Instant Feedback | ✅ | ✅ |
| 💫 Built for Designers | ✅ | ❌ |
| 📦 Smart Lib Management | ✅ | ❌ |
| 🔖 Variant/Stash System | ✅ | ❌ |

---

## 📥 Download

<div align="center">

### 🚧 Under Development

**First release is coming soon!**

Want to try the latest development build? Clone the repository and run locally:

```bash
git clone https://github.com/NattLi/Entropic.git
cd Entropic
npm install
npm run dev
```

</div>

> 💡 Once officially released, **download and run**, no dependencies required—start creating instantly!

---

## 🚀 Start Creating in 3 Minutes

### 1️⃣ Download & Install

Click the download button above, install, and open Entropic.

### 2️⃣ Try This

Paste the following code into the editor:

```processing
// ✨ Entropic - Order from Chaos
// Meaning: Generating patterns from randomness

float[] x, y;  // Position
float[] angle; // Direction
int[] c;       // Color (use int instead of color for Java compatibility)
int num = 1000; // Particle count

void setup() {
  size(800, 600);
  background(10);
  noStroke();
  
  x = new float[num];
  y = new float[num];
  angle = new float[num];
  c = new int[num];
  
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
    float n = noise(x[i]*0.005f, y[i]*0.005f, frameCount*0.005f);
    angle[i] += map(n, 0, 1, -0.1f, 0.1f);
    
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
```

### 3️⃣ Click Run

Click the **▶️ Run** button, move your mouse, and see what happens!

---

## 💡 What Can You Do?

| Use Case | Description |
|------|------|
| 🎨 **Generative Art** | Create unique visual works |
| 🎮 **Interactive Installations** | Make your work react to mouse and keyboard input |
| 📊 **Motion Graphics** | Create animations and data visualizations |
| 🧪 **Creative Experiments** | Quickly prototype visual ideas |

---

## 🌟 Interface Preview

```
┌─────────────────────────────────────────┐
│  ✨ Entropic           ▶️ Run  🛑 Stop  │
├──────┬──────────────────────┬───────────┤
│      │                      │  📚 Res   │
│ 📁   │   🎨 Code Editor       │           │
│ My   │                      │  Sound ✓  │
│ Works│   (Write code here...) │  Video ✓  │
│      │                      │           │
│      ├──────────────────────┤           │
│      │  📊 Console           │           │
│      │  (Output here)        │           │
└──────┴──────────────────────┴───────────┘
```

---

## 🎯 Roadmap

- [x] ✅ Basic Code Editor
- [x] ✅ Processing Runtime
- [x] ✅ Auto-Dependency Check & Install
- [x] ✅ Variant System (Stash & Restore)
- [x] ✅ Reveal in Folder
- [ ] 🔜 Built-in Example Library
- [ ] 🔜 Cloud Sync

---

## 🤝 Contribution

Contributions of all kinds are welcome:

- 🎨 **Designers**: UI/UX suggestions
- 📝 **Writers**: Documentation and tutorials
- 💻 **Developers**: Code contributions

---

## 📄 License

MIT License - Free to use, modify, and share

---

<div align="center">

**Creating order from chaos, drawing images with code** ✨

Made with ❤️ for artists and designers

[Get Started](#-download) · [Report Issue](https://github.com/NattLi/Entropic/issues)

</div>

<br>
<br>
<br>

---

# (Chinese Version)

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
| 📦 智能依赖管理 | ✅ | ❌ |
| 🔖 变体/快照系统 | ✅ | ❌ |

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
// ✨ Entropic - 混沌中诞生秩序
// 含义：从随机性中生成规律的图案

float[] x, y;  // 位置
float[] angle; // 方向
int[] c;       // 颜色 (Java 兼容，使用 int 替代 color)
int num = 1000; // 粒子数量

void setup() {
  size(800, 600);
  background(10);
  noStroke();
  
  x = new float[num];
  y = new float[num];
  angle = new float[num];
  c = new int[num];
  
  for(int i=0; i<num; i++) {
    x[i] = random(width);
    y[i] = random(height);
    angle[i] = random(TWO_PI);
    // 混沌中诞生的霓虹色彩
    c[i] = color(
      random(50, 150),
      random(100, 255),
      255, 
      100
    );
  }
}

void draw() {
  // 半透明背景实现拖尾效果
  fill(10, 20);
  rect(0, 0, width, height);
  
  for(int i=0; i<num; i++) {
    // 基于柏林噪声的流场（熵）
    float n = noise(x[i]*0.005f, y[i]*0.005f, frameCount*0.005f);
    angle[i] += map(n, 0, 1, -0.1f, 0.1f);
    
    x[i] += cos(angle[i]) * 2;
    y[i] += sin(angle[i]) * 2;
    
    // 边缘环绕
    if(x[i] < 0) x[i] = width;
    if(x[i] > width) x[i] = 0;
    if(y[i] < 0) y[i] = height;
    if(y[i] > height) y[i] = 0;
    
    fill(c[i]);
    circle(x[i], y[i], 2);
  }
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
- [x] ✅ 智能依赖检测与安装
- [x] ✅ 变体系统 (Stash & Restore)
- [x] ✅ 在文件夹中显示
- [ ] 🔜 内置示例库
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
