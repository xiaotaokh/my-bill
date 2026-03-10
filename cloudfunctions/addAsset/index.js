// 云函数：addAsset
// 用于添加资产
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    const result = await db.collection('assets').add({
      data: {
        ...event.data,
        _openid: wxContext.OPENID,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });

    return {
      success: true,
      data: result
    };
  } catch (err) {
    return {
      success: false,
      error: err
    };
  }
};
