# Implementation Plan: 订阅类资产 (Subscription Asset)

**Branch**: `001-subscription-asset` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-subscription-asset/spec.md`

## Summary

新增订阅类资产功能，支持月度/年度/周/自定义周期订阅，实现动态累计总投入和固定日均成本计算。通过在现有资产模型上扩展字段，不破坏现有功能。

## Technical Context

**Language/Version**: JavaScript ES6+
**Primary Dependencies**: 微信小程序原生框架, 微信云开发 SDK
**Storage**: 云开发数据库 (MongoDB 兼容)
**Testing**: 云开发控制台测试 + 真机测试
**Target Platform**: 微信小程序
**Project Type**: mobile-app
**Performance Goals**: 页面加载 < 1秒, 云函数响应 < 500ms
**Constraints**: 主包体积 < 1.5MB, 不修改现有逻辑
**Scale/Scope**: 个人记账应用，单用户数据隔离

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. 简洁优先 | ✅ Pass | 扩展现有字段，不引入新库 |
| II. 用户体验至上 | ✅ Pass | 3步完成新增，即时反馈 |
| III. 数据安全 | ✅ Pass | 复用现有云函数权限机制 |
| IV. 可维护性 | ✅ Pass | 职责单一，代码复用 |
| V. 云原生架构 | ✅ Pass | 使用云函数和云数据库 |
| VI. 交互一致性 | ✅ Pass | 复用现有 UI 组件和样式 |

## Project Structure

### Documentation (this feature)

```text
specs/001-subscription-asset/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
pages/
├── asset-add/           # 修改：新增资产类型选择和订阅字段
│   ├── asset-add.js
│   ├── asset-add.wxml
│   └── asset-add.wxss
├── asset-detail/        # 修改：显示订阅资产详情
│   ├── asset-detail.js
│   ├── asset-detail.wxml
│   └── asset-detail.wxss
└── index/               # 修改：列表展示订阅标签和统计
    ├── index.js
    ├── index.wxml
    └── index.wxss

cloudfunctions/
├── addAsset/            # 修改：支持订阅资产字段
│   └── index.js
└── updateAsset/         # 修改：支持订阅资产更新
    └── index.js
```

**Structure Decision**: 在现有页面和云函数基础上扩展，不新增独立模块。

## Complexity Tracking

> No violations detected. All changes extend existing patterns.