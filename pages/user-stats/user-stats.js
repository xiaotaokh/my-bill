// pages/user-stats/user-stats.js
Page({
  data: {
    users: [],
    loading: false,
    empty: false
  },

  onLoad() {
    this.loadUserStats();
  },

  onPullDownRefresh() {
    this.loadUserStats(() => {
      wx.stopPullDownRefresh();
    });
  },

  loadUserStats(callback) {
    if (this.data.loading) return;

    this.setData({ loading: true, empty: false });
    wx.showLoading({ title: '加载中...' });

    wx.cloud.callFunction({
      name: 'getUserStats',
      success: async (res) => {
        wx.hideLoading();
        if (res.result?.success) {
          const users = res.result.data || [];
          console.log('获取到的用户数据:', users);

          // 处理头像链接
          const processedUsers = await Promise.all(users.map(async (user) => {
            let avatarUrl = user.avatarUrl;
            console.log('用户头像原始URL:', user.nickName, avatarUrl);

            // 云存储链接需要转换为临时链接
            if (avatarUrl && avatarUrl.startsWith('cloud://')) {
              try {
                const fileRes = await wx.cloud.getTempFileURL({ fileList: [avatarUrl] });
                console.log('云存储转换结果:', fileRes);
                console.log('fileList[0]:', fileRes.fileList[0]);
                if (fileRes.fileList && fileRes.fileList.length > 0) {
                  const fileItem = fileRes.fileList[0];
                  // 检查是否有 tempFileURL 或其他字段
                  avatarUrl = fileItem.tempFileURL || fileItem.fileURL || '';
                  console.log('获取到的临时链接:', avatarUrl);
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

            console.log('最终头像URL:', avatarUrl);

            return {
              ...user,
              avatarUrl: avatarUrl,
              genderText: this.getGenderText(user.gender),
              firstAccessText: this.formatTime(user.firstAccessTime),
              lastAccessText: this.formatTime(user.lastAccessTime)
            };
          }));

          this.setData({
            users: processedUsers,
            empty: processedUsers.length === 0,
            loading: false
          });
        } else {
          this.setData({
            users: [],
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
        wx.hideLoading();
        console.error('云函数调用失败:', err);
        this.setData({
          users: [],
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

  getGenderText(gender) {
    switch (gender) {
      case 1: return '男';
      case 2: return '女';
      default: return '';
    }
  },

  formatTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }
});