// pages/account/account.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    loading: true
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();
  },

  // 从数据库加载用户信息
  loadUserInfo() {
    this.setData({ loading: true });

    const openid = app.globalData.openid;
    if (!openid) {
      // 等待 openid 获取完成
      app.getOpenid().then(() => {
        this.queryUserInfo();
      }).catch(() => {
        this.setData({ loading: false });
      });
    } else {
      this.queryUserInfo();
    }
  },

  // 查询数据库
  queryUserInfo() {
    wx.cloud.database().collection('users').where({
      _openid: app.globalData.openid
    }).limit(1).get({
      success: (res) => {
        if (res.data && res.data.length > 0) {
          this.setData({
            userInfo: {
              nickName: res.data[0].nickName || '',
              avatarUrl: res.data[0].avatarUrl || ''
            },
            loading: false
          });
        } else {
          this.setData({
            userInfo: {},
            loading: false
          });
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err);
        this.setData({ loading: false });
      }
    });
  }
});
