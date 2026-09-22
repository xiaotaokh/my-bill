// app.js
const { supabase } = require('./utils/supabase');

App({
  onLaunch: function () {
    // 获取当前用户 openid
    this.getOpenid().catch(err => {
      console.error('[app] 启动时获取 openid 失败', err);
    });
  },

  // 网络异常提示（同一次启动只提示一次，避免多个页面重复弹）
  showNetworkErrorToast: function() {
    if (this.globalData.networkErrorShown) {
      return;
    }
    this.globalData.networkErrorShown = true;
    wx.showToast({
      title: '网络异常，请检查网络后重试',
      icon: 'none',
      duration: 3000
    });
  },

  // 获取用户 openid
  // retryCount: 已重试次数，内部使用；失败时会自动重试一次
  getOpenid: function(retryCount) {
    const attempt = retryCount || 0;

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

        // 首次失败自动重试一次，网络抖动时可以自愈
        if (attempt < 1) {
          console.warn('[app] 获取 openid 失败，1 秒后自动重试', err);
          setTimeout(() => {
            this.getOpenid(attempt + 1).then(resolve).catch(reject);
          }, 1000);
          return;
        }

        // 重试后仍失败，给用户明确提示，避免只看到空白页
        this.showNetworkErrorToast();
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
                  this.globalData.networkErrorShown = false;
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
    adminTargetName: '',  // 被模拟用户的名称
    networkErrorShown: false // 本次启动是否已提示过网络异常
  }
})
