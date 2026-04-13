// 云函数：添加新类别
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { name, icon } = event;

  if (!name || name.trim() === '') {
    return {
      success: false,
      error: '类别名称不能为空'
    };
  }

  // 获取微信调用上下文
  const wxContext = cloud.getWXContext();

  try {
    // 检查是否已存在（检查当前用户的类别）
    let existing;
    try {
      existing = await db.collection('categories')
        .where({
          name: name.trim(),
          _openid: wxContext.OPENID
        })
        .get();
    } catch (checkErr) {
      // 集合不存在，尝试创建（添加一条记录来创建集合）
    }

    if (existing && existing.data.length > 0) {
      return {
        success: false,
        error: '类别已存在'
      };
    }

    // 添加新类别（如果集合不存在，这会创建集合）
    const result = await db.collection('categories').add({
      data: {
        _openid: wxContext.OPENID,
        name: name.trim(),
        icon: icon || '', // 添加图标字段，默认为空
        description: event.description || '', // 分类描述
        sortOrder: event.sortOrder || 0, // 排序顺序
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });

    return {
      success: true,
      id: result._id,
      name: name.trim(),
      icon: icon || '', // 返回图标信息
      description: event.description || ''
    };
  } catch (err) {
    // 如果是权限错误，给出更友好的提示
    if (err.errCode === -502001 || (err.message && err.message.includes('permission'))) {
      return {
        success: false,
        error: '数据库权限不足，请在云开发控制台设置 categories 集合权限为"所有用户可读写"'
      };
    }

    return {
      success: false,
      error: err.message
    };
  }
};
