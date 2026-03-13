// asset-detail.js
Page({
  data: {
    asset: {},
    assetId: '',
    displayIcon: null, // 资产缩略图的临时URL
    categoryIcon: null, // 分类图标的临时URL
    categoryIconEmoji: '', // 分类图标 emoji
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

  onShow: function () {
    // 从编辑页返回时刷新数据
    if (this.data.assetId) {
      this.loadAssetDetail(this.data.assetId);
    }
  },

  // 加载资产详情
  loadAssetDetail(id) {
    wx.showLoading({ title: '加载中...' });

    const db = wx.cloud.database({
      env: getApp().globalData.envId
    });
    db.collection('assets').doc(id).get()
      .then(async res => {
        if (res.data) {
          const asset = res.data;
          const displayInfo = this.calculateDisplayInfo(asset);

          // 处理资产缩略图 - 获取云存储临时URL
          let displayIcon = null;
          if (asset.icon && asset.icon.startsWith('cloud://')) {
            try {
              const fileRes = await wx.cloud.getTempFileURL({
                fileList: [asset.icon]
              });
              if (fileRes.fileList && fileRes.fileList[0] && fileRes.fileList[0].tempFileURL) {
                displayIcon = fileRes.fileList[0].tempFileURL;
              }
            } catch (e) {
              // 获取失败时使用 null
            }
          } else if (asset.icon && asset.icon.startsWith('http')) {
            displayIcon = asset.icon;
          }

          // 加载分类图标
          this.loadCategoryIcon(asset.category);

          this.setData({
            asset: asset,
            displayInfo: displayInfo,
            displayIcon: displayIcon
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

  // 加载分类图标
  loadCategoryIcon(categoryName) {
    if (!categoryName) return;

    wx.cloud.callFunction({
      name: 'getCategories',
      success: async (res) => {
        if (res.result && res.result.data) {
          const category = res.result.data.find(c => c.name === categoryName);
          if (category && category.icon) {
            // 处理云存储图标
            if (category.icon.startsWith('cloud://')) {
              try {
                const fileRes = await wx.cloud.getTempFileURL({
                  fileList: [category.icon]
                });
                if (fileRes.fileList && fileRes.fileList[0] && fileRes.fileList[0].tempFileURL) {
                  this.setData({
                    categoryIcon: fileRes.fileList[0].tempFileURL
                  });
                }
              } catch (e) {
                // 获取失败时使用空
              }
            } else if (category.icon.startsWith('http')) {
              this.setData({
                categoryIcon: category.icon
              });
            } else {
              // emoji 图标
              this.setData({
                categoryIconEmoji: category.icon
              });
            }
          }
        }
      }
    });
  },

  // 编辑资产
  editAsset() {
    wx.navigateTo({
      url: `/pages/asset-add/asset-add?id=${this.data.assetId}&edit=true`
    });
  },

  // 预览资产图标原图
  previewIcon() {
    if (this.data.displayIcon) {
      wx.previewImage({
        current: this.data.displayIcon,
        urls: [this.data.displayIcon]
      });
    }
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