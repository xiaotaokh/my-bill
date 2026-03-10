// 云函数：deleteAsset
// 删除资产
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    const result = await db.collection('assets')
      .doc(event.id)
      .remove();

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
