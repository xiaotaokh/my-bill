# Research: 订阅类资产 (Subscription Asset)

**Date**: 2026-03-27
**Feature**: 订阅类资产支持

## 现有代码分析

### 资产数据模型 (assets 集合)

```javascript
{
  _id: String,
  _openid: String,
  name: String,           // 资产名称
  price: Number,          // 价格
  purchaseDate: String,   // 购买日期 YYYY-MM-DD
  category: String,       // 分类名称
  icon: String,           // 图标 (emoji 或云存储路径)
  iconName: String,       // 图标名称
  groupName: String,      // 图标分组名称
  remark: String,         // 备注
  status: String,         // 状态: active | retired | sold
  retiredDate: String,    // 退役日期
  soldDate: String,       // 卖出日期
  excludeTotal: Boolean,  // 不计入总资产
  excludeDaily: Boolean,  // 不计入总日均
  createdAt: Date,
  updatedAt: Date
}
```

### 日均成本计算逻辑

**当前实现** (`index.js:369-375`):
```javascript
// 日均 = 总价 / 使用天数
if (asset.status === 'active' && asset.price && usedDays >= 1) {
  dailyCost = (asset.price / usedDays).toFixed(2);
}
```

**问题**: 对于订阅类资产，随着时间推移使用天数增加，日均会递减，不符合需求。

### 云函数结构

| 云函数 | 用途 | 需要修改 |
|--------|------|----------|
| `addAsset` | 新增资产 | ✅ 支持订阅字段 |
| `updateAsset` | 更新资产 | ✅ 支持订阅字段 |
| `getCategories` | 获取分类 | ❌ 无需修改 |
| `batchDeleteAssets` | 批量删除 | ❌ 无需修改 |

## 设计决策

### 1. 资产类型区分

**Decision**: 使用 `assetType` 字段区分资产类型

**Rationale**:
- 简单直接，向后兼容（默认值为 'fixed'）
- 不需要新建集合
- 查询时可通过条件筛选

**Alternatives considered**:
- 新建 subscription_assets 集合 → 增加复杂度，统计需跨集合
- 使用 status 字段区分 → 语义不清晰

### 2. 日均成本计算

**Decision**: 订阅资产日均 = `periodAmount / periodDays`（固定值）

**Rationale**:
- 符合用户直觉：月会员 88 元，日均约 2.93 元
- 与普通资产的动态日均区分开来
- 统计时直接相加，逻辑清晰

**Alternatives considered**:
- 累计总投入 / 使用天数 → 不符合"固定日均"需求

### 3. 总投入累计

**Decision**: 动态计算 `periodAmount × 已过周期数`

**Rationale**:
- 不需要存储累计值，避免数据不一致
- 每次查询时实时计算，数据准确
- 支持金额变更历史的分段计算

**Implementation**:
```javascript
// 计算已过周期数
const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
const completedPeriods = Math.floor(daysSinceStart / periodDays);
const totalInvested = periodAmount × completedPeriods;
```

### 4. 金额变更历史

**Decision**: 使用 `amountHistory` 数组存储变更记录

**Rationale**:
- 支持分段计算总投入
- 保留历史数据，可追溯
- 结构简单，易于维护

**Format**:
```javascript
amountHistory: [
  { amount: 88, effectiveDate: '2026-01-01' },
  { amount: 98, effectiveDate: '2026-04-01' }
]
```

### 5. 订阅状态管理

**Decision**: 使用 `subscriptionStatus` 字段独立管理

**Rationale**:
- 与普通资产的 `status` (active/retired/sold) 分离
- 语义更清晰：pending/active/ended
- 不影响现有资产的状态逻辑

## UI/UX 设计

### 新增资产页面改造

1. **顶部添加资产类型选择**
   - 普通资产（默认选中）
   - 订阅资产

2. **订阅资产专属字段**
   - 每期金额（必填）
   - 周期类型（下拉选择：月度/年度/周/自定义）
   - 周期天数（自定义时显示）
   - 结束日期（可选）

3. **待订阅开关**
   - 关闭：立即生效，状态为"服役中"
   - 打开：显示开始日期选择器，状态为"待生效"

### 列表展示

1. **订阅标签**: 在资产名称旁显示"订阅"标签
2. **待生效标签**: 未来开始的订阅显示"待生效"标签
3. **日均显示**: 订阅资产显示固定日均，普通资产显示动态日均

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 旧数据兼容 | 低 | assetType 默认为 'fixed'，旧数据自动识别为普通资产 |
| 计算性能 | 低 | 订阅资产计算简单，实时计算无性能问题 |
| UI 复杂度 | 中 | 复用现有组件，保持一致性 |