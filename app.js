// app.js
const { supabase } = require('./utils/supabase');

App({
  onLaunch: function () {
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
    // 使用 Supabase Edge Function 获取 openid
    this.globalData.openidPromise = new Promise((resolve, reject) => {
      // 失败时清除缓存的 Promise，允许下次调用时重试
      const clearAndReject = (err) => {
        this.globalData.openidPromise = null;
        reject(err);
      };

      wx.login({
        success: (loginRes) => {
          if (loginRes.code) {
            supabase.functions.invoke('get-user-openid', { code: loginRes.code })
              .then(result => {
                const { data, error } = result;
                if (error) {
                  clearAndReject(error);
                  return;
                }
                if (data && data.openid) {
                  this.globalData.openid = data.openid;
                  resolve(data.openid);
                } else {
                  clearAndReject(new Error('获取 openid 失败'));
                }
              })
              .catch(err => {
                clearAndReject(err);
              });
          } else {
            clearAndReject(new Error('wx.login 失败：' + loginRes.errMsg));
          }
        },
        fail: (err) => {
          clearAndReject(err);
        }
      });
    });

    return this.globalData.openidPromise;
  },

  // 切换为指定用户的身份（管理员模拟用户）
  switchToUser(targetOpenid, targetName) {
    this.globalData.adminOpenid = this.globalData.openid;
    this.globalData.isAdminMode = true;
    this.globalData.openid = targetOpenid;
    this.globalData.openidPromise = null;
    this.globalData.userInfo = null;
    this.globalData.adminTargetName = targetName || '';
  },

  // 切换回管理员身份
  switchBackToAdmin() {
    if (this.globalData.adminOpenid) {
      this.globalData.openid = this.globalData.adminOpenid;
    }
    this.globalData.isAdminMode = false;
    this.globalData.adminOpenid = null;
    this.globalData.openidPromise = null;
    this.globalData.userInfo = null;
    this.globalData.adminTargetName = '';
  },

  globalData: {
    userInfo: null,
    openid: null,
    openidPromise: null,  // 保存 openid 的 Promise
    adminOpenid: null,    // 管理员的原始 openid（模拟用户时保存）
    isAdminMode: false,   // 是否处于模拟用户模式
    adminTargetName: ''   // 被模拟用户的名称
  }
})
