// 云函数：获取用户统计信息（管理员专用）
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 管理员 openid
const ADMIN_OPENID = 'ofW_r4lPk806IqPSk4-gR9r_478g';

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 权限检查：仅管理员可访问
  if (openid !== ADMIN_OPENID) {
    return {
      success: false,
      error: '无权限访问'
    };
  }

  try {
    // 查询所有用户（排除管理员）
    const res = await db.collection('users')
      .where({
        _openid: _.neq(ADMIN_OPENID)
      })
      .orderBy('lastAccessTime', 'desc')
      .limit(100)
      .get();

    // 格式化用户数据
    const users = res.data.map(user => ({
      _id: user._id,
      nickName: user.nickName || '未设置',
      avatarUrl: user.avatarUrl || '',
      gender: user.gender || 0,
      firstAccessTime: user.firstAccessTime,
      lastAccessTime: user.lastAccessTime
    }));

    return {
      success: true,
      data: users,
      total: res.data.length
    };
  } catch (err) {
    console.error('获取用户统计失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};