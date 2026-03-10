// 云函数：getStats
// 获取资产统计信息
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;

  try {
    const assets = await db.collection('assets')
      .where({
        _openid: wxContext.OPENID
      })
      .get();

    const data = assets.data;

    let totalPrice = 0;
    let totalDays = 0;
    let activeCount = 0;
    let retiredCount = 0;
    let soldCount = 0;

    data.forEach(asset => {
      if (!asset.excludeTotal) {
        totalPrice += asset.price || 0;
      }

      if (asset.status === 'active') {
        activeCount++;
        if (!asset.excludeDaily) {
          const purchaseDate = new Date(asset.purchaseDate);
          const now = new Date();
          const days = Math.floor((now - purchaseDate) / (1000 * 60 * 60 * 24));
          totalDays += days;
        }
      } else if (asset.status === 'retired') {
        retiredCount++;
      } else if (asset.status === 'sold') {
        soldCount++;
      }
    });

    const dailyCost = totalDays > 0 ? (totalPrice / totalDays).toFixed(2) : 0;

    return {
      success: true,
      data: {
        totalPrice: totalPrice.toFixed(2),
        dailyCost: dailyCost,
        activeCount,
        retiredCount,
        soldCount,
        totalCount: data.length
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err
    };
  }
};
