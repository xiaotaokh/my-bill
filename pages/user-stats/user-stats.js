// pages/user-stats/user-stats.js
const { themeManager } = require('../../utils/themeManager');
const { supabase } = require('../../utils/supabase');

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
    totalAssetCount: 0
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
    });
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
      const processedUsers = users.map(user => {
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

      // 计算统计数据
      this.calculateStats(processedUsers);

      this.setData({
        users: processedUsers,
        filteredUsers: processedUsers,
        empty: processedUsers.length === 0,
        loading: false
      });

      // 默认按最近访问排序
      this.filterAndSortUsers();

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
  }
});