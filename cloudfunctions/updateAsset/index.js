// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  try {
    // 从事件参数获取资产数据
    const {
      id,
      name,
      price,
      purchaseDate,
      category,
      icon,
      remark = '',
      status = 'active',
      retiredDate = '',
      soldDate = '',
      excludeTotal = false,
      excludeDaily = false
    } = event;

    // 验证必需参数
    if (!id) {
      return {
        success: false,
        error: '缺少资产ID'
      };
    }

    if (!name || !price || !purchaseDate || !category) {
      return {
        success: false,
        error: '缺少必需参数'
      };
    }

    // 检查资产名称是否重复（排除当前资产）
    const existingAsset = await db.collection('assets')
      .where({
        _openid: wxContext.OPENID,
        name: name.trim(),
        _id: db.command.neq(id)
      })
      .count();

    if (existingAsset.total > 0) {
      return {
        success: false,
        error: '资产名称已存在，请使用其他名称'
      };
    }

    // 更新资产
    const result = await db.collection('assets').doc(id).update({
      data: {
        name: name.trim(),
        price: parseFloat(price),
        purchaseDate: purchaseDate,
        category: category,
        icon: icon,
        remark: remark,
        status: status,
        retiredDate: retiredDate,
        soldDate: soldDate,
        excludeTotal: excludeTotal,
        excludeDaily: excludeDaily,
        updatedAt: db.serverDate()
      }
    });

    if (result.stats.updated === 0) {
      return {
        success: false,
        error: '资产不存在或无权更新'
      };
    }

    return {
      success: true,
      message: '资产更新成功'
    };

  } catch (error) {
    console.error('更新资产失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};