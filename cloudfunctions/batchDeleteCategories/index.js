// 云函数：批量删除分类
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { categoryIds } = event; // 要删除的分类ID数组

  if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    return {
      success: false,
      error: '请选择要删除的分类'
    };
  }

  // 获取微信调用上下文
  const wxContext = cloud.getWXContext();

  try {
    // 获取要删除的分类信息
    const categoriesToDelete = await db.collection('categories')
      .where({
        _id: db.command.in(categoryIds),
        _openid: wxContext.OPENID
      })
      .get();

    if (categoriesToDelete.data.length === 0) {
      return {
        success: false,
        error: '没有可删除的分类'
      };
    }

    // 获取分类名称列表
    const categoryNames = categoriesToDelete.data.map(cat => cat.name);

    // 检查哪些分类下有资产
    const assetsCheck = await db.collection('assets')
      .where({
        category: db.command.in(categoryNames),
        _openid: wxContext.OPENID
      })
      .field({ category: true })
      .get();

    // 找出有资产的分类
    const categoriesWithAssets = new Set(assetsCheck.data.map(asset => asset.category));

    // 过滤出可以删除的分类（没有资产的）
    const deletableCategoryIds = categoriesToDelete.data
      .filter(cat => !categoriesWithAssets.has(cat.name))
      .map(cat => cat._id);

    // 找出不可删除的分类
    const undeletableCategories = categoriesToDelete.data
      .filter(cat => categoriesWithAssets.has(cat.name))
      .map(cat => cat.name);

    if (deletableCategoryIds.length === 0) {
      return {
        success: false,
        error: '所选分类都有资产关联，无法删除',
        undeletableCategories
      };
    }

    // 批量删除
    const deletePromises = deletableCategoryIds.map(id => {
      return db.collection('categories').doc(id).remove();
    });

    await Promise.all(deletePromises);

    return {
      success: true,
      deletedCount: deletableCategoryIds.length,
      undeletableCategories,
      message: undeletableCategories.length > 0
        ? `成功删除${deletableCategoryIds.length}个分类，${undeletableCategories.length}个分类因有资产关联未删除`
        : `成功删除${deletableCategoryIds.length}个分类`
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
};