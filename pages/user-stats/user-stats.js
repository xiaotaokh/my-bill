// pages/user-stats/user-stats.js
const echarts = require('../../components/ec-canvas/echarts');
const { themeManager } = require('../../utils/themeManager');
const { supabase } = require('../../utils/supabase');
const { ADMIN_OPENID } = require('../../utils/auth');

// 内置默认头像列表（8种不同颜色的简单 SVG）
const DEFAULT_AVATARS = [
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%234F46E5%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23fff%22%3E😀%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23EA580C%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23fff%22%3E😊%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23059669%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23fff%22%3E😎%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%238B5CF6%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23fff%22%3E🤩%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23EC4899%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23fff%22%3E😍%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%233B82F6%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23fff%22%3E😋%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%23F59E0B%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23fff%22%3E🤗%3C/text%3E%3C/svg%3E',
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%22%2310B981%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23fff%22%3E😄%3C/text%3E%3C/svg%3E'
];

// 根据 openid 确定性选取默认头像
function getDefaultAvatar(openid) {
  if (!openid) return DEFAULT_AVATARS[0];
  var hash = 0;
  for (var i = 0; i < openid.length; i++) {
    hash = ((hash << 5) - hash) + openid.charCodeAt(i);
    hash = hash & hash; // 保证32位
  }
  var index = Math.abs(hash) % DEFAULT_AVATARS.length;
  return DEFAULT_AVATARS[index];
}

