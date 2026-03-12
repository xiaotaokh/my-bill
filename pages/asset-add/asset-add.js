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

    // 缩略图选择
    selectedIcon: '📦', // 用户选择的自定义缩略图（默认为📦）
    selectedIconName: '默认',
    uploadedImagePath: '', // 用户上传的图片路径
    builtinIcons: [  // 内置的常见资产图标
      { name: '默认', icon: '📦' },  // 将默认图标放在第一位
      { name: '手机', icon: '📱' },
      { name: '电脑', icon: '💻' },
      { name: '平板', icon: '🖥️' },  // 修复平板图标，使用显示器图标
      { name: '相机', icon: '📷' },
      { name: '手表', icon: '⌚' },
      { name: '眼镜', icon: '👓' },
      { name: '耳机', icon: '🎧' },
      { name: '音响', icon: '🔊' },
      { name: '车子', icon: '🚗' },
      { name: '房子', icon: '🏠' },
      { name: '钱包', icon: '👛' },  // 修复钱包图标
      { name: '珠宝', icon: '💎' },
      { name: '家电', icon: '📺' },
      { name: '家具', icon: '🛋️' },  // 修复家具图标
      { name: '衣物', icon: '👕' },
      { name: '鞋', icon: '👟' },
      { name: '包包', icon: '👜' },
      { name: '书籍', icon: '📚' },
      { name: '餐饮', icon: '🍔' },
      { name: '饮品', icon: '🥤' },
      { name: '药品', icon: '💊' },
      { name: '健身', icon: '💪' },
      { name: '乐器', icon: '🎸' },
      { name: '游戏', icon: '🎮' }
    ],

    // 类别 - 初始为空，从数据库加载
    categories: [],

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
      purchaseDate: `${year}-${month}-${day}`,
      selectedIcon: '📦', // 设置默认的通用emoji
      selectedIconName: '默认'
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
          const categories = res.result.data.map(item => ({
            name: item.name,
            icon: item.icon || '', // 加载类别图标
            selected: false // 默认不选中
          }));

          // 默认选中第一个类别
          if (categories.length > 0) {
            categories[0].selected = true;
          }

          console.log('类别列表:', categories);
          this.setData({ categories });
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

  // 辅助函数：判断是否为图片路径（云存储或网络路径）
  isAssetImage(icon) {
    if (!icon) return true;  // 没有图标时显示上传区域
    // 检查是否为云存储路径或网络路径
    return icon.indexOf('cloud://') !== -1 || icon.indexOf('http://') !== -1 || icon.indexOf('https://') !== -1;
  },

  // 移除已上传的图片
  removeUploadedImage() {
    // 删除上传图片后，默认选中第一个内置图标（默认图标）
    this.setData({
      uploadedImagePath: '',
      selectedIcon: this.data.builtinIcons[0].icon, // 默认选中第一个内置图标
      selectedIconName: this.data.builtinIcons[0].name
    });
  },

  selectBuiltinIcon(e) {
    const icon = e.currentTarget.dataset.icon;
    this.setData({
      selectedIcon: icon.icon,
      selectedIconName: icon.name,
      uploadedImagePath: '' // 清空之前上传的图片
    });
    // 移除提示信息
    // wx.showToast({
    //   title: `已选择${icon.name}`,
    //   icon: 'success'
    // });
  },

  // 选择自定义图标
  chooseIcon() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const size = res.tempFiles[0].size;

        // 检查文件大小（2M限制）
        if (size > 2 * 1024 * 1024) {
          wx.showToast({
            title: '图片大小不能超过2M',
            icon: 'none'
          });
          return;
        }

        // 检查文件类型
        const ext = tempFilePath.split('.').pop().toLowerCase();
        const allowedTypes = ['jpg', 'jpeg', 'png', 'webp', 'svg'];
        if (!allowedTypes.includes(ext)) {
          wx.showToast({
            title: '仅支持jpg/png/webp/svg格式',
            icon: 'none'
          });
          return;
        }

        // 设置临时路径作为预览，并清空之前选择的内置图标
        this.setData({
          selectedIcon: '', // 清空之前选择的内置图标
          uploadedImagePath: tempFilePath // 设置上传图片的临时路径
        });

        // 上传图片到云存储
        this.uploadIconToCloud(tempFilePath);
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        if (err.errMsg && err.errMsg.includes('cancel')) {
          // 用户取消选择，不做任何操作
          return;
        }
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 上传图标到云存储
  uploadIconToCloud(filePath) {
    wx.showLoading({ title: '上传中...' });

    const fileName = `icons/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;

    wx.cloud.uploadFile({
      cloudPath: fileName,
      filePath: filePath,
      success: (res) => {
        console.log('上传成功:', res.fileID);
        // 上传成功后，更新selectedIcon为云存储路径，保持缩略图显示
        this.setData({
          uploadedImagePath: res.fileID // 使用uploadedImagePath存储云存储路径
        });
        wx.hideLoading();
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('上传失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '上传失败，请重试',
          icon: 'none'
        });
        // 如果上传失败，清空上传路径
        this.setData({
          uploadedImagePath: ''
        });
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
    const index = e.currentTarget.dataset.index;
    const key = `categories[${index}].selected`;

    this.setData({
      [key]: !this.data.categories[index].selected
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
  onSubmit() {
    // 构造表单数据
    const formData = {
      name: this.data.name,
      price: this.data.price,
      purchaseDate: this.data.purchaseDate,
      remark: this.data.remark,
      // 优先使用上传的图片，如果有的话；否则使用选择的内置图标
      // 如果两者都没有，使用默认图标
      icon: this.data.uploadedImagePath || this.data.selectedIcon || '📦'
    };

    // 获取选中的类别
    const selectedCats = this.data.categories
      .filter(item => item.selected)
      .map(item => item.name);

    // 将选中的类别用逗号连接（支持多选）
    formData.category = selectedCats.join(',');

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

    // 调用云函数保存资产
    wx.cloud.callFunction({
      name: 'addAsset',
      data: {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        purchaseDate: formData.purchaseDate,
        category: formData.category,
        icon: formData.icon, // 传递缩略图字段
        remark: formData.remark || '',
        status: status,
        excludeTotal: this.data.excludeTotal,
        excludeDaily: this.data.excludeDaily
      },
      success: (res) => {
        console.log('云函数调用成功:', res);
        if (res.result.success) {
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
        } else {
          throw new Error(res.result.error || '保存失败');
        }
      },
      fail: (err) => {
        console.error('云函数调用失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      }
    });
  }
});