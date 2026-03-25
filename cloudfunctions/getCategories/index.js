// 云函数：获取类别列表
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 获取每个分类的资产数量
async function getAssetCounts(openid, categoryNames) {
  const counts = {};

  // 并行获取每个分类的资产数量
  const countPromises = categoryNames.map(async (name) => {
    try {
      const res = await db.collection('assets')
        .where({
          _openid: openid,
          category: name
        })
        .count();
      counts[name] = res.total;
    } catch (err) {
      counts[name] = 0;
    }
  });

  await Promise.all(countPromises);
  return counts;
}

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

    // 如果没有分类，直接返回空列表
    if (res.data.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 获取每个分类的资产数量
    const categoryNames = res.data.map(cat => cat.name);
    const assetCounts = await getAssetCounts(wxContext.OPENID, categoryNames);

    // 添加资产数量到分类数据中
    const categoriesWithCount = res.data.map(cat => ({
      ...cat,
      assetCount: assetCounts[cat.name] || 0
    }));

    return {
      success: true,
      data: categoriesWithCount
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
