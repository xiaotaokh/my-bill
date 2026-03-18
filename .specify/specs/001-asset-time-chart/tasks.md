# Tasks: 时间段资产统计图

**Input**: Design documents from `/.specify/specs/001-asset-time-chart/`
**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md

**Tests**: 未请求测试任务，跳过测试阶段。

**Organization**: 任务按用户故事组织，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 任务所属用户故事 (US1, US2, US3)
- 包含精确文件路径

## Path Conventions

微信小程序项目结构：
- `pages/index/index.js` - 页面逻辑
- `pages/index/index.wxml` - 页面模板
- `pages/index/index.wxss` - 页面样式
- `components/ec-canvas/` - echarts 组件（复用）

---

## Phase 1: 数据层准备

**Purpose**: 在页面 data 对象中添加时间段统计所需的数据字段

- [X] T001 在 pages/index/index.js 的 data 对象中添加时间段统计字段：activeTimePeriod、activeGranularity、timePeriodStats、timePeriodEc

---

## Phase 2: 核心计算逻辑 (Foundational)

**Purpose**: 实现时间段筛选和数据统计的核心函数

**⚠️ CRITICAL**: 所有 UI 和图表功能依赖此阶段完成

- [X] T002 在 pages/index/index.js 中实现 getTimeRange(period) 函数，返回指定时间段的起始和结束日期
- [X] T003 在 pages/index/index.js 中实现 groupAssetsByGranularity(assets, granularity) 函数，按粒度分组统计资产
- [X] T004 在 pages/index/index.js 中实现 calculateTimePeriodStats() 函数，整合时间范围计算和分组统计

**Checkpoint**: 核心计算函数就绪，可开始 UI 和图表实现

---

## Phase 3: User Story 1 - 查看时间段资产统计 (Priority: P1) 🎯 MVP

**Goal**: 用户在统计页面选择时间段，查看该时间段内购买的资产总金额和数量

**Independent Test**: 切换时间段选择器，验证统计图数据正确更新

### Implementation for User Story 1

- [X] T005 [US1] 在 pages/index/index.wxml 中添加时间段资产统计模块，位于折线图之后，包含时间段选择器、统计概览和图表容器
- [X] T006 [US1] 在 pages/index/index.wxss 中添加时间段选择器样式（.time-period-selector、.period-pill）
- [X] T007 [US1] 在 pages/index/index.wxss 中添加统计概览样式（.time-stats-summary、.summary-item）
- [X] T008 [US1] 在 pages/index/index.js 中实现 selectTimePeriod(e) 事件处理函数
- [X] T009 [US1] 在 pages/index/index.js 中实现 initTimeChart() 函数，初始化柱状图（echarts bar 类型，双Y轴）
- [X] T010 [US1] 在 pages/index/index.js 的 loadReportData 成功回调中调用 calculateTimePeriodStats() 初始化统计
- [X] T011 [US1] 在 pages/index/index.wxml 中添加空状态提示，当 timePeriodStats 为空时显示

**Checkpoint**: User Story 1 完成，可独立测试核心功能

---

## Phase 4: User Story 2 - 时间段快速切换 (Priority: P2)

**Goal**: 用户可快速切换预设时间段，切换响应 < 1秒，选中状态明确

**Independent Test**: 点击各时间段选项，验证切换流畅且高亮正确

### Implementation for User Story 2

- [X] T012 [US2] 在 pages/index/index.wxml 的时间段选择器中为每个选项添加动态 class 绑定 activeTimePeriod
- [X] T013 [US2] 在 pages/index/index.wxss 中添加 .period-pill.active 选中状态样式（渐变背景、白色文字）
- [X] T014 [US2] 在 pages/index/index.js 中优化 calculateTimePeriodStats，确保切换响应时间 < 1秒

**Checkpoint**: User Story 2 完成，切换交互流畅

---

## Phase 5: User Story 3 - "全部"时间线粒度切换 (Priority: P3)

**Goal**: 选择"全部"时间段时，用户可切换时间线粒度（按年/按月/按季度）

**Independent Test**: 选择"全部"后切换粒度，验证图表分组数据正确

### Implementation for User Story 3

- [X] T015 [US3] 在 pages/index/index.wxml 中添加粒度选择器，仅当 activeTimePeriod === 'all' 时显示
- [X] T016 [US3] 在 pages/index/index.wxss 中添加粒度选择器样式（.granularity-selector、.granularity-pill）
- [X] T017 [US3] 在 pages/index/index.js 中实现 selectGranularity(e) 事件处理函数
- [X] T018 [US3] 在 pages/index/index.js 的 groupAssetsByGranularity 函数中实现按年/按月/按季度三种分组逻辑

**Checkpoint**: User Story 3 完成，全部功能就绪

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 优化和收尾工作

- [X] T019 调整图表 tooltip 样式，确保金额和数量信息清晰显示
- [X] T020 测试边界情况：无资产数据、购买日期缺失、跨年数据
- [X] T021 验证时间段切换不影响环形图和折线图数据（FR-010）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (数据层)**: 无依赖，可立即开始
- **Phase 2 (核心逻辑)**: 依赖 Phase 1 - 阻塞所有用户故事
- **Phase 3-5 (用户故事)**: 依赖 Phase 2 完成
- **Phase 6 (收尾)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 依赖 Phase 2 完成，无其他故事依赖
- **User Story 2 (P2)**: 依赖 US1 的 UI 结构，增强交互
- **User Story 3 (P3)**: 依赖 US1 的基础功能，扩展"全部"时间段

### Parallel Opportunities

- Phase 1 和 Phase 2 必须顺序执行
- US1 完成后，US2 和 US3 可并行开发
- T006 和 T007（样式任务）可并行执行

---

## Parallel Example: User Story 1

```bash
# 样式任务可并行：
Task: "添加时间段选择器样式 in pages/index/index.wxss"
Task: "添加统计概览样式 in pages/index/index.wxss"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: 数据层准备
2. Complete Phase 2: 核心计算逻辑
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: 测试核心功能
5. 可发布 MVP 版本

### Incremental Delivery

1. US1 → 核心功能可用 (MVP)
2. US2 → 交互体验优化
3. US3 → 高级功能完善
4. Polish → 最终优化

---

## Notes

- 所有任务基于现有 `pages/index/` 页面扩展
- 复用现有 `ec-canvas` 组件，无需新增依赖
- 图表配置参考现有 `initPieChart` 和 `initLineChart` 实现
- 时间段定义遵循 spec.md Assumptions 章节