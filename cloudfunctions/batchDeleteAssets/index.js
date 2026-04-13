// 云函数：批量删除资产
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { assetIds } = event;

  if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
    return {
      success: false,
      error: '资产ID列表不能为空'
    };
  }

  // 获取微信调用上下文
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    let deletedCount = 0;
    let failedCount = 0;
    const errors = [];

    // 逐个删除资产（验证所有权）
    for (const assetId of assetIds) {
      try {
        // 先获取资产验证所有权
        const assetDoc = await db.collection('assets').doc(assetId).get();

        if (!assetDoc.data) {
          failedCount++;
          errors.push(`资产 ${assetId} 不存在`);
          continue;
        }

        // 验证资产属于当前用户
        if (assetDoc.data._openid !== openid) {
          failedCount++;
          errors.push(`无权删除资产 ${assetId}`);
          continue;
        }

        // 删除资产
        await db.collection('assets').doc(assetId).remove();
        deletedCount++;
      } catch (err) {
        failedCount++;
        errors.push(`删除资产 ${assetId} 失败: ${err.message}`);
      }
    }

    if (deletedCount === 0) {
      return {
        success: false,
        error: '没有资产被删除',
        details: errors
      };
    }

    return {
      success: true,
      message: `成功删除 ${deletedCount} 项资产`,
      deletedCount,
      failedCount,
      errors: failedCount > 0 ? errors : undefined
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || '批量删除失败'
    };
  }
};