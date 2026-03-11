// asset-add.js
Page({
  data: {
    // 表单数据
    name: '',
    price: '',
    purchaseDate: '',
    remark: '',
    isRetired: false,
    isSold: false,
    excludeTotal: false,
    excludeDaily: false,

    // 类别 - 初始为空，从数据库加载
    categories: [],
    selectedCategories: [], // 支持多选

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
    // 加载类别
    this.loadCategories();
  },

  // 加载类别
  loadCategories() {
    wx.cloud.callFunction({
      name: 'getCategories',
      success: (res) => {
        console.log('加载类别成功:', res);
        if (res.result && res.result.success && res.result.data) {
          const categories = res.result.data.map(item => item.name);
          console.log('类别列表:', categories);
          this.setData({ categories });
          // 默认选中第一个类别
          if (categories.length > 0) {
            this.setData({ selectedCategories: [categories[0]] });
          }
        } else {
          console.log('加载类别失败，云函数返回错误:', res.result);
          this.setData({ categories: [] });
        }
      },
      fail: (err) => {
        console.error('加载类别失败:', err);
        this.setData({ categories: [] });
      }
    });
  },

  // 物品名称输入
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  // 价格输入
  onPriceInput(e) {
    this.setData({ price: e.detail.value });
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  // 购买日期改变
  onDateChange(e) {
    this.setData({
      purchaseDate: e.detail.value
    });
  },

  // 切换类别选择（支持多选）
  toggleCategory(e) {
    const category = e.currentTarget.dataset.category;
    const { selectedCategories } = this.data;
    const index = selectedCategories.indexOf(category);

    if (index > -1) {
      // 已选中，取消选择（至少保留一个）
      if (selectedCategories.length > 1) {
        selectedCategories.splice(index, 1);
        this.setData({ selectedCategories });
      }
    } else {
      // 未选中，添加
      selectedCategories.push(category);
      this.setData({ selectedCategories });
    }

    // 清除类别错误
    if (this.data.errors.category) {
      this.setData({ 'errors.category': null });
    }
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
          if (newCategory) {
            wx.showLoading({ title: '添加中...' });
            // 调用云函数添加类别
            wx.cloud.callFunction({
              name: 'addCategory',
              data: { name: newCategory },
              success: (res) => {
                wx.hideLoading();
                if (res.result.success) {
                  const newCategories = [...this.data.categories, newCategory];
                  this.setData({
                    categories: newCategories,
                    // 自动选中新添加的类别
                    selectedCategories: [...this.data.selectedCategories, newCategory]
                  });
                  wx.showToast({
                    title: '添加成功',
                    icon: 'success'
                  });
                } else {
                  wx.showToast({
                    title: res.result.error || '添加失败',
                    icon: 'none'
                  });
                }
              },
              fail: (err) => {
                wx.hideLoading();
                console.error('添加类别失败:', err);
                wx.showToast({
                  title: '添加失败，请重试',
                  icon: 'none'
                });
              }
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
      errors.name = '物品名称不能超过 50 个字符';
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

    // 验证类别（至少选择一个）
    if (!formData.category || formData.category.trim() === '') {
      errors.category = '请至少选择一个类别';
    }

    return errors;
  },

  // 表单提交
  onSubmit(e) {
    const formData = e.detail.value;

    // 将选中的类别用逗号连接（支持多选）
    formData.category = this.data.selectedCategories.join(',');

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

    // 确定资产状态
    let status = 'active'; // 默认服役中
    if (this.data.isRetired) {
      status = 'retired';
    } else if (this.data.isSold) {
      status = 'sold';
    }

    // 获取 openid
    const openid = getApp().globalData.openid;
    if (!openid) {
      wx.hideLoading();
      wx.showToast({
        title: '获取用户信息失败，请重试',
        icon: 'none'
      });
      return;
    }

    // 保存到云数据库
    const db = wx.cloud.database({
      env: getApp().globalData.envId
    });
    db.collection('assets').add({
      data: {
        _openid: openid,
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
    }).then(() => {
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
            // 触发上一页的 onShow
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
    }).catch(err => {
      console.error('保存失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    });
  }
});
