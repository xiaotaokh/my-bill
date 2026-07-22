// pages/user-stats/user-stats.js
const echarts = require('../../components/ec-canvas/echarts');
const { themeManager } = require('../../utils/themeManager');
const { supabase } = require('../../utils/supabase');
const { ADMIN_OPENID } = require('../../utils/auth');

const { PRESET_AVATARS } = require('../../utils/presetAvatars');

// 根据 openid 确定性选取默认头像（从30种SVG中按hash选取）
function getDefaultAvatar(openid) {
  if (!openid) return PRESET_AVATARS[0];
  var hash = 0;
  for (var i = 0; i < openid.length; i++) {
    hash = ((hash << 5) - hash) + openid.charCodeAt(i);
    hash = hash & hash; // 保证32位
  }
  var index = Math.abs(hash) % PRESET_AVATARS.length;
  return PRESET_AVATARS[index];
}

// SVG 图标路径（Lucide 风格）
const ICON_PATHS = {
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  box: '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>',
  lightning: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/>',
  trendingUp: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
};

function createSVGDataURI(pathData, strokeColor) {
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + strokeColor + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + pathData + '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

Page({
  data: {
    themeStyle: '',
    users: [],
    filteredUsers: [],
    loading: false,
    loadingMore: false,
    empty: false,

    // 分页
    userPage: 1,
    userPageSize: 20,
    userTotalCount: 0,
    userHasMore: false,

    // 搜索筛选
    searchKeyword: '',

    // 排序选项
    sortOptions: [
      { label: '最近访问', value: 'lastAccess' },
      { label: '资产数量', value: 'assetCount' },
      { label: '活跃度', value: 'activity' }
    ],
    sortIndex: 0,

    // 统计数据
    activeUserCount: 0,
    totalAssetCount: 0,

    // 访问统计
    todayCount: 0,
    todayUserCount: 0,
    totalAccessCount: 0,
    totalAccessUserCount: 0,
    accessChartData: [],
    rawChartData: [],       // 原始日粒度数据（聚合源）
    chartGranularity: 'day', // day | month | quarter | year
    chartDateStart: '',     // 自定义起始日期（YYYY-MM-DD）
    chartDateEnd: '',       // 自定义结束日期（YYYY-MM-DD）
    showDateFilter: false,  // 是否展示日期筛选面板
    showActiveModal: false, // 活跃客户弹窗
    activeModalData: { high: 0, medium: 0, low: 0, total: 0 },
    accessEc: { lazyLoad: true },

    // SVG 图标
    usersIcon: '',
    boxIcon: '',
    lightningIcon: '',
    calendarCheckIcon: '',
    calendarClockIcon: '',
    detailIcon: '',
    chartIcon: ''
  },

  onLoad() {
    themeManager.init();
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
      // 主题切换时重新生成图标和图表
      this.initIcons();
      setTimeout(() => this.initAccessChart(), 300);
    });
    this.initIcons();
    this.loadUserStats();
  },

  onPullDownRefresh() {
    this.loadUserStats(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 展开/收起用户资产
  toggleUserExpand(e) {
    const index = e.currentTarget.dataset.index;
    const filteredUsers = this.data.filteredUsers;
    filteredUsers[index]._expanded = !filteredUsers[index]._expanded;
    this.setData({ filteredUsers });
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });
    this.filterAndSortUsers();
  },

  // 清除搜索
  clearSearch() {
    this.setData({ searchKeyword: '' });
    this.filterAndSortUsers();
  },

  // 排序变化
  onSortChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ sortIndex: index });
    this.filterAndSortUsers();
  },

  // 筛选和排序用户
  filterAndSortUsers() {
    let filtered = [...this.data.users];

    // 搜索筛选
    if (this.data.searchKeyword) {
      const keyword = this.data.searchKeyword.toLowerCase();
      filtered = filtered.filter(user =>
        user.nickName.toLowerCase().includes(keyword)
      );
    }

    // 排序
    const sortValue = this.data.sortOptions[this.data.sortIndex].value;
    filtered.sort((a, b) => {
      if (sortValue === 'lastAccess') {
        const ta = a.lastAccessTime ? new Date(a.lastAccessTime).getTime() : 0;
        const tb = b.lastAccessTime ? new Date(b.lastAccessTime).getTime() : 0;
        return tb - ta;
      } else if (sortValue === 'assetCount') {
        return (b.assetCount || 0) - (a.assetCount || 0);
      } else if (sortValue === 'activity') {
        // 活跃度排序：high > medium > low
        const order = { high: 3, medium: 2, low: 1 };
        return (order[b.activityLevel] || 0) - (order[a.activityLevel] || 0);
      }
      return 0;
    });

    this.setData({ filteredUsers: filtered });
  },

  // 计算活跃度等级
  calculateActivityLevel(lastAccessTime) {
    if (!lastAccessTime) return { level: 'low', text: '低活跃' };

    const now = new Date();
    const last = new Date(lastAccessTime);
    const daysDiff = Math.floor((now - last) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
      return { level: 'high', text: '高活跃' };
    } else if (daysDiff <= 21) {
      return { level: 'medium', text: '中活跃' };
    } else {
      return { level: 'low', text: '低活跃' };
    }
  },

  // 计算统计数据
  calculateStats(users) {
    const now = new Date();

    // 活跃用户（7天内访问）
    const activeUsers = users.filter(user => {
      if (!user.lastAccessTime) return false;
      const last = new Date(user.lastAccessTime);
      const daysDiff = Math.floor((now - last) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    });

    // 资产总数
    const totalAssets = users.reduce((sum, user) => sum + (user.assetCount || 0), 0);

    this.setData({
      activeUserCount: activeUsers.length,
      totalAssetCount: totalAssets
    });
  },

  loadUserStats: function(callback) {
    if (this.data.loading) return;

    this.setData({ loading: true, empty: false, userPage: 1 });

    const app = getApp();
    const pageSize = this.data.userPageSize;
    app.getOpenid().then(openid => {
      // 调用 Supabase Edge Function 获取用户统计（传入分页参数）
      supabase.functions.invoke('get-user-stats', { openid: openid, page: 1, pageSize: pageSize }).then(result => {
      const { data, error } = result;

      if (error) {
        this.setData({ loading: false, empty: true });
        wx.showToast({ title: '获取数据失败', icon: 'none' });
        if (callback) callback();
        return;
      }

      var users = Array.isArray(data) ? data : ((data && data.users) || []);
      var accessStats = Array.isArray(data) ? null : (data && data.accessStats);
      var totalCount = (data && data.totalCount) || users.length;
      var hasMore = (data && data.hasMore) || false;
      var currentPage = (data && data.page) || 1;

      // 处理用户数据（Supabase URL 直接使用）
      // 计算今日日期用于"今日访问"判定
      var now = new Date();
      var chinaOffset = 8 * 60;
      var localOffset = now.getTimezoneOffset();
      var chinaNow = new Date(now.getTime() + (chinaOffset + localOffset) * 60000);
      var todayDateStr = chinaNow.toISOString().slice(0, 10);

      let processedUsers = users.map(user => {
        let avatarUrl = user.avatarUrl;

        if (!avatarUrl) {
          avatarUrl = getDefaultAvatar(user._openid);
        }

        // 计算活跃度
        const activity = this.calculateActivityLevel(user.lastAccessTime);

        // 判断是否今日访问
        var userLastDate = '';
        if (user.lastAccessTime) {
          var lastD = new Date(user.lastAccessTime);
          var chinaLastD = new Date(lastD.getTime() + (chinaOffset + lastD.getTimezoneOffset()) * 60000);
          userLastDate = chinaLastD.toISOString().slice(0, 10);
        }
        var isTodayAccess = userLastDate === todayDateStr;

        // 处理资产列表
        const assets = (user.assets || []).map(asset => {
          let assetIcon = asset.icon || '📦';
          let displayIcon = '';

          if (assetIcon && assetIcon.startsWith('http')) {
            displayIcon = assetIcon;
          }

          return {
            ...asset,
            icon: assetIcon,
            displayIcon: displayIcon
          };
        });

        // 格式化 totalAssetPrice 避免浮点数精度问题
        const totalAssetPriceText = (user.totalAssetPrice || 0).toFixed(2);

        return {
          ...user,
          avatarUrl: avatarUrl,
          canPreviewAvatar: this.canPreviewAvatar(avatarUrl),
          firstAccessText: this.formatTime(user.firstAccessTime),
          lastAccessText: this.formatTime(user.lastAccessTime),
          activityLevel: activity.level,
          activityLevelText: activity.text,
          isTodayAccess: isTodayAccess,
          assets: assets,
          totalAssetPriceText: totalAssetPriceText,
          _expanded: false
        };
      });

      // 过滤掉管理员
      processedUsers = processedUsers.filter(u => u._openid !== ADMIN_OPENID);

      // 全量统计数据优先用服务端返回值
      var serverActiveCount = (data && data.activeUserCount != null) ? data.activeUserCount : null;
      var serverAssetCount = (data && data.totalAssetCount != null) ? data.totalAssetCount : null;
      if (serverActiveCount != null || serverAssetCount != null) {
        this.setData({
          activeUserCount: serverActiveCount != null ? serverActiveCount : this.data.activeUserCount,
          totalAssetCount: serverAssetCount != null ? serverAssetCount : this.data.totalAssetCount
        });
      } else {
        this.calculateStats(processedUsers);
      }
      // 计算访问统计数据
      this.calculateAccessStats(users, accessStats);

      this.setData({
        users: processedUsers,
        filteredUsers: processedUsers,
        empty: processedUsers.length === 0 && totalCount === 0,
        loading: false,
        userPage: currentPage,
        userTotalCount: totalCount,
        userHasMore: hasMore
      });

      // 默认按最近访问排序
      this.filterAndSortUsers();

      // 延迟初始化图表（等 DOM 渲染完成）
      setTimeout(() => this.initAccessChart(), 300);

      if (callback) callback();
    }).catch(err => {
      console.error('获取用户统计失败:', err);
      this.setData({
        users: [],
        filteredUsers: [],
        empty: true,
        loading: false
      });
      wx.showToast({ title: '网络错误', icon: 'none' });
      if (callback) callback();
    });
    });
  },

  // 滚动到底部触发加载更多
  onReachBottom() {
    if (this.data.userHasMore && !this.data.loadingMore) {
      this.loadMoreUsers();
    }
  },

  // 加载更多用户（分页）
  loadMoreUsers() {
    if (this.data.loadingMore || !this.data.userHasMore) return;

    var self = this;
    var nextPage = this.data.userPage + 1;
    var pageSize = this.data.userPageSize;

    this.setData({ loadingMore: true });

    var app = getApp();
    app.getOpenid().then(function(openid) {
      supabase.functions.invoke('get-user-stats', { openid: openid, page: nextPage, pageSize: pageSize }).then(function(result) {
        var data = result.data;
        var error = result.error;

        if (error) {
          self.setData({ loadingMore: false });
          wx.showToast({ title: '加载失败', icon: 'none' });
          return;
        }

        var newUsers = (data && data.users) || [];
        var totalCount = (data && data.totalCount) || 0;
        var hasMore = (data && data.hasMore) || false;

        if (newUsers.length === 0) {
          self.setData({ loadingMore: false, userHasMore: false });
          return;
        }

        // 处理新用户数据（复用相同的处理逻辑）
        var nowDate = new Date();
        var chinaOff = 8 * 60;
        var localOff = nowDate.getTimezoneOffset();
        var chinaNow = new Date(nowDate.getTime() + (chinaOff + localOff) * 60000);
        var todayStr = chinaNow.toISOString().slice(0, 10);

        var processedUsers = newUsers.map(function(user) {
          var avatarUrl = user.avatarUrl;
          if (!avatarUrl) {
            avatarUrl = getDefaultAvatar(user._openid);
          }

          var activity = self.calculateActivityLevel(user.lastAccessTime);

          var userLastDate = '';
          if (user.lastAccessTime) {
            var lastD = new Date(user.lastAccessTime);
            var chinaLastD = new Date(lastD.getTime() + (chinaOff + lastD.getTimezoneOffset()) * 60000);
            userLastDate = chinaLastD.toISOString().slice(0, 10);
          }
          var isTodayAccess = userLastDate === todayStr;

          var assets = (user.assets || []).map(function(asset) {
            var assetIcon = asset.icon || '📦';
            var displayIcon = '';
            if (assetIcon && assetIcon.startsWith('http')) {
              displayIcon = assetIcon;
            }
            return {
              ...asset,
              icon: assetIcon,
              displayIcon: displayIcon
            };
          });

          var totalAssetPriceText = (user.totalAssetPrice || 0).toFixed(2);

          return {
            ...user,
            avatarUrl: avatarUrl,
            canPreviewAvatar: self.canPreviewAvatar(avatarUrl),
            firstAccessText: self.formatTime(user.firstAccessTime),
            lastAccessText: self.formatTime(user.lastAccessTime),
            activityLevel: activity.level,
            activityLevelText: activity.text,
            isTodayAccess: isTodayAccess,
            assets: assets,
            totalAssetPriceText: totalAssetPriceText,
            _expanded: false
          };
        });

        // 过滤管理员
        processedUsers = processedUsers.filter(function(u) { return u._openid !== ADMIN_OPENID; });

        // 追加到现有列表
        var allUsers = self.data.users.concat(processedUsers);
        var allFiltered = self.data.filteredUsers.concat(processedUsers);

        // 全量统计用服务端返回值
        if (data.activeUserCount != null || data.totalAssetCount != null) {
          self.setData({
            activeUserCount: data.activeUserCount != null ? data.activeUserCount : self.data.activeUserCount,
            totalAssetCount: data.totalAssetCount != null ? data.totalAssetCount : self.data.totalAssetCount
          });
        } else {
          self.calculateStats(allUsers);
        }

        self.setData({
          users: allUsers,
          filteredUsers: allFiltered,
          loadingMore: false,
          userPage: nextPage,
          userTotalCount: totalCount,
          userHasMore: hasMore
        });

        // 重新筛选排序
        self.filterAndSortUsers();
      }).catch(function() {
        self.setData({ loadingMore: false });
        wx.showToast({ title: '网络错误', icon: 'none' });
      });
    });
  },

  // 计算访问统计数据：按自然日补齐空日期，用于每日折线图
  calculateAccessStats(users, accessStats) {
    const now = new Date();
    const chinaOffset = 8 * 60;
    const localOffset = now.getTimezoneOffset();
    const chinaNow = new Date(now.getTime() + (chinaOffset + localOffset) * 60000);
    const todayDateStr = chinaNow.toISOString().slice(0, 10);

    let todayCount = 0;
    // date -> { count, users: [{ name, assetCount }] }
    var dateData = {};

    function parseDateKey(dateStr) {
      var parts = dateStr.split('-').map(function(item) { return parseInt(item, 10); });
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function formatDateKey(date) {
      var year = date.getFullYear();
      var month = String(date.getMonth() + 1).padStart(2, '0');
      var day = String(date.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    }

    function normalizeChartData(rawChartData) {
      if (!rawChartData || rawChartData.length === 0) return [];

      var rawDateData = {};
      rawChartData.forEach(function(item) {
        var fullDate = item.fullDate || item.date;
        if (!fullDate) return;
        rawDateData[fullDate] = {
          count: item.count || 0,
          users: item.users || []
        };
      });

      var rawDates = Object.keys(rawDateData).sort();
      if (rawDates.length === 0) return [];

      var firstDate = parseDateKey(rawDates[0]);
      var lastDate = parseDateKey(rawDates[rawDates.length - 1]);
      var todayDate = parseDateKey(todayDateStr);
      if (todayDate > lastDate) {
        lastDate = todayDate;
      }

      var fullDayData = {};
      var cursor = new Date(firstDate.getTime());
      while (cursor <= lastDate) {
        var key = formatDateKey(cursor);
        fullDayData[key] = rawDateData[key] || { count: 0, users: [] };
        cursor.setDate(cursor.getDate() + 1);
      }

      return Object.keys(fullDayData).sort().map(function(date) {
        var d = fullDayData[date];
        return { date: date.slice(5), count: d.count, fullDate: date, users: d.users };
      });
    }

    if (accessStats && accessStats.chartData) {
      var normalizedData = normalizeChartData(accessStats.chartData);
      this.setData({
        todayCount: accessStats.todayCount || 0,
        todayUserCount: accessStats.todayUserCount || 0,
        totalAccessCount: accessStats.totalCount || 0,
        totalAccessUserCount: accessStats.totalUserCount || 0,
        rawChartData: normalizedData,
        accessChartData: normalizedData
      });
      // 应用当前粒度聚合
      this.applyChartAggregation();
      // 如果后端返回空数据，继续走本地兜底覆盖
      if (accessStats.totalCount > 0) return;
    }

    function getChinaDateStr(user) {
      if (!user.lastAccessTime) return null;
      var d = new Date(user.lastAccessTime);
      var chinaD = new Date(d.getTime() + (chinaOffset + d.getTimezoneOffset()) * 60000);
      return chinaD.toISOString().slice(0, 10);
    }

    users.forEach(function(user) {
      if (user._openid === ADMIN_OPENID) return;
      var dateStr = getChinaDateStr(user);
      if (!dateStr) return;
      if (dateStr === todayDateStr) todayCount++;
      if (!dateData[dateStr]) dateData[dateStr] = { count: 0, users: [] };
      dateData[dateStr].count++;
      dateData[dateStr].users.push({
        name: user.nickName || '未知用户',
        assetCount: user.assetCount || 0,
        assetPrice: user.totalAssetPrice || 0
      });
    });

    var dates = Object.keys(dateData).sort();
    if (dates.length === 0) {
      this.setData({ todayCount: 0, totalAccessCount: 0, accessChartData: [], rawChartData: [] });
      return;
    }

    var firstDate = parseDateKey(dates[0]);
    var lastDate = parseDateKey(dates[dates.length - 1]);
    var todayDate = parseDateKey(todayDateStr);
    if (todayDate > lastDate) {
      lastDate = todayDate;
    }
    var fullDayData = {};
    var cursor = new Date(firstDate.getTime());

    while (cursor <= lastDate) {
      var key = formatDateKey(cursor);
      fullDayData[key] = dateData[key] || { count: 0, users: [] };
      cursor.setDate(cursor.getDate() + 1);
    }

    var accessChartData = Object.keys(fullDayData).sort().map(function(date) {
      var d = fullDayData[date];
      return { date: date.slice(5), count: d.count, fullDate: date, users: d.users };
    });

    this.setData({
      todayCount: todayCount,
      todayUserCount: todayCount,
      totalAccessCount: users.filter(function(user) {
        return user._openid !== ADMIN_OPENID && !!user.lastAccessTime;
      }).length,
      totalAccessUserCount: users.filter(function(user) {
        return user._openid !== ADMIN_OPENID && !!user.lastAccessTime;
      }).length,
      rawChartData: accessChartData,
      accessChartData: accessChartData
    });
    // 应用当前粒度聚合
    this.applyChartAggregation();
  },

  // ============================================
  // 图表粒度聚合 — 日/月/季度/年
  // ============================================

  // 从原始日粒度数据按粒度聚合
  applyChartAggregation() {
    var rawData = this.data.rawChartData || [];
    var granularity = this.data.chartGranularity || 'day';
    var dateStart = this.data.chartDateStart || '';
    var dateEnd = this.data.chartDateEnd || '';

    // 1. 日期范围筛选
    var filtered = rawData;
    if (dateStart) {
      filtered = filtered.filter(function(d) { return d.fullDate >= dateStart; });
    }
    if (dateEnd) {
      filtered = filtered.filter(function(d) { return d.fullDate <= dateEnd; });
    }

    if (filtered.length === 0) {
      this.setData({ accessChartData: [] });
      return;
    }

    // 2. 按粒度聚合
    var aggregated;
    if (granularity === 'day') {
      aggregated = filtered;
    } else if (granularity === 'month') {
      aggregated = this._aggregateByMonth(filtered);
    } else if (granularity === 'quarter') {
      aggregated = this._aggregateByQuarter(filtered);
    } else if (granularity === 'year') {
      aggregated = this._aggregateByYear(filtered);
    } else {
      aggregated = filtered;
    }

    this.setData({ accessChartData: aggregated });
  },

  // 按月聚合
  _aggregateByMonth(dailyData) {
    var monthMap = {};
    dailyData.forEach(function(day) {
      var parts = day.fullDate.split('-');
      var monthKey = parts[0] + '-' + parts[1]; // "2024-01"
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { count: 0, userMap: {} };
      }
      monthMap[monthKey].count += day.count;
      // 合并用户（按 name 去重，累加访问次数）
      (day.users || []).forEach(function(u) {
        var nameKey = u.name || '未知';
        if (!monthMap[monthKey].userMap[nameKey]) {
          monthMap[monthKey].userMap[nameKey] = {
            name: nameKey,
            assetCount: u.assetCount || 0,
            assetPrice: u.assetPrice || 0,
            visitCount: 0
          };
        }
        monthMap[monthKey].userMap[nameKey].visitCount += (u.visitCount || 1);
      });
    });

    var keys = Object.keys(monthMap).sort();
    return keys.map(function(key) {
      var m = monthMap[key];
      var parts = key.split('-');
      return {
        date: parseInt(parts[1], 10) + '月',
        fullDate: key,
        count: m.count,
        users: Object.keys(m.userMap).map(function(k) { return m.userMap[k]; })
      };
    });
  },

  // 按季度聚合
  _aggregateByQuarter(dailyData) {
    var quarterMap = {};
    dailyData.forEach(function(day) {
      var parts = day.fullDate.split('-');
      var year = parts[0];
      var q = Math.ceil(parseInt(parts[1], 10) / 3);
      var quarterKey = year + 'Q' + q; // "2024Q1"
      if (!quarterMap[quarterKey]) {
        quarterMap[quarterKey] = { count: 0, userMap: {} };
      }
      quarterMap[quarterKey].count += day.count;
      (day.users || []).forEach(function(u) {
        var nameKey = u.name || '未知';
        if (!quarterMap[quarterKey].userMap[nameKey]) {
          quarterMap[quarterKey].userMap[nameKey] = {
            name: nameKey,
            assetCount: u.assetCount || 0,
            assetPrice: u.assetPrice || 0,
            visitCount: 0
          };
        }
        quarterMap[quarterKey].userMap[nameKey].visitCount += (u.visitCount || 1);
      });
    });

    var keys = Object.keys(quarterMap).sort();
    return keys.map(function(key) {
      var q = quarterMap[key];
      return {
        date: key,
        fullDate: key,
        count: q.count,
        users: Object.keys(q.userMap).map(function(k) { return q.userMap[k]; })
      };
    });
  },

  // 按年聚合
  _aggregateByYear(dailyData) {
    var yearMap = {};
    dailyData.forEach(function(day) {
      var yearKey = day.fullDate.split('-')[0]; // "2024"
      if (!yearMap[yearKey]) {
        yearMap[yearKey] = { count: 0, userMap: {} };
      }
      yearMap[yearKey].count += day.count;
      (day.users || []).forEach(function(u) {
        var nameKey = u.name || '未知';
        if (!yearMap[yearKey].userMap[nameKey]) {
          yearMap[yearKey].userMap[nameKey] = {
            name: nameKey,
            assetCount: u.assetCount || 0,
            assetPrice: u.assetPrice || 0,
            visitCount: 0
          };
        }
        yearMap[yearKey].userMap[nameKey].visitCount += (u.visitCount || 1);
      });
    });

    var keys = Object.keys(yearMap).sort();
    return keys.map(function(key) {
      var y = yearMap[key];
      return {
        date: key + '年',
        fullDate: key,
        count: y.count,
        users: Object.keys(y.userMap).map(function(k) { return y.userMap[k]; })
      };
    });
  },

  // 切换图表粒度
  switchGranularity(e) {
    var granularity = e.currentTarget.dataset.granularity;
    if (granularity === this.data.chartGranularity) return;
    this.setData({ chartGranularity: granularity });
    this.applyChartAggregation();
    var self = this;
    setTimeout(function() { self.initAccessChart(); }, 200);
  },

  // 切换日期筛选面板
  toggleDateFilter() {
    this.setData({ showDateFilter: !this.data.showDateFilter });
  },

  // 起始日期变更
  onDateStartChange(e) {
    this.setData({ chartDateStart: e.detail.value });
    this.applyChartAggregation();
    var self = this;
    setTimeout(function() { self.initAccessChart(); }, 200);
  },

  // 结束日期变更
  onDateEndChange(e) {
    this.setData({ chartDateEnd: e.detail.value });
    this.applyChartAggregation();
    var self = this;
    setTimeout(function() { self.initAccessChart(); }, 200);
  },

  // 清除日期筛选
  clearDateFilter() {
    this.setData({ chartDateStart: '', chartDateEnd: '', showDateFilter: false });
    this.applyChartAggregation();
    var self = this;
    setTimeout(function() { self.initAccessChart(); }, 200);
  },

  // 初始化访问趋势图表（每日折线 + 长周期滚动）
  initAccessChart() {
    var chartData = this.data.accessChartData;
    if (!chartData || chartData.length === 0) return;

    var themeColors = themeManager.getThemeColors();
    var isBarChart = this.data.chartGranularity === 'quarter' || this.data.chartGranularity === 'year';
    var component = this.selectComponent('#access-chart');
    if (!component) return;

    component.init(function(canvas, width, height, dpr) {
      var chart = echarts.init(canvas, null, {
        width: width, height: height, devicePixelRatio: dpr
      });
      canvas.setChart(chart);

      var areaGradientColor = {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: themeColors.primary400 },
          { offset: 1, color: 'rgba(255, 255, 255, 0)' }
        ]
      };
      var showDataZoom = chartData.length > 31;
      var startPercent = showDataZoom ? Math.max(0, 100 - Math.round(31 / chartData.length * 100)) : 0;
      var labelInterval = 0;
      if (chartData.length > 90) {
        labelInterval = 14;
      } else if (chartData.length > 60) {
        labelInterval = 9;
      } else if (chartData.length > 31) {
        labelInterval = 6;
      } else if (chartData.length > 15) {
        labelInterval = 2;
      }

      function formatAxisDate(value) {
        if (!value) return '';
        var parts = String(value).split('-');
        if (parts.length === 3) {
          return parts[0] + '/' + parseInt(parts[1], 10) + '/' + parseInt(parts[2], 10);
        }
        if (parts.length === 2) {
          return parseInt(parts[0], 10) + '/' + parseInt(parts[1], 10);
        }
        return value;
      }

      function truncateByWidth(value, maxWidth) {
        var text = String(value || '');
        var width = 0;
        var result = '';
        for (var i = 0; i < text.length; i++) {
          var charWidth = text.charCodeAt(i) > 255 ? 2 : 1;
          if (width + charWidth > maxWidth) {
            return result + '..';
          }
          result += text[i];
          width += charWidth;
        }
        return result;
      }

      chart.setOption({
        color: [themeColors.primary600],
        animationDuration: 800,
        animationEasing: 'cubicOut',
        tooltip: {
          trigger: 'axis',
          triggerOn: 'mousemove',
          confine: true,
          backgroundColor: themeColors.bgCard,
          borderColor: themeColors.borderLight,
          borderWidth: 1,
          padding: [10, 14],
          textStyle: {
            color: themeColors.textDefault,
            fontSize: 12
          },
          formatter: function(params) {
            if (!params || !params.length) return '';
            var d = params[0];
            var dataItem = chartData[d.dataIndex];
            var title = dataItem && dataItem.fullDate ? dataItem.fullDate : d.name;
            var header = formatAxisDate(title) + '  ' + d.value + '次';

            if (!dataItem || !dataItem.users || dataItem.users.length === 0) {
              return header;
            }

            var list = dataItem.users.slice(0, 5);
            var sepLen = Math.max(header.length - 2, 10);
            var lines = [header, new Array(sepLen + 1).join('─')];
            for (var i = 0; i < list.length; i++) {
              var u = list[i];
              var name = truncateByWidth(u.name || '未知', 8);
              var count = (u.visitCount || u.assetCount || 0) + (u.visitCount ? '次' : '件');
              var price = '¥' + Number(u.assetPrice).toFixed(0);
              lines.push(name + '  ' + count + '  ' + price);
            }
            if (dataItem.users.length > 5) {
              lines.push('...还有' + (dataItem.users.length - 5) + '人');
            }
            return lines.join('\n');
          }
        },
        grid: { left: '3%', right: '6%', bottom: showDataZoom ? '14%' : '9%', top: '12%', containLabel: true },
        xAxis: {
          type: 'category',
          data: chartData.map(function(d) { return d.fullDate || d.date; }),
          boundaryGap: isBarChart,
          axisLabel: {
            fontSize: 10,
            color: themeColors.textHint,
            interval: labelInterval,
            rotate: 0,
            margin: 6,
            formatter: formatAxisDate
          },
          axisLine: { lineStyle: { color: themeColors.borderDefault } },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: themeColors.textHint, fontSize: 10 },
          splitLine: { lineStyle: { type: 'dashed', color: themeColors.borderLight } }
        },
        dataZoom: showDataZoom ? [
          {
            type: 'inside',
            start: startPercent,
            end: 100
          },
          {
            type: 'slider',
            height: 12,
            bottom: 2,
            start: startPercent,
            end: 100,
            borderColor: themeColors.borderLight,
            fillerColor: themeColors.primary200 || themeColors.primary400,
            handleStyle: { color: themeColors.primary600 },
            textStyle: { color: themeColors.textHint }
          }
        ] : [],
        series: [isBarChart ? {
          name: '访问次数',
          type: 'bar',
          barMaxWidth: 40,
          barMinWidth: 16,
          itemStyle: {
            color: themeColors.primary600,
            borderRadius: [6, 6, 0, 0]
          },
          emphasis: {
            itemStyle: { color: themeColors.primary700 || themeColors.primary600 }
          },
          data: chartData.map(function(d) { return d.count; })
        } : {
          name: '访问次数',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: chartData.length <= 45,
          lineStyle: { width: 3, color: themeColors.primary600 },
          itemStyle: {
            color: themeColors.primary600,
            borderColor: themeColors.bgCard,
            borderWidth: 2
          },
          areaStyle: {
            color: areaGradientColor,
            opacity: 0.24
          },
          emphasis: {
            focus: 'series',
            itemStyle: { color: themeColors.primary700 || themeColors.primary600 }
          },
          data: chartData.map(function(d) { return d.count; })
        }]
      });

      return chart;
    });
  },

  // 生成 SVG 图标（使用主题色）
  initIcons() {
    var colors = themeManager.getThemeColors();
    // 主指标图标用 primary 色，比 textMuted 更显眼
    var mainColor = colors.primary400;
    var mutedColor = colors.textMuted;
    this.setData({
      // 主指标图标 — primary 色，更醒目
      usersIcon: createSVGDataURI(ICON_PATHS.users, mainColor),
      boxIcon: createSVGDataURI(ICON_PATHS.box, mainColor),
      lightningIcon: createSVGDataURI(ICON_PATHS.lightning, mainColor),
      // 访问统计图标 — 今日用太阳突出，全部用层叠低调
      calendarCheckIcon: createSVGDataURI(ICON_PATHS.sun, mainColor),
      calendarClockIcon: createSVGDataURI(ICON_PATHS.layers, mutedColor),
      // 辅助图标
      detailIcon: createSVGDataURI(ICON_PATHS.info, mutedColor),
      chartIcon: createSVGDataURI(ICON_PATHS.trendingUp, mutedColor)
    });
  },

  showActiveUserDetail() {
    var users = this.data.users || [];
    var high = 0, medium = 0, low = 0;

    users.forEach(function(u) {
      var level = this.calculateActivityLevel(u.lastAccessTime);
      if (level.level === 'high') high++;
      else if (level.level === 'medium') medium++;
      else low++;
    }.bind(this));

    this.setData({
      showActiveModal: true,
      activeModalData: { high: high, medium: medium, low: low, total: users.length }
    });
  },

  closeActiveModal() {
    this.setData({ showActiveModal: false });
    // 图表 canvas 被 wx:if 销毁，弹窗关闭后重新渲染
    var self = this;
    setTimeout(function() { self.initAccessChart(); }, 300);
  },

  formatTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 预览资产图标原图
  previewIcon(e) {
    const iconUrl = e.currentTarget.dataset.icon;
    if (iconUrl) {
      wx.previewImage({
        current: iconUrl,
        urls: [iconUrl]
      });
    }
  },

  canPreviewAvatar(avatarUrl) {
    if (!avatarUrl) return false;
    // 内置 SVG 头像不支持预览
    if (avatarUrl.startsWith('data:image')) return false;
    if (avatarUrl.toLowerCase().endsWith('.svg')) return false;
    return true;
  },

  // 预览用户自定义头像
  previewAvatar(e) {
    const avatarUrl = e.currentTarget.dataset.avatar;
    if (!this.canPreviewAvatar(avatarUrl)) {
      this.toggleUserExpand(e);
      return;
    }

    wx.previewImage({
      current: avatarUrl,
      urls: [avatarUrl]
    });
  },

  // 头像加载失败显示内置默认头像
  onAvatarError(e) {
    const index = e.currentTarget.dataset.index;
    const user = this.data.filteredUsers[index];
    if (!user || user._avatarFallback) return;
    user._avatarFallback = true;
    var data = {};
    data['filteredUsers[' + index + '].avatarUrl'] = getDefaultAvatar(user._openid);
    data['filteredUsers[' + index + '].canPreviewAvatar'] = false;
    this.setData(data);
  },

  // 删除用户
  deleteUser(e) {
    const openid = e.currentTarget.dataset.openid;
    const name = e.currentTarget.dataset.name;

    // 防止删除管理员自身
    if (openid === ADMIN_OPENID) {
      wx.showToast({ title: '不能删除管理员账号', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除用户「${name}」及其所有资产、分类和图片数据吗？此操作不可恢复！`,
      cancelText: '取消',
      confirmText: '确认删除',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          this.doDeleteUser(openid, name);
        }
      }
    });
  },

  doDeleteUser(openid, name) {
    wx.showLoading({ title: '删除中...' });

    const app = getApp();
    app.getOpenid().then(adminOpenid => {
      supabase.functions.invoke('delete-user', {
        admin_openid: adminOpenid,
        target_openid: openid
      }).then(result => {
        wx.hideLoading();

        const { data, error } = result;

        if (error) {
          wx.showToast({ title: '删除失败：' + (error.message || '未知错误'), icon: 'none', duration: 3000 });
          return;
        }

        if (data && data.success) {
          wx.showToast({ title: '已删除用户', icon: 'success' });

          // 从本地列表中移除该用户
          const users = this.data.users.filter(u => u._openid !== openid);
          var newTotal = Math.max(0, (this.data.userTotalCount || users.length) - 1);
          this.setData({ users, userTotalCount: newTotal });
          this.filterAndSortUsers();
          this.calculateStats(users);
          this.calculateAccessStats(users);
          setTimeout(() => this.initAccessChart(), 300);

          if (users.length === 0) {
            this.setData({ empty: true, userHasMore: false });
          }
        } else {
          const errMsg = (data && data.message) || '部分删除操作失败';
          wx.showToast({ title: errMsg, icon: 'none', duration: 3000 });
          if (data && data.errors && data.errors.length > 0) {
            console.error('删除用户失败详情:', data.errors);
          }
        }
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
        console.error('删除用户请求失败:', err);
      });
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '身份验证失败', icon: 'none' });
    });
  }
});
