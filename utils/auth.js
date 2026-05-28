// utils/auth.js - 用户认证逻辑
// 微信小程序用户认证，获取 openid

const { supabase } = require('./supabase');

const ADMIN_OPENID = 'ofW_r4lPk806IqPSk4-gR9r_478g';

// 判断是否为管理员
function isAdmin(openid) {
  return openid === ADMIN_OPENID;
}

// 获取用户 openid（通过微信登录）
// 使用 Supabase Edge Function 处理微信登录
function getWxOpenid() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用 Supabase Edge Function 获取 openid
          supabase.functions.invoke('get-user-openid', { code: res.code })
            .then(result => {
              const { data, error } = result;
              if (error) {
                reject(error);
                return;
              }
              if (data && data.openid) {
                resolve(data.openid);
              } else {
                reject(new Error('获取 openid 失败'));
              }
            })
            .catch(err => {
              reject(err);
            });
        } else {
          reject(new Error('wx.login 失败：' + res.errMsg));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

module.exports = {
  isAdmin,
  getWxOpenid,
  ADMIN_OPENID
};