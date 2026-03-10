// 云函数：getAssets
// 获取资产列表，支持筛选和排序
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;

  try {
    let query = db.collection('assets').where({
      _openid: wxContext.OPENID
    });

    // 筛选状态
    if (event.status && event.status !== 'all') {
      query = query.where({
        status: event.status
      });
    }

    // 排序
    if (event.sortField && event.sortOrder) {
      query = query.orderBy(event.sortField, event.sortOrder);
    } else {
      query = query.orderBy('createdAt', 'desc');
    }

    // 分页
    if (event.limit) {
      query = query.limit(event.limit);
    }
    if (event.skip) {
      query = query.skip(event.skip);
    }

    const result = await query.get();

    return {
      success: true,
      data: result.data
    };
  } catch (err) {
    return {
      success: false,
      error: err
    };
  }
};
