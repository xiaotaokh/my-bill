# Data Model: 订阅类资产 (Subscription Asset)

**Date**: 2026-03-27
**Feature**: 订阅类资产支持

## 实体定义

### Asset (资产 - 扩展)

在现有资产模型基础上新增以下字段：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `assetType` | String | 否 | 'fixed' | 资产类型: 'fixed'(普通) / 'subscription'(订阅) |

### SubscriptionAsset 扩展字段

当 `assetType = 'subscription'` 时，使用以下扩展字段：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `periodAmount` | Number | 是 | - | 每期金额 |
| `periodType` | String | 是 | - | 周期类型: 'monthly' / 'yearly' / 'weekly' / 'custom' |
| `periodDays` | Number | 条件 | - | 周期天数 (periodType='custom' 时必填，否则自动计算) |
| `subscriptionStartDate` | String | 否 | purchaseDate | 订阅开始日期 (待订阅开关打开时使用) |
| `subscriptionEndDate` | String | 否 | - | 订阅结束日期 |
| `subscriptionStatus` | String | 否 | 'active' | 订阅状态: 'pending' / 'active' / 'ended' |
| `amountHistory` | Array | 否 | [] | 金额变更历史 |
| `pendingSubscription` | Boolean | 否 | false | 待订阅开关 |

### 周期天数映射

| periodType | periodDays |
|------------|------------|
| 'monthly' | 30 |
| 'yearly' | 365 |
| 'weekly' | 7 |
| 'custom' | 用户输入 (1-365) |

### 金额变更历史格式

```javascript
amountHistory: [
  {
    amount: Number,        // 金额
    effectiveDate: String  // 生效日期 YYYY-MM-DD
  }
]
```

## 状态转换

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
┌─────────┐    打开待订阅开关    ┌─────────┐              │
│  新建   │ ──────────────────► │ pending │              │
└─────────┘                     └────┬────┘              │
     │                               │                   │
     │ 关闭待订阅开关                 │ 开始日期到达      │
     ▼                               ▼                   │
┌─────────┐                     ┌─────────┐             │
│ active  │ ◄───────────────────│ active  │             │
└────┬────┘                     └─────────┘             │
     │                                                   │
     │ 手动结束 / 到期                                    │
     ▼                                                   │
┌─────────┐                                             │
│  ended  │ ────────────────────────────────────────────┘
└─────────┘              重新激活 (编辑)
```

## 计算逻辑

### 日均成本

```javascript
function calculateDailyCost(asset) {
  if (asset.assetType !== 'subscription') {
    // 普通资产：总价 / 使用天数
    return asset.price / usedDays;
  }
  // 订阅资产：每期金额 / 周期天数（固定值）
  const periodDays = asset.periodDays || getPeriodDays(asset.periodType);
  return asset.periodAmount / periodDays;
}
```

### 总投入（订阅资产）

```javascript
function calculateTotalInvested(asset) {
  if (asset.assetType !== 'subscription') {
    return asset.price; // 普通资产返回原价
  }

  const startDate = parseDate(asset.subscriptionStartDate || asset.purchaseDate);
  const endDate = asset.subscriptionStatus === 'ended'
    ? parseDate(asset.subscriptionEndDate)
    : new Date();

  const periodDays = asset.periodDays || getPeriodDays(asset.periodType);

  // 分段计算（支持金额变更）
  let total = 0;
  const history = asset.amountHistory || [{ amount: asset.periodAmount, effectiveDate: startDate }];

  for (let i = 0; i < history.length; i++) {
    const current = history[i];
    const next = history[i + 1];
    const periodStart = parseDate(current.effectiveDate);
    const periodEnd = next ? parseDate(next.effectiveDate) : endDate;

    const daysInPeriod = Math.floor((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
    const completedPeriods = Math.floor(daysInPeriod / periodDays);
    total += current.amount * completedPeriods;
  }

  return total;
}
```

### 已过周期数

```javascript
function getCompletedPeriods(startDate, endDate, periodDays) {
  const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
  return Math.floor(days / periodDays);
}
```

## 数据迁移

**无需迁移**：新增字段都有默认值，现有数据自动识别为普通资产。

```javascript
// 查询时兼容旧数据
const assets = await db.collection('assets').get();
assets.forEach(asset => {
  // 旧数据默认为普通资产
  if (!asset.assetType) {
    asset.assetType = 'fixed';
  }
});
```

## 索引建议

无需新增索引，现有 `_openid` 索引足够支持查询。

## 权限规则

复用现有数据库权限规则：仅创建者可读写。