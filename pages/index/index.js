Page({
  data: {
    items: [],
    hasShownReminders: false,
    sortAsc: true // 添加排序状态变量
  },

  onLoad() {
    this.loadItems();
  },

  onShow() {
    this.loadItems(); // 每次显示页面时重新加载数据
    if (!this.data.hasShownReminders) {
      this.checkReminders(); // 只在首次进入时检查提醒
      this.setData({ hasShownReminders: true });
    }
  },

  loadItems() {
    const items = wx.getStorageSync('items') || [];
    const now = Date.now();
    
    // 格式化日期并计算剩余天数
    const formattedItems = items.map(item => {
      const daysLeft = item.reminderDays ? Math.ceil((item.reminderEndDate - now) / (24 * 60 * 60 * 1000)) : null;
      return {
        ...item,
        formattedDate: this.formatDate(item.timestamp),
        daysLeft: daysLeft
      };
    });
    
    // 根据排序状态进行排序
    const sortedItems = formattedItems.sort((a, b) => {
      return this.data.sortAsc ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
    });
    
    this.setData({
      items: sortedItems
    });
  },

  // 添加切换排序方法
  toggleSort() {
    this.setData({
      sortAsc: !this.data.sortAsc
    }, () => {
      this.loadItems();
    });
  },

  checkReminders() {
    const items = wx.getStorageSync('items') || [];
    const now = Date.now();
    let hasReminders = false;

    items.forEach(item => {
      if (item.reminderDays && item.reminderEndDate) {
        const daysLeft = Math.ceil((item.reminderEndDate - now) / (24 * 60 * 60 * 1000));
        
        if (daysLeft <= 1 && daysLeft > 0) {
          hasReminders = true;
          wx.showModal({
            title: '提醒',
            content: `"${item.name}"即将到期（剩${daysLeft}天），\n存放位置：${item.location}`,
            showCancel: false
          });
        }
      }
    });

    // 如果有提醒，设置导航栏为红点提示
    if (hasReminders) {
      wx.showTabBarRedDot({
        index: 0
      });
    }
  },

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        // 跳转到添加物品页面，并传递图片路径
        wx.navigateTo({
          url: `/pages/addItem/addItem?imagePath=${tempFilePath}`
        });
      }
    });
  },

  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: [url],
      current: url
    });
  },

  showItemDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/itemDetail/itemDetail?id=${id}`
    });
  }
})