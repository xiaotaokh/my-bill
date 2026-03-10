// index.js
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

Page({
  data: {
    // 日期
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    currentDay: new Date().getDate(),
    currentWeek: weekDays[new Date().getDay()],

    // 统计数据
    totalPrice: 0,
    dailyCost: 0,
    activeCount: 0,
    retiredCount: 0,
    soldCount: 0,

    // 资产列表
    assets: [],
    filteredAssets: [],

    // 筛选状态
    activeStatus: 'all',
    statusMap: {
      all: '全部',
      active: '服役中',
      retired: '已退役',
      sold: '已卖出'
    },

    // 排序
    sortOptions: ['价格', '购买时间', '添加时间', '服役时长', '日均成本'],
    currentSortIndex: 0,
    sortOrder: 'desc', // asc 或 desc
  },

  onLoad: function () {
    this.loadAssets();
  },

  onShow: function () {
    // 每次进入页面重新加载数据
    this.loadAssets();
  },

  // 加载资产数据
  async loadAssets() {
    wx.showLoading({ title: '加载中...' });

    try {
      // 检查云开发是否已初始化
      if (!wx.cloud) {
        console.log('云开发未初始化，显示空数据');
        this.setData({
          assets: [],
          filteredAssets: []
        });
        wx.hideLoading();
        return;
      }

      // 从云数据库获取资产数据
      const db = wx.cloud.database();
      const _ = db.command;

      const res = await db.collection('assets')
        .orderBy('createdAt', 'desc')
        .get();

      this.setData({
        assets: res.data,
        filteredAssets: res.data
      });

      // 计算统计数据
      this.calculateStats();
    } catch (err) {
      console.error('加载资产失败:', err);
      // 即使失败也显示空状态，不崩溃
      this.setData({
        assets: [],
        filteredAssets: []
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 计算统计数据
  calculateStats() {
    const { assets } = this.data;

    let totalPrice = 0;
    let totalDays = 0;
    let activeCount = 0;
    let retiredCount = 0;
    let soldCount = 0;

    assets.forEach(asset => {
      // 排除不计入总资产的项
      if (asset.excludeTotal) return;

      totalPrice += asset.price || 0;

      // 计算状态数量
      if (asset.status === 'active') {
        activeCount++;
        // 计算服役天数
        if (asset.purchaseDate && !asset.excludeDaily) {
          const purchaseDate = new Date(asset.purchaseDate);
          const now = new Date();
          const days = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24));
          totalDays += days;
        }
      } else if (asset.status === 'retired') {
        retiredCount++;
      } else if (asset.status === 'sold') {
        soldCount++;
      }
    });

    // 计算日均成本
    const dailyCost = totalDays > 0 ? (totalPrice / totalDays).toFixed(2) : 0;

    this.setData({
      totalPrice: totalPrice.toFixed(2),
      dailyCost: dailyCost,
      activeCount,
      retiredCount,
      soldCount
    });
  },

  // 按状态筛选
  filterByStatus(e) {
    const status = e.currentTarget.dataset.status;
    const { assets } = this.data;

    let filtered = assets;
    if (status !== 'all') {
      filtered = assets.filter(asset => asset.status === status);
    }

    this.setData({
      activeStatus: status,
      filteredAssets: filtered
    });

    // 重新应用排序
    this.applySort();
  },

  // 改变排序
  changeSort(e) {
    const index = e.detail.value;
    const { sortOrder } = this.data;

    this.setData({
      currentSortIndex: index
    });

    // 切换排序顺序
    this.setData({
      sortOrder: sortOrder === 'desc' ? 'asc' : 'desc'
    });

    // 应用排序
    this.applySort();
  },

  // 应用排序
  applySort() {
    const { filteredAssets, currentSortIndex, sortOrder } = this.data;
    let sorted = [...filteredAssets];

    switch (currentSortIndex) {
      case 0: // 价格
        sorted.sort((a, b) => {
          return sortOrder === 'desc' ? (b.price || 0) - (a.price || 0) : (a.price || 0) - (b.price || 0);
        });
        break;
      case 1: // 购买时间
        sorted.sort((a, b) => {
          const dateA = new Date(a.purchaseDate).getTime();
          const dateB = new Date(b.purchaseDate).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        break;
      case 2: // 添加时间
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        break;
      case 3: // 服役时长
        sorted.sort((a, b) => {
          if (a.status !== 'active' && b.status !== 'active') return 0;
          if (a.status !== 'active') return 1;
          if (b.status !== 'active') return -1;

          const dateA = new Date(a.purchaseDate).getTime();
          const dateB = new Date(b.purchaseDate).getTime();
          const daysA = (Date.now() - dateA) / (1000 * 60 * 60 * 24);
          const daysB = (Date.now() - dateB) / (1000 * 60 * 60 * 24);
          return sortOrder === 'desc' ? daysB - daysA : daysA - daysB;
        });
        break;
      case 4: // 日均成本
        sorted.sort((a, b) => {
          if (a.status !== 'active') return 1;
          if (b.status !== 'active') return -1;

          const dateA = new Date(a.purchaseDate).getTime();
          const dateB = new Date(b.purchaseDate).getTime();
          const daysA = (Date.now() - dateA) / (1000 * 60 * 60 * 24);
          const daysB = (Date.now() - dateB) / (1000 * 60 * 60 * 24);
          const costA = daysA > 0 ? a.price / daysA : 0;
          const costB = daysB > 0 ? b.price / daysB : 0;
          return sortOrder === 'desc' ? costB - costA : costA - costB;
        });
        break;
    }

    this.setData({
      filteredAssets: sorted
    });
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 跳转到添加页面
  goToAdd() {
    wx.navigateTo({
      url: '/pages/asset-add/asset-add'
    });
  },

  // 跳转到详情页面
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/asset-detail/asset-detail?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadAssets();
    wx.stopPullDownRefresh();
  }
});