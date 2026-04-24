// pages/user-stats/user-stats.js
Page({
  data: {
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
        return (b.lastAccessTime || 0) - (a.lastAccessTime || 0);
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

  loadUserStats(callback) {
    if (this.data.loading) return;

    this.setData({ loading: true, empty: false });

    wx.cloud.callFunction({
      name: 'getUserStats',
      success: async (res) => {
        if (res.result?.success) {
          const users = res.result.data || [];

          // 处理头像链接
          const processedUsers = await Promise.all(users.map(async (user) => {
            let avatarUrl = user.avatarUrl;

            // 云存储链接需要转换为临时链接
            if (avatarUrl && avatarUrl.startsWith('cloud://')) {
              try {
                const fileRes = await wx.cloud.getTempFileURL({ fileList: [avatarUrl] });
                if (fileRes.fileList && fileRes.fileList.length > 0) {
                  const fileItem = fileRes.fileList[0];
                  avatarUrl = fileItem.tempFileURL || fileItem.fileURL || '';
                }
              } catch (e) {
                console.error('云存储链接转换失败:', e);
                avatarUrl = '';
              }
            }

            // 如果没有头像或转换失败，使用默认头像
            if (!avatarUrl) {
              avatarUrl = '/images/default-avatar.svg';
            }

            // 计算活跃度
            const activity = this.calculateActivityLevel(user.lastAccessTime);

            // 处理资产列表（需要转换云存储链接）
            const assets = await Promise.all((user.assets || []).map(async (asset) => {
              let assetIcon = asset.icon || '📦';
              let displayIcon = '';

              // 云存储链接需要转换为临时链接
              if (assetIcon && assetIcon.startsWith('cloud://')) {
                try {
                  const fileRes = await wx.cloud.getTempFileURL({ fileList: [assetIcon] });
                  if (fileRes.fileList && fileRes.fileList.length > 0) {
                    const fileItem = fileRes.fileList[0];
                    displayIcon = fileItem.tempFileURL || fileItem.fileURL || '';
                    assetIcon = displayIcon || asset.icon;
                  }
                } catch (e) {
                  console.error('资产图标云存储链接转换失败:', e);
                }
              } else if (assetIcon && assetIcon.startsWith('http')) {
                // HTTP 链接直接使用
                displayIcon = assetIcon;
              }

              return {
                ...asset,
                icon: assetIcon,
                displayIcon: displayIcon  // 图片链接，用于 <image> 显示
              };
            }));

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
          }));

          // 计算统计数据
          this.calculateStats(processedUsers);

          this.setData({
            users: processedUsers,
            filteredUsers: processedUsers,
            empty: processedUsers.length === 0,
            loading: false
          });
        } else {
          this.setData({
            users: [],
            filteredUsers: [],
            empty: true,
            loading: false
          });
          wx.showToast({
            title: res.result?.error || '加载失败',
            icon: 'none'
          });
        }
        if (callback) callback();
      },
      fail: (err) => {
        console.error('云函数调用失败:', err);
        this.setData({
          users: [],
          filteredUsers: [],
          empty: true,
          loading: false
        });
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
        if (callback) callback();
      }
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
  }
});