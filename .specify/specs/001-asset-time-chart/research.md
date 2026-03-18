# Research: 时间段资产统计图

**Feature**: 001-asset-time-chart
**Date**: 2026-03-18

## 概述

本文档记录时间段资产统计图功能的实现研究和决策。

## 决策记录

### 1. 图表组件选择

**Decision**: 复用现有 ec-canvas (echarts) 组件

**Rationale**:
- 项目已集成 echarts 组件用于环形图和折线图
- echarts 原生支持柱状图和双Y轴
- 无需引入新依赖，保持主包体积

**Alternatives Considered**:
- wx-charts: 轻量但功能有限，不支持双Y轴
- 自定义 canvas: 开发成本高，维护困难

### 2. 数据计算方式

**Decision**: 前端计算统计数据，复用现有资产数据

**Rationale**:
- 统计页面已加载所有资产数据 (`reportAssets`)
- 时间段筛选为纯前端计算，无需网络请求
- 符合"简洁优先"原则，避免新增云函数

**Alternatives Considered**:
- 新增云函数: 增加部署复杂度，响应时间更长
- 分页查询: 数据量小（<1000）无必要

### 3. 时间段计算逻辑

**Decision**: 使用 JavaScript Date 对象本地计算

**Rationale**:
- 时间段定义明确（本周/本月/本季度/本年）
- 小程序端时间与用户感知一致
- 简单可靠，无网络依赖

**实现细节**:
```javascript
// 本周 (周一至周日)
const today = new Date();
const dayOfWeek = today.getDay() || 7; // 周日为0，转为7
const weekStart = new Date(today);
weekStart.setDate(today.getDate() - dayOfWeek + 1);
weekStart.setHours(0, 0, 0, 0);

// 本月
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

// 本季度
const quarter = Math.floor(today.getMonth() / 3);
const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);

// 本年
const yearStart = new Date(today.getFullYear(), 0, 1);
```

### 4. 柱状图配置

**Decision**: echarts bar 类型 + 双Y轴配置

**Rationale**:
- 满足"单柱展示金额 + Y轴双刻度"需求
- echarts 原生支持，配置简单

**配置要点**:
- `xAxis.type: 'category'` - 时间段分类
- `yAxis[0]` - 左侧金额轴
- `yAxis[1]` - 右侧数量轴
- `series[0].type: 'bar'` - 柱状图
- `series[0].yAxisIndex: 0` - 绑定金额轴
- 柱子上方 label 显示数量

### 5. "全部"时间段的分组粒度

**Decision**: 支持年/月/季度三种粒度，默认按年

**Rationale**:
- 用户需求明确支持三种时间线统计
- 默认按年适合多年数据概览
- 切换粒度为前端操作，即时响应

**实现方式**:
- 当 `timePeriod === 'all'` 时显示粒度切换按钮
- 根据粒度对资产数据进行分组聚合
- 重新计算每组的时间范围标签

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 资产数量过多导致渲染慢 | 中 | 数据量预计 <1000，echarts 可处理 |
| 用户设备时间异常 | 低 | Edge case 已定义，以服务器时间为准 |
| 双Y轴刻度难以阅读 | 低 | tooltip 显示完整数据 |

## 结论

所有技术决策已确定，无需额外澄清。可进入 Phase 1 设计阶段。