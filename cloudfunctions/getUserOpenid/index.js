// 云函数：获取当前用户 openid
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  // 获取微信调用上下文
  const wxContext = cloud.getWXContext();

  return {
    success: true,
    openid: wxContext.OPENID,
    appid: wxContext.APPID
  };
};
