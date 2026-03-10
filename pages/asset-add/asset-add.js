// asset-add.js
Page({
  data: {
    // 表单数据
    name: '',
    price: '',
    purchaseDate: '',
    category: '',
    remark: '',
    isRetired: false,
    isSold: false,
    excludeTotal: false,
    excludeDaily: false,

    // 类别
    categories: ['电子设备', '房产', '车辆', '投资', '其他'],
    currentCategoryIndex: 0,

    // 表单验证
    errors: {}
  },

  onLoad: function () {
    // 初始化购买日期为今天
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.setData({
      purchaseDate: `${year}-${month}-${day}`
    });
  },

  // 购买日期改变
  onDateChange(e) {
    this.setData({
      purchaseDate: e.detail.value
    });
  },

  // 类别改变
  onCategoryChange(e) {
    this.setData({
      currentCategoryIndex: e.detail.value,
      category: this.data.categories[e.detail.value]
    });
  },

  // 添加新类别
  addCategory() {
    wx.showModal({
      title: '添加新类别',
      editable: true,
      placeholderText: '请输入新类别名称',
      confirmButtonText: '确定',
      success: (res) => {
        if (res.confirm && res.content) {
          const newCategory = res.content.trim();
          if (newCategory && !this.data.categories.includes(newCategory)) {
            this.setData({
              categories: [...this.data.categories, newCategory],
              currentCategoryIndex: this.data.categories.length
            });
          } else if (newCategory) {
            wx.showToast({
              title: '类别已存在',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 已退役开关
  onRetiredChange(e) {
    const checked = e.detail.value;
    this.setData({ isRetired: checked });

    // 如果已退役，取消已卖出
    if (checked) {
      this.setData({ isSold: false });
    }
  },

  // 已卖出开关
  onSoldChange(e) {
    const checked = e.detail.value;
    this.setData({ isSold: checked });

    // 如果已卖出，取消已退役
    if (checked) {
      this.setData({ isRetired: false });
    }
  },

  // 不计入总资产开关
  onExcludeTotalChange(e) {
    this.setData({ excludeTotal: e.detail.value });
  },

  // 不计入日均开关
  onExcludeDailyChange(e) {
    this.setData({ excludeDaily: e.detail.value });
  },

  // 表单验证
  validateForm(formData) {
    const errors = {};

    // 验证物品名称
    if (!formData.name || formData.name.trim() === '') {
      errors.name = '请输入物品名称';
    } else if (formData.name.length > 50) {
      errors.name = '物品名称不能超过50个字符';
    }

    // 验证价格
    if (!formData.price || formData.price <= 0) {
      errors.price = '请输入有效的价格';
    } else if (isNaN(formData.price)) {
      errors.price = '价格必须是数字';
    }

    // 验证购买日期
    if (!formData.purchaseDate) {
      errors.purchaseDate = '请选择购买日期';
    }

    // 验证类别
    if (!formData.category) {
      errors.category = '请选择类别';
    }

    return errors;
  },

  // 表单提交
  async onSubmit(e) {
    const formData = e.detail.value;

    // 设置类别
    formData.category = this.data.categories[this.data.currentCategoryIndex] || this.data.categories[0];

    // 验证表单
    const errors = this.validateForm(formData);
    if (Object.keys(errors).length > 0) {
      this.setData({ errors });
      const firstError = Object.values(errors)[0];
      wx.showToast({
        title: firstError,
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      // 确定资产状态
      let status = 'active'; // 默认服役中
      if (this.data.isRetired) {
        status = 'retired';
      } else if (this.data.isSold) {
        status = 'sold';
      }

      // 保存到云数据库
      const db = wx.cloud.database();
      await db.collection('assets').add({
        data: {
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          purchaseDate: formData.purchaseDate,
          category: formData.category,
          remark: formData.remark || '',
          status: status,
          excludeTotal: this.data.excludeTotal,
          excludeDaily: this.data.excludeDaily,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      });

      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      // 返回首页并刷新
      setTimeout(() => {
        wx.navigateBack({
          delta: 1,
          success: () => {
            // 触发上一页的onShow
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
    } catch (err) {
      console.error('保存失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  }
});
