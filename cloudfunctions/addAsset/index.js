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
      name,
      price,
      purchaseDate,
      category,
      icon,  // 图标字段
      remark = '',
      status = 'active',
      retiredDate = '',  // 退役日期
      soldDate = '',  // 卖出日期
      excludeTotal = false,
      excludeDaily = false
    } = event;

    // 验证必需参数
    if (!name || !price || !purchaseDate || !category) {
      return {
        success: false,
        error: '缺少必需参数'
      };
    }

    // 检查资产名称是否重复
    const existingAsset = await db.collection('assets')
      .where({
        _openid: wxContext.OPENID,
        name: name.trim()
      })
      .count();

    if (existingAsset.total > 0) {
      return {
        success: false,
        error: '资产名称已存在，请使用其他名称'
      };
    }

    // 添加资产到数据库
    const result = await db.collection('assets').add({
      data: {
        _openid: wxContext.OPENID,
        name: name.trim(),
        price: parseFloat(price),
        purchaseDate: purchaseDate,
        category: category,
        icon: icon,  // 存储图标信息
        remark: remark,
        status: status,
        retiredDate: retiredDate,  // 存储退役日期
        soldDate: soldDate,  // 存储卖出日期
        excludeTotal: excludeTotal,
        excludeDaily: excludeDaily,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });

    return {
      success: true,
      assetId: result._id,
      message: '资产添加成功'
    };

  } catch (error) {
    console.error('添加资产失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};