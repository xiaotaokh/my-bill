# Implementation Plan: 时间段资产统计图

**Branch**: `001-asset-time-chart` | **Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-asset-time-chart/spec.md`

## Summary

在统计页面添加时间段资产统计图模块，用户可选择预设时间段（本周/本月/本季度/本年/全部）查看该时间段内购买的资产总金额和数量。采用柱状图可视化展示，支持Y轴双刻度（左侧金额、右侧数量）。模块位于现有折线图之后，独立运作不影响其他图表。

## Technical Context

**Language/Version**: JavaScript ES6+ (微信小程序原生)
**Primary Dependencies**: echarts (现有 ec-canvas 组件), 微信云开发 SDK
**Storage**: 云开发数据库 (MongoDB 兼容)
**Testing**: 微信开发者工具模拟器 + 真机测试
**Target Platform**: 微信小程序
**Project Type**: mobile-app
**Performance Goals**: 时间段切换 < 1秒，图表渲染 < 500ms
**Constraints**: 主包体积 < 1.5MB，云函数响应 < 500ms (p95)
**Scale/Scope**: 单用户资产统计，预计资产数 < 1000

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. 简洁优先 | ✅ PASS | 复用现有 echarts 组件，无需引入新库；功能单一明确 |
| II. 用户体验至上 | ✅ PASS | 默认"本月"时间段减少选择成本；切换响应 < 1秒；空状态友好提示 |
| III. 数据安全 | ✅ PASS | 使用现有数据查询逻辑，用户数据隔离已由云开发保障 |
| IV. 可维护性 | ✅ PASS | 新增功能独立模块化，不修改现有图表逻辑 |
| V. 云原生架构 | ✅ PASS | 前端计算统计数据，无需新增云函数 |

**Gate Result**: ✅ PASS - 所有原则检查通过

## Project Structure

### Documentation (this feature)

```text
specs/001-asset-time-chart/
├── spec.md              # 功能规格说明
├── plan.md              # 本文件 (/speckit.plan 输出)
├── research.md          # Phase 0 输出
├── data-model.md        # Phase 1 输出
├── quickstart.md        # Phase 1 输出
└── tasks.md             # Phase 2 输出 (/speckit.tasks 命令)
```

### Source Code (repository root)

```text
pages/index/
├── index.js             # 添加时间段统计逻辑
├── index.wxml           # 添加时间段统计模块 UI
└── index.wxss           # 添加时间段统计模块样式

components/ec-canvas/    # 现有 echarts 组件 (复用)
```

**Structure Decision**: 在现有 `pages/index/` 页面基础上扩展，复用 ec-canvas 组件渲染柱状图。无需新建页面或组件。

## Complexity Tracking

> 无 Constitution 违规，无需记录复杂度辩护。