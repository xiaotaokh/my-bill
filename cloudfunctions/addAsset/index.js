// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 周期天数映射
const PERIOD_DAYS_MAP = {
  'monthly': 30,
  'yearly': 365,
  'weekly': 7
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()

  try {
    // 从事件参数获取资产数据
    const {
      name,
      price,
      purchaseDate,
      category,
      icon,  // 图标字段
      iconName = '',  // 图标名称，用于回显
      groupName = '',  // 分组名称，用于回显
      remark = '',
      status = 'active',
      retiredDate = '',  // 退役日期
      soldDate = '',  // 卖出日期
      excludeTotal = false,
      excludeDaily = false,
      // 订阅资产字段
      assetType = 'fixed',  // 资产类型: 'fixed' | 'subscription'
      periodAmount,  // 每期金额
      periodType,  // 周期类型: 'monthly' | 'yearly' | 'weekly' | 'custom'
      periodDays,  // 周期天数（自定义时使用）
      subscriptionStartDate,  // 订阅开始日期
      subscriptionEndDate = '',  // 订阅结束日期
      pendingSubscription = false  // 待订阅开关
    } = event;

    // 验证必需参数
    if (!name || !category) {
      return {
        success: false,
        error: '缺少必需参数'
      };
    }

    // 普通资产必须有 purchaseDate 和 price
    if (assetType === 'fixed') {
      if (!purchaseDate) {
        return {
          success: false,
          error: '缺少购买日期'
        };
      }
      if (!price) {
        return {
          success: false,
          error: '缺少价格参数'
        };
      }
    }

    // 订阅资产必须有日期（purchaseDate 或 subscriptionStartDate）
    if (assetType === 'subscription') {
      if (!purchaseDate && !subscriptionStartDate) {
        return {
          success: false,
          error: '缺少订阅日期'
        };
      }
    }

    // 订阅资产验证
    if (assetType === 'subscription') {
      if (!periodAmount || periodAmount <= 0) {
        return {
          success: false,
          error: '每期金额必须大于0'
        };
      }
      if (!periodType) {
        return {
          success: false,
          error: '请选择周期类型'
        };
      }
      if (periodType === 'custom') {
        if (!periodDays || periodDays < 1 || periodDays > 365) {
          return {
            success: false,
            error: '周期天数必须在1-365之间'
          };
        }
      }
    }

    // 检查资产名称是否重复
    const existingAsset = await db.collection('assets')
      .where({
        _openid: wxContext.OPENID,
        name: name.trim()
      })
      .count();

    if (existingAsset.total > 0) {
      return {
        success: false,
        error: '资产名称已存在，请使用其他名称'
      };
    }

    // 构建基础数据
    const assetData = {
      _openid: wxContext.OPENID,
      name: name.trim(),
      purchaseDate: purchaseDate,
      category: category,
      icon: icon,  // 存储图标信息
      iconName: iconName,  // 存储图标名称
      groupName: groupName,  // 存储分组名称
      remark: remark,
      excludeTotal: excludeTotal,
      excludeDaily: excludeDaily,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    };

    // 根据资产类型添加不同字段
    if (assetType === 'subscription') {
      // 订阅资产
      const calculatedPeriodDays = periodType === 'custom' ? periodDays : PERIOD_DAYS_MAP[periodType];
      const subscriptionStatus = pendingSubscription ? 'pending' : 'active';

      assetData.assetType = 'subscription';
      assetData.price = parseFloat(periodAmount);  // price 字段存储每期金额，用于列表排序等
      assetData.periodAmount = parseFloat(periodAmount);
      assetData.periodType = periodType;
      assetData.periodDays = calculatedPeriodDays;

      // 根据待订阅状态设置日期
      if (pendingSubscription) {
        // 待订阅：使用 subscriptionStartDate
        assetData.purchaseDate = subscriptionStartDate;
        assetData.subscriptionStartDate = subscriptionStartDate;
        assetData.subscriptionEndDate = '';
      } else {
        // 已订阅：使用 purchaseDate
        assetData.purchaseDate = purchaseDate;
        assetData.subscriptionStartDate = purchaseDate;
        assetData.subscriptionEndDate = subscriptionEndDate || '';
      }

      assetData.subscriptionStatus = subscriptionStatus;
      assetData.amountHistory = [];  // 金额变更历史
      assetData.pendingSubscription = pendingSubscription;
      assetData.status = 'active';  // 订阅资产使用 subscriptionStatus
    } else {
      // 普通资产
      assetData.assetType = 'fixed';
      assetData.price = parseFloat(price);
      assetData.status = status;
      assetData.retiredDate = retiredDate;
      assetData.soldDate = soldDate;
    }

    // 添加资产到数据库
    const result = await db.collection('assets').add({
      data: assetData
    });

    return {
      success: true,
      assetId: result._id,
      message: '资产添加成功'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};