# myBill 项目规则

## 工作流程

**先理解，再确认，后动手。**

1. 认真理解用户需求，明确要改什么、为什么改、影响范围
2. 把理解用简洁的语言告诉用户，等待确认
3. 用户确认后，再开始修改代码

禁止：没搞清楚需求就直接改代码、改完后用户说"不对"再反复返工。

## 样式规范

**所有样式必须使用 CSS 变量，严禁硬编码。**

- 颜色：`var(--text-default)`、`var(--bg-card)`、`var(--primary-600)` 等
- 阴影：`var(--shadow-card)`、`var(--shadow-soft)` 等
- 边框：`var(--border-default)`、`var(--border-focus)` 等
- 背景：`var(--bg-base)`、`var(--bg-subtle)`、`var(--bg-card)` 等

CSS 变量定义在两个位置：
1. `utils/themes.js` — 所有 6 个主题的完整变量定义
2. `app.wxss` — 默认主题和 `.theme-minimal` 的静态后备

如需调整样式效果，修改对应 CSS 变量在 `themes.js` 和 `app.wxss` 中的定义，不要在各页面组件中硬编码数值。
