# 配色方案 Design Tokens

> 目标：去 AI 感 / 产品级配色 / 提升产品化一致性

---

## 一、设计原则

- **中性优先**：以白、灰为主，降低视觉噪音
- **克制用色**：主色 ≤ 2，避免多色干扰
- **功能导向**：颜色服务信息层级
- **稳定统一**：减少颜色种类，避免"组件库感"
- **可访问性**：确保文字对比度符合 WCAG AA 标准（≥ 4.5:1）

---

## 二、核心配色

### 1. Primary（主色）

| Token | HEX | 用途 |
|------|-----|------|
| primary-700 | #1E4A6E | pressed / active |
| primary-600 | #2F5E8A | 主按钮 / 激活态 |
| primary-500 | #3E739F | hover / 链接 |
| primary-400 | #5C8BB5 | disabled 按钮 |
| primary-200 | #C5D9E8 | 浅背景 hover |
| primary-100 | #E6EFF6 | 浅背景 |
| primary-soft | #F3F7FA | 页面弱底 |

---

### 2. Accent（强调色）

| Token | HEX | 用途 |
|------|-----|------|
| accent | #7C9A92 | 图表高亮 / 标签点缀 |
| accent-light | #E8F0EE | accent 浅背景 |

**使用限制**：
- 仅用于局部强调
- 不用于按钮 / 大面积背景

---

### 3. Neutral（中性色）

| Token | HEX | 用途 |
|------|-----|------|
| neutral-900 | #1E2A36 | 主文字 |
| neutral-700 | #5F6B7A | 次级文字 |
| neutral-500 | #8B929E | 占位 / 禁用文字（对比度优化） |
| neutral-300 | #D1D6DE | 分割线 |
| neutral-200 | #E3E8EE | 边框 |
| neutral-100 | #F4F7FA | 区块背景 |
| neutral-50 | #FAFBFD | 页面背景 |

---

### 4. Background

| Token | HEX |
|------|-----|
| bg-base | #FAFBFD |
| bg-card | #FFFFFF |
| bg-subtle | #F4F7FA |
| bg-hover | #F0F4F8 |

---

### 5. Border

| Token | HEX |
|------|-----|
| border-default | #E3E8EE |
| border-light | #EEF2F6 |
| border-focus | #3E739F |

---

### 6. Status

#### Success

| Token | HEX | 用途 |
|------|-----|------|
| success-700 | #0A6B52 | 深色文字 / icon |
| success | #0F8F6F | 常规 |
| success-100 | #E7F5F1 | 浅背景 |

#### Error

| Token | HEX | 用途 |
|------|-----|------|
| error-700 | #9B2C2C | 深色文字 / icon |
| error | #C24141 | 常规 |
| error-100 | #FBECEC | 浅背景 |

#### Warning

| Token | HEX | 用途 |
|------|-----|------|
| warning-700 | #9B5C1A | 深色文字 / icon |
| warning | #C27A2C | 常规 |
| warning-100 | #FFF6E9 | 浅背景 |

---

## 三、命名规范

### 文字颜色统一使用 Neutral

| Token | HEX | 用途 |
|------|-----|------|
| text-default | neutral-900 (#1E2A36) | 主文字 |
| text-muted | neutral-700 (#5F6B7A) | 次级文字 |
| text-hint | neutral-500 (#8B929E) | 占位 / 禁用 |
| text-inverse | #FFFFFF | 深色背景上的文字 |

> 避免使用 `text-primary` 以防与 `primary` 主色混淆

---

## 四、Dark Mode（待定义）

| Token | HEX | 备注 |
|------|-----|------|
| dark-bg-base | TBD | 页面背景 |
| dark-bg-card | TBD | 卡片背景 |
| dark-bg-subtle | TBD | 次级背景 |
| dark-text-default | TBD | 主文字 |
| dark-text-muted | TBD | 次级文字 |
| dark-border | TBD | 边框 |

---

## 五、CSS 变量声明

```css
:root {
  /* Primary */
  --primary-700: #1E4A6E;
  --primary-600: #2F5E8A;
  --primary-500: #3E739F;
  --primary-400: #5C8BB5;
  --primary-200: #C5D9E8;
  --primary-100: #E6EFF6;
  --primary-soft: #F3F7FA;

  /* Accent */
  --accent: #7C9A92;
  --accent-light: #E8F0EE;

  /* Neutral */
  --neutral-900: #1E2A36;
  --neutral-700: #5F6B7A;
  --neutral-500: #8B929E;
  --neutral-300: #D1D6DE;
  --neutral-200: #E3E8EE;
  --neutral-100: #F4F7FA;
  --neutral-50: #FAFBFD;

  /* Background */
  --bg-base: #FAFBFD;
  --bg-card: #FFFFFF;
  --bg-subtle: #F4F7FA;
  --bg-hover: #F0F4F8;

  /* Border */
  --border-default: #E3E8EE;
  --border-light: #EEF2F6;
  --border-focus: #3E739F;

  /* Text */
  --text-default: #1E2A36;
  --text-muted: #5F6B7A;
  --text-hint: #8B929E;
  --text-inverse: #FFFFFF;

  /* Success */
  --success-700: #0A6B52;
  --success: #0F8F6F;
  --success-100: #E7F5F1;

  /* Error */
  --error-700: #9B2C2C;
  --error: #C24141;
  --error-100: #FBECEC;

  /* Warning */
  --warning-700: #9B5C1A;
  --warning: #C27A2C;
  --warning-100: #FFF6E9;
}
```

---

## 六、使用场景示例

| 场景 | Token |
|------|-------|
| 主按钮背景 | primary-600 |
| 主按钮文字 | text-inverse |
| 主按钮 hover | primary-500 |
| 主按钮 pressed | primary-700 |
| 主按钮 disabled | primary-400 + opacity |
| 次按钮边框 | border-default |
| 次按钮文字 | text-default |
| 链接文字 | primary-500 |
| 输入框边框 | border-default |
| 输入框聚焦 | border-focus |
| 卡片背景 | bg-card |
| 页面背景 | bg-base |
| 成功提示 | success + success-100 |
| 错误提示 | error + error-100 |
| 警告提示 | warning + warning-100 |