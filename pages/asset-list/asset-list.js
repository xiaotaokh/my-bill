// asset-list.js
Page({
  data: {
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
  loadAssets() {
    wx.showLoading({ title: '加载中...' });

    const db = wx.cloud.database({
      env: getApp().globalData.envId
    });

    db.collection('assets')
      .orderBy('createdAt', 'desc')
      .get()
      .then(res => {
        this.setData({
          assets: res.data,
          filteredAssets: res.data
        });
        // 应用默认排序
        this.applySort();
      })
      .catch(err => {
        console.error('加载资产失败:', err);
        wx.showModal({
          title: '加载失败',
          content: '错误信息: ' + (err.message || JSON.stringify(err)),
          showCancel: false
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  // 辅助函数：安全解析日期（兼容iOS）
  parseDate(dateInput) {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'string') {
      return new Date(dateInput.replace(/-/g, '/'));
    }
    return new Date(dateInput);
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
    const index = parseInt(e.detail.value);
    const { sortOrder } = this.data;

    this.setData({
      currentSortIndex: index,
      sortOrder: sortOrder === 'desc' ? 'asc' : 'desc'
    });

    // 应用排序
    this.applySort();
  },

  // 切换排序顺序
  toggleSortOrder() {
    const { sortOrder } = this.data;
    this.setData({
      sortOrder: sortOrder === 'desc' ? 'asc' : 'desc'
    });
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

  // 获取状态文本
  getStatusText(status) {
    const map = {
      active: '服役中',
      retired: '已退役',
      sold: '已卖出'
    };
    return map[status] || status;
  },

  // 获取状态样式
  getStatusClass(status) {
    const map = {
      active: 'status-active',
      retired: 'status-retired',
      sold: 'status-sold'
    };
    return map[status] || '';
  },

  // 计算服役时长
  getServiceDays(purchaseDate) {
    if (!purchaseDate) return 0;
    const days = Math.floor((Date.now() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  },

  // 计算日均成本
  getDailyCost(price, purchaseDate) {
    if (!price || !purchaseDate) return 0;
    const days = this.getServiceDays(purchaseDate);
    if (days <= 0) return 0;
    return (price / days).toFixed(2);
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

  // 跳转到详情页面
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/asset-detail/asset-detail?id=${id}`
    });
  },

  // 跳转到添加页面
  goToAdd() {
    wx.navigateTo({
      url: '/pages/asset-add/asset-add'
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadAssets();
    wx.stopPullDownRefresh();
  }
});