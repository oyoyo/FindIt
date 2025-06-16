// 引入公共工具方法
const util = require('../../utils/util');

Page({
  data: {
    item: null
  },

  /**
   * 页面加载时触发
   * @param {Object} options - 页面参数
   */
  onLoad(options) {
    if (options.id) {
      this.loadItemDetail(options.id);
    }
  },

  /**
   * 加载物品详情
   * @param {string} id - 物品 ID
   */
  loadItemDetail(id) {
    const items = wx.getStorageSync('items') || [];
    const item = items.find(item => item.id === id);
    if (item) {
      item.saveTime = util.formatDate(item.timestamp);
      this.setData({ item });
    } else {
      wx.showToast({
        title: '物品不存在',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 播放录音文件
   */
  playRecord() {
    console.log('录音文件:', this.data.item.voiceNote);
    const recordPath = this.data.item.voiceNote;
    if (recordPath) {
      console.log('尝试播放:', recordPath);
      const innerAudioContext = wx.createInnerAudioContext();
      innerAudioContext.src = recordPath;

      // 添加错误处理
      innerAudioContext.onError((res) => {
        console.error('音频播放出错:', res.errMsg);
        wx.showToast({
          title: '播放失败',
          icon: 'error'
        });
      });

      innerAudioContext.play();
    }
  },

  /**
   * 预览物品图片
   */
  previewImage() {
    wx.previewImage({
      urls: [this.data.item.imageUrl],
      current: this.data.item.imageUrl
    });
  },

  /**
   * 编辑物品信息
   */
  editItem() {
    const item = this.data.item;
    let url=`/pages/addItem/addItem?edit=true&id=${item.id}&imagePath=${item.imageUrl}&name=${item.name}&category=${item.category}&location=${item.location}&remarks=${encodeURIComponent(item.remarks || '')}&reminderDays=${item.reminderDays || 0}`;
      console.log(`${encodeURIComponent(item.voiceNote)}`);
      if (item.voiceNote) {
      url=url+"&voiceNote="+`${encodeURIComponent(item.voiceNote)}`;
    }
    console.log(url);
    wx.navigateTo({
      url: url
    });
  },

  /**
   * 删除物品记录
   */
  deleteItem() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个物品记录吗？',
      success: (res) => {
        if (res.confirm) {
          const items = wx.getStorageSync('items') || [];
          const newItems = items.filter(item => item.id !== this.data.item.id);
          wx.setStorageSync('items', newItems);

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });

          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      }
    });
  }
});