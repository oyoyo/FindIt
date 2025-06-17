Page({
  data: {
    items: [],
    hasShownReminders: false,
    sortAsc: false,
    // 新增数据
    startX: 0,
    currentIndex: -1
  },

  // 处理滑动事件
  handleMovableChange(e) {
    const { index } = e.currentTarget.dataset;
    const x = e.detail.x;
    const items = this.data.items.map((item, i) => {
      if (i === index) {
        return { ...item, x };
      }
      return { ...item, x: 0 };
    });
    this.setData({ items });
  },

  // 编辑按钮点击事件
  editItem(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.items[index];
    // 跳转到编辑页面，传递物品信息
    wx.navigateTo({
      url: `/pages/addItem/addItem?id=${item.id}`
    });
  },

  // 删除按钮点击事件
  /**
   * 删除物品方法，删除前会弹出确认提示框
   * @param {Object} e - 事件对象，包含点击按钮的索引信息
   */
  deleteItem(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.items[index];
    wx.showModal({
      title: '确认删除',
      content: `确定要删除条目 ${item.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          const items = this.data.items.filter((_, i) => i !== index);
          wx.setStorageSync('items', items);
          this.setData({ items });

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        } else if (res.cancel) {
          console.log('用户取消删除');
        }
      }
    });
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

  goToAddItemWithoutPhoto() {
    // 直接跳转到添加物品页面，不传递图片路径
    wx.navigateTo({
      url: `/pages/addItem/addItem`
    });
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

  // ... existing code ...
  /**
   * 播放录音文件
   */
  playRecord(e) {
    const recordPath = e.currentTarget.dataset.voiceNote;
    if (!recordPath) {
      wx.showToast({
        title: '无效的录音文件',
        icon: 'error'
      });
      return;
    }

    // 如果已经有正在播放的音频，先停止它
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
    }

    // 创建新的音频上下文
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.src = recordPath;

    // 监听播放开始
    this.audioContext.onPlay(() => {
      console.log('开始播放录音');
    });

    // 监听播放结束
    this.audioContext.onEnded(() => {
      console.log('录音播放结束');
      this.audioContext.destroy();
      this.audioContext = null;
    });

    // 监听播放错误
    this.audioContext.onError((res) => {
      console.error('音频播放出错:', res.errMsg);
      wx.showToast({
        title: '播放失败',
        icon: 'error'
      });
      this.audioContext.destroy();
      this.audioContext = null;
    });

    // 开始播放
    this.audioContext.play();
  },
// ... existing code ...

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