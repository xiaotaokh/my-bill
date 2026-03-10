// 云函数：updateAsset
// 更新资产信息
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    const result = await db.collection('assets')
      .doc(event.id)
      .update({
        data: {
          ...event.data,
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
