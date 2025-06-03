Page({
  data: {
    tempImagePath: '',
    categories: [],
    categoryIndex: null,
    isEdit: false,
    itemId: '',
    formData: {
      name: '',
      category: '',
      location: '',
      remarks: '',
      reminderDays: ''
    }
  },

  onLoad(options) {
    // Load categories from storage
    const categories = wx.getStorageSync('categories') || ['电子产品', '书籍', '衣物', '文具', '工具', '其他'];
    this.setData({ categories });

    if (options.imagePath) {
      this.setData({
        tempImagePath: options.imagePath
      });
    }

    // Handle edit mode
    if (options.edit === 'true') {
      this.setData({
        isEdit: true,
        itemId: options.id,
        'formData.name': options.name,
        'formData.category': options.category,
        'formData.location': options.location,
        'formData.remarks': decodeURIComponent(options.remarks),
        'formData.reminderDays': options.reminderDays
      });

      // Set category index
      const categoryIndex = this.data.categories.findIndex(cat => cat === options.category);
      if (categoryIndex !== -1) {
        this.setData({ categoryIndex });
      }
    }
  },

  onCategoryChange(e) {
    const index = e.detail.value;
    this.setData({
      categoryIndex: index,
      'formData.category': this.data.categories[index]
    });
  },

  saveItem(e) {
    const formData = e.detail.value;
    
    if (!formData.name || !formData.location) {
      wx.showToast({
        title: '请填写物品名称和存放位置',
        icon: 'none'
      });
      return;
    }

    // 处理提醒天数
    let reminderDays = parseInt(formData.reminderDays);
    if (isNaN(reminderDays) || reminderDays <= 0) {
      reminderDays = 0;
    }

    // 获取已存储的物品列表
    const items = wx.getStorageSync('items') || [];
    
    // 创建物品对象
    const now = Date.now();
    const itemData = {
      id: this.data.isEdit ? this.data.itemId : now.toString(),
      name: formData.name,
      category: this.data.categories[this.data.categoryIndex] || '其他',
      location: formData.location,
      remarks: formData.remarks,
      imageUrl: this.data.tempImagePath,
      saveTime: new Date().toLocaleString(),
      timestamp: this.data.isEdit ? now : now,
      reminderDays: reminderDays,
      reminderStartDate: now,
      reminderEndDate: reminderDays ? now + (reminderDays * 24 * 60 * 60 * 1000) : 0
    };

    if (this.data.isEdit) {
      // Update existing item
      const index = items.findIndex(item => item.id === this.data.itemId);
      if (index !== -1) {
        items[index] = itemData;
      }
    } else {
      // Add new item
      items.unshift(itemData);
    }
    
    // Save updated list
    wx.setStorageSync('items', items);

    wx.showToast({
      title: this.data.isEdit ? '更新成功' : '保存成功',
      icon: 'success',
      duration: 1500,
      success: () => {
        setTimeout(() => {
          wx.navigateBack({
            delta: this.data.isEdit ? 2 : 1 // Go back two pages if editing
          });
        }, 1500);
      }
    });
  },

  cancel() {
    wx.navigateBack();
  }
}) 