// SVG 图标路径（Lucide 风格）
const ICON_PATHS = {
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  box: '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>',
  lightning: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  calendarCheck: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/>',
  calendarClock: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="12 14 12 18 15 18"/>',
  trendingUp: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'
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
    empty: false,

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
    yesterdayCount: 0,
    accessChartData: [],
    accessEc: { lazyLoad: true },

    // SVG 图标
    usersIcon: '',
    boxIcon: '',
    lightningIcon: '',
    calendarCheckIcon: '',
    calendarClockIcon: '',
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

    if (daysDiff <= 3) {
      return { level: 'high', text: '高活跃' };
    } else if (daysDiff <= 14) {
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

    this.setData({ loading: true, empty: false });

    const app = getApp();
    app.getOpenid().then(openid => {
      // 调用 Supabase Edge Function 获取用户统计（传入 openid 用于鉴权）
      supabase.functions.invoke('get-user-stats', { openid: openid }).then(result => {
      const { data, error } = result;

      if (error) {
        this.setData({ loading: false, empty: true });
        wx.showToast({ title: '获取数据失败', icon: 'none' });
        if (callback) callback();
        return;
      }

      const users = data || [];

      // 处理用户数据（Supabase URL 直接使用）
      let processedUsers = users.map(user => {
        let avatarUrl = user.avatarUrl;

        if (!avatarUrl) {
          avatarUrl = getDefaultAvatar(user._openid);
        }

        // 计算活跃度
        const activity = this.calculateActivityLevel(user.lastAccessTime);

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

        return {
          ...user,
          avatarUrl: avatarUrl,
          firstAccessText: this.formatTime(user.firstAccessTime),
          lastAccessText: this.formatTime(user.lastAccessTime),
          activityLevel: activity.level,
          activityLevelText: activity.text,
          assets: assets,
          _expanded: false
        };
      });

      // 过滤掉管理员
      processedUsers = processedUsers.filter(u => u._openid !== ADMIN_OPENID);

      // 计算统计数据
      this.calculateStats(processedUsers);
      // 计算访问统计数据
      this.calculateAccessStats(users);

      this.setData({
        users: processedUsers,
        filteredUsers: processedUsers,
        empty: processedUsers.length === 0,
        loading: false
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

  // 计算访问统计数据（收集所有日期，支持长周期滚动）
  calculateAccessStats(users) {
    const now = new Date();
    const chinaOffset = 8 * 60;
    const localOffset = now.getTimezoneOffset();
    const chinaNow = new Date(now.getTime() + (chinaOffset + localOffset) * 60000);
    const todayDateStr = chinaNow.toISOString().slice(0, 10);
    const yesterdayDate = new Date(chinaNow);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayDateStr = yesterdayDate.toISOString().slice(0, 10);

    let todayCount = 0;
    let yesterdayCount = 0;
    // date -> { count, users: [{ name, assetCount }] }
    var dateData = {};

    function getChinaDateStr(user) {
      if (!user.lastAccessTime) return null;
      var d = new Date(user.lastAccessTime);
      var chinaD = new Date(d.getTime() + (chinaOffset + d.getTimezoneOffset()) * 60000);
      return chinaD.toISOString().slice(0, 10);
    }

    users.forEach(function(user) {
      var dateStr = getChinaDateStr(user);
      if (!dateStr) return;
      if (dateStr === todayDateStr) todayCount++;
      if (dateStr === yesterdayDateStr) yesterdayCount++;
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
      this.setData({ todayCount: 0, yesterdayCount: 0, accessChartData: [] });
      return;
    }

    var firstDate = new Date(dates[0]);
    var lastDate = new Date(dates[dates.length - 1]);
    var totalDays = Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;

    var accessChartData;
    if (totalDays > 90) {
      // 按月聚合（不展示用户明细）
      var monthMap = {};
      users.forEach(function(user) {
        var dateStr = getChinaDateStr(user);
        if (!dateStr) return;
        var monthKey = dateStr.slice(0, 7);
        if (!monthMap[monthKey]) monthMap[monthKey] = { count: 0 };
        monthMap[monthKey].count++;
      });
      accessChartData = Object.keys(monthMap).sort().map(function(m) {
        return { date: m.slice(5), count: monthMap[m].count, fullDate: m };
      });
    } else {
      // 按日展示，补全空日期
      var fullDayData = {};
      var cursor = new Date(firstDate);
      while (cursor <= lastDate) {
        var key = cursor.toISOString().slice(0, 10);
        fullDayData[key] = dateData[key] || { count: 0, users: [] };
        cursor.setDate(cursor.getDate() + 1);
      }
      accessChartData = Object.keys(fullDayData).sort().map(function(date) {
        var d = fullDayData[date];
        return { date: date.slice(5), count: d.count, fullDate: date, users: d.users };
      });
    }

    this.setData({ todayCount: todayCount, yesterdayCount: yesterdayCount, accessChartData: accessChartData });
  },

  // 初始化访问趋势图表（渐变柱状 + 滚动缩放）
  initAccessChart() {
    var chartData = this.data.accessChartData;
    if (!chartData || chartData.length === 0) return;

    var themeColors = themeManager.getThemeColors();
    var component = this.selectComponent('#access-chart');
    if (!component) return;

    component.init(function(canvas, width, height, dpr) {
      var chart = echarts.init(canvas, null, {
        width: width, height: height, devicePixelRatio: dpr
      });
      canvas.setChart(chart);

      // 渐变颜色
      var gradientColor = {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: themeColors.primary400 },
          { offset: 1, color: themeColors.primary600 }
        ]
      };

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
          textStyle: { color: themeColors.textDefault, fontSize: 12 },
          formatter: function(params) {
            if (!params || !params.length) return '';
            var d = params[0];
            var dataItem = chartData[d.dataIndex];
            var text = d.name + '\n访问人数: ' + d.value + '人';
            if (dataItem && dataItem.users && dataItem.users.length > 0) {
              var list = dataItem.users.slice(0, 10);
              for (var i = 0; i < list.length; i++) {
                var u = list[i];
                text += '\n  ' + u.name + '  ' + u.assetCount + '件  ¥' + Number(u.assetPrice).toFixed(2);
              }
              if (dataItem.users.length > 10) {
                text += '\n  ... 等' + dataItem.users.length + '人';
              }
            }
            return text;
          }
        },
        grid: { left: '3%', right: '6%', bottom: '15%', top: '12%', containLabel: true },
        xAxis: {
          type: 'category',
          data: chartData.map(function(d) { return d.date; }),
          boundaryGap: true,
          axisLabel: {
            fontSize: 10,
            color: themeColors.textHint,
            interval: chartData.length > 15 ? 'auto' : 0
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
        series: [{
          type: 'bar',
          barMaxWidth: 36,
          itemStyle: { borderRadius: [4, 4, 0, 0], color: gradientColor },
          emphasis: { itemStyle: { color: themeColors.primary700 } },
          data: chartData.map(function(d) { return d.count; })
        }]
      });

      return chart;
    });
  },

  // 生成 SVG 图标（使用主题色）
  initIcons() {
    var color = themeManager.getThemeColors().textMuted;
    this.setData({
      usersIcon: createSVGDataURI(ICON_PATHS.users, color),
      boxIcon: createSVGDataURI(ICON_PATHS.box, color),
      lightningIcon: createSVGDataURI(ICON_PATHS.lightning, color),
      calendarCheckIcon: createSVGDataURI(ICON_PATHS.calendarCheck, color),
      calendarClockIcon: createSVGDataURI(ICON_PATHS.calendarClock, color),
      chartIcon: createSVGDataURI(ICON_PATHS.trendingUp, color)
    });
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

  // 头像加载失败显示内置默认头像
  onAvatarError(e) {
    const index = e.currentTarget.dataset.index;
    const user = this.data.filteredUsers[index];
    if (!user || user._avatarFallback) return;
    user._avatarFallback = true;
    var data = {};
    data['filteredUsers[' + index + '].avatarUrl'] = getDefaultAvatar(user._openid);
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
          this.setData({ users });
          this.filterAndSortUsers();
          this.calculateStats(users);
          this.calculateAccessStats(users);
          setTimeout(() => this.initAccessChart(), 300);

          if (users.length === 0) {
            this.setData({ empty: true });
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