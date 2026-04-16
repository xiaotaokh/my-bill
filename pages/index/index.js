// index.js
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 引入 echarts
import * as echarts from '../../components/ec-canvas/echarts';

Page({
  data: {
    // 日期
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    currentDay: new Date().getDate(),
    currentWeek: weekDays[new Date().getDay()],

    // 天气
    weatherText: '',
    weatherTemp: '',
    weatherIcon: '',
    weatherTempMax: '',
    weatherTempMin: '',
    weatherLoading: true,

    // 统计数据
    totalPrice: 0,
    dailyCost: 0,
    totalPriceSize: 64,
    dailyCostSize: 32,
    activeCount: 0,
    retiredCount: 0,
    soldCount: 0,
    statsTotalCount: 0,

    // 管理员标识
    showUserStats: false,
    isAdmin: false,

    // 资产列表
    assets: [],
    filteredAssets: [],
    filteredTotalPrice: '0.00',
    filteredDailyCost: '0.00',

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
    categoryList: [],

    // 排序
    sortDbFields: ['price', 'purchaseDate', 'createdAt'],
    sortOptions: ['价格', '购买时间', '添加时间', '服役时长', '日均成本'],
    currentSortIndex: 1,
    sortOrder: 'desc',

    // 视图控制
    showSetting: false,
    showReport: false,

    // 统计数据
    reportLoading: false,
    reportEmpty: false,
    reportTotalAssets: 0,
    reportTotalPrice: 0,
    reportExcludedPrice: 0,
    reportIncludedCount: 0,
    reportExcludedCount: 0,
    reportCategoryStats: [],
    reportColors: ['#667eea', '#764ba2', '#9b72e8', '#f472b6', '#fb923c', '#34d399', '#60a5fa', '#a78bfa', '#fbbf24', '#38bdf8'],

    // 状态统计
    reportActiveCount: 0,
    reportActivePrice: 0,
    reportRetiredCount: 0,
    reportRetiredPrice: 0,
    reportSoldCount: 0,
    reportSoldPrice: 0,
    reportDailyCost: 0,

    // 图表配置 - 使用延迟加载
    pieEc: { lazyLoad: true },
    lineEc: { lazyLoad: true },
    timePeriodEc: { lazyLoad: true },

    // 时间段统计
    activeTimePeriod: 'all',
    activeGranularity: 'year',
    timePeriodStats: null,

    // 环形图中间文字
    pieCenterText: '',
    pieCenterSubText: '总资产',

    // 批量删除
    showBatchDelete: false,
    batchAssetList: [],
    filteredBatchAssetList: [],
    selectedAssets: [],
    selectedTotalPrice: '0.00',
    isAllSelected: false,
    batchSearchKeyword: '',

    // 状态
    isLoading: false,
    _fromSetting: false,
    showBackToTop: false,

    // 搜索
    searchKeyword: '',
    showSearchInput: false,
    searchInputValue: '',
    searchInputFocus: false,

    // 用户授权弹窗
    showAuthModal: false,
    authNickName: '',
    authAvatarUrl: '',
    nicknameFocus: false,
    authSubmitting: false
  },

  onLoad() {
    this.loadCategories();
    this.loadAssets();
    this.loadWeather();
    this.checkAdmin();
    this.checkUserAuth();
  },

  // 检查用户是否已授权
  checkUserAuth() {
    const app = getApp();
    const ADMIN_OPENID = 'ofW_r4lPk806IqPSk4-gR9r_478g';

    app.getOpenid().then(openid => {
      // 管理员不需要弹窗，也不需要记录到用户统计
      if (openid === ADMIN_OPENID) {
        return;
      }

      wx.cloud.callFunction({
        name: 'saveUserInfo',
        data: { updateAccessTime: false },
        success: (res) => {
          if (res.result?.success && res.result?.isNewUser) {
            // 新用户，显示授权弹窗
            this.setData({ showAuthModal: true });
          } else if (res.result?.success) {
            // 已有用户记录，检查是否有昵称头像
            wx.cloud.database().collection('users').where({ _openid: openid }).limit(1).get().then(dbRes => {
              const user = dbRes.data[0];
              if (user && !user.nickName && !user.avatarUrl) {
                // 缺少昵称头像，显示授权弹窗
                this.setData({ showAuthModal: true });
              } else if (user && user.nickName && user.avatarUrl) {
                // 用户已授权，更新访问时间，同时保存到全局
                app.globalData.userInfo = {
                  nickName: user.nickName,
                  avatarUrl: user.avatarUrl
                };
                wx.cloud.callFunction({
                  name: 'saveUserInfo',
                  data: { updateAccessTime: true }
                });
              }
            });
          }
        }
      });
    });
  },

  // 选择头像
  onChooseAvatar(e) {
    if (this.data.authSubmitting) {
      return;
    }
    const avatarUrl = e.detail.avatarUrl;
    this.setData({ authAvatarUrl: avatarUrl });
  },

  // 点击按钮触发昵称选择
  chooseNickname() {
    if (this.data.authSubmitting) {
      return;
    }
    this.setData({ nicknameFocus: true });
  },

  // 微信官方昵称填写能力完成后回填
  onNicknameBlur(e) {
    const nickName = (e.detail.value || '').trim();
    this.setData({
      authNickName: nickName,
      nicknameFocus: false
    });
  },

  // 提交用户信息
  submitUserInfo() {
    const { authNickName, authAvatarUrl } = this.data;

    if (this.data.authSubmitting) {
      return;
    }

    if (!authAvatarUrl) {
      wx.showToast({ title: '请选择头像', icon: 'none' });
      return;
    }

    if (!authNickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    this.setData({ authSubmitting: true });

    // 上传头像到云存储（如果是本地临时文件）
    const uploadPromise = authAvatarUrl.startsWith('http') ?
      Promise.resolve(authAvatarUrl) : this.uploadAvatar(authAvatarUrl);

    uploadPromise.then(finalAvatarUrl => {
      wx.cloud.callFunction({
        name: 'saveUserInfo',
        data: {
          nickName: authNickName.trim(),
          avatarUrl: finalAvatarUrl
        },
        success: (res) => {
          this.setData({ authSubmitting: false });
          if (res.result?.success) {
            this.setData({
              showAuthModal: false,
              authNickName: '',
              authAvatarUrl: ''
            });
          } else {
            wx.showToast({ title: res.result?.error || '保存失败', icon: 'none' });
          }
        },
        fail: () => {
          this.setData({ authSubmitting: false });
          wx.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    }).catch(() => {
      this.setData({ authSubmitting: false });
      wx.showToast({ title: '头像上传失败', icon: 'none' });
    });
  },

  // 取消授权（退出小程序）
  cancelAuth() {
    wx.exitMiniProgram();
  },

  // 上传头像到云存储
  uploadAvatar(tempFilePath) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const cloudPath = `user-avatars/${timestamp}.jpg`;
      wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath,
        success: res => resolve(res.fileID),
        fail: err => reject(err)
      });
    });
  },

  checkAdmin() {
    const app = getApp();
    const ADMIN_OPENID = 'ofW_r4lPk806IqPSk4-gR9r_478g';
    
    app.getOpenid().then(openid => {
      if (openid === ADMIN_OPENID) {
        this.setData({
          isAdmin: true,
          showUserStats: true
        });
      } else {
        this.setData({
          isAdmin: false,
          showUserStats: false
        });
      }
    }).catch(err => {
      this.setData({
        isAdmin: false,
        showUserStats: false
      });
    });
  },

  onShow() {
    if (this.data.isLoading) return;

    if (this.data._fromSetting) {
      this.setData({ showSetting: true, _fromSetting: false });
    }

    this.loadCategories();
    this.loadAssets();
  },

  // 加载天气
  loadWeather() {
    this.setData({ weatherLoading: true });

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const { latitude, longitude } = res;
        this.fetchWeather(latitude, longitude);
      },
      fail: (err) => {
        // 位置获取失败时显示默认状态
        this.setData({
          weatherText: '',
          weatherTemp: '',
          weatherIcon: '',
          weatherLoading: false
        });
      }
    });
  },

  // 获取天气数据（通过云函数）
  fetchWeather(latitude, longitude) {
    wx.cloud.callFunction({
      name: 'getWeather',
      data: { latitude, longitude },
      success: (res) => {
        if (res.result?.success) {
          const { now, forecast } = res.result;

          const updateData = { weatherLoading: false };

          if (now) {
            updateData.weatherText = now.text || '';
            updateData.weatherTemp = now.temp || '';
            updateData.weatherIcon = this.getWeatherIcon(now.text);
          }

          if (forecast && forecast[0]) {
            updateData.weatherTempMax = forecast[0].tempMax || '';
            updateData.weatherTempMin = forecast[0].tempMin || '';
          }

          this.setData(updateData);
        } else {
          this.setData({ weatherLoading: false });
        }
      },
      fail: (err) => {
        this.setData({ weatherLoading: false });
      }
    });
  },

  // 根据天气描述获取对应的图标
  getWeatherIcon(text) {
    const iconMap = {
      '晴': '☀️',
      '多云': '⛅',
      '阴': '☁️',
      '小雨': '🌧️',
      '中雨': '🌧️',
      '大雨': '🌧️',
      '暴雨': '⛈️',
      '雷阵雨': '⛈️',
      '小雪': '🌨️',
      '中雪': '🌨️',
      '大雪': '❄️',
      '雨夹雪': '🌨️',
      '雾': '🌫️',
      '霾': '🌫️',
      '风': '💨',
      '浮尘': '🌪️',
      '扬沙': '🌪️'
    };

    for (const key in iconMap) {
      if (text && text.includes(key)) {
        return iconMap[key];
      }
    }
    return '🌡️';
  },

  // 加载类别
  loadCategories() {
    wx.cloud.callFunction({
      name: 'getCategories',
      success: (res) => {
        if (res.result?.success && res.result.data) {
          this.processCategories(res.result.data);
        } else {
          this.setData({ categories: [], categoryList: [] });
        }
      },
      fail: () => {
        this.setData({ categories: [], categoryList: [] });
      }
    });
  },

  async processCategories(categoriesData) {
    const categoriesWithIcons = await Promise.all(categoriesData.map(async category => {
      let displayIcon = null;
      if (category.icon?.startsWith('cloud://')) {
        try {
          const fileRes = await wx.cloud.getTempFileURL({ fileList: [category.icon] });
          displayIcon = fileRes.fileList[0]?.tempFileURL || null;
        } catch (e) {}
      } else if (category.icon?.startsWith('http')) {
        displayIcon = category.icon;
      }
      return { name: category.name, icon: category.icon || '', displayIcon };
    }));

    this.setData({
      categories: categoriesWithIcons.map(c => c.name),
      categoryList: categoriesWithIcons
    }, () => this.updateAssetsCategoryIcon());
  },

  // 加载资产
  loadAssets(searchKeyword) {
    if (this.data.isLoading) return;

    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    const app = getApp();
    const { currentSortIndex, sortOrder, sortDbFields } = this.data;

    // 使用传入的搜索关键词，或当前状态中的值
    const keyword = searchKeyword !== undefined ? searchKeyword : this.data.searchKeyword;

    app.getOpenid().then(openid => {
      const db = wx.cloud.database({ env: app.globalData.envId });
      const where = { _openid: openid };

      // 添加名称搜索条件
      if (keyword) {
        // 使用正则表达式进行模糊搜索
        where.name = db.RegExp({
          regexp: keyword,
          options: 'i'  // 不区分大小写
        });
      }

      const sortField = sortDbFields[currentSortIndex];
      const orderField = sortField || 'createdAt';
      const orderDir = sortField ? sortOrder : 'desc';

      // 获取所有资产（不做筛选，用于统计和列表）
      return this.getAllAssetsWithPaging(db, where, orderField, orderDir);
    }).then(async res => {
      const assetsWithIcon = await Promise.all(res.data.map(async asset => {
        let displayIcon = null;
        if (asset.icon?.startsWith('cloud://')) {
          try {
            const fileRes = await wx.cloud.getTempFileURL({ fileList: [asset.icon] });
            displayIcon = fileRes.fileList[0]?.tempFileURL || null;
          } catch (e) {}
        } else if (asset.icon?.startsWith('http')) {
          displayIcon = asset.icon;
        }
        return { ...asset, displayIcon };
      }));

      const assets = assetsWithIcon.map(a => this.calculateAssetFields(a));
      this.setData({ assets, isLoading: false });

      // 应用筛选
      this.applyFilters();

      if (!sortDbFields[currentSortIndex]) {
        this.applySort();
      }
    }).catch(err => {
      this.setData({ assets: [], filteredAssets: [], isLoading: false });
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }).finally(() => wx.hideLoading());
  },

  // 分页获取所有资产
  async getAllAssetsWithPaging(db, where, orderBy, orderDir) {
    const MAX_LIMIT = 20;
    let allData = [];
    let count = 0;

    // 先获取总数
    const countRes = await db.collection('assets').where(where).count();
    const total = countRes.total;

    // 分批获取
    const batchTimes = Math.ceil(total / MAX_LIMIT);
    for (let i = 0; i < batchTimes; i++) {
      const res = await db.collection('assets')
        .where(where)
        .orderBy(orderBy, orderDir)
        .skip(i * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .get();
      allData = allData.concat(res.data);
    }

    return { data: allData };
  },

  parseDate(dateInput) {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'string') {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    return new Date(dateInput);
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

  // 获取周期类型显示文本
  getPeriodTypeText(periodType, periodDays) {
    const periodTextMap = {
      'monthly': '月',
      'yearly': '年',
      'weekly': '周',
      'custom': periodDays ? `${periodDays}天` : '自定义'
    };
    return periodTextMap[periodType] || '周期';
  },

  // 格式化每期金额显示
  formatPeriodAmount(asset) {
    if (asset.assetType !== 'subscription' || !asset.periodAmount) return { amount: '', period: '' };
    const periodTypeText = this.getPeriodTypeText(asset.periodType, asset.periodDays);
    return {
      amount: `¥${asset.periodAmount}元/`,
      period: periodTypeText
    };
  },

  // 计算订阅资产日均成本
  calculateSubscriptionDailyCost(asset) {
    if (asset.assetType !== 'subscription') return '0.00';
    if (!asset.periodAmount || !asset.periodType) return '0.00';

    const periodDays = this.getPeriodDays(asset.periodType, asset.periodDays);
    const dailyCost = asset.periodAmount / periodDays;
    return dailyCost.toFixed(2);
  },

  calculateAssetFields(asset) {
    // 订阅资产处理
    if (asset.assetType === 'subscription') {
      const purchaseDate = this.parseDate(asset.purchaseDate);
      const now = new Date();
      const subscriptionStartDate = asset.subscriptionStartDate ? this.parseDate(asset.subscriptionStartDate) : purchaseDate;

      // 计算订阅开始日期（待生效状态使用subscriptionStartDate）
      const effectiveStartDate = asset.subscriptionStatus === 'pending' ? subscriptionStartDate : purchaseDate;

      // 订阅结束日期
      let endDate = now;
      if (asset.subscriptionStatus === 'ended' && asset.subscriptionEndDate) {
        endDate = this.parseDate(asset.subscriptionEndDate);
      }

      // 计算已订阅天数
      let usedDays = 0;
      if (asset.subscriptionStatus !== 'pending') {
        usedDays = Math.floor((endDate - effectiveStartDate) / (1000 * 60 * 60 * 24)) + 1;
        if (usedDays <= 0) usedDays = 1;
      }

      // 订阅资产日均成本 = 每期金额 / 周期天数
      const dailyCost = this.calculateSubscriptionDailyCost(asset);

      // 计算总投入（动态累计）
      let totalInvestment = 0;
      if (asset.subscriptionStatus !== 'pending' && asset.periodAmount && asset.periodType) {
        const periodDays = this.getPeriodDays(asset.periodType, asset.periodDays);
        const totalDays = usedDays;
        const completedPeriods = Math.floor(totalDays / periodDays) + 1;
        totalInvestment = asset.periodAmount * completedPeriods;
      }

      const startDate = this.formatDate(asset.subscriptionStartDate || asset.purchaseDate);
      const dateRangeEnd = asset.subscriptionStatus === 'ended' && asset.subscriptionEndDate
        ? this.formatDate(asset.subscriptionEndDate) : '至今';

      const categoryItem = this.data.categoryList?.find(c => c.name === asset.category);
      const categoryIcon = categoryItem?.displayIcon || categoryItem?.icon || '';
      const categoryIconUrl = categoryIcon?.startsWith('http') ? categoryIcon : '';

      return {
        ...asset,
        usedDays,
        dailyCost,
        dailyEquivalent: '0.00',
        totalInvestment: totalInvestment.toFixed(2),
        periodAmountDisplay: this.formatPeriodAmount(asset).amount,
        periodTypeDisplay: this.formatPeriodAmount(asset).period,
        dateRange: asset.subscriptionStatus === 'pending'
          ? `待生效: ${startDate}`
          : (asset.subscriptionStatus === 'ended'
            ? `${startDate} - ${dateRangeEnd}`
            : `${startDate} - 至今`),
        categoryIcon,
        categoryIconUrl
      };
    }

    // 普通资产处理
    const purchaseDate = this.parseDate(asset.purchaseDate);
    const now = new Date();
    let usedDays = 0;
    let endDate = now;

    if (asset.purchaseDate) {
      const retiredDateStr = asset.retiredDate || asset.soldDate;
      if ((asset.status === 'retired' || asset.status === 'sold') && retiredDateStr) {
        endDate = this.parseDate(retiredDateStr);
      }
      usedDays = Math.floor((endDate - purchaseDate) / (1000 * 60 * 60 * 24)) + 1;
      if (usedDays <= 0) usedDays = 1;
    }

    const startDate = this.formatDate(asset.purchaseDate);
    const retiredDateStr = asset.retiredDate || asset.soldDate;
    const dateRangeEnd = (asset.status === 'retired' || asset.status === 'sold') && retiredDateStr
      ? this.formatDate(retiredDateStr) : '至今';

    let dailyCost = '0.00';
    let dailyEquivalent = '0.00';
    if (asset.status === 'active' && asset.price && usedDays >= 1) {
      dailyCost = (asset.price / usedDays).toFixed(2);
    } else if ((asset.status === 'retired' || asset.status === 'sold') && asset.price && usedDays >= 1) {
      dailyEquivalent = (asset.price / usedDays).toFixed(2);
    }

    const categoryItem = this.data.categoryList?.find(c => c.name === asset.category);
    const categoryIcon = categoryItem?.displayIcon || categoryItem?.icon || '';
    const categoryIconUrl = categoryIcon?.startsWith('http') ? categoryIcon : '';

    return {
      ...asset,
      usedDays,
      dailyCost,
      dailyEquivalent,
      dateRange: asset.status === 'active' ? `${startDate} - 至今` : `${startDate} - ${dateRangeEnd}`,
      categoryIcon,
      categoryIconUrl
    };
  },

  updateAssetsCategoryIcon() {
    const { assets, categoryList } = this.data;
    if (!assets.length || !categoryList?.length) return;

    const update = list => list.map(asset => {
      const item = categoryList.find(c => c.name === asset.category);
      const icon = item?.displayIcon || item?.icon || '';
      return { ...asset, categoryIcon: icon, categoryIconUrl: icon?.startsWith('http') ? icon : '' };
    });

    this.setData({ assets: update(assets), filteredAssets: update(this.data.filteredAssets) });
  },

  // 应用筛选
  applyFilters() {
    const { assets, activeStatus, activeCategory } = this.data;
    let filtered = [...assets];

    // 按状态筛选
    if (activeStatus !== 'all') {
      filtered = filtered.filter(a => a.status === activeStatus);
    }

    // 按分类筛选
    if (activeCategory !== 'all') {
      filtered = filtered.filter(a => a.category === activeCategory);
    }

    this.setData({ filteredAssets: filtered }, () => this.calculateStats());
  },

  calculateStats() {
    const { filteredAssets, assets, activeCategory } = this.data;
    let totalPrice = 0, dailyCostTotal = 0;
    let filteredTotal = 0; // 当前筛选条件下所有资产总金额
    let filteredDailyTotal = 0; // 当前筛选条件下所有资产的日均总和
    let activeCount = 0, retiredCount = 0, soldCount = 0;
    let subscriptionActiveCount = 0, subscriptionPendingCount = 0, subscriptionEndedCount = 0;

    // 根据分类筛选计算统计数量
    const statsAssets = activeCategory === 'all' ? assets : assets.filter(a => a.category === activeCategory);
    statsAssets.forEach(asset => {
      // 订阅资产统计
      if (asset.assetType === 'subscription') {
        if (asset.subscriptionStatus === 'active' || (!asset.subscriptionStatus && asset.status === 'active')) {
          subscriptionActiveCount++;
        } else if (asset.subscriptionStatus === 'pending') {
          subscriptionPendingCount++;
        } else if (asset.subscriptionStatus === 'ended') {
          subscriptionEndedCount++;
        }
      } else {
        // 普通资产统计
        if (asset.status === 'active') activeCount++;
        else if (asset.status === 'retired') retiredCount++;
        else if (asset.status === 'sold') soldCount++;
      }
    });

    // 从筛选后的资产计算金额统计
    filteredAssets.forEach(asset => {
      // 订阅资产处理
      if (asset.assetType === 'subscription') {
        // 订阅资产使用 totalInvestment 作为总金额
        const investment = parseFloat(asset.totalInvestment) || 0;
        filteredTotal += investment;

        // 订阅资产日均成本
        if (asset.subscriptionStatus !== 'pending' && asset.subscriptionStatus !== 'ended' && asset.dailyCost) {
          filteredDailyTotal += parseFloat(asset.dailyCost);
        }

        if (asset.excludeTotal === true || asset.excludeTotal === 'true') return;
        totalPrice += investment;

        // 订阅资产的日均成本计入统计（待生效和已结束的不计入）
        if (asset.subscriptionStatus !== 'pending' && asset.subscriptionStatus !== 'ended' &&
            asset.excludeDaily !== true && asset.excludeDaily !== 'true' && asset.dailyCost) {
          dailyCostTotal += parseFloat(asset.dailyCost);
        }
        return;
      }

      // 普通资产处理
      filteredTotal += asset.price || 0; // 计算所有资产金额

      // 计算所有资产的日均（active用dailyCost，retired/sold用dailyEquivalent）
      if (asset.status === 'active' && asset.dailyCost) {
        filteredDailyTotal += parseFloat(asset.dailyCost);
      } else if ((asset.status === 'retired' || asset.status === 'sold') && asset.dailyEquivalent) {
        filteredDailyTotal += parseFloat(asset.dailyEquivalent);
      }

      if (asset.excludeTotal === true || asset.excludeTotal === 'true') return;
      totalPrice += asset.price || 0;

      if (asset.status === 'active' && asset.excludeDaily !== true && asset.excludeDaily !== 'true' && asset.dailyCost) {
        dailyCostTotal += parseFloat(asset.dailyCost);
      }
    });

    const totalPriceStr = totalPrice.toFixed(2);
    const dailyCostStr = dailyCostTotal.toFixed(2);

    // 根据数字长度计算字体大小
    const calcFontSize = (numStr, baseSize, minSize) => {
      const len = numStr.length;
      if (len <= 6) return baseSize;
      if (len <= 8) return baseSize - 4;
      if (len <= 10) return baseSize - 8;
      if (len <= 12) return baseSize - 14;
      return Math.max(minSize, baseSize - 20);
    };

    this.setData({
      totalPrice: totalPriceStr,
      filteredTotalPrice: filteredTotal.toFixed(2),
      filteredDailyCost: filteredDailyTotal.toFixed(2),
      dailyCost: dailyCostStr,
      totalPriceSize: calcFontSize(totalPriceStr, 48, 26),
      dailyCostSize: calcFontSize(dailyCostStr, 28, 20),
      activeCount, retiredCount, soldCount,
      subscriptionActiveCount, subscriptionPendingCount, subscriptionEndedCount,
      statsTotalCount: statsAssets.length
    });
  },

  filterByStatus(e) {
    this.setData({ activeStatus: e.currentTarget.dataset.status });
    this.applyFilters();
  },

  filterByCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.category });
    this.applyFilters();
  },

  changeSort(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      currentSortIndex: index,
      sortOrder: this.data.sortOrder === 'desc' ? 'asc' : 'desc'
    });

    if (this.data.sortDbFields[index]) {
      this.loadAssets();
    } else {
      this.applySort();
    }
  },

  applySort() {
    const { filteredAssets, currentSortIndex, sortOrder } = this.data;
    const sorted = [...filteredAssets];

    const getVal = (a, key) => {
      if (key === 'price') return Number(a.price) || 0;
      if (key === 'purchaseDate' || key === 'createdAt') return this.parseDate(a[key]).getTime();
      if (key === 'usedDays') return a.usedDays || 0;
      if (key === 'dailyCost') {
        if (a.status !== 'active') return 0;
        const days = (Date.now() - this.parseDate(a.purchaseDate).getTime()) / 86400000;
        return days > 0 ? a.price / days : 0;
      }
      return 0;
    };

    const fields = ['price', 'purchaseDate', 'createdAt', 'usedDays', 'dailyCost'];
    const field = fields[currentSortIndex];
    sorted.sort((a, b) => sortOrder === 'desc' ? getVal(b, field) - getVal(a, field) : getVal(a, field) - getVal(b, field));

    this.setData({ filteredAssets: sorted }, () => this.calculateStats());
  },

  goToAdd() {
    // 检查是否有分类,没有分类则提示用户先去添加
    if (!this.data.categoryList || this.data.categoryList.length === 0) {
      wx.showModal({
        title: '提示',
        content: '请先在设置中添加资产分类',
        confirmText: '去添加',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/category-manage/category-manage' });
          }
        }
      });
      return;
    }
    wx.navigateTo({ url: '/pages/asset-add/asset-add' });
  },

  switchToHome() {
    this.setData({ showSetting: false, showReport: false });
  },

  switchToReport() {
    this.setData({ showReport: true, showSetting: false });
    setTimeout(() => this.loadReportData(), 100);
  },

  navigateToCategoryManage() {
    this.setData({ _fromSetting: true });
    wx.navigateTo({ url: '/pages/category-manage/category-manage' });
  },

  navigateToUserStats() {
    wx.navigateTo({ url: '/pages/user-stats/user-stats' });
  },

  navigateToAccount() {
    wx.navigateTo({ url: '/pages/account/account' });
  },

  navigateToSetting() {
    this.setData({ showSetting: true, showReport: false });
  },

  showAboutInfo() {
    wx.showModal({
      title: '关于朝夕数计365',
      content: '朝夕数计365 —— 您的智能资产管理助手\n\n在这里，每一笔资产都有它的故事。记录购买价格、追踪服役时长、计算日均成本，让消费更透明，决策更智慧。\n\n愿您朝夕相伴，数计有方。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  goToDetail(e) {
    wx.navigateTo({ url: `/pages/asset-detail/asset-detail?id=${e.currentTarget.dataset.id}` });
  },

  onPullDownRefresh() {
    this.loadAssets();
    wx.stopPullDownRefresh();
  },

  onPageScroll(e) {
    const showBackToTop = e.scrollTop > 100;
    if (showBackToTop !== this.data.showBackToTop) {
      this.setData({ showBackToTop });
    }
  },

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  preventTouchMove() {},

  // ============================================
  // 批量删除
  // ============================================

  enterBatchDelete() {
    this.loadAllAssetsForBatch();
    this.setData({ showSetting: false, showBatchDelete: true, selectedAssets: [], selectedTotalPrice: '0.00', isAllSelected: false, batchSearchKeyword: '' });
  },

  exitBatchDelete() {
    this.setData({ showBatchDelete: false, showSetting: true, selectedAssets: [], selectedTotalPrice: '0.00', isAllSelected: false, batchAssetList: [], filteredBatchAssetList: [], batchSearchKeyword: '' });
  },

  async loadAllAssetsForBatch() {
    const app = getApp();
    wx.showLoading({ title: '加载中...' });

    try {
      const openid = await app.getOpenid();
      const db = wx.cloud.database({ env: app.globalData.envId });
      const res = await this.getAllAssetsWithPaging(db, { _openid: openid }, 'purchaseDate', 'desc');

      const list = await Promise.all(res.data.map(async asset => {
        let displayIcon = null;
        if (asset.icon?.startsWith('cloud://')) {
          try {
            const fileRes = await wx.cloud.getTempFileURL({ fileList: [asset.icon] });
            displayIcon = fileRes.fileList[0]?.tempFileURL;
          } catch (e) {}
        } else if (asset.icon?.startsWith('http')) {
          displayIcon = asset.icon;
        }

        const purchaseDate = this.formatDate(asset.purchaseDate);
        const endDate = this.formatDate(asset.retiredDate || asset.soldDate);
        const dateRange = asset.status === 'active' ? `${purchaseDate} - 至今` : `${purchaseDate} - ${endDate || '至今'}`;

        return { ...asset, displayIcon, _selected: false, dateRange };
      }));

      this.setData({ batchAssetList: list, filteredBatchAssetList: list, isAllSelected: false });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  toggleSelectAsset(e) {
    const id = e.currentTarget.dataset.id;
    const { batchAssetList, filteredBatchAssetList, selectedAssets } = this.data;
    const newSelected = selectedAssets.includes(id)
      ? selectedAssets.filter(x => x !== id)
      : [...selectedAssets, id];

    // 计算选中资产总金额
    const selectedTotalPrice = batchAssetList
      .filter(a => newSelected.includes(a._id))
      .reduce((sum, a) => sum + (Number(a.price) || 0), 0)
      .toFixed(2);

    const newBatchAssetList = batchAssetList.map(a => ({ ...a, _selected: newSelected.includes(a._id) }));
    const newFilteredList = filteredBatchAssetList.map(a => ({ ...a, _selected: newSelected.includes(a._id) }));

    this.setData({
      selectedAssets: newSelected,
      selectedTotalPrice,
      batchAssetList: newBatchAssetList,
      filteredBatchAssetList: newFilteredList,
      isAllSelected: newSelected.length === newFilteredList.length && newFilteredList.length > 0
    });
  },

  toggleSelectAll() {
    const { isAllSelected, batchAssetList, filteredBatchAssetList } = this.data;
    if (isAllSelected) {
      // 取消全选：只取消过滤列表中的选中
      const filteredIds = new Set(filteredBatchAssetList.map(a => a._id));
      const newSelected = this.data.selectedAssets.filter(id => !filteredIds.has(id));

      const newBatchAssetList = batchAssetList.map(a => ({
        ...a,
        _selected: newSelected.includes(a._id)
      }));
      const newFilteredList = filteredBatchAssetList.map(a => ({ ...a, _selected: false }));

      this.setData({
        selectedAssets: newSelected,
        selectedTotalPrice: newSelected.length > 0
          ? batchAssetList.filter(a => newSelected.includes(a._id))
              .reduce((sum, a) => sum + (Number(a.price) || 0), 0).toFixed(2)
          : '0.00',
        batchAssetList: newBatchAssetList,
        filteredBatchAssetList: newFilteredList,
        isAllSelected: false
      });
    } else {
      // 全选：选中过滤列表中的所有
      const filteredIds = new Set(filteredBatchAssetList.map(a => a._id));
      const newSelected = [...new Set([...this.data.selectedAssets, ...filteredIds])];

      const selectedTotalPrice = batchAssetList
        .filter(a => newSelected.includes(a._id))
        .reduce((sum, a) => sum + (Number(a.price) || 0), 0)
        .toFixed(2);

      const newBatchAssetList = batchAssetList.map(a => ({
        ...a,
        _selected: newSelected.includes(a._id)
      }));
      const newFilteredList = filteredBatchAssetList.map(a => ({ ...a, _selected: true }));

      this.setData({
        selectedAssets: newSelected,
        selectedTotalPrice,
        batchAssetList: newBatchAssetList,
        filteredBatchAssetList: newFilteredList,
        isAllSelected: true
      });
    }
  },

  onBatchSearchInput(e) {
    const keyword = e.detail.value.trim().toLowerCase();
    const { batchAssetList } = this.data;

    let filteredList = batchAssetList;
    if (keyword) {
      filteredList = batchAssetList.filter(asset => {
        const name = (asset.name || '').toLowerCase();
        const category = (asset.category || '').toLowerCase();
        return name.includes(keyword) || category.includes(keyword);
      });
    }

    this.setData({
      batchSearchKeyword: e.detail.value,
      filteredBatchAssetList: filteredList,
      isAllSelected: filteredList.length > 0 &&
        filteredList.every(a => this.data.selectedAssets.includes(a._id))
    });
  },

  clearBatchSearch() {
    const { batchAssetList } = this.data;
    this.setData({
      batchSearchKeyword: '',
      filteredBatchAssetList: batchAssetList,
      isAllSelected: batchAssetList.length > 0 &&
        batchAssetList.every(a => this.data.selectedAssets.includes(a._id))
    });
  },

  confirmBatchDelete() {
    const { selectedAssets } = this.data;
    if (selectedAssets.length === 0) {
      wx.showToast({ title: '请选择要删除的资产', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定删除选中的 ${selectedAssets.length} 项资产吗？`,
      confirmColor: '#FF7043',
      success: res => { if (res.confirm) this.executeBatchDelete(); }
    });
  },

  executeBatchDelete() {
    const { selectedAssets, batchSearchKeyword } = this.data;
    wx.showLoading({ title: '删除中...', mask: true });

    wx.cloud.callFunction({
      name: 'batchDeleteAssets',
      data: { assetIds: selectedAssets },
      success: res => {
        wx.hideLoading();
        if (res.result?.success) {
          const remaining = this.data.batchAssetList.filter(a => !selectedAssets.includes(a._id));

          // 根据当前搜索关键词过滤剩余列表
          let filteredRemaining = remaining;
          if (batchSearchKeyword) {
            const keyword = batchSearchKeyword.toLowerCase();
            filteredRemaining = remaining.filter(asset => {
              const name = (asset.name || '').toLowerCase();
              const category = (asset.category || '').toLowerCase();
              return name.includes(keyword) || category.includes(keyword);
            });
          }

          this.setData({
            batchAssetList: remaining,
            filteredBatchAssetList: filteredRemaining,
            selectedAssets: [],
            selectedTotalPrice: '0.00',
            isAllSelected: false
          });
          wx.showToast({ title: `已删除 ${selectedAssets.length} 项`, icon: 'success' });

          if (remaining.length === 0) {
            setTimeout(() => { this.exitBatchDelete(); this.loadAssets(); }, 1500);
          }
        } else {
          wx.showToast({ title: res.result?.error || '删除失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '删除失败', icon: 'none' });
      }
    });
  },

  // ============================================
  // 统计功能
  // ============================================

  async loadReportData() {
    this.setData({ reportLoading: true });

    const app = getApp();
    try {
      const openid = await app.getOpenid();
      const db = wx.cloud.database({ env: app.globalData.envId });
      const res = await this.getAllAssetsWithPaging(db, { _openid: openid }, 'purchaseDate', 'asc');

      const assets = res.data;

      // 计算分类统计和资产映射
      const categoryMap = {};
      const categoryAssetsMap = {}; // 分类资产映射
      let totalPrice = 0;
      let excludedPrice = 0; // 不计入总资产的金额
      let includedCount = 0; // 计入总资产的资产数
      let excludedCount = 0; // 不计入总资产的资产数

      // 状态统计
      let activeCount = 0, activePrice = 0;
      let retiredCount = 0, retiredPrice = 0;
      let soldCount = 0, soldPrice = 0;
      let dailyCostTotal = 0; // 日均成本（全部资产）

      // 先初始化所有分类
      const categoryList = this.data.categoryList || [];
      categoryList.forEach(c => {
        categoryMap[c.name] = { name: c.name, total: 0, count: 0, icon: c.icon || '', displayIcon: c.displayIcon || '' };
        categoryAssetsMap[c.name] = [];
      });

      // 使用 calculateAssetFields 处理每个资产，复用首页的计算逻辑
      const enrichedAssets = assets.map(a => this.calculateAssetFields(a));

      enrichedAssets.forEach(asset => {
        const cat = asset.category || '未分类';
        const price = Number(asset.price) || 0;
        if (!categoryMap[cat]) {
          categoryMap[cat] = { name: cat, total: 0, count: 0, icon: '', displayIcon: '' };
          categoryAssetsMap[cat] = [];
        }
        categoryMap[cat].total += price;
        categoryMap[cat].count++;
        categoryAssetsMap[cat].push({ name: asset.name, price: price });

        // 总资产 = 所有资产金额总和
        totalPrice += price;

        // 统计不计入总资产的金额
        if (asset.excludeTotal === true || asset.excludeTotal === 'true') {
          excludedPrice += price;
          excludedCount++;
        } else {
          includedCount++;
        }

        // 计算日均成本（全部资产）- 复用首页逻辑
        if (asset.status === 'active' && asset.dailyCost) {
          dailyCostTotal += parseFloat(asset.dailyCost);
        } else if ((asset.status === 'retired' || asset.status === 'sold') && asset.dailyEquivalent) {
          dailyCostTotal += parseFloat(asset.dailyEquivalent);
        }

        // 状态统计
        if (asset.status === 'active') {
          activeCount++;
          activePrice += price;
        } else if (asset.status === 'retired') {
          retiredCount++;
          retiredPrice += price;
        } else if (asset.status === 'sold') {
          soldCount++;
          soldPrice += price;
        }
      });

      const reportCategoryStats = Object.values(categoryMap)
        .sort((a, b) => b.total - a.total)
        .map(item => ({ ...item, totalFixed: item.total.toFixed(2) }));

      this.setData({
        reportLoading: false,
        reportEmpty: assets.length === 0,
        reportAssets: assets,
        reportTotalAssets: assets.length,
        reportTotalPrice: totalPrice.toFixed(2),
        reportExcludedPrice: excludedPrice.toFixed(2),
        reportIncludedCount: includedCount,
        reportExcludedCount: excludedCount,
        reportCategoryStats,
        reportCategoryAssetsMap: categoryAssetsMap,
        pieCenterText: '¥' + totalPrice.toFixed(2),
        pieCenterSubText: '总资产',
        // 状态统计
        reportActiveCount: activeCount,
        reportActivePrice: activePrice.toFixed(2),
        reportRetiredCount: retiredCount,
        reportRetiredPrice: retiredPrice.toFixed(2),
        reportSoldCount: soldCount,
        reportSoldPrice: soldPrice.toFixed(2),
        reportDailyCost: dailyCostTotal.toFixed(2)
      });

      if (assets.length > 0) {
        setTimeout(() => {
          this.initPieChart();
          this.initLineChart();
          this.calculateTimePeriodStats();
        }, 200);
      }
    } catch (err) {
      this.setData({ reportLoading: false, reportEmpty: true });
    }
  },

  initPieChart() {
    const { reportCategoryStats, reportColors, pieCenterText, pieCenterSubText } = this.data;
    if (!reportCategoryStats.length) return;

    const component = this.selectComponent('#pie-chart');
    if (!component) return;

    component.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });
      canvas.setChart(chart);

      const total = reportCategoryStats.reduce((sum, i) => sum + i.total, 0);
      const pieData = reportCategoryStats.map((item, i) => ({
        name: item.name,
        value: item.total
      }));

      // 保存 chart 实例以便后续更新
      this.pieChart = chart;
      this.pieTotal = total;

      chart.setOption({
        color: reportColors,
        tooltip: {
          trigger: 'item',
          confine: true,
          backgroundColor: '#fff',
          borderColor: '#eee',
          borderWidth: 1,
          padding: [8, 12],
          textStyle: {
            color: '#333',
            fontSize: 12
          },
          formatter: params => {
            const catName = params.name;
            const catValue = params.value;
            const catAssets = this.data.reportCategoryAssetsMap[catName] || [];
            const percent = ((catValue / total) * 100).toFixed(1);

            // 构建资产列表（纯文本格式）
            let assetList = catAssets.slice(0, 5).map(asset => `${asset.name}: ¥${asset.price}`).join('\n');
            if (catAssets.length > 5) {
              assetList += `\n... 等${catAssets.length}项`;
            }

            return `${catName}\n总计: ¥${catValue} (${percent}%)\n${assetList}`;
          }
        },
        legend: {
          type: 'scroll',
          orient: 'horizontal',
          bottom: 0,
          left: 'center'
        },
        // 中间文字 - z: -1 确保 tooltip 层级更高
        graphic: [{
          type: 'group',
          left: 'center',
          top: '32%',
          z: -1,
          children: [
            {
              type: 'text',
              left: 'center',
              top: '0',
              style: {
                fill: '#333',
                text: pieCenterText,
                font: 'bold 18px sans-serif',
                textAlign: 'center'
              }
            },
            {
              type: 'text',
              left: 'center',
              top: '24',
              style: {
                fill: '#999',
                text: pieCenterSubText,
                font: '12px sans-serif',
                textAlign: 'center'
              }
            }
          ]
        }],
        series: [{
          type: 'pie',
          radius: ['40%', '60%'],
          center: ['50%', '40%'],
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false },
          emphasis: {
            scale: true,
            label: { show: true, fontWeight: 'bold' }
          },
          data: pieData
        }]
      });

      // 点击事件
      chart.on('click', params => {
        if (params.componentType === 'series') {
          const value = params.value;
          const name = params.name;
          this.updatePieCenterText('¥' + value.toFixed(2), name);
        }
      });

      // 图例点击事件 - 重置为总金额
      chart.on('legendselectchanged', () => {
        this.updatePieCenterText('¥' + this.pieTotal.toFixed(2), '总资产');
      });

      return chart;
    });
  },

  // 更新环形图中间文字
  updatePieCenterText(text, subText) {
    if (!this.pieChart) return;

    this.pieChart.setOption({
      graphic: [{
        type: 'group',
        left: 'center',
        top: '32%',
        z: -1,
        children: [
          {
            type: 'text',
            left: 'center',
            top: '0',
            style: {
              fill: '#333',
              text: text,
              font: 'bold 18px sans-serif',
              textAlign: 'center'
            }
          },
          {
            type: 'text',
            left: 'center',
            top: '24',
            style: {
              fill: '#999',
              text: subText,
              font: '12px sans-serif',
              textAlign: 'center'
            }
          }
        ]
      }]
    });

    this.setData({
      pieCenterText: text,
      pieCenterSubText: subText
    });
  },

  initLineChart() {
    const { reportAssets } = this.data;
    if (!reportAssets.length) return;

    const component = this.selectComponent('#line-chart');
    if (!component) return;

    const sorted = [...reportAssets].sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));

    // 日期到资产的映射（同一天可能有多笔资产）
    const dateAssetsMap = {};
    sorted.forEach(a => {
      const d = new Date(a.purchaseDate);
      const dateKey = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
      if (!dateAssetsMap[dateKey]) {
        dateAssetsMap[dateKey] = [];
      }
      dateAssetsMap[dateKey].push(a);
    });

    component.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });
      canvas.setChart(chart);

      const dates = [];
      const dayPrices = [];

      // 按日期聚合
      const uniqueDates = [...new Set(sorted.map(a => {
        const d = new Date(a.purchaseDate);
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
      }))];

      uniqueDates.forEach(dateKey => {
        dates.push(dateKey);
        const dayAssets = dateAssetsMap[dateKey] || [];
        const dayTotal = dayAssets.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
        dayPrices.push(dayTotal);
      });

      // 保存映射供tooltip使用
      this.lineDateAssetsMap = dateAssetsMap;

      chart.setOption({
        color: ['#667eea'],
        tooltip: {
          trigger: 'axis',
          confine: true,
          backgroundColor: '#fff',
          borderColor: '#eee',
          borderWidth: 1,
          padding: [8, 12],
          textStyle: {
            color: '#333',
            fontSize: 12
          },
          formatter: params => {
            if (!params || !params.length) return '';
            const dateKey = params[0].axisValue;
            const dayTotal = params[0].value;
            const dayAssets = this.lineDateAssetsMap[dateKey] || [];

            let assetList = dayAssets.map(asset => `${asset.name}: ¥${Number(asset.price || 0).toFixed(2)}`).join('\n');

            return `${dateKey}\n金额: ¥${dayTotal.toFixed(2)}\n${assetList}`;
          }
        },
        legend: {
          data: ['每日资产'],
          top: 0
        },
        grid: {
          left: '3%',
          right: '3%',
          bottom: '8%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            fontSize: 10,
            rotate: dates.length > 6 ? 30 : 0
          },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: '¥{value}' },
          splitLine: { lineStyle: { type: 'dashed' } }
        },
        series: [
          {
            name: '每日资产',
            type: 'line',
            data: dayPrices,
            smooth: true,
            areaStyle: { opacity: 0.1 },
            symbol: 'circle',
            symbolSize: 6
          }
        ]
      });

      return chart;
    });
  },

  // ============================================
  // 时间段统计功能
  // ============================================

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

  // 按粒度分组统计
  groupAssetsByGranularity(assets, granularity) {
    if (!assets || assets.length === 0) {
      return {
        data: [],
        summary: { totalAmount: 0, totalCount: 0 }
      };
    }

    const groupMap = {};

    assets.forEach(asset => {
      const purchaseDate = new Date(asset.purchaseDate);
      let label;

      if (granularity === 'year') {
        label = purchaseDate.getFullYear().toString();
      } else if (granularity === 'quarter') {
        const year = purchaseDate.getFullYear();
        const quarter = Math.floor(purchaseDate.getMonth() / 3) + 1;
        label = `${year}Q${quarter}`;
      } else if (granularity === 'month') {
        const year = purchaseDate.getFullYear();
        const month = purchaseDate.getMonth() + 1;
        label = `${year}-${String(month).padStart(2, '0')}`;
      } else {
        // 非全部时间段，使用单组
        label = this.getTimePeriodLabel(this.data.activeTimePeriod);
      }

      if (!groupMap[label]) {
        groupMap[label] = { label, totalAmount: 0, count: 0, assets: [] };
      }
      groupMap[label].totalAmount += Number(asset.price) || 0;
      groupMap[label].count++;
      groupMap[label].assets.push({ name: asset.name, price: Number(asset.price) || 0 });
    });

    // 按时间排序
    const data = Object.values(groupMap).sort((a, b) => a.label.localeCompare(b.label));
    const totalAmount = data.reduce((sum, d) => sum + d.totalAmount, 0);
    const summary = {
      totalAmount: totalAmount.toFixed(2),
      totalCount: data.reduce((sum, d) => sum + d.count, 0)
    };

    return { data, summary };
  },

  // 获取时间段显示名称
  getTimePeriodLabel(period) {
    const labels = {
      week: '本周',
      month: '本月',
      quarter: '本季度',
      year: '本年',
      all: '全部'
    };
    return labels[period] || period;
  },

  // 计算时间段统计数据
  calculateTimePeriodStats() {
    const { reportAssets, activeTimePeriod, activeGranularity } = this.data;
    if (!reportAssets || reportAssets.length === 0) {
      this.setData({ timePeriodStats: null });
      return;
    }

    // 计算时间范围
    const { startDate, endDate } = this.getTimeRange(activeTimePeriod);

    // 筛选资产
    const filteredAssets = reportAssets.filter(a => {
      if (!a.purchaseDate) return false;
      const pd = new Date(a.purchaseDate);
      return pd >= startDate && pd <= endDate;
    });

    // 分组统计
    const granularity = activeTimePeriod === 'all' ? activeGranularity : null;
    const stats = this.groupAssetsByGranularity(filteredAssets, granularity);

    this.setData({ timePeriodStats: stats });

    // 更新图表
    setTimeout(() => this.initTimeChart(), 100);
  },

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

  // 初始化时间段柱状图
  initTimeChart() {
    const { timePeriodStats } = this.data;
    if (!timePeriodStats || timePeriodStats.data.length === 0) return;

    const component = this.selectComponent('#time-chart');
    if (!component) return;

    component.init((canvas, width, height, dpr) => {
      const chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr
      });
      canvas.setChart(chart);

      chart.setOption({
        color: ['#667eea'],
        tooltip: {
          trigger: 'axis',
          confine: true,
          backgroundColor: '#fff',
          borderColor: '#eee',
          borderWidth: 1,
          padding: [8, 12],
          textStyle: {
            color: '#333',
            fontSize: 12
          },
          formatter: params => {
            if (!params || !params.length) return '';
            const d = params[0];
            const dataItem = timePeriodStats.data[d.dataIndex];
            // 构建资产列表（最多显示5项）
            let assetList = dataItem.assets.slice(0, 5).map(a => `${a.name}: ¥${a.price.toFixed(2)}`).join('\n');
            if (dataItem.assets.length > 5) {
              assetList += `\n... 等${dataItem.assets.length}项`;
            }
            return `${d.name}\n金额: ¥${dataItem.totalAmount.toFixed(2)}\n数量: ${dataItem.count}件\n${assetList}`;
          }
        },
        grid: {
          left: '3%',
          right: '6%',
          bottom: '15%',
          top: '18%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: timePeriodStats.data.map(d => d.label),
          axisLabel: {
            fontSize: 10,
            rotate: timePeriodStats.data.length > 6 ? 30 : 0
          },
          axisTick: { show: false }
        },
        yAxis: [
          {
            type: 'value',
            name: '金额(元)',
            axisLabel: { formatter: '¥{value}' },
            splitLine: { lineStyle: { type: 'dashed' } }
          },
          {
            type: 'value',
            name: '数量(件)',
            axisLabel: { formatter: '{value}件' },
            splitLine: { show: false }
          }
        ],
        series: [{
          type: 'bar',
          yAxisIndex: 0,
          data: timePeriodStats.data.map(d => d.totalAmount),
          barMaxWidth: 40,
          itemStyle: {
            borderRadius: [4, 4, 0, 0]
          },
          label: {
            show: true,
            position: 'top',
            formatter: params => {
              const dataItem = timePeriodStats.data[params.dataIndex];
              return dataItem.count + '件';
            },
            fontSize: 10,
            color: '#666'
          }
        }]
      });

      this.timeChart = chart;
      return chart;
    });
  },

  // ============================================
  // 搜索功能
  // ============================================

  // 显示/隐藏搜索输入框
  toggleSearchInput() {
    if (this.data.showSearchInput) {
      // 关闭时恢复原状
      this.setData({
        searchKeyword: '',
        searchInputValue: '',
        showSearchInput: false,
        searchInputFocus: false
      });
      this.loadAssets('');  // 传入空字符串确保加载全部资产
    } else {
      // 先显示搜索框，延迟设置 focus 确保键盘弹出
      this.setData({
        showSearchInput: true,
        searchInputFocus: false
      });
      setTimeout(() => {
        this.setData({ searchInputFocus: true });
      }, 100);
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchInputValue: e.detail.value });
  },

  // 执行搜索
  doSearch() {
    const keyword = this.data.searchInputValue.trim();
    this.setData({ searchKeyword: keyword });
    this.loadAssets(keyword);
  },

  // 清空输入框内容
  clearSearch() {
    this.setData({
      searchInputValue: ''
    });
  },

  // 取消搜索 - 恢复原状
  cancelSearch() {
    this.setData({
      searchKeyword: '',
      searchInputValue: '',
      showSearchInput: false,
      searchInputFocus: false
    });
    this.loadAssets('');  // 传入空字符串确保加载全部资产
  }
});
