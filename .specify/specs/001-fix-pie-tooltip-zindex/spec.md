# Feature Specification: 环形图 Tooltip 层级修复

**Feature Branch**: `001-fix-pie-tooltip-zindex`
**Created**: 2026-03-18
**Status**: Completed
**Input**: User description: "报表页面环形图tooltip提示层级没有中间的总资产dom层级高，被总资产遮罩了"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 查看 Tooltip 提示信息 (Priority: P1)

用户在报表页面悬停环形图分类区域时，能够完整查看 tooltip 提示信息，包括分类名称、金额、百分比和资产列表，不被中间的"总资产"文字遮挡。

**Why this priority**: 这是核心功能修复，直接影响用户查看资产分布详情的体验。

**Independent Test**: 打开报表页面，悬停在环形图任意分类区域，确认 tooltip 完整显示在总资产文字上方。

**Acceptance Scenarios**:

1. **Given** 用户进入报表页面, **When** 用户悬停在环形图的分类区域, **Then** tooltip 完整显示，不被中间文字遮挡
2. **Given** tooltip 正在显示, **When** 用户点击分类扇区, **Then** 中间文字更新为该分类金额，tooltip 仍能正常显示

---

### Edge Cases

- 当分类数据为空时，不显示 tooltip
- 当只有一个分类时，tooltip 仍能正常显示

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 环形图 tooltip 必须显示在所有图形元素的上层
- **FR-002**: tooltip 内容必须包含分类名称、金额、百分比和资产列表
- **FR-003**: 中间的"总资产"文字层级必须低于 tooltip
- **FR-004**: 点击分类扇区时，中间文字需更新为对应分类信息

### Key Entities

- **ECharts graphic 元素**: 用于在环形图中心显示总资产文字，通过 z 属性控制层级
- **ECharts tooltip**: 悬停提示框，显示分类详情

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户悬停环形图时，tooltip 100% 完整显示，无遮挡
- **SC-002**: 修复后不影响环形图的其他交互功能（点击、图例切换等）

## Technical Implementation

### 修改文件
- `pages/index/index.js`

### 修改内容
1. `initPieChart()` 方法：将 graphic 元素的 `z` 值从 `0` 改为 `-1`
2. `updatePieCenterText()` 方法：将 graphic group 的 `z` 设置为 `-1`，移除 children 中不必要的 `z: 100`

### 技术原理
ECharts 中 `z` 属性控制元素渲染层级，数值越大层级越高。将 graphic 的 z 设为 `-1`，确保 tooltip 能正常显示在最上层。

## Change Log

| Date | Status | Notes |
|------|--------|-------|
| 2026-03-18 | Completed | 修复完成，tooltip 层级问题已解决 |