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
    // 注意：微信已不再支持在onLaunch中自动获取用户信息（wx.getUserInfo接口已调整）
    // 真机调试时此处容易报错，且云开发主要依赖openid鉴权，不影响核心功能
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
  },

  globalData: {
    userInfo: null,
    envId: 'cloud1-4gdakam95d203bfc'
  }
})
