// 云函数：批量更新分类排序
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { sortOrders } = event; // [{ categoryId, sortOrder }, ...]

  if (!sortOrders || !Array.isArray(sortOrders) || sortOrders.length === 0) {
    return {
      success: false,
      error: '排序数据无效'
    };
  }

  // 获取微信调用上下文
  const wxContext = cloud.getWXContext();

  try {
    // 批量更新排序
    const updatePromises = sortOrders.map(item => {
      return db.collection('categories').doc(item.categoryId).update({
        data: {
          sortOrder: item.sortOrder,
          updatedAt: db.serverDate()
        }
      });
    });

    await Promise.all(updatePromises);

    return {
      success: true,
      message: '排序更新成功'
    };
  } catch (err) {
    console.error('更新分类排序失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};