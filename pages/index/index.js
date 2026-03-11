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

    // 分类筛选
    activeCategory: 'all',
    categories: [],

    // 排序
    sortOptions: ['价格', '购买时间', '添加时间', '服役时长', '日均成本'],
    currentSortIndex: 0,
    sortOrder: 'desc', // asc 或 desc

    // 加载状态标志
    isLoading: false
  },

  onLoad: function () {
    this.loadCategories();
    // 直接调用 loadAssets，它内部会等待 openid
    this.loadAssets();
  },

  onShow: function () {
    // 每次进入页面重新加载数据，但如果正在加载中则跳过
    if (this.data.isLoading) return;
    this.loadCategories();
    this.loadAssets();
  },

  // 加载类别
  loadCategories() {
    wx.cloud.callFunction({
      name: 'getCategories',
      success: (res) => {
        console.log('加载类别返回:', JSON.stringify(res.result, null, 2));
        const resultData = res.result;
        if (resultData && resultData.data && Array.isArray(resultData.data)) {
          const categories = resultData.data.map(item => item.name);
          console.log('类别列表:', categories);
          this.setData({ categories });
        } else {
          console.log('加载类别失败，云函数返回:', resultData);
          this.setData({ categories: [] });
        }
      },
      fail: (err) => {
        console.error('加载类别失败:', err);
        this.setData({ categories: [] });
      }
    });
  },

  // 加载资产数据
  loadAssets() {
    // 防止重复加载
    if (this.data.isLoading) return;

    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    // 检查云开发是否已初始化
    if (!wx.cloud) {
      console.log('云开发未初始化，显示空数据');
      this.setData({
        assets: [],
        filteredAssets: [],
        isLoading: false
      });
      wx.hideLoading();
      return;
    }

    // 使用 app 的 getOpenid 方法获取 openid
    const app = getApp();
    app.getOpenid()
      .then(openid => {
        // 从云数据库获取资产数据
        // 显式指定环境 ID，防止真机环境丢失
        const db = wx.cloud.database({
          env: app.globalData.envId
        });

        // 只获取当前用户的资产
        db.collection('assets')
          .where({
            _openid: openid
          })
          .orderBy('createdAt', 'desc')
          .get()
          .then(res => {
            console.log('获取资产成功:', res.data.length);
            // 为每个资产添加计算字段
            const assetsWithCalculated = res.data.map(asset => this.calculateAssetFields(asset));
            this.setData({
              assets: assetsWithCalculated,
              filteredAssets: assetsWithCalculated,
              isLoading: false
            });
            // 计算统计数据
            this.calculateStats();
          })
          .catch(err => {
            console.error('加载资产失败:', err);
            // 真机调试显示具体错误
            wx.showModal({
              title: '加载失败',
              content: '错误信息：' + (err.message || JSON.stringify(err)),
              showCancel: false
            });

            // 即使失败也显示空状态，不崩溃
            this.setData({
              assets: [],
              filteredAssets: [],
              isLoading: false
            });
          })
          .finally(() => {
            wx.hideLoading();
          });
      })
      .catch(err => {
        console.error('获取 openid 失败:', err);
        this.setData({
          assets: [],
          filteredAssets: [],
          isLoading: false
        });
        wx.hideLoading();
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
      });
  },

  // 辅助函数：安全解析日期（兼容 iOS）
  parseDate(dateInput) {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'string') {
      // iOS 不支持 2023-01-01 这种格式（有时支持但带时间就不行），统一替换为 /
      return new Date(dateInput.replace(/-/g, '/'));
    }
    return new Date(dateInput);
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 为单个资产计算显示字段
  calculateAssetFields(asset) {
    const purchaseDate = this.parseDate(asset.purchaseDate);
    const now = new Date();

    // 计算已使用天数
    let usedDays = 0;
    if (asset.purchaseDate) {
      usedDays = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24));
      if (usedDays < 0) usedDays = 0;
    }

    // 计算日均成本（仅服役中的资产计算）
    let dailyCost = '0.00';
    if (asset.status === 'active' && !asset.excludeDaily && usedDays > 0) {
      dailyCost = (asset.price / usedDays).toFixed(2);
    } else if (asset.status === 'active' && !asset.excludeDaily && usedDays === 0) {
      dailyCost = asset.price.toFixed(2); // 当天添加的，日均成本等于原价
    }

    // 计算日期范围
    const startDate = this.formatDate(asset.purchaseDate);
    let endDate = '至今';
    if (asset.status === 'retired' || asset.status === 'sold') {
      // 已退役或已卖出的，使用当前日期作为结束日期
      endDate = this.formatDate(asset.retireDate || asset.soldDate || now);
    }

    return {
      ...asset,
      usedDays,
      dailyCost,
      dateRange: asset.status === 'active' ? `${startDate} - 至今` : `${startDate} - ${endDate}`
    };
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
          const purchaseDate = this.parseDate(asset.purchaseDate);
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
    const { assets, activeCategory } = this.data;

    let filtered = assets;
    // 先按分类筛选
    if (activeCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === activeCategory);
    }
    // 再按状态筛选
    if (status !== 'all') {
      filtered = filtered.filter(asset => asset.status === status);
    }

    this.setData({
      activeStatus: status,
      filteredAssets: filtered
    });

    // 重新应用排序
    this.applySort();
  },

  // 按分类筛选
  filterByCategory(e) {
    const category = e.currentTarget.dataset.category;
    const { assets, activeStatus } = this.data;

    let filtered = assets;
    // 先按分类筛选
    if (category !== 'all') {
      filtered = filtered.filter(asset => asset.category === category);
    }
    // 再按状态筛选
    if (activeStatus !== 'all') {
      filtered = filtered.filter(asset => asset.status === activeStatus);
    }

    this.setData({
      activeCategory: category,
      filteredAssets: filtered
    });

    // 重新应用排序
    this.applySort();
  },

  // 新增类别
  addCategory() {
    wx.showModal({
      title: '添加新类别',
      editable: true,
      placeholderText: '请输入新类别名称',
      confirmButtonText: '确定',
      success: (res) => {
        if (res.confirm && res.content) {
          const newCategory = res.content.trim();
          if (newCategory) {
            wx.showLoading({ title: '添加中...' });
            // 调用云函数添加类别
            wx.cloud.callFunction({
              name: 'addCategory',
              data: { name: newCategory },
              success: (res) => {
                wx.hideLoading();
                if (res.result.success) {
                  // 重新加载类别列表
                  this.loadCategories();
                  wx.showToast({
                    title: '添加成功',
                    icon: 'success'
                  });
                } else {
                  wx.showToast({
                    title: res.result.error || '添加失败',
                    icon: 'none'
                  });
                }
              },
              fail: (err) => {
                wx.hideLoading();
                console.error('添加类别失败:', err);
                wx.showToast({
                  title: '添加失败，请重试',
                  icon: 'none'
                });
              }
            });
          }
        }
      }
    });
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
          const dateA = this.parseDate(a.purchaseDate).getTime();
          const dateB = this.parseDate(b.purchaseDate).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        break;
      case 2: // 添加时间
        sorted.sort((a, b) => {
          const dateA = this.parseDate(a.createdAt).getTime();
          const dateB = this.parseDate(b.createdAt).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        break;
      case 3: // 服役时长
        sorted.sort((a, b) => {
          if (a.status !== 'active' && b.status !== 'active') return 0;
          if (a.status !== 'active') return 1;
          if (b.status !== 'active') return -1;

          const dateA = this.parseDate(a.purchaseDate).getTime();
          const dateB = this.parseDate(b.purchaseDate).getTime();
          const daysA = (Date.now() - dateA) / (1000 * 60 * 60 * 24);
          const daysB = (Date.now() - dateB) / (1000 * 60 * 60 * 24);
          return sortOrder === 'desc' ? daysB - daysA : daysA - daysB;
        });
        break;
      case 4: // 日均成本
        sorted.sort((a, b) => {
          if (a.status !== 'active') return 1;
          if (b.status !== 'active') return -1;

          const dateA = this.parseDate(a.purchaseDate).getTime();
          const dateB = this.parseDate(b.purchaseDate).getTime();
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
