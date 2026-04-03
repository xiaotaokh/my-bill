# Quickstart: 订阅类资产 (Subscription Asset)

## 概述

本功能新增订阅类资产支持，用户可以记录月度/年度/周/自定义周期的订阅资产（如音乐会员），系统自动计算固定日均成本和动态累计总投入。

## 开发步骤

### 1. 修改云函数

#### addAsset/index.js

```javascript
// 新增订阅资产字段支持
const {
  // 现有字段...
  name, price, purchaseDate, category, icon, iconName, groupName, remark,
  status, retiredDate, soldDate, excludeTotal, excludeDaily,
  // 新增订阅字段
  assetType = 'fixed',
  periodAmount,
  periodType,
  periodDays,
  subscriptionStartDate,
  subscriptionEndDate,
  subscriptionStatus = 'active',
  amountHistory = [],
  pendingSubscription = false
} = event;

// 数据验证
if (assetType === 'subscription') {
  if (!periodAmount || periodAmount <= 0) {
    return { success: false, error: '每期金额必须大于0' };
  }
  if (!periodType) {
    return { success: false, error: '请选择周期类型' };
  }
  if (periodType === 'custom' && (!periodDays || periodDays < 1 || periodDays > 365)) {
    return { success: false, error: '周期天数必须在1-365之间' };
  }
}

// 存储数据
await db.collection('assets').add({
  data: {
    // 现有字段...
    // 订阅字段
    assetType,
    periodAmount: assetType === 'subscription' ? parseFloat(periodAmount) : undefined,
    periodType: assetType === 'subscription' ? periodType : undefined,
    periodDays: assetType === 'subscription' ? getPeriodDays(periodType, periodDays) : undefined,
    subscriptionStartDate,
    subscriptionEndDate,
    subscriptionStatus: pendingSubscription ? 'pending' : 'active',
    amountHistory,
    pendingSubscription,
    // ...
  }
});
```

#### updateAsset/index.js

```javascript
// 处理金额变更
if (assetType === 'subscription' && periodAmount !== existingAsset.periodAmount) {
  // 记录变更历史
  const amountHistory = existingAsset.amountHistory || [];
  amountHistory.push({
    amount: existingAsset.periodAmount,
    effectiveDate: existingAsset.purchaseDate
  });

  // 更新当前金额
  updates.periodAmount = parseFloat(periodAmount);
  updates.amountHistory = amountHistory;
}
```

### 2. 修改前端页面

#### pages/asset-add/asset-add.js

```javascript
data: {
  // 新增资产类型选择
  assetType: 'fixed',  // 'fixed' | 'subscription'

  // 订阅资产字段
  periodAmount: '',
  periodType: 'monthly',
  periodDays: '',
  subscriptionEndDate: '',
  pendingSubscription: false,
  subscriptionStartDate: '',
}

// 资产类型切换
onAssetTypeChange(e) {
  this.setData({
    assetType: e.detail.value,
    // 切换类型时清空订阅字段
    periodAmount: '',
    periodType: 'monthly',
    pendingSubscription: false
  });
}

// 周期类型变更
onPeriodTypeChange(e) {
  const periodType = e.detail.value;
  this.setData({
    periodType,
    periodDays: ''  // 清空自定义天数
  });
}
```

#### pages/asset-add/asset-add.wxml

```xml
<!-- 资产类型选择 -->
<view class="form-group">
  <view class="form-header">
    <text class="form-title">资产类型</text>
  </view>
  <view class="asset-type-selector">
    <view class="type-option {{assetType === 'fixed' ? 'selected' : ''}}"
          bindtap="onAssetTypeChange" data-type="fixed">
      <text class="type-icon">📦</text>
      <text class="type-label">普通资产</text>
    </view>
    <view class="type-option {{assetType === 'subscription' ? 'selected' : ''}}"
          bindtap="onAssetTypeChange" data-type="subscription">
      <text class="type-icon">🔄</text>
      <text class="type-label">订阅资产</text>
    </view>
  </view>
</view>

<!-- 订阅资产专属字段 -->
<view class="form-group" wx:if="{{assetType === 'subscription'}}">
  <view class="form-header">
    <text class="form-title">订阅设置</text>
  </view>
  <view class="form-item">
    <view class="item-label"><text class="required">*</text>每期金额</view>
    <input class="item-input" type="digit" placeholder="请输入每期金额"
           value="{{periodAmount}}" bindinput="onPeriodAmountInput"/>
  </view>
  <view class="form-item">
    <view class="item-label"><text class="required">*</text>周期类型</view>
    <picker mode="selector" range="{{['月度', '年度', '周', '自定义']}}"
            value="{{['monthly', 'yearly', 'weekly', 'custom'].indexOf(periodType)}}"
            bindchange="onPeriodTypeChange">
      <view class="picker-content">
        <text>{{periodType === 'monthly' ? '月度' : periodType === 'yearly' ? '年度' : periodType === 'weekly' ? '周' : '自定义'}}</text>
      </view>
    </picker>
  </view>
  <view class="form-item" wx:if="{{periodType === 'custom'}}">
    <view class="item-label"><text class="required">*</text>周期天数</view>
    <input class="item-input" type="number" placeholder="请输入周期天数(1-365)"
           value="{{periodDays}}" bindinput="onPeriodDaysInput"/>
  </view>
</view>
```

#### pages/index/index.js

```javascript
// 计算日均成本（区分资产类型）
calculateAssetFields(asset) {
  let dailyCost = '0.00';

  if (asset.assetType === 'subscription') {
    // 订阅资产：固定日均
    const periodDays = asset.periodDays || this.getPeriodDays(asset.periodType);
    dailyCost = (asset.periodAmount / periodDays).toFixed(2);
  } else {
    // 普通资产：动态日均
    dailyCost = (asset.price / usedDays).toFixed(2);
  }

  return { ...asset, dailyCost };
}

// 获取周期天数
getPeriodDays(periodType) {
  const mapping = { monthly: 30, yearly: 365, weekly: 7 };
  return mapping[periodType] || 30;
}
```

### 3. 列表展示标签

```xml
<!-- 订阅标签 -->
<view class="asset-tag subscription" wx:if="{{item.assetType === 'subscription'}}">
  <text>订阅</text>
</view>

<!-- 待生效标签 -->
<view class="asset-tag pending" wx:if="{{item.subscriptionStatus === 'pending'}}">
  <text>待生效</text>
</view>
```

## 测试清单

- [ ] 新增普通资产（验证兼容性）
- [ ] 新增月度订阅资产
- [ ] 新增年度订阅资产
- [ ] 新增自定义周期订阅资产
- [ ] 待订阅开关功能
- [ ] 编辑订阅资产金额
- [ ] 结束订阅
- [ ] 列表显示订阅/待生效标签
- [ ] 首页统计包含订阅资产

## 注意事项

1. **向后兼容**: 所有新字段都有默认值，旧数据自动识别为普通资产
2. **权限控制**: 复用现有云函数权限验证
3. **计算时机**: 日均和总投入在前端实时计算，不存储到数据库