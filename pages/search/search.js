Page({
  data: {
    categories: ['全部', '电子产品', '书籍', '衣物', '文具', '工具', '其他'],
    categoryIndex: 0,
    locations: ['全部'], // 将从已有数据中动态获取
    locationIndex: 0,
    filters: {
      name: '',
      category: '',
      location: '',
      startDate: '',
      endDate: ''
    },
    searchResults: []
  },

  onLoad() {
    this.loadLocations();
    this.search(); // 初始加载所有数据
  },

  loadLocations() {
    const items = wx.getStorageSync('items') || [];
    const locations = new Set(['全部']);
    items.forEach(item => {
      if (item.location) {
        locations.add(item.location);
      }
    });
    this.setData({
      locations: Array.from(locations)
    });
  },

  onNameInput(e) {
    this.setData({
      'filters.name': e.detail.value
    });
  },

  onCategoryChange(e) {
    const index = e.detail.value;
    this.setData({
      categoryIndex: index,
      'filters.category': index === '0' ? '' : this.data.categories[index]
    });
  },

  onLocationChange(e) {
    const index = e.detail.value;
    this.setData({
      locationIndex: index,
      'filters.location': index === '0' ? '' : this.data.locations[index]
    });
  },

  onStartDateChange(e) {
    this.setData({
      'filters.startDate': e.detail.value
    });
  },

  onEndDateChange(e) {
    this.setData({
      'filters.endDate': e.detail.value
    });
  },

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  search() {
    const items = wx.getStorageSync('items') || [];
    const filters = this.data.filters;
    
    const results = items.filter(item => {
      // 名称匹配
      if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
      
      // 类别匹配
      if (filters.category && item.category !== filters.category) {
        return false;
      }
      
      // 位置匹配
      if (filters.location && item.location !== filters.location) {
        return false;
      }
      
      // 日期范围匹配
      if (filters.startDate || filters.endDate) {
        const itemDate = new Date(item.timestamp);
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          if (itemDate < startDate) return false;
        }
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (itemDate > endDate) return false;
        }
      }
      
      return true;
    });

    // 添加格式化日期
    const formattedResults = results.map(item => ({
      ...item,
      formattedDate: this.formatDate(item.timestamp)
    }));

    this.setData({
      searchResults: formattedResults
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