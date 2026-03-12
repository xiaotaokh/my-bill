// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = wx.cloud.database();

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