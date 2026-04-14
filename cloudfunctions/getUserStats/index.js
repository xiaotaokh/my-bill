// 云函数：获取用户统计信息（管理员专用）
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 管理员 openid
const ADMIN_OPENID = 'ofW_r4lPk806IqPSk4-gR9r_478g';

// 计算服役时长
function calculateUsedDays(purchaseDate, status, retiredDate, soldDate) {
  if (!purchaseDate) return 0;

  const purchase = new Date(purchaseDate);
  const now = new Date();

  // 已退役或已卖出，计算到退役/卖出日期
  if (status === 'retired' && retiredDate) {
    const retired = new Date(retiredDate);
    return Math.max(1, Math.floor((retired - purchase) / (1000 * 60 * 60 * 24)) + 1);
  }

  if (status === 'sold' && soldDate) {
    const sold = new Date(soldDate);
    return Math.max(1, Math.floor((sold - purchase) / (1000 * 60 * 60 * 24)) + 1);
  }

  // 服役中，计算到今天
  return Math.max(1, Math.floor((now - purchase) / (1000 * 60 * 60 * 24)) + 1);
}

// 格式化服役时长
function formatUsedDays(days) {
  if (days >= 365) {
    const years = Math.floor(days / 365);
    const remainDays = days % 365;
    if (remainDays > 0) {
      return `${years}年${remainDays}天`;
    }
    return `${years}年`;
  }
  return `${days}天`;
}

// 计算日均成本
function calculateDailyCost(price, usedDays, assetType, periodAmount, periodDays) {
  if (assetType === 'subscription') {
    // 订阅资产：日均 = 每期金额 / 周期天数
    if (periodAmount && periodDays) {
      return periodAmount / periodDays;
    }
    return 0;
  }

  // 普通资产：日均 = 价格 / 服役时长
  if (price && usedDays) {
    return price / usedDays;
  }
  return 0;
}

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
    const userRes = await db.collection('users')
      .where({
        _openid: _.neq(ADMIN_OPENID)
      })
      .orderBy('lastAccessTime', 'desc')
      .limit(100)
      .get();

    // 获取所有用户的 openid 列表
    const userOpenids = userRes.data.map(user => user._openid);

    // 查询所有用户的资产
    const assetRes = await db.collection('assets')
      .where({
        _openid: _.in(userOpenids)
      })
      .orderBy('createdAt', 'desc')
      .get();

    // 按用户 openid 分组资产
    const assetsByUser = {};
    assetRes.data.forEach(asset => {
      if (!assetsByUser[asset._openid]) {
        assetsByUser[asset._openid] = [];
      }

      // 计算服役时长和日均成本
      const usedDays = calculateUsedDays(
        asset.purchaseDate,
        asset.status,
        asset.retiredDate,
        asset.soldDate
      );

      const dailyCost = calculateDailyCost(
        asset.price,
        usedDays,
        asset.assetType,
        asset.periodAmount,
        asset.periodDays
      );

      assetsByUser[asset._openid].push({
        _id: asset._id,
        name: asset.name,
        icon: asset.icon || '📦',
        price: asset.price || 0,
        status: asset.status,
        assetType: asset.assetType || 'fixed',
        purchaseDate: asset.purchaseDate,
        usedDays: usedDays,
        usedDaysText: formatUsedDays(usedDays),
        dailyCost: dailyCost.toFixed(2),
        category: asset.category
      });
    });

    // 格式化用户数据，包含资产列表
    const users = userRes.data.map(user => ({
      _id: user._id,
      nickName: user.nickName || '未设置',
      avatarUrl: user.avatarUrl || '',
      firstAccessTime: user.firstAccessTime,
      lastAccessTime: user.lastAccessTime,
      assets: assetsByUser[user._openid] || [],
      assetCount: (assetsByUser[user._openid] || []).length,
      totalAssetPrice: (assetsByUser[user._openid] || [])
        .reduce((sum, asset) => sum + (asset.price || 0), 0)
        .toFixed(2)
    }));

    return {
      success: true,
      data: users,
      total: userRes.data.length,
      totalAssets: assetRes.data.length
    };
  } catch (err) {
    console.error('获取用户统计失败:', err);
    return {
      success: false,
      error: err.message
    };
  }
};