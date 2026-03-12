// pages/setting/setting.js

Page({
  data: {

  },

  onLoad: function () {

  },

  // 跳转到分类管理页面
  navigateToCategoryManage: function() {
    wx.navigateTo({
      url: '/pages/category-manage/category-manage'
    });
  },

  // 显示关于信息
  showAboutInfo: function() {
    wx.showModal({
      title: '关于我的账本',
      content: '我的账本是一款个人资产管理小程序，帮助您记录和追踪个人资产情况。使用微信云开发技术构建，数据安全可靠。',
      showCancel: false,
      confirmText: '确定'
    });
  }
})