Page({
  data: {
    categories: [],
    newCategory: ''
  },

  onLoad() {
    this.loadCategories();
  },

  loadCategories() {
    const categories = wx.getStorageSync('categories') || ['电子产品', '书籍', '衣物', '文具', '工具', '其他'];
    this.setData({ categories });
  },

  onInputCategory(e) {
    this.setData({
      newCategory: e.detail.value
    });
  },

  addCategory() {
    if (!this.data.newCategory.trim()) {
      wx.showToast({
        title: '类别名称不能为空',
        icon: 'none'
      });
      return;
    }

    const categories = [...this.data.categories];
    if (categories.includes(this.data.newCategory)) {
      wx.showToast({
        title: '类别已存在',
        icon: 'none'
      });
      return;
    }

    categories.push(this.data.newCategory);
    this.setData({
      categories,
      newCategory: ''
    });
    wx.setStorageSync('categories', categories);
  },

  deleteCategory(e) {
    const index = e.currentTarget.dataset.index;
    const categories = [...this.data.categories];
    
    if (categories.length <= 1) {
      wx.showToast({
        title: '至少保留一个类别',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: '删除类别可能会影响已有物品的分类，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          categories.splice(index, 1);
          this.setData({ categories });
          wx.setStorageSync('categories', categories);
        }
      }
    });
  }
}) 