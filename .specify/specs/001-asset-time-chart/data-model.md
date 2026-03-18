# Data Model: 时间段资产统计图

**Feature**: 001-asset-time-chart
**Date**: 2026-03-18

## 概述

本功能不新增数据实体，复用现有 `assets` 集合数据。以下定义前端数据结构和计算逻辑。

## 现有数据实体

### assets 集合 (已有)

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 资产ID |
| _openid | string | 用户标识 |
| name | string | 资产名称 |
| price | number | 购买价格 |
| purchaseDate | string | 购买日期 (YYYY-MM-DD) |
| category | string | 分类名称 |
| status | string | 状态: active/retired/sold |

## 前端数据结构

### 时间段选项 (timePeriodOptions)

```javascript
const timePeriodOptions = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
  { key: 'all', label: '全部' }
];
```

### 时间线粒度选项 (timelineGranularities)

```javascript
const timelineGranularities = [
  { key: 'year', label: '按年' },
  { key: 'quarter', label: '按季度' },
  { key: 'month', label: '按月' }
];
```

### 统计结果 (timePeriodStats)

```javascript
{
  period: 'month',           // 当前时间段
  granularity: 'year',       // 时间线粒度 (仅 all 时有效)
  data: [
    {
      label: '2024',         // 时间标签
      totalAmount: 15000,    // 总金额
      count: 5               // 资产数量
    },
    {
      label: '2025',
      totalAmount: 28000,
      count: 12
    }
  ],
  summary: {
    totalAmount: 43000,      // 总金额
    totalCount: 17           // 总数量
  }
}
```

## 计算逻辑

### 时间范围计算

| 时间段 | 起始时间 | 结束时间 |
|--------|----------|----------|
| 本周 | 本周一 00:00:00 | 今日 23:59:59 |
| 本月 | 当月1日 00:00:00 | 今日 23:59:59 |
| 本季度 | 季度首月1日 00:00:00 | 今日 23:59:59 |
| 本年 | 1月1日 00:00:00 | 今日 23:59:59 |
| 全部 | 最早资产购买日期 | 今日 23:59:59 |

### 数据分组规则

**非"全部"时间段**:
- 单组数据，label 为时间段名称

**"全部"时间段**:
- 按年分组: label 为年份 (2024, 2025, ...)
- 按季度分组: label 为季度 (2024Q1, 2024Q2, ...)
- 按月分组: label 为月份 (2024-01, 2024-02, ...)

### 筛选条件

```javascript
// 筛选时间段内的资产
const filterAssetsByPeriod = (assets, startDate, endDate) => {
  return assets.filter(asset => {
    if (!asset.purchaseDate) return false;
    const purchaseDate = new Date(asset.purchaseDate);
    return purchaseDate >= startDate && purchaseDate <= endDate;
  });
};
```

## 状态管理

### Page Data 新增字段

```javascript
{
  // 时间段统计
  activeTimePeriod: 'month',        // 当前选中时间段
  activeGranularity: 'year',        // 当前时间线粒度
  timePeriodStats: null,            // 统计数据
  timePeriodEc: { lazyLoad: true }, // 图表配置
  timeChart: null                   // 图表实例
}
```