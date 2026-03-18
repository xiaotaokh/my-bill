# Quickstart: 时间段资产统计图

**Feature**: 001-asset-time-chart
**Date**: 2026-03-18

## 快速开始

### 前置条件

- 微信开发者工具已安装
- 项目已配置云开发环境
- 已有资产数据可测试

### 实现步骤

#### 1. 添加数据字段 (index.js)

在 `data` 对象中添加:

```javascript
// 时间段统计
activeTimePeriod: 'month',
activeGranularity: 'year',
timePeriodStats: null,
timePeriodEc: { lazyLoad: true },
```

#### 2. 添加时间段选择器 UI (index.wxml)

在现有折线图 section 之后添加:

```xml
<!-- 时间段资产统计 -->
<view class="report-chart-section">
  <view class="section-header">
    <text class="section-title">时间段统计</text>
    <text class="section-icon">📊</text>
  </view>

  <!-- 时间段选择器 -->
  <view class="time-period-selector">
    <view
      wx:for="{{['week', 'month', 'quarter', 'year', 'all']}}"
      wx:key="*this"
      class="period-pill {{activeTimePeriod === item ? 'active' : ''}}"
      bindtap="selectTimePeriod"
      data-period="{{item}}"
    >
      {{item === 'week' ? '本周' : item === 'month' ? '本月' : item === 'quarter' ? '本季度' : item === 'year' ? '本年' : '全部'}}
    </view>
  </view>

  <!-- 时间线粒度选择器 (仅"全部"时显示) -->
  <view wx:if="{{activeTimePeriod === 'all'}}" class="granularity-selector">
    <text class="granularity-label">时间线:</text>
    <view
      wx:for="{{['year', 'quarter', 'month']}}"
      wx:key="*this"
      class="granularity-pill {{activeGranularity === item ? 'active' : ''}}"
      bindtap="selectGranularity"
      data-granularity="{{item}}"
    >
      {{item === 'year' ? '按年' : item === 'quarter' ? '按季度' : '按月'}}
    </view>
  </view>

  <!-- 统计概览 -->
  <view class="time-stats-summary">
    <view class="summary-item">
      <text class="summary-label">总金额</text>
      <text class="summary-value">¥{{timePeriodStats.summary.totalAmount}}</text>
    </view>
    <view class="summary-item">
      <text class="summary-label">资产数</text>
      <text class="summary-value">{{timePeriodStats.summary.totalCount}}件</text>
    </view>
  </view>

  <!-- 柱状图 -->
  <view class="chart-wrapper" style="height: 400rpx;">
    <ec-canvas id="time-chart" canvas-id="time-chart" ec="{{ timePeriodEc }}"></ec-canvas>
  </view>
</view>
```

#### 3. 添加事件处理函数 (index.js)

```javascript
// 选择时间段
selectTimePeriod(e) {
  const period = e.currentTarget.dataset.period;
  this.setData({ activeTimePeriod: period });
  this.calculateTimePeriodStats();
},

// 选择时间线粒度
selectGranularity(e) {
  const granularity = e.currentTarget.dataset.granularity;
  this.setData({ activeGranularity: granularity });
  this.calculateTimePeriodStats();
},

// 计算时间段统计数据
calculateTimePeriodStats() {
  const { reportAssets, activeTimePeriod, activeGranularity } = this.data;
  if (!reportAssets || reportAssets.length === 0) return;

  // 计算时间范围
  const { startDate, endDate } = this.getTimeRange(activeTimePeriod);

  // 筛选资产
  const filteredAssets = reportAssets.filter(a => {
    if (!a.purchaseDate) return false;
    const pd = new Date(a.purchaseDate);
    return pd >= startDate && pd <= endDate;
  });

  // 分组统计
  const stats = this.groupAssetsByGranularity(filteredAssets, activeTimePeriod === 'all' ? activeGranularity : null);

  this.setData({ timePeriodStats: stats });

  // 更新图表
  setTimeout(() => this.initTimeChart(), 100);
},

// 获取时间范围
getTimeRange(period) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  let startDate;

  switch (period) {
    case 'week':
      const dayOfWeek = today.getDay() || 7;
      startDate = new Date(today);
      startDate.setDate(today.getDate() - dayOfWeek + 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(today.getMonth() / 3);
      startDate = new Date(today.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    case 'all':
      startDate = new Date(0); // 最早时间
      break;
  }

  return { startDate, endDate: today };
},

// 分组统计
groupAssetsByGranularity(assets, granularity) {
  // 实现分组逻辑...
}
```

#### 4. 初始化柱状图

```javascript
initTimeChart() {
  const { timePeriodStats } = this.data;
  if (!timePeriodStats) return;

  const component = this.selectComponent('#time-chart');
  if (!component) return;

  component.init((canvas, width, height, dpr) => {
    const chart = echarts.init(canvas, null, {
      width, height, devicePixelRatio: dpr
    });

    chart.setOption({
      color: ['#667eea'],
      tooltip: {
        trigger: 'axis',
        formatter: params => {
          const d = params[0];
          return `${d.name}\n金额: ¥${d.value}\n数量: ${timePeriodStats.data[d.dataIndex].count}件`;
        }
      },
      grid: { left: '12%', right: '12%', bottom: '15%', top: '10%' },
      xAxis: {
        type: 'category',
        data: timePeriodStats.data.map(d => d.label),
        axisLabel: { fontSize: 10 }
      },
      yAxis: [
        {
          type: 'value',
          name: '金额(元)',
          axisLabel: { formatter: '¥{value}' }
        },
        {
          type: 'value',
          name: '数量(件)',
          axisLabel: { formatter: '{value}件' }
        }
      ],
      series: [{
        type: 'bar',
        data: timePeriodStats.data.map(d => d.totalAmount),
        label: {
          show: true,
          position: 'top',
          formatter: (params) => timePeriodStats.data[params.dataIndex].count + '件'
        }
      }]
    });

    this.timeChart = chart;
    return chart;
  });
}
```

#### 5. 添加样式 (index.wxss)

```css
/* 时间段选择器 */
.time-period-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 20rpx;
}

.period-pill {
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 24rpx;
  font-size: 24rpx;
  color: #666;
}

.period-pill.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

/* 统计概览 */
.time-stats-summary {
  display: flex;
  justify-content: space-around;
  padding: 24rpx;
  background: #f8f9ff;
  border-radius: 16rpx;
  margin: 0 20rpx 20rpx;
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 24rpx;
  color: #999;
}

.summary-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}
```

### 测试清单

1. [ ] 默认显示"本月"统计
2. [ ] 切换时间段数据更新正确
3. [ ] "全部"显示粒度选择器
4. [ ] 粒度切换数据分组正确
5. [ ] 空数据显示提示
6. [ ] 图表渲染正常
7. [ ] tooltip 显示金额和数量

### 文件变更清单

| 文件 | 变更类型 |
|------|----------|
| pages/index/index.js | 修改 - 添加逻辑 |
| pages/index/index.wxml | 修改 - 添加UI |
| pages/index/index.wxss | 修改 - 添加样式 |