# Concept-Driven Design Systems

这是一个长期维护的概念驱动型设计系统集合。本项目中的每一个设计系统都是一个独立的、单文件的 HTML 交互式设计规范与组件库。
无论是配色、排版还是文案基调，每一个系统的设计都在探索一种特定的艺术、电影或文化概念。本项目将持续跟进和更新，引入更多不同概念的设计系统。

## 🌟 核心理念与规范

本项目中**所有**的设计系统都严格遵循以下开发和设计规范：

1. **概念驱动 (Concept-driven)**：系统内的所有 Design Tokens、字体选择和文案基调都必须清晰地追溯到核心的电影或艺术概念，拒绝毫无根据的审美堆砌。
2. **完全独立 (Self-contained)**：每个系统都是一个纯粹的 `.html` 单文件，除了 Google Fonts 之外，不引入任何外部 JS 或 CSS 依赖，极致轻量，开箱即用。
3. **Token 洁净度 (Token hygiene)**：组件 CSS 中零硬编码颜色或间距值，所有样式必须严格引用 CSS 变量 `var(--token-name)`。
4. **统一命名空间 (Fixed token names)**：采用高度一致的语义化 Token，如间距 (`--sp-1` … `--sp-10`)、字号比例 (`--fs-12` … `--fs-96` 及其配套行高 `--lh-*`) 以及语义化色彩 (`--fg-*`, `--bg-*`, `--line`, `--accent`)。
5. **六大标准模块 (Fixed Structure)**：所有文档严格按顺序包含六大章节区块：Overview（系统概述） · Foundations（设计基础） · Components（组件库） · Motion（动效原则） · Iconography（图标指引） · Voice & Tone（文案基调）。
6. **主题切换 (Alternate theme)**：内置至少一种基于 `[data-theme="…"]` 属性的主题切换（如日夜间模式），通过覆盖底层语义角色 Tokens 优雅实现。

## 🎨 当前收录的系统

直接在浏览器中打开对应 `.html` 文件即可进入沉浸式的交互体验指南：

- **[`Edge_Runner_Design_System.html`](./Edge_Runner_Design_System.html)**
  - **概念灵感**：《镜之边缘》(Mirror's Edge)
  - **视觉特征**：极简近乎单调的正负空间 + 强烈的“Runner Red”强调色，带来极度锐利的几何切割感。
- **[`Playtime_Design_System.html`](./Playtime_Design_System.html)**
  - **概念灵感**：雅克·塔蒂导演的电影《玩乐时间》(Playtime, 1967)
  - **视觉特征**：复古现代主义与玻璃建筑美学，严谨的网格与低饱和度双模式调色板。
- **[`Suzuka_Design_System.html`](./Suzuka_Design_System.html)**
  - **视觉特征**：打开文档即可体验该全新系统的专属交互与概念设计。

## 🚀 如何使用

本项目**无任何构建依赖**（No Webpack, No Vite, No npm install）。
直接将克隆到本地的任意 `.html` 文件拖拽进入你的现代浏览器，即可完整浏览设计原则、尝试交互组件以及查看源码实践。

## 🛠️ 后续维护与开发提示

本项目是一个长期更新的代码库。后续计划增加诸如 Solarpunk (太阳朋克)、Retro NeonBazaar (复古夜市) 等多种风格的全新设计系统。

👉 **开发与 AI 协同规范**：对于参与贡献或利用 AI（如 Claude/GitHub Copilot）辅助编写该项目的开发者，请重点参考项目根目录的 **[`CLAUDE.md`](./CLAUDE.md)** 文件。其中详细定义了用于维持项目高标准的开发指引和 AI Skill 指令（如 `/design-system`）。