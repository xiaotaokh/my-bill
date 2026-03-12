// 云函数：删除类别
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { categoryId } = event;

  if (!categoryId) {
    return {
      success: false,
      error: '类别ID不能为空'
    };
  }

  // 获取微信调用上下文
  const wxContext = cloud.getWXContext();

  try {
    // 获取待删除的类别信息
    const categoryDoc = await db.collection('categories').doc(categoryId).get();

    if (!categoryDoc.data || categoryDoc.data.length === 0) {
      return {
        success: false,
        error: '类别不存在'
      };
    }

    const categoryData = categoryDoc.data[0];

    // 验证类别属于当前用户
    if (categoryData._openid !== wxContext.OPENID) {
      return {
        success: false,
        error: '无权删除此分类'
      };
    }

    // 检查是否有资产使用了此分类，如果有，则不允许删除
    const assetsUsingCategory = await db.collection('assets')
      .where({
        category: categoryData.name,
        _openid: wxContext.OPENID
      })
      .count();

    if (assetsUsingCategory.total > 0) {
      return {
        success: false,
        error: `无法删除分类，已有${assetsUsingCategory.total}个资产使用此分类`
      };
    }

    // 删除类别
    const result = await db.collection('categories').doc(categoryId).remove();

    return {
      success: true,
      message: '删除成功'
    };
  } catch (err) {
    console.error('删除类别失败:', err);

    // 如果是权限错误，给出更友好的提示
    if (err.errCode === -502001 || (err.message && err.message.includes('permission'))) {
      return {
        success: false,
        error: '数据库权限不足，请在云开发控制台设置 categories 集合权限'
      };
    }

    return {
      success: false,
      error: err.message
    };
  }
};