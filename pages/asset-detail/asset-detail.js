// asset-detail.js
Page({
  data: {
    asset: {},
    assetId: ''
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
          this.setData({
            asset: res.data
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

  // 辅助函数：安全解析日期（兼容 iOS）
  parseDate(dateInput) {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'string') {
      return new Date(dateInput.replace(/-/g, '/'));
    }
    return new Date(dateInput);
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化日期时间
  formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = this.parseDate(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 计算服役天数
  getServedDays(purchaseDate) {
    if (!purchaseDate) return 0;
    const purchase = this.parseDate(purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now - purchase);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  },

  // 计算日均成本
  getDailyCost(price, purchaseDate) {
    if (!price || !purchaseDate) return 0;
    const days = this.getServedDays(purchaseDate);
    if (days === 0) return price;
    return (price / days).toFixed(2);
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
