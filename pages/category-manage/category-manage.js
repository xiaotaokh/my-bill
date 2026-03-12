// pages/category-manage/category-manage.js

Page({
  data: {
    categories: [],
    loading: false,
    // 排序相关
    sortOptions: ['名称', '添加时间'],
    currentSortIndex: 0,
    sortOrder: 'asc', // 'asc' 或 'desc'

    // 添加/编辑弹窗相关
    dialogVisible: false,
    dialogTitle: '添加分类',
    operationType: '', // 'add' 或 'edit'
    editCategoryId: null,

    // 表单数据
    tempCategoryName: '',
    selectedIcon: '',
    selectedIconName: '',
    uploadedImagePath: '', // 用户上传的图片路径

    // 内置图标列表（带中文名称）
    builtinIcons: [
      { name: '默认', icon: '📦' },
      { name: '手机', icon: '📱' },
      { name: '电脑', icon: '💻' },
      { name: '平板', icon: '🖥️' },
      { name: '相机', icon: '📷' },
      { name: '手表', icon: '⌚' },
      { name: '眼镜', icon: '👓' },
      { name: '耳机', icon: '🎧' },
      { name: '音响', icon: '🔊' },
      { name: '车子', icon: '🚗' },
      { name: '房子', icon: '🏠' },
      { name: '钱包', icon: '👛' },
      { name: '珠宝', icon: '💎' },
      { name: '家电', icon: '📺' },
      { name: '家具', icon: '🛋️' },
      { name: '衣物', icon: '👕' },
      { name: '鞋', icon: '👟' },
      { name: '包包', icon: '👜' },
      { name: '书籍', icon: '📚' },
      { name: '餐饮', icon: '🍔' },
      { name: '饮品', icon: '🥤' },
      { name: '药品', icon: '💊' },
      { name: '健身', icon: '💪' },
      { name: '乐器', icon: '🎸' },
      { name: '游戏', icon: '🎮' },
      { name: '投资', icon: '📈' },
      { name: '现金', icon: '💵' },
      { name: '黄金', icon: '🥇' },
      { name: '信用卡', icon: '💳' },
      { name: '保险', icon: '🛡️' },
      { name: '其他', icon: '➕' }
    ]
  },

  onLoad: function () {
    this.loadCategories();
  },

  onShow: function () {
    // 页面每次显示都重新加载，确保数据是最新的
    this.loadCategories();
  },

  onPullDownRefresh: function () {
    this.loadCategories(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载类别列表
  loadCategories: function (callback) {
    if (this.data.loading) return;

    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });

    wx.cloud.callFunction({
      name: 'getCategories',
      success: (res) => {
        const resultData = res.result;

        if (resultData && resultData.success) {
          // 为每个类别处理图标（云存储ID转换为临时路径）
          const processCategories = async () => {
            const categoriesData = resultData.data || [];

            const categoriesWithIcons = await Promise.all(categoriesData.map(async category => {
              let displayIcon = null;

              // 如果是云存储的fileID，获取临时文件链接
              if (category.icon && category.icon.startsWith('cloud://')) {
                try {
                  const fileRes = await wx.cloud.getTempFileURL({
                    fileList: [category.icon]
                  });
                  if (fileRes.fileList && fileRes.fileList[0] && fileRes.fileList[0].tempFileURL) {
                    displayIcon = fileRes.fileList[0].tempFileURL;
                  }
                } catch (e) {
                  // 获取失败时使用 null，显示内置图标
                }
              } else if (category.icon && category.icon.startsWith('http')) {
                // 已经是 http 临时链接，直接使用
                displayIcon = category.icon;
              }

              return {
                ...category,
                displayIcon: displayIcon,
                computedIcon: this.getCategoryIcon(category)
              };
            }));

            // 应用当前排序
            const sortedCategories = this.applySorting(categoriesWithIcons);

            this.setData({
              categories: sortedCategories
            });
          };

          processCategories();
        } else {
          this.setData({
            categories: []
          });
          wx.showToast({
            title: resultData?.error || '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        this.setData({
          categories: []
        });
        wx.showToast({
            title: '网络错误',
            icon: 'none'
        });
      },
      complete: () => {
        this.setData({ loading: false });
        wx.hideLoading();
        if (callback) callback();
      }
    });
  },

  // 应用排序
  applySorting: function(categories) {
    const sorted = [...categories];
    const { currentSortIndex, sortOrder } = this.data;

    switch(currentSortIndex) {
      case 0: // 按名称排序
        sorted.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (sortOrder === 'asc') {
            return nameA.localeCompare(nameB);
          } else {
            return nameB.localeCompare(nameA);
          }
        });
        break;
      case 1: // 按添加时间排序
        sorted.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (sortOrder === 'asc') {
            return timeA - timeB;
          } else {
            return timeB - timeA;
          }
        });
        break;
    }

    return sorted;
  },

  // 改变排序
  changeSort: function(e) {
    const index = parseInt(e.detail.value);
    const { sortOrder, currentSortIndex } = this.data;

    // 如果是同一个排序字段，则切换升序/降序；否则重置为升序
    const newSortOrder = (currentSortIndex === index) ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';

    this.setData({
      currentSortIndex: index,
      sortOrder: newSortOrder
    });

    // 重新排序并更新显示
    const sortedCategories = this.applySorting(this.data.categories);
    this.setData({
      categories: sortedCategories
    });
  },

  // 获取分类图标
  getCategoryIcon: function (category) {
    if (!category || !category.name) return '📦';

    // 根据类别返回相应图标
    const categoryIcons = {
      '电子设备': '📱',
      '家具': '🛋️',
      '车辆': '🚗',
      '电脑': '💻',
      '房产': '🏠',
      '投资': '📈',
      '餐饮': '🍔',
      '衣服': '👕',
      '书籍': '📚',
      '运动': '⚽',
      '游戏': '🎮',
      '其他': '📦'
    };

    // 检查是否存在于类别映射中
    if (categoryIcons[category.name]) {
      return categoryIcons[category.name];
    }

    // 检查类别是否有自定义图标
    if (category.icon) {
      return category.icon;
    }

    // 对于更细分的类别，提取关键词进行匹配
    const lowerCategory = category.name.toLowerCase();
    if (lowerCategory.includes('电子') || lowerCategory.includes('手机') || lowerCategory.includes('数码')) {
      return '📱';
    } else if (lowerCategory.includes('车')) {
      return '🚗';
    } else if (lowerCategory.includes('房')) {
      return '🏠';
    } else if (lowerCategory.includes('电脑') || lowerCategory.includes('笔记')) {
      return '💻';
    } else if (lowerCategory.includes('家') || lowerCategory.includes('具')) {
      return '🛋️';
    } else if (lowerCategory.includes('投') || lowerCategory.includes('资') || lowerCategory.includes('基金') || lowerCategory.includes('股票')) {
      return '📈';
    } else if (lowerCategory.includes('餐') || lowerCategory.includes('食')) {
      return '🍔';
    } else if (lowerCategory.includes('衣') || lowerCategory.includes('服')) {
      return '👕';
    } else if (lowerCategory.includes('书') || lowerCategory.includes('图书')) {
      return '📚';
    } else if (lowerCategory.includes('运') || lowerCategory.includes('动') || lowerCategory.includes('球')) {
      return '⚽';
    } else if (lowerCategory.includes('游') || lowerCategory.includes('戏')) {
      return '🎮';
    }

    // 默认返回一个通用图标
    return '📦';
  },

  // ========== 添加/编辑分类相关方法 ==========

  // 显示分类添加/编辑弹窗
  showCategoryDialog: function(operationType, categoryId = null) {
    if (operationType === 'add') {
      // 添加分类时先设置初始数据
      this.setData({
        dialogVisible: true,
        dialogTitle: '添加分类',
        operationType: 'add',
        tempCategoryName: '',
        selectedIcon: this.data.builtinIcons[0].icon,
        selectedIconName: this.data.builtinIcons[0].name,
        uploadedImagePath: '',
        editCategoryId: null
      });
    } else if (operationType === 'edit' && categoryId) {
      // 查找要编辑的分类
      const category = this.data.categories.find(cat => cat._id === categoryId);
      if (category) {
        // 判断是内置图标还是上传的图片
        // 云存储fileID格式: cloud://xxx 或 http开头
        const iconValue = category.icon || '';
        const isBuiltinIcon = this.data.builtinIcons.some(item => item.icon === iconValue);
        const isUploadedImage = !isBuiltinIcon && iconValue.length > 0;

        this.setData({
          dialogVisible: true,
          dialogTitle: '编辑分类',
          operationType: 'edit',
          editCategoryId: categoryId,
          tempCategoryName: category.name,
          selectedIcon: iconValue || this.data.builtinIcons[0].icon,
          selectedIconName: isBuiltinIcon ? (this.data.builtinIcons.find(item => item.icon === iconValue)?.name || '') : (isUploadedImage ? '自定义图片' : ''),
          uploadedImagePath: isUploadedImage ? iconValue : ''
        });
      }
    }
  },

  // 监听分类名称输入
  onCategoryNameInput: function(e) {
    this.setData({
      tempCategoryName: e.detail.value
    });
  },

  // 选择内置图标
  selectBuiltinIcon: function(e) {
    const iconItem = e.currentTarget.dataset.icon;
    if (iconItem) {
      this.setData({
        selectedIcon: iconItem.icon,
        selectedIconName: iconItem.name,
        uploadedImagePath: '' // 清除上传的图片
      });
    }
  },

  // 上传自定义图标
  chooseImage: function() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success(res) {
        const tempFilePath = res.tempFiles[0].tempFilePath;

        // 检查文件大小 (最大2M)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (res.tempFiles[0].size > maxSize) {
          wx.showToast({
            title: '图片过大，请选择小于2M的图片',
            icon: 'none'
          });
          return;
        }

        // 上传图片到云存储
        that.uploadImage(tempFilePath);
      },
      fail: function(err) {
        // 用户取消选择图片或出现错误
      }
    });
  },

  // 上传图片到云存储
  uploadImage: function(filePath) {
    wx.showLoading({ title: '上传中...' });

    const that = this;
    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000);
    const fileName = `category-icons/${timestamp}-${randomNum}.png`;

    wx.cloud.uploadFile({
      cloudPath: fileName,
      filePath: filePath,
      success: res => {
        wx.hideLoading();
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });

        // 将云文件ID存储起来
        that.setData({
          selectedIcon: res.fileID,
          selectedIconName: '自定义图片',
          uploadedImagePath: res.fileID
        });
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
      }
    });
  },

  // 删除已上传的图片
  removeUploadedImage: function() {
    this.setData({
      uploadedImagePath: '',
      selectedIcon: this.data.builtinIcons[0].icon,
      selectedIconName: this.data.builtinIcons[0].name
    });
  },

  // 确认分类操作（添加或编辑）
  confirmCategoryOperation: function() {
    const { tempCategoryName, selectedIcon, operationType, editCategoryId } = this.data;

    if (!tempCategoryName || tempCategoryName.trim() === '') {
      wx.showToast({
        title: '请输入分类名称',
        icon: 'none'
      });
      return;
    }

    if (operationType === 'add') {
      // 添加分类时检查是否已存在
      const exists = this.data.categories.some(cat => cat.name === tempCategoryName);
      if (exists) {
        wx.showToast({
          title: '分类已存在',
          icon: 'none'
        });
        return;
      }

      this.performAddCategory();
    } else if (operationType === 'edit' && editCategoryId) {
      // 编辑分类时检查名称是否与其他分类冲突
      const exists = this.data.categories.some(cat =>
        cat.name === tempCategoryName && cat._id !== editCategoryId
      );
      if (exists) {
        wx.showToast({
          title: '分类名称已存在',
          icon: 'none'
        });
        return;
      }

      this.performEditCategory();
    }
  },

  // 执行添加分类
  performAddCategory: function() {
    wx.showLoading({ title: '添加中...' });

    const { tempCategoryName, selectedIcon } = this.data;

    // 调用云函数添加类别
    wx.cloud.callFunction({
      name: 'addCategory',
      data: {
        name: tempCategoryName,
        icon: selectedIcon || ''
      },
      success: (res) => {
        wx.hideLoading();
        if (res.result.success) {
          // 重新加载类别列表
          this.loadCategories();
          // 关闭弹窗
          this.setData({
            dialogVisible: false,
            tempCategoryName: '',
            selectedIcon: '',
            selectedIconName: '',
            uploadedImagePath: '',
            operationType: '',
            editCategoryId: null
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
        wx.showToast({
          title: '添加失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 执行编辑分类
  performEditCategory: function() {
    const { tempCategoryName, selectedIcon, editCategoryId } = this.data;

    wx.showLoading({ title: '更新中...' });

    // 调用云函数更新类别
    wx.cloud.callFunction({
      name: 'updateCategory',
      data: {
        categoryId: editCategoryId,
        name: tempCategoryName,
        icon: selectedIcon || ''
      },
      success: (res) => {
        wx.hideLoading();
        if (res.result.success) {
          // 重新加载类别列表
          this.loadCategories();
          // 关闭弹窗
          this.setData({
            dialogVisible: false,
            tempCategoryName: '',
            selectedIcon: '',
            selectedIconName: '',
            uploadedImagePath: '',
            operationType: '',
            editCategoryId: null
          });
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: res.result.error || '更新失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '更新失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 添加新分类
  addCategory: function () {
    this.showCategoryDialog('add');
  },

  // 编辑分类
  editCategory: function (e) {
    const dataset = e.currentTarget.dataset;
    const categoryId = dataset.id;

    this.showCategoryDialog('edit', categoryId);
  },

  // 关闭弹窗
  closeDialog: function() {
    this.setData({
      dialogVisible: false,
      tempCategoryName: '',
      selectedIcon: '',
      selectedIconName: '',
      uploadedImagePath: '',
      operationType: '',
      editCategoryId: null
    });
  },

  // 处理Dialog关闭事件（保留兼容）
  handleDialogClose: function(e) {
    this.closeDialog();
  },

  // 处理Dialog确认（保留兼容）
  handleDialogConfirm: function(e) {
    this.confirmCategoryOperation();
  },

  // 删除分类
  deleteCategory: function (e) {
    const dataset = e.currentTarget.dataset;
    const categoryId = dataset.id;
    const categoryIndex = dataset.index;
    const category = this.data.categories[categoryIndex];

    // 检查是否为不可删除的默认分类
    const protectedCategories = ['电子设备', '房产', '车辆', '投资', '其他'];
    if (protectedCategories.includes(category.name)) {
      wx.showModal({
        title: '提示',
        content: '系统默认分类不能删除',
        showCancel: false,
        confirmText: '确定'
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除分类 "${category.name}" 吗？此操作不可恢复`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });

          // 调用云函数删除类别
          wx.cloud.callFunction({
            name: 'deleteCategory',
            data: {
              categoryId: categoryId
            },
            success: (res) => {
              wx.hideLoading();
              if (res.result.success) {
                // 重新加载类别列表
                this.loadCategories();
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
              } else {
                wx.showToast({
                  title: res.result.error || '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              wx.hideLoading();
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  }
})