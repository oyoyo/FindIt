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
      reminderDays: '',
      voiceNote: ''
    },
    isRecording: false,
    isPlayingVoice: false,
    audioDuration: 0,
    tempDuration: 0
  },
  innerAudioContext: null,

  onLoad(options) {
    // Initialize InnerAudioContext
    this.innerAudioContext = wx.createInnerAudioContext();
    this.innerAudioContext.onPlay(() => {
      console.log('开始播放');
      this.setData({ isPlayingVoice: true });
    });
    this.innerAudioContext.onPause(() => {
      console.log('暂停播放');
      this.setData({ isPlayingVoice: false });
    });
    this.innerAudioContext.onStop(() => {
      console.log('停止播放');
      this.setData({ isPlayingVoice: false });
    });
    this.innerAudioContext.onEnded(() => {
      console.log('播放结束');
      this.setData({ isPlayingVoice: false });
    });
    this.innerAudioContext.onTimeUpdate(() => {
      this.setData({ audioDuration: Math.floor(this.innerAudioContext.duration) });
    });
    this.innerAudioContext.onError((res) => {
      console.error('播放失败', res.errMsg);
      wx.showToast({
        title: '播放失败', 
        icon: 'none'
      });
      this.setData({ isPlayingVoice: false });
    });
    
    // Load categories from storage
    const categories = wx.getStorageSync('categories') || ['电子产品', '书籍/音像', '衣物/饰品', '食品/医药', '文体/工具', '其他'];
    this.setData({ categories });

    if (options.imagePath) {
      this.setData({
        tempImagePath: options.imagePath,
        voiceNote: decodeURIComponent(options.voiceNote||'')
      });
    }
    console.log('options.voiceNote与空子串或操作-前：', options.voiceNote);
    console.log('options.voiceNote与空子串或操作-后：', decodeURIComponent(options.voiceNote||''));
    // Handle edit mode
    if (options.edit === 'true') {
      const decodedVoiceNote = decodeURIComponent(options.voiceNote||'');
      this.setData({
        isEdit: true,
        itemId: options.id,
        'formData.name': options.name,
        'formData.category': options.category,
        'formData.location': options.location,
        'formData.voiceNote': decodedVoiceNote,
        'formData.remarks': decodeURIComponent(options.remarks||''),
        'formData.reminderDays': options.reminderDays
      });

      // Set category index
      const categoryIndex = this.data.categories.findIndex(cat => cat === options.category);
      if (categoryIndex !== -1) {
        this.setData({ categoryIndex });
      }
      // Set audio source if voice note exists
      if (decodedVoiceNote && decodedVoiceNote !== 'null') {
        this.innerAudioContext.src = decodedVoiceNote;
      }
    }
  },

  onUnload() {
    if (this.innerAudioContext) {
      this.innerAudioContext.destroy();
      this.innerAudioContext = null;
    }
  },

  playVoiceNote() {
    if (this.data.formData.voiceNote) {
      if (this.data.isPlayingVoice) {
        this.innerAudioContext.pause();
      } else {
        this.innerAudioContext.play();
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

  async handleCalendarReminder(itemData, oldItem = null) {
    if (itemData.reminderDays > 0) {
      // 请求日历权限
      wx.authorize({
        scope: 'scope.addPhoneCalendar',
        success: () => {
          // 创建日历事件
          const startDate = new Date();
          const endDate = new Date(itemData.reminderEndDate);
          
          // 设置时间为当天上午10点
          startDate.setHours(10, 0, 0, 0);
          endDate.setHours(10, 0, 0, 0);
          
          const startTime = Math.floor(startDate.getTime() / 1000);
          const endTime = Math.floor(endDate.getTime() / 1000);
          
          console.log('添加日历事件:', {
            title: `FindIt提醒：${itemData.name}`,
            startTime: startTime,
            endTime: endTime,
            startDate: startDate.toLocaleString(),
            endDate: endDate.toLocaleString()
          });

          wx.addPhoneCalendar({
            title: `FindIt提醒：${itemData.name}`,
            startTime: startTime,
            endTime: endTime,
            description: `物品位置：${itemData.location}`,
            success: () => {
              wx.showToast({
                title: '已添加到日历',
                icon: 'success'
              });
            },
            fail: (err) => {
              console.error('添加日历失败，错误详情:', err);
              wx.showModal({
                title: '添加日历失败',
                content: '请确保已授予日历权限，并重试。错误信息：' + JSON.stringify(err),
                showCancel: false
              });
            }
          });
        },
        fail: (err) => {
          console.error('获取日历权限失败:', err);
          wx.showModal({
            title: '需要日历权限',
            content: '需要您同意日历权限才能添加提醒，是否前往设置？',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        }
      });
    }
  },

  async saveItem(e) {
    const formData = e.detail.value;
    
    if (!formData.name || !formData.location) {
      wx.showToast({
        title: '请填写物品名称和存放位置',
        icon: 'none'
      });
      return;
    }

   
// 录音文件的临时路径存储在 this.data.voiceNote 中
const recordTempPath = this.data.formData.voiceNote;
if ((recordTempPath)&&(recordTempPath!=this.data.voiceNote)) {
  this.data.voiceNote = recordTempPath;
  console.log('尝试保存录音:', recordTempPath);
    try {
        // 保存录音文件到永久路径
        const { savedFilePath } = await wx.saveFile({
            tempFilePath: recordTempPath
        });
        formData.recordPath = savedFilePath;
        formData.voiceNote = savedFilePath;
        this.data.voiceNote = savedFilePath;
        console.log('录音文件保存成功，永久路径:', savedFilePath);
        // Update innerAudioContext source after saving file
        if (this.innerAudioContext) {
          this.innerAudioContext.src = savedFilePath;
        }
    } catch (error) {
        console.error('录音文件保存失败:', error);
        wx.showToast({
            title: '录音文件保存失败',
            icon: 'none'
        });
    }
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
      voiceNote: this.data.voiceNote? this.data.voiceNote : null,      
      saveTime: new Date().toLocaleString(),
      timestamp: this.data.isEdit ? now : now,
      reminderDays: reminderDays,
      reminderStartDate: now,
      reminderEndDate: reminderDays ? now + (reminderDays * 24 * 60 * 60 * 1000) : 0
    };
console.log('itemData.saveTime:', itemData.saveTime);
console.log('itemData.voiceNote:', itemData.voiceNote);

    // 如果是编辑模式，删除旧的提醒
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

    // 如果设置了提醒天数，询问是否添加到日历
    if (reminderDays > 0) {
      wx.showModal({
        title: '添加日历提醒',
        content: '是否将到期提醒添加到系统日历？',
        success: (res) => {
          if (res.confirm) {
            const startDate = new Date();
            const endDate = new Date(itemData.reminderEndDate);
            
            // 设置时间为当天上午10点
            startDate.setHours(10, 0, 0, 0);
            endDate.setHours(10, 0, 0, 0);
            
            const calendarEvent = {
              title: `FindIt提醒：${itemData.name}`,
              description: `物品位置：${itemData.location}\n备注：${itemData.remarks || '无'}`,
              startTime: Math.floor(startDate.getTime() / 1000),
              endTime: Math.floor(endDate.getTime() / 1000),
              alarm: true
            };
            
            console.log('准备添加日历事件:', calendarEvent);
            
            wx.addPhoneCalendar({
              ...calendarEvent,
              success: () => {
                console.log('已跳转到系统日历');
                // 先显示保存成功的提示
                wx.showToast({
                  title: this.data.isEdit ? '更新成功' : '保存成功',
                  icon: 'success',
                  duration: 1500
                });
                // 延迟返回，确保用户看到提示
                setTimeout(() => {
                  if (this.data.isEdit) {
                    // 如果是编辑模式，返回到详情页
                    wx.navigateBack({
                      delta: 2
                    });
                  } else {
                    // 如果是新增模式，返回到首页
                    wx.navigateBack({
                      delta: 1
                    });
                  }
                }, 1500);
              },
              fail: (err) => {
                console.error('跳转到系统日历失败:', err);
                wx.showModal({
                  title: '跳转失败',
                  content: '无法打开系统日历，请确保已授予日历权限，并且微信不是分身。',
                  showCancel: false,
                  success: () => {
                    if (this.data.isEdit) {
                      wx.navigateBack({
                        delta: 2
                      });
                    } else {
                      wx.navigateBack({
                        delta: 1
                      });
                    }
                  }
                });
              }
            });
          } else {
            // 用户选择不添加到日历，显示保存成功后返回
            wx.showToast({
              title: this.data.isEdit ? '更新成功' : '保存成功',
              icon: 'success',
              duration: 1500,
              success: () => {
                setTimeout(() => {
                  if (this.data.isEdit) {
                    wx.navigateBack({
                      delta: 2
                    });
                  } else {
                    wx.navigateBack({
                      delta: 1
                    });
                  }
                }, 1500);
              }
            });
          }
        }
      });
    } else {
      // 没有设置提醒天数，显示保存成功后返回
      wx.showToast({
        title: this.data.isEdit ? '更新成功' : '保存成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            if (this.data.isEdit) {
              wx.navigateBack({
                delta: 2
              });
            } else {
              wx.navigateBack({
                delta: 1
              });
            }
          }, 1500);
        }
      });
    }
  },

  cancel() {
    wx.navigateBack();
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ tempImagePath: tempFilePath });
      },
      fail: (err) => {
        wx.showToast({
          title: '未选择图片',
          icon: 'none'
        });
      }
    });
  },


  /**
   * @description 开始录音
   */
  startRecord() {
    this.setData({ isRecording: true });
    // 原有的录音启动逻辑
    const recorderManager = wx.getRecorderManager();
    recorderManager.start({ format: 'mp3' });
    this.recorderManager = recorderManager;
  },

  /**
   * 停止录音方法
   * 此方法会在用户松开录音按钮或取消操作时触发，设置 isRecording 为 false 以隐藏提示，并停止录音功能
   */
  stopRecord() {
    this.setData({ isRecording: false });
    // 原有的录音停止逻辑
    this.recorderManager.stop();
    this.recorderManager.onStop((res) => {
      if (res.tempFilePath) {
        this.setData({
          'formData.voiceNote': res.tempFilePath
        });
        // Set innerAudioContext source after recording
        if (this.innerAudioContext) {
          this.innerAudioContext.src = res.tempFilePath;
          console.log("临时文件已保存：",res.tempFilePath);
          //this.setData({ tempDuration: Math.floor(this.innerAudioContext.duration) });
        }
      }
    });
  },

  /**
   * 删除录音文件
   */
  deleteVoiceNote() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除此录音吗？',
      success: (res) => {
        if (res.confirm) {
          // Clear voice note data
          this.setData({
            'formData.voiceNote': null,
            audioDuration: 0,
            isPlayingVoice: false
          });
          // If there's an active audio context, stop and destroy it
          if (this.innerAudioContext) {
            this.innerAudioContext.stop();
            //this.innerAudioContext.destroy();
            //this.innerAudioContext = null;
          }
          wx.showToast({
            title: '录音已删除',
            icon: 'success'
          });
        }
      }
    });
  },

})