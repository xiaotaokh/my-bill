// components/custom-dialog/custom-dialog.js
Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: '标题'
    },
    okText: {
      type: String,
      value: '确定'
    },
    cancelText: {
      type: String,
      value: '取消'
    }
  },

  data: {},

  methods: {
    onOverlayTap() {
      // 点击遮罩层触发取消
      this.onCancel();
    },

    onCancel() {
      // 触发取消事件
      this.triggerEvent('cancel');
    },

    onConfirm() {
      // 触发确认事件
      this.triggerEvent('confirm');
    }
  }
})