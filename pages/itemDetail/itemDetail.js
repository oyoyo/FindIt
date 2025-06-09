Page({
  data: {
    item: null
  },

  onLoad(options) {
    if (options.id) {
      this.loadItemDetail(options.id);
    }
  },

  loadItemDetail(id) {
    const items = wx.getStorageSync('items') || [];
    const item = items.find(item => item.id === id);
    if (item) {
      // 格式化保存时间
      item.formattedSaveTime = this.formatDate(item.timestamp);
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

  // 添加格式化时间的方法
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  },

  previewImage() {
    wx.previewImage({
      urls: [this.data.item.imageUrl],
      current: this.data.item.imageUrl
    });
  },

  editItem() {
    const item = this.data.item;
    wx.navigateTo({
      url: `/pages/addItem/addItem?edit=true&id=${item.id}&imagePath=${item.imageUrl}&name=${item.name}&category=${item.category}&location=${item.location}&remarks=${encodeURIComponent(item.remarks || '')}&reminderDays=${item.reminderDays || 0}`
    });
  },

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
})