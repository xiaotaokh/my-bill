// app.js
App({
  onLaunch: function () {
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-4gdakam95d203bfc',
        traceUser: true
      })
    }

    // 获取用户信息
    // 注意：微信已不再支持在 onLaunch 中自动获取用户信息（wx.getUserInfo 接口已调整）
    // 真机调试时此处容易报错，且云开发主要依赖 openid 鉴权，不影响核心功能
    // 如需获取头像昵称，建议在具体页面通过按钮引导用户点击 wx.getUserProfile
    /*
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
            }
          })
        }
      }
    })
    */

    // 获取当前用户 openid
    this.getOpenid();
  },

  // 获取用户 openid
  getOpenid: function() {
    // 如果已经有 openid，直接返回 resolved 的 Promise
    if (this.globalData.openid) {
      return Promise.resolve(this.globalData.openid);
    }
    // 如果已经有 Promise 在进行中，返回同一个 Promise
    if (this.globalData.openidPromise) {
      return this.globalData.openidPromise;
    }

    // 创建新的 Promise 并保存
    this.globalData.openidPromise = new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getUserOpenid',
        success: (res) => {
          if (res.result && res.result.openid) {
            this.globalData.openid = res.result.openid;
            resolve(res.result.openid);
          } else {
            reject(res);
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });

    return this.globalData.openidPromise;
  },

  globalData: {
    userInfo: null,
    envId: 'cloud1-4gdakam95d203bfc',
    openid: null,
    openidPromise: null  // 保存 openid 的 Promise
  }
})
