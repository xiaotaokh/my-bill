// asset-detail.js
const { themeManager } = require('../../utils/themeManager');
const { supabase, deleteStorageFile } = require('../../utils/supabase');
Page({
  data: {
    themeStyle: '',
    asset: { status: '' },
    assetId: '',
    displayIcon: null, // 资产缩略图的临时URL
    categoryIcon: null, // 分类图标的临时URL
    categoryIconEmoji: '', // 分类图标 emoji
    // 计算后的显示字段
    displayInfo: {
      purchaseDateFormatted: '',
      createdAtFormatted: '',
      retiredDateFormatted: '',
      soldDateFormatted: '',
      usedDays: 0,
      dailyCost: '0.00',
      dailyEquivalent: '0.00',
      dateRange: '',
      // 订阅资产专属字段
      periodTypeText: '',
      totalInvestment: '0.00',
      subscriptionStartDateFormatted: '',
      subscriptionEndDateFormatted: ''
    }
  },

  onLoad: function (options) {
    // 初始化主题
    this.setData({
      themeStyle: themeManager.getCurrentStyle(),
      currentThemeKey: themeManager.getCurrentTheme()
    });
    // 初始化导航栏颜色
    const initNavColors = themeManager.getThemeColors();
    wx.setNavigationBarColor({
      backgroundColor: initNavColors.navBg,
      frontColor: initNavColors.navTextStyle
    });
    themeManager.addListener((style, themeKey) => {
      this.setData({ themeStyle: style, currentThemeKey: themeKey });
      const navColors = themeManager.getThemeColors();
      wx.setNavigationBarColor({
        backgroundColor: navColors.navBg,
        frontColor: navColors.navTextStyle
      });
    });

    if (options.id) {
      this.setData({
        assetId: options.id
      });
      this.loadAssetDetail(options.id);
    }
  },

  onShow: function () {
    // 从编辑页返回时刷新数据
    if (this.data.assetId) {
      this.loadAssetDetail(this.data.assetId);
    }
  },

  // 加载资产详情（通过 Supabase id 查询）
  async loadAssetDetail(assetId) {
    wx.showLoading({ title: '加载中...' });
    const app = getApp();

    try {
      const openid = await app.getOpenid();

      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error || !data) {
        wx.hideLoading();
        wx.showToast({ title: '资产不存在', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
        return;
      }

      const asset = data;
      const displayInfo = this.calculateDisplayInfo(asset);

      // 处理资产缩略图 - HTTP 链接用图片，emoji 用文字
      const displayIcon = asset.icon && asset.icon.startsWith('http') ? asset.icon : null;

      // 加载分类图标
      this.loadCategoryIcon(asset.category);

      this.setData({
        asset: asset,
        displayInfo: displayInfo,
        displayIcon: displayIcon
      });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  // 辅助函数：安全解析日期（兼容 iOS，明确解析为本地时间午夜）
  parseDate(dateInput) {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'string') {
      // 解析 YYYY-MM-DD 格式为本地时间的午夜，避免时区问题
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      return new Date(dateInput.replace(/-/g, '/'));
    }
    return new Date(dateInput);
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化日期时间（添加时间专用）
  formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 根据周期类型获取周期天数
  getPeriodDays(periodType, customDays) {
    const periodMap = {
      'monthly': 30,
      'yearly': 365,
      'weekly': 7
    };
    if (periodType === 'custom') {
      return parseInt(customDays) || 30;
    }
    return periodMap[periodType] || 30;
  },

  // 获取周期类型文本
  getPeriodTypeText(periodType, customDays) {
    const typeMap = {
      'monthly': '月度',
      'yearly': '年度',
      'weekly': '周'
    };
    if (periodType === 'custom') {
      return `${customDays || 30}天`;
    }
    return typeMap[periodType] || '月度';
  },

  // 计算显示信息 - 和首页保持一致
  calculateDisplayInfo(asset) {
    // 订阅资产处理
    if (asset.assetType === 'subscription') {
      return this.calculateSubscriptionDisplayInfo(asset);
    }

    // 普通资产处理
    const purchaseDate = this.parseDate(asset.purchaseDate);
    const now = new Date();

    // 计算已使用天数
    let usedDays = 0;
    let endDate = now;

    if (asset.purchaseDate) {
      // 已退役/已卖出：计算到退役/卖出日期
      const retiredDateStr = asset.retiredDate || asset.soldDate;
      if ((asset.status === 'retired' || asset.status === 'sold') && retiredDateStr) {
        endDate = this.parseDate(retiredDateStr);
      }

      usedDays = Math.floor((endDate - purchaseDate) / (1000 * 60 * 60 * 24)) + 1;
      if (usedDays <= 0) usedDays = 1;
    }

    // 计算日均成本（服役中）
    let dailyCost = '0.00';
    // 折合每日（已退役/已卖出）
    let dailyEquivalent = '0.00';

    if (asset.status === 'active' && asset.price && usedDays >= 1) {
      dailyCost = (asset.price / usedDays).toFixed(2);
    } else if ((asset.status === 'retired' || asset.status === 'sold') && asset.price && usedDays >= 1) {
      dailyEquivalent = (asset.price / usedDays).toFixed(2);
      dailyCost = dailyEquivalent;
    }

    // 计算日期范围
    const startDate = this.formatDate(asset.purchaseDate);
    let dateRangeEnd = '至今';
    const retiredDateStr = asset.retiredDate || asset.soldDate;
    if ((asset.status === 'retired' || asset.status === 'sold') && retiredDateStr) {
      dateRangeEnd = this.formatDate(retiredDateStr);
    }

    return {
      purchaseDateFormatted: this.formatDate(asset.purchaseDate),
      createdAtFormatted: this.formatDate(asset.createdAt),
      retiredDateFormatted: this.formatDate(asset.retiredDate),
      soldDateFormatted: this.formatDate(asset.soldDate),
      usedDays: usedDays,
      dailyCost: dailyCost,
      dailyEquivalent: dailyEquivalent,
      dateRange: asset.status === 'active' ? `${startDate} - 至今` : `${startDate} - ${dateRangeEnd}`,
      periodTypeText: '',
      totalInvestment: '0.00',
      subscriptionStartDateFormatted: '',
      subscriptionEndDateFormatted: ''
    };
  },

  // 计算订阅资产显示信息
  calculateSubscriptionDisplayInfo(asset) {
    const purchaseDate = this.parseDate(asset.purchaseDate);
    const subscriptionStartDate = asset.subscriptionStartDate ? this.parseDate(asset.subscriptionStartDate) : purchaseDate;
    const now = new Date();

    // 计算已订阅天数
    let usedDays = 0;
    let endDate = now;

    if (asset.subscriptionStatus === 'ended' && asset.subscriptionEndDate) {
      endDate = this.parseDate(asset.subscriptionEndDate);
    }

    // 待生效状态不计算使用天数
    if (asset.subscriptionStatus !== 'pending') {
      usedDays = Math.floor((endDate - subscriptionStartDate) / (1000 * 60 * 60 * 24)) + 1;
      if (usedDays <= 0) usedDays = 1;
    }

    // 计算订阅资产日均成本 = 每期金额 / 周期天数
    let dailyCost = '0.00';
    if (asset.periodAmount && asset.periodType) {
      const periodDays = this.getPeriodDays(asset.periodType, asset.periodDays);
      dailyCost = (asset.periodAmount / periodDays).toFixed(2);
    }

    // 计算总投入
    let totalInvestment = '0.00';
    if (asset.subscriptionStatus !== 'pending' && asset.periodAmount && asset.periodType) {
      const periodDays = this.getPeriodDays(asset.periodType, asset.periodDays);
      const completedPeriods = Math.floor(usedDays / periodDays) + 1;
      totalInvestment = (asset.periodAmount * completedPeriods).toFixed(2);
    }

    // 周期类型文本
    const periodTypeText = this.getPeriodTypeText(asset.periodType, asset.periodDays);

    // 日期范围
    const startDate = this.formatDate(asset.subscriptionStartDate || asset.purchaseDate);
    let dateRangeEnd = '至今';
    if (asset.subscriptionStatus === 'ended' && asset.subscriptionEndDate) {
      dateRangeEnd = this.formatDate(asset.subscriptionEndDate);
    }
    const dateRange = asset.subscriptionStatus === 'pending'
      ? `待生效: ${startDate}`
      : `${startDate} - ${dateRangeEnd}`;

    return {
      purchaseDateFormatted: this.formatDate(asset.purchaseDate),
      createdAtFormatted: this.formatDate(asset.createdAt),
      retiredDateFormatted: '',
      soldDateFormatted: '',
      usedDays: usedDays,
      dailyCost: dailyCost,
      dailyEquivalent: '0.00',
      dateRange: dateRange,
      periodTypeText: periodTypeText,
      totalInvestment: totalInvestment,
      subscriptionStartDateFormatted: this.formatDate(asset.subscriptionStartDate),
      subscriptionEndDateFormatted: this.formatDate(asset.subscriptionEndDate)
    };
  },

  // 加载分类图标
  async loadCategoryIcon(categoryName) {
    if (!categoryName) return;
    const app = getApp();

    try {
      const openid = await app.getOpenid();

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('_openid', openid)
        .eq('name', categoryName)
        .single();

      if (data && data.icon) {
        // Supabase URL 直接使用
        if (data.icon.startsWith('http')) {
          this.setData({ categoryIcon: data.icon });
        } else {
          // emoji 图标
          this.setData({ categoryIconEmoji: data.icon });
        }
      }
    } catch (err) {
      // 加载失败时忽略
    }
  },

  // 编辑资产
  editAsset() {
    wx.navigateTo({
      url: `/pages/asset-add/asset-add?id=${this.data.asset.id}&edit=true`
    });
  },

  // 预览资产图标原图
  previewIcon() {
    if (this.data.displayIcon) {
      wx.previewImage({
        current: this.data.displayIcon,
        urls: [this.data.displayIcon]
      });
    }
  },

  // 删除资产
  deleteAsset() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此资产吗？删除后无法恢复',
      confirmColor: themeManager.getThemeColors().error,
      success: (res) => {
        if (res.confirm) {
          this.confirmDelete();
        }
      }
    });
  },

  // 确认删除
  async confirmDelete() {
    wx.showLoading({ title: '删除中...' });
    const app = getApp();

    try {
      const openid = await app.getOpenid();

      // 删除 Storage 中的图标文件
      if (this.data.asset.icon && this.data.asset.icon.startsWith('http')) {
        await deleteStorageFile('icons', this.data.asset.icon);
      }

      await supabase
        .from('assets')
        .delete()
        .eq('id', this.data.assetId);

      wx.hideLoading();
      wx.showToast({ title: '删除成功', icon: 'success' });

      // 返回并刷新
      setTimeout(() => {
        wx.navigateBack({
          success: () => {
            const pages = getCurrentPages();
            if (pages.length > 1) {
              const prevPage = pages[pages.length - 2];
              if (prevPage.loadAssets) {
                prevPage.loadAssets();
              }
            }
          }
        });
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  }
});