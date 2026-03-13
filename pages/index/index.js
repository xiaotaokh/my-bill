// index.js
const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

Page({
  data: {
    // 日期
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    currentDay: new Date().getDate(),
    currentWeek: weekDays[new Date().getDay()],

    // 统计数据
    totalPrice: 0,
    dailyCost: 0,
    activeCount: 0,
    retiredCount: 0,
    soldCount: 0,

    // 资产列表
    assets: [],
    filteredAssets: [],

    // 筛选状态
    activeStatus: 'all',
    statusMap: {
      all: '全部',
      active: '服役中',
      retired: '已退役',
      sold: '已卖出'
    },

    // 分类筛选
    activeCategory: 'all',
    categories: [],
    categoryList: [], // 包含图标信息的分类列表
    allCategories: [], // 用于设置页面显示所有分类

    // 排序字段映射（索引对应关系）
    // 0:价格 1:购买时间 2:添加时间 3:服役时长 4:日均成本
    // 前3个可在数据库层面排序，后2个需要前端排序
    sortDbFields: ['price', 'purchaseDate', 'createdAt'],

    // 排序
    sortOptions: ['价格', '购买时间', '添加时间', '服役时长', '日均成本'],
    currentSortIndex: 2, // 默认按添加时间排序
    sortOrder: 'desc', // asc 或 desc

    // 视图控制
    showSetting: false, // 控制显示设置视图

    // 加载状态标志
    isLoading: false,

    // 回到顶部按钮显示控制
    showBackToTop: false
  },

  onLoad: function () {
    this.loadCategories();
    // 直接调用 loadAssets，它内部会等待 openid
    this.loadAssets();
  },

  onShow: function () {
    // 每次进入页面重新加载数据，但如果正在加载中则跳过
    if (this.data.isLoading) return;
    this.loadCategories();
    this.loadAssets();
  },

  // 加载类别
  loadCategories() {
    wx.cloud.callFunction({
      name: 'getCategories',
      success: (res) => {
        const resultData = res.result;
        if (resultData && resultData.success && resultData.data) {
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
                  // 获取失败时使用 null，显示 icon
                }
              } else if (category.icon && category.icon.startsWith('http')) {
                displayIcon = category.icon;
              }

              return {
                name: category.name,
                icon: category.icon || '',
                displayIcon: displayIcon
              };
            }));

            // 分类名称数组（用于筛选）
            const categoryNames = categoriesWithIcons.map(c => c.name);

            this.setData({
              categories: categoryNames,
              categoryList: categoriesWithIcons,
              allCategories: [...categoryNames]
            }, () => {
              // 分类加载完成后，重新为已有资产添加图标
              this.updateAssetsCategoryIcon();
            });
          };

          processCategories();
        } else {
          this.setData({
            categories: [],
            categoryList: [],
            allCategories: []
          });
        }
      },
      fail: () => {
        this.setData({
          categories: [],
          categoryList: [],
          allCategories: []
        });
      }
    });
  },

  // 加载资产数据
  loadAssets() {
    // 防止重复加载
    if (this.data.isLoading) return;

    this.setData({ isLoading: true });
    wx.showLoading({ title: '加载中...' });

    // 检查云开发是否已初始化
    if (!wx.cloud) {
      console.log('云开发未初始化，显示空数据');
      this.setData({
        assets: [],
        filteredAssets: [],
        isLoading: false
      });
      wx.hideLoading();
      return;
    }

    // 使用 app 的 getOpenid 方法获取 openid
    const app = getApp();
    const { currentSortIndex, sortOrder, sortDbFields, activeStatus, activeCategory } = this.data;

    app.getOpenid()
      .then(openid => {
        // 从云数据库获取资产数据
        // 显式指定环境 ID，防止真机环境丢失
        const db = wx.cloud.database({
          env: app.globalData.envId
        });

        // 构建查询条件
        const whereCondition = {
          _openid: openid
        };

        // 添加状态筛选条件
        if (activeStatus && activeStatus !== 'all') {
          whereCondition.status = activeStatus;
        }

        // 添加分类筛选条件
        if (activeCategory && activeCategory !== 'all') {
          whereCondition.category = activeCategory;
        }

        // 构建查询
        let query = db.collection('assets').where(whereCondition);

        // 判断是否可以在数据库层面排序（价格、购买时间、添加时间）
        const sortField = sortDbFields[currentSortIndex];
        if (sortField) {
          // 数据库层面排序
          query = query.orderBy(sortField, sortOrder);
        } else {
          // 计算字段排序，使用默认排序
          query = query.orderBy('createdAt', 'desc');
        }

        query.get()
          .then(async res => {
            console.log('获取资产成功:', res.data.length);

            // 处理资产的 icon 字段，获取云存储临时 URL
            const assetsWithDisplayIcon = await Promise.all(res.data.map(async asset => {
              let displayIcon = null;

              // 如果是云存储的 fileID，获取临时文件链接
              if (asset.icon && asset.icon.startsWith('cloud://')) {
                try {
                  const fileRes = await wx.cloud.getTempFileURL({
                    fileList: [asset.icon]
                  });
                  if (fileRes.fileList && fileRes.fileList[0] && fileRes.fileList[0].tempFileURL) {
                    displayIcon = fileRes.fileList[0].tempFileURL;
                  }
                } catch (e) {
                  // 获取失败时使用 null，显示 emoji icon
                }
              } else if (asset.icon && asset.icon.startsWith('http')) {
                displayIcon = asset.icon;
              }

              return {
                ...asset,
                displayIcon
              };
            }));

            // 为每个资产添加计算字段
            const assetsWithCalculated = assetsWithDisplayIcon.map(asset => this.calculateAssetFields(asset));
            this.setData({
              assets: assetsWithCalculated,
              filteredAssets: assetsWithCalculated,
              isLoading: false
            });

            // 只有前端排序字段（服役时长、日均成本）需要额外处理
            // 数据库排序的字段已经排好序了，不需要再排序
            if (!sortField) {
              this.applySort();
            } else {
              this.calculateStats();
            }
          })
          .catch(err => {
            console.error('加载资产失败:', err);
            // 真机调试显示具体错误
            wx.showModal({
              title: '加载失败',
              content: '错误信息：' + (err.message || JSON.stringify(err)),
              showCancel: false
            });

            // 即使失败也显示空状态，不崩溃
            this.setData({
              assets: [],
              filteredAssets: [],
              isLoading: false
            });
          })
          .finally(() => {
            wx.hideLoading();
          });
      })
      .catch(err => {
        console.error('获取 openid 失败:', err);
        this.setData({
          assets: [],
          filteredAssets: [],
          isLoading: false
        });
        wx.hideLoading();
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 为单个资产计算显示字段
  calculateAssetFields(asset) {
    const purchaseDate = this.parseDate(asset.purchaseDate);
    const now = new Date();

    // 计算已使用天数
    let usedDays = 0;
    let endDate = now; // 用于日期范围显示

    if (asset.purchaseDate) {
      // 已退役/已卖出：计算到退役/卖出日期
      const retiredDateStr = asset.retiredDate || asset.soldDate;
      if ((asset.status === 'retired' || asset.status === 'sold') && retiredDateStr) {
        endDate = this.parseDate(retiredDateStr);
      }

      usedDays = Math.floor((endDate - purchaseDate) / (1000 * 60 * 60 * 24)) + 1;
      if (usedDays <= 0) usedDays = 1;
    }

    // 计算日期范围
    const startDate = this.formatDate(asset.purchaseDate);
    let dateRangeEnd = '至今';
    const retiredDateStr = asset.retiredDate || asset.soldDate;
    if ((asset.status === 'retired' || asset.status === 'sold') && retiredDateStr) {
      dateRangeEnd = this.formatDate(retiredDateStr);
    }

    // 计算日均成本（仅服役中的资产计算）
    let dailyCost = '0.00';
    // 折合每日（已退役/已卖出）
    let dailyEquivalent = '0.00';
    if (asset.status === 'active' && asset.price && usedDays >= 1) {
      // 无论是否排除日均，都计算日均成本用于显示
      dailyCost = (asset.price / usedDays).toFixed(2);
    } else if ((asset.status === 'retired' || asset.status === 'sold') && asset.price && usedDays >= 1) {
      dailyEquivalent = (asset.price / usedDays).toFixed(2);
    }

    // 获取类别图标 - 优先使用云存储图片，否则使用emoji
    const categoryItem = this.data.categoryList ? this.data.categoryList.find(c => c.name === asset.category) : null;
    const categoryIcon = categoryItem ? (categoryItem.displayIcon || categoryItem.icon || '📦') : '';
    const categoryIconUrl = categoryIcon && (categoryIcon.startsWith('http') || categoryIcon.startsWith('cloud://')) ? categoryIcon : '';

    return {
      ...asset,
      usedDays,
      dailyCost,
      dailyEquivalent,
      dateRange: asset.status === 'active' ? `${startDate} - 至今` : `${startDate} - ${dateRangeEnd}`,
      categoryIcon,
      categoryIconUrl
    };
  },

  // 为已有资产更新分类图标
  updateAssetsCategoryIcon() {
    const { assets, categoryList } = this.data;
    if (!assets.length || !categoryList.length) return;

    const updatedAssets = assets.map(asset => {
      const categoryItem = categoryList.find(c => c.name === asset.category);
      const categoryIcon = categoryItem ? (categoryItem.displayIcon || categoryItem.icon || '📦') : '';
      const categoryIconUrl = categoryIcon && (categoryIcon.startsWith('http') || categoryIcon.startsWith('cloud://')) ? categoryIcon : '';
      return { ...asset, categoryIcon, categoryIconUrl };
    });

    const updatedFilteredAssets = this.data.filteredAssets.map(asset => {
      const categoryItem = categoryList.find(c => c.name === asset.category);
      const categoryIcon = categoryItem ? (categoryItem.displayIcon || categoryItem.icon || '📦') : '';
      const categoryIconUrl = categoryIcon && (categoryIcon.startsWith('http') || categoryIcon.startsWith('cloud://')) ? categoryIcon : '';
      return { ...asset, categoryIcon, categoryIconUrl };
    });

    this.setData({
      assets: updatedAssets,
      filteredAssets: updatedFilteredAssets
    });
  },

  
  // 计算统计数据
  calculateStats() {
    const { filteredAssets } = this.data;

    let totalPrice = 0;
    let dailyCostTotal = 0;
    let activeCount = 0;
    let retiredCount = 0;
    let soldCount = 0;

    filteredAssets.forEach(asset => {
      // 排除不计入总资产的项（字符串 "true" 也需要排除）
      if (asset.excludeTotal === true || asset.excludeTotal === 'true') return;

      totalPrice += asset.price || 0;

      // 累加日均成本（仅服役中且未排除日均计算的资产）
      if (asset.status === 'active' && asset.excludeDaily !== true && asset.excludeDaily !== 'true' && asset.dailyCost) {
        dailyCostTotal += parseFloat(asset.dailyCost);
      }

      // 计算状态数量
      if (asset.status === 'active') {
        activeCount++;
      } else if (asset.status === 'retired') {
        retiredCount++;
      } else if (asset.status === 'sold') {
        soldCount++;
      }
    });

    this.setData({
      totalPrice: totalPrice.toFixed(2),
      dailyCost: dailyCostTotal.toFixed(2),
      activeCount,
      retiredCount,
      soldCount
    });
  },

  // 按状态筛选
  filterByStatus(e) {
    const status = e.currentTarget.dataset.status;

    this.setData({
      activeStatus: status
    });

    // 重新加载数据（带筛选条件）
    this.loadAssets();
  },

  // 按分类筛选
  filterByCategory(e) {
    const category = e.currentTarget.dataset.category;

    this.setData({
      activeCategory: category
    });

    // 重新加载数据（带筛选条件）
    this.loadAssets();
  },

  // 新增类别
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
                  // 重新加载类别列表
                  this.loadCategories();
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

  // 改变排序
  changeSort(e) {
    const index = parseInt(e.detail.value);
    const { sortOrder, sortDbFields } = this.data;

    this.setData({
      currentSortIndex: index,
      sortOrder: sortOrder === 'desc' ? 'asc' : 'desc'
    });

    console.log('排序切换:', index, sortDbFields[index]);

    // 如果是数据库支持的排序字段，重新从数据库查询
    // 否则使用前端排序
    if (sortDbFields[index]) {
      this.loadAssets();
    } else {
      this.applySort();
    }
  },

  // 应用排序
  applySort() {
    const { filteredAssets, currentSortIndex, sortOrder } = this.data;
    let sorted = [...filteredAssets];

    switch (currentSortIndex) {
      case 0: // 价格
        sorted.sort((a, b) => {
          const priceA = Number(a.price) || 0;
          const priceB = Number(b.price) || 0;
          return sortOrder === 'desc' ? priceB - priceA : priceA - priceB;
        });
        break;
      case 1: // 购买时间
        sorted.sort((a, b) => {
          const dateA = this.parseDate(a.purchaseDate).getTime();
          const dateB = this.parseDate(b.purchaseDate).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        break;
      case 2: // 添加时间
        sorted.sort((a, b) => {
          const dateA = this.parseDate(a.createdAt).getTime();
          const dateB = this.parseDate(b.createdAt).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        break;
      case 3: // 服役时长
        sorted.sort((a, b) => {
          const daysA = a.usedDays || 0;
          const daysB = b.usedDays || 0;
          return sortOrder === 'desc' ? daysB - daysA : daysA - daysB;
        });
        break;
      case 4: // 日均成本
        sorted.sort((a, b) => {
          if (a.status !== 'active') return 1;
          if (b.status !== 'active') return -1;

          const dateA = this.parseDate(a.purchaseDate).getTime();
          const dateB = this.parseDate(b.purchaseDate).getTime();
          const daysA = (Date.now() - dateA) / (1000 * 60 * 60 * 24);
          const daysB = (Date.now() - dateB) / (1000 * 60 * 60 * 24);
          const costA = daysA > 0 ? a.price / daysA : 0;
          const costB = daysB > 0 ? b.price / daysB : 0;
          return sortOrder === 'desc' ? costB - costA : costA - costB;
        });
        break;
    }

    this.setData({
      filteredAssets: sorted
    }, () => {
      // 排序后重新计算统计数据
      this.calculateStats();
    });
  },

  // 跳转到添加页面
  goToAdd() {
    wx.navigateTo({
      url: '/pages/asset-add/asset-add'
    });
  },

  // 切换模式（首页/设置）
  toggleMode() {
    this.setData({
      showSetting: !this.data.showSetting,
      showCategoryManagement: false // 确保分类管理关闭
    });
  },

  // 切换到首页视图
  switchToHome() {
    this.setData({
      showSetting: false,
      showCategoryManagement: false
    });
  },

  // 切换到设置视图
  switchToSetting() {
    this.setData({
      showSetting: true
    });
  },

  // 导航到分类管理页面
  navigateToCategoryManage() {
    wx.navigateTo({
      url: '/pages/category-manage/category-manage'
    });
  },

  // 切换到设置视图（本页切换，不跳转路由）
  navigateToSetting() {
    this.setData({
      showSetting: true,
      showCategoryManagement: false
    });
  },

  // 显示关于信息
  showAboutInfo() {
    wx.showModal({
      title: '关于我的账本',
      content: '我的账本是一款个人资产管理小程序，帮助您记录和追踪个人资产情况。使用微信云开发技术构建，数据安全可靠。',
      showCancel: false,
      confirmText: '确定'
    });
  },

  // 添加新分类
  addNewCategory() {
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
                  // 重新加载类别列表
                  this.loadCategories();
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

  // 编辑分类
  editCategory(e) {
    const index = e.currentTarget.dataset.index;
    const categoryList = [...this.data.allCategories];
    const oldName = categoryList[index];

    wx.showModal({
      title: '编辑分类',
      editable: true,
      placeholderText: '请输入新的分类名称',
      content: oldName,
      success: (res) => {
        if (res.confirm && res.content.trim() && res.content.trim() !== oldName) {
          const newCategory = res.content.trim();

          // 检查新名称是否已存在
          if (categoryList.includes(newCategory)) {
            wx.showToast({
              title: '分类已存在',
              icon: 'none'
            });
            return;
          }

          // 获取该分类的详细信息以便编辑
          wx.cloud.callFunction({
            name: 'getCategories',
            success: (getRes) => {
              if (getRes.result && getRes.result.data) {
                const categories = getRes.result.data;
                const categoryToEdit = categories.find(cat => cat.name === oldName);

                if (categoryToEdit) {
                  wx.showLoading({ title: '更新中...' });

                  // 调用云函数更新类别
                  wx.cloud.callFunction({
                    name: 'updateCategory',
                    data: {
                      categoryId: categoryToEdit._id,
                      name: newCategory,
                      icon: categoryToEdit.icon || ''
                    },
                    success: (updateRes) => {
                      wx.hideLoading();
                      if (updateRes.result.success) {
                        // 重新加载类别列表
                        this.loadCategories();
                        wx.showToast({
                          title: '修改成功',
                          icon: 'success'
                        });
                      } else {
                        wx.showToast({
                          title: updateRes.result.error || '更新失败',
                          icon: 'none'
                        });
                      }
                    },
                    fail: (err) => {
                      wx.hideLoading();
                      console.error('更新类别失败:', err);
                      wx.showToast({
                        title: '更新失败，请重试',
                        icon: 'none'
                      });
                    }
                  });
                } else {
                  wx.showToast({
                    title: '找不到对应分类',
                    icon: 'none'
                  });
                }
              }
            },
            fail: (err) => {
              console.error('获取分类详情失败:', err);
              wx.showToast({
                title: '获取分类信息失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 删除分类
  deleteCategory(e) {
    const index = e.currentTarget.dataset.index;
    const categoryList = [...this.data.allCategories];
    const categoryToDelete = categoryList[index];

    // 检查是否为不可删除的默认分类
    const protectedCategories = ['电子设备', '房产', '车辆', '投资', '其他'];
    if (protectedCategories.includes(categoryToDelete)) {
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
      content: `确定要删除分类 "${categoryToDelete}" 吗？此操作不可恢复`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });

          // 首先获取该分类的详细信息
          wx.cloud.callFunction({
            name: 'getCategories',
            success: (getRes) => {
              if (getRes.result && getRes.result.data) {
                const categories = getRes.result.data;
                const categoryObj = categories.find(cat => cat.name === categoryToDelete);

                if (categoryObj) {
                  // 调用云函数删除类别
                  wx.cloud.callFunction({
                    name: 'deleteCategory', // 需要创建这个云函数
                    data: {
                      categoryId: categoryObj._id
                    },
                    success: (deleteRes) => {
                      wx.hideLoading();
                      if (deleteRes.result.success) {
                        // 重新加载类别列表
                        this.loadCategories();
                        wx.showToast({
                          title: '删除成功',
                          icon: 'success'
                        });
                      } else {
                        wx.showToast({
                          title: deleteRes.result.error || '删除失败',
                          icon: 'none'
                        });
                      }
                    },
                    fail: (err) => {
                      wx.hideLoading();
                      console.error('删除类别失败:', err);
                      wx.showToast({
                        title: '删除失败，请重试',
                        icon: 'none'
                      });
                    }
                  });
                } else {
                  wx.hideLoading();
                  wx.showToast({
                    title: '找不到对应分类',
                    icon: 'none'
                  });
                }
              }
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('获取分类详情失败:', err);
              wx.showToast({
                title: '获取分类信息失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 跳转到详情页面
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/asset-detail/asset-detail?id=${id}`
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadAssets();
    wx.stopPullDownRefresh();
  },

  // 页面滚动监听
  onPageScroll(e) {
    const scrollTop = e.scrollTop;
    // 滚动超过 100px 显示回到顶部按钮
    const showBackToTop = scrollTop > 100;
    if (showBackToTop !== this.data.showBackToTop) {
      this.setData({ showBackToTop });
    }
  },

  // 回到顶部
  scrollToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },

  // 阻止触摸穿透
  preventTouchMove() {}
});