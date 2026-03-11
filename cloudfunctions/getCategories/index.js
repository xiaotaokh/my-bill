// 云函数：获取类别列表
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 获取微信调用上下文
    const wxContext = cloud.getWXContext();

    // 只获取当前用户的类别
    const res = await db.collection('categories')
      .where({
        _openid: wxContext.OPENID
      })
      .orderBy('createdAt', 'asc')
      .get();

    return {
      success: true,
      data: res.data
    };
  } catch (err) {
    console.error('获取类别失败:', err);
    return {
      success: false,
      error: err.message,
      data: []
    };
  }
};
