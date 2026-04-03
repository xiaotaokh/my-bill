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
      id,
      name,
      price,
      purchaseDate,
      category,
      icon,
      iconName = '',  // 图标名称，用于回显
      groupName = '',  // 分组名称，用于回显
      remark = '',
      status = 'active',
      retiredDate = '',
      soldDate = '',
      excludeTotal = false,
      excludeDaily = false,
      // 订阅资产字段
      assetType = 'fixed',
      periodAmount,
      periodType,
      periodDays,
      subscriptionStartDate,
      subscriptionEndDate = '',
      subscriptionStatus = 'active',
      pendingSubscription = false,
      endSubscription = false  // 结束订阅标记
    } = event;

    // 验证必需参数
    if (!id) {
      return {
        success: false,
        error: '缺少资产ID'
      };
    }

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

    // 检查资产名称是否重复（排除当前资产）
    const existingAsset = await db.collection('assets')
      .where({
        _openid: wxContext.OPENID,
        name: name.trim(),
        _id: db.command.neq(id)
      })
      .count();

    if (existingAsset.total > 0) {
      return {
        success: false,
        error: '资产名称已存在，请使用其他名称'
      };
    }

    // 获取现有资产数据（用于处理金额变更历史）
    const currentAsset = await db.collection('assets').doc(id).get();
    if (!currentAsset.data) {
      return {
        success: false,
        error: '资产不存在'
      };
    }

    // 构建基础更新数据
    const updateData = {
      name: name.trim(),
      purchaseDate: purchaseDate,
      category: category,
      icon: icon,
      iconName: iconName,
      groupName: groupName,
      remark: remark,
      excludeTotal: excludeTotal,
      excludeDaily: excludeDaily,
      updatedAt: db.serverDate()
    };

    // 根据资产类型处理不同字段
    if (assetType === 'subscription') {
      const calculatedPeriodDays = periodType === 'custom' ? periodDays : PERIOD_DAYS_MAP[periodType];

      updateData.assetType = 'subscription';
      updateData.price = parseFloat(periodAmount);
      updateData.periodAmount = parseFloat(periodAmount);
      updateData.periodType = periodType;
      updateData.periodDays = calculatedPeriodDays;

      // 根据待订阅状态设置日期
      if (pendingSubscription) {
        // 待订阅：使用 subscriptionStartDate，清空结束状态
        updateData.purchaseDate = subscriptionStartDate;
        updateData.subscriptionStartDate = subscriptionStartDate;
        updateData.subscriptionEndDate = '';
        updateData.subscriptionStatus = 'pending';
      } else {
        // 已订阅：使用 purchaseDate
        updateData.purchaseDate = purchaseDate;
        updateData.subscriptionStartDate = purchaseDate;
        updateData.subscriptionEndDate = subscriptionEndDate || '';

        // 处理结束订阅（仅非待订阅状态）
        if (endSubscription) {
          updateData.subscriptionStatus = 'ended';
          updateData.subscriptionEndDate = subscriptionEndDate || new Date().toISOString().split('T')[0];
        } else {
          updateData.subscriptionStatus = 'active';
        }
      }

      updateData.pendingSubscription = pendingSubscription;

      // 处理金额变更历史
      const existingAmountHistory = currentAsset.data.amountHistory || [];
      const oldPeriodAmount = currentAsset.data.periodAmount;

      // 如果金额发生变化，记录到历史
      if (oldPeriodAmount && parseFloat(periodAmount) !== oldPeriodAmount) {
        const historyEntry = {
          amount: oldPeriodAmount,
          effectiveDate: currentAsset.data.subscriptionStartDate || currentAsset.data.purchaseDate
        };
        updateData.amountHistory = [...existingAmountHistory, historyEntry];
      }

      // 保持 status 字段为 active（订阅资产使用 subscriptionStatus）
      updateData.status = 'active';
    } else {
      // 普通资产
      updateData.assetType = 'fixed';
      updateData.price = parseFloat(price);
      updateData.status = status;
      updateData.retiredDate = retiredDate;
      updateData.soldDate = soldDate;
    }

    // 更新资产
    const result = await db.collection('assets').doc(id).update({
      data: updateData
    });

    if (result.stats.updated === 0) {
      return {
        success: false,
        error: '资产不存在或无权更新'
      };
    }

    return {
      success: true,
      message: '资产更新成功'
    };

  } catch (error) {
    console.error('更新资产失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};