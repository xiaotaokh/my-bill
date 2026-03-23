// 云函数：更新类别信息
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { categoryId, name, icon } = event;

  if (!categoryId) {
    return {
      success: false,
      error: '类别ID不能为空'
    };
  }

  // 获取微信调用上下文
  const wxContext = cloud.getWXContext();

  try {
    // 先获取原分类信息
    const categoryDoc = await db.collection('categories').doc(categoryId).get();
    const oldCategory = categoryDoc.data;

    // 准备更新数据
    const updateData = {
      updatedAt: db.serverDate()
    };

    if (name) {
      updateData.name = name.trim();
    }

    if (icon !== undefined) {
      updateData.icon = icon;
    }

    // 更新类别
    await db.collection('categories').doc(categoryId).update({
      data: updateData
    });

    // 如果分类名称有变化，同步更新所有关联资产的分类名称
    if (name && oldCategory.name !== name.trim()) {
      const newName = name.trim();
      const oldName = oldCategory.name;

      // 更新所有该分类下的资产
      await db.collection('assets').where({
        _openid: wxContext.OPENID,
        category: oldName
      }).update({
        data: {
          category: newName,
          updatedAt: db.serverDate()
        }
      });
    }

    return {
      success: true,
      message: '更新成功'
    };
  } catch (err) {
    console.error('更新类别失败:', err);

    // 如果是权限错误，给出更友好的提示
    if (err.errCode === -502001 || (err.message && err.message.includes('permission'))) {
      return {
        success: false,
        error: '数据库权限不足'
      };
    }

    return {
      success: false,
      error: err.message
    };
  }
};