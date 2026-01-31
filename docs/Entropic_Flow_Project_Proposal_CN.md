# 项目代号：Entropic Flow (熵流)
**Version 0.1 (草案)**

> "让数学触手可及，让艺术自然生长。"
> "Make Math Touchable. Make Art Generative."

## 1. 项目摘要 (Executive Summary)
**Entropic Flow** 旨在打造下一代生成式艺术创作平台。它致力于填补底层编程框架（Processing, OpenFrameworks）与高阶设计工具（Figma, Photoshop）之间的鸿沟。通过利用 **WebGPU** 的极致性能与 **“节点-代码二象性” (Node-Code Hybrid)** 的交互体验，我们将复杂的数学概念封装为艺术家指尖的直观工具，让创作像呼吸一样自然。

## 2. 核心铁三角 (The Core Team)
*   **设计师 (The Designer - UX/Product)**：定义“手感”。专注于“直接操作 (Direct Manipulation)”——确保调节微分方程参数的感觉就像在捏泥巴，而不是在改 Excel。
*   **数学家 (The Mathematician - Algorithm Core)**：提供“引擎”。将高深的数学概念（拓扑学、向量场、混沌理论）转化为稳定的、参数化的“数学原语”，让艺术家无需博士学位也能驾驭。
*   **AI 架构师 (The AI - Architecture)**：负责“实现”。快速原型化 Web/Rust/WebGPU 技术栈，优化渲染管线，并提供能够理解艺术意图的 AI 辅助编码。

## 3. 产品愿景：生成式艺术领域的 Figma

### 3.1 无限画布 (The Infinite Canvas)
*   **空间化组织**：告别线性的脚本文件。在一个无限大的二维空间中，代码片段、实时预览窗口、参数节点共存。
*   **非线性心流**：逻辑从数据源流向处理节点，最终流向渲染输出，所见即所得。

### 3.2 数学画笔 (The Math Brushes) —— *核心护城河*
我们将复杂的数学封装为可视化的工具，这是 Dr. Hu 的主战场：
*   **场论操纵器 (Field Manipulators)**：用画笔在画布上直接“刷”出向量流的走向，底层控制着复杂的向量场方程。
*   **拓扑弯曲器 (Topology Benders)**：不仅仅是缩放大小，而是改变 3D形状的拓扑亏格，或者在非欧几里得空间中折叠 2D 平面。
*   **对称引擎 (Symmetry Engines)**：基于晶体群论 (Wallpaper Groups) 的实时万花筒生成系统，一键生成数学上完美的平铺图案。

### 3.3 节点与代码的二象性 (Node-Code Hybrid)
*   **拒绝黑盒**：每一个可视化的节点，双击后都能展开看到底层的 GLSL/WGSL/Rust 源码。
*   **实时编程**：直接修改节点内的代码，视觉表现和所有下游输出瞬间更新。

## 4. 技术架构 (Technical Architecture)

*   **平台**：Web-based (桌面端通过 Electron 封装)。
*   **图形内核**：**WebGPU** (Rust/Wasm)。这是性能的关键，利用 GPU 计算着色器 (Compute Shader) 在浏览器中实时模拟百万级粒子。
*   **反应式引擎 (Reactive Engine)**：类似 Excel 或 Houdini 的依赖图系统，确保只重算需要更新的部分，极致流畅。

## 5. 为什么是现在？ (Why Now?)
*   **WebGPU 落地**：浏览器终于拥有了接近原生 C++ 应用的计算能力，这是以前做不到的。
*   **生成式 AI 的爆发**：市场已经被教育了。创作者们渴望控制力，他们不再满足于简单的“文生图”抽卡，他们想要精准的、算法驱动的控制。

## 6. 致数学家 (Call to Action for Dr. Hu)
我们需要一个**既稳健又灵活**的数学地基。
*   *挑战*：如何参数化一个“奇异吸引子 (Strange Attractor)”，使其永远不会产生“无聊”的结果，但又能允许无限的“有趣”变体？
*   *目标*：构建一套“数学原语库 (Math Primitives)”，让它们在数字艺术中的地位，如同“贝塞尔曲线”在矢量设计中一样基础且重要。
