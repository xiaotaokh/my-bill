// asset-detail.js
Page({
  data: {
    asset: {},
    assetId: '',
    // 计算后的显示字段
    displayInfo: {
      purchaseDateFormatted: '',
      createdAtFormatted: '',
      retiredDateFormatted: '',
      soldDateFormatted: '',
      usedDays: 0,
      dailyCost: '0.00',
      dailyEquivalent: '0.00',
      dateRange: ''
    }
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({
        assetId: options.id
      });
      this.loadAssetDetail(options.id);
    }
  },

  // 加载资产详情
  loadAssetDetail(id) {
    wx.showLoading({ title: '加载中...' });

    const db = wx.cloud.database({
      env: getApp().globalData.envId
    });
    db.collection('assets').doc(id).get()
      .then(res => {
        if (res.data) {
          const asset = res.data;
          const displayInfo = this.calculateDisplayInfo(asset);
          this.setData({
            asset: asset,
            displayInfo: displayInfo
          });
        } else {
          wx.showToast({
            title: '资产不存在',
            icon: 'none'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      })
      .catch(err => {
        console.error('加载资产失败:', err);

        // 检查是否是权限错误（访问他人数据）
        if (err.errCode === -502001 || (err.message && err.message.includes('permission'))) {
          wx.showToast({
            title: '无权访问此资产',
            icon: 'none'
          });
        } else {
          wx.showModal({
            title: '加载失败',
            content: '错误信息：' + (err.message || JSON.stringify(err)),
            showCancel: false
          });
        }

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  // 辅助函数：安全解析日期（兼容 iOS，明确解析为本地时间午夜）
  parseDate(dateInput) {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'string') {
      // 解析 YYYY-MM-DD 格式为本地时间的午夜，避免时区问题
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      return new Date(dateInput.replace(/-/g, '/'));
    }
    return new Date(dateInput);
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化日期时间（添加时间专用）
  formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 计算显示信息 - 和首页保持一致
  calculateDisplayInfo(asset) {
    const purchaseDate = this.parseDate(asset.purchaseDate);
    const now = new Date();

    // 计算已使用天数
    let usedDays = 0;
    let endDate = now;

    if (asset.purchaseDate) {
      // 已退役/已卖出：计算到退役/卖出日期
      const retiredDateStr = asset.retiredDate || asset.soldDate;
      if ((asset.status === 'retired' || asset.status === 'sold') && retiredDateStr) {
        endDate = this.parseDate(retiredDateStr);
      }

      usedDays = Math.floor((endDate - purchaseDate) / (1000 * 60 * 60 * 24)) + 1;
      if (usedDays <= 0) usedDays = 1;
    }

    // 计算日均成本（服役中）
    let dailyCost = '0.00';
    // 折合每日（已退役/已卖出）
    let dailyEquivalent = '0.00';

    if (asset.status === 'active' && asset.price && usedDays >= 1) {
      dailyCost = (asset.price / usedDays).toFixed(2);
    } else if ((asset.status === 'retired' || asset.status === 'sold') && asset.price && usedDays >= 1) {
      dailyEquivalent = (asset.price / usedDays).toFixed(2);
      dailyCost = dailyEquivalent;
    }

    // 计算日期范围
    const startDate = this.formatDate(asset.purchaseDate);
    let dateRangeEnd = '至今';
    const retiredDateStr = asset.retiredDate || asset.soldDate;
    if ((asset.status === 'retired' || asset.status === 'sold') && retiredDateStr) {
      dateRangeEnd = this.formatDate(retiredDateStr);
    }

    return {
      purchaseDateFormatted: this.formatDate(asset.purchaseDate),
      createdAtFormatted: this.formatDate(asset.createdAt),
      retiredDateFormatted: this.formatDate(asset.retiredDate),
      soldDateFormatted: this.formatDate(asset.soldDate),
      usedDays: usedDays,
      dailyCost: dailyCost,
      dailyEquivalent: dailyEquivalent,
      dateRange: asset.status === 'active' ? `${startDate} - 至今` : `${startDate} - ${dateRangeEnd}`
    };
  },

  // 获取资产对应的默认图标
  getAvatarIcon(category) {
    if (!category) return '📦';

    const categoryIcons = {
      '电子设备': '📱',
      '家具': '🛋️',
      '车子': '🚗',
      '电脑': '💻',
      '房产': '🏠',
      '投资': '📈',
      '餐饮': '🍔',
      '衣服': '👕',
      '书籍': '📚',
      '运动': '⚽',
      '游戏': '🎮'
    };

    if (categoryIcons[category]) {
      return categoryIcons[category];
    }

    // 关键词匹配
    if (category.includes('电子') || category.includes('手机') || category.includes('数码')) {
      return '📱';
    } else if (category.includes('车') || category.includes('汽车')) {
      return '🚗';
    } else if (category.includes('房') || category.includes('地产') || category.includes('房子')) {
      return '🏠';
    } else if (category.includes('电脑') || category.includes('笔记')) {
      return '💻';
    } else if (category.includes('家') || category.includes('具')) {
      return '🛋️';
    } else if (category.includes('投') || category.includes('资') || category.includes('基金') || category.includes('股票')) {
      return '📈';
    } else if (category.includes('餐') || category.includes('食')) {
      return '🍔';
    } else if (category.includes('衣') || category.includes('服')) {
      return '👕';
    } else if (category.includes('书') || category.includes('图书')) {
      return '📚';
    } else if (category.includes('运') || category.includes('动') || category.includes('球')) {
      return '⚽';
    } else if (category.includes('游') || category.includes('戏')) {
      return '🎮';
    }

    return '📦';
  },

  // 编辑资产
  editAsset() {
    wx.navigateTo({
      url: `/pages/asset-add/asset-add?id=${this.data.assetId}&edit=true`
    });
  },

  // 删除资产
  deleteAsset() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此资产吗？删除后无法恢复',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          this.confirmDelete();
        }
      }
    });
  },

  // 确认删除
  confirmDelete() {
    wx.showLoading({ title: '删除中...' });

    const db = wx.cloud.database({
      env: getApp().globalData.envId
    });
    db.collection('assets').doc(this.data.assetId).remove()
      .then(() => {
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });

        // 返回并刷新
        setTimeout(() => {
          wx.navigateBack({
            success: () => {
              const pages = getCurrentPages();
              if (pages.length > 1) {
                const prevPage = pages[pages.length - 2];
                if (prevPage.loadAssets) {
                  prevPage.loadAssets();
                }
              }
            }
          });
        }, 1500);
      })
      .catch(err => {
        console.error('删除失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
      });
  }
});