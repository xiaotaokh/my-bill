// 云函数：保存/更新用户信息和访问时间
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { nickName, avatarUrl, updateAccessTime = true } = event;

  try {
    // 查询是否已存在用户记录
    const existingUser = await db.collection('users')
      .where({
        _openid: openid
      })
      .limit(1)
      .get();

    const now = db.serverDate();

    if (existingUser.data.length > 0) {
      // 用户已存在，更新信息
      const userId = existingUser.data[0]._id;
      const updateData = {
        updatedAt: now
      };

      // 仅更新传入的字段
      if (nickName) updateData.nickName = nickName;
      if (avatarUrl) updateData.avatarUrl = avatarUrl;

      // 更新访问时间
      if (updateAccessTime) {
        updateData.lastAccessTime = now;
      }

      await db.collection('users').doc(userId).update({
        data: updateData
      });

      return {
        success: true,
        isNewUser: false,
        message: '用户信息更新成功'
      };
    } else {
      // 新用户，创建记录（必须有昵称和头像）
      if (!nickName || !avatarUrl) {
        return {
          success: false,
          error: '新用户必须提供昵称和头像'
        };
      }

      const newUser = {
        _openid: openid,
        nickName: nickName,
        avatarUrl: avatarUrl,
        firstAccessTime: now,
        lastAccessTime: now,
        createdAt: now,
        updatedAt: now
      };

      await db.collection('users').add({
        data: newUser
      });

      return {
        success: true,
        isNewUser: true,
        message: '用户信息创建成功'
      };
    }
  } catch (err) {
    console.error('保存用户信息失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};