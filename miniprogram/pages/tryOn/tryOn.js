const app = getApp();

Page({
  data: { original: '', result: '', prompt: '', loading: false, error: '' },

  onChooseImage() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath;
        this.setData({ original: path, result: '', error: '' });
      }
    });
  },

  onInput(e) { this.setData({ prompt: e.detail.value }); },

  async onApply() {
    if (!this.data.original || !this.data.prompt.trim()) return;
    this.setData({ loading: true, error: '' });

    try {
      // 读取图片为 base64
      const fs = wx.getFileSystemManager();
      const base64 = fs.readFileSync(this.data.original, 'base64');
      const dataUrl = 'data:image/jpeg;base64,' + base64;

      // 调用后端
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: app.globalData.apiBase + '/image-edit',
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { original_image: dataUrl, edit_prompt: this.data.prompt, strength: 0.55 },
          responseType: 'arraybuffer',
          success(r) {
            if (r.statusCode >= 200 && r.statusCode < 300) resolve(r.data);
            else reject(new Error('AI 编辑失败'));
          },
          fail(e) { reject(new Error(e.errMsg || '网络错误')); }
        });
      });

      // arraybuffer -> base64 -> temp file
      const b64 = wx.arrayBufferToBase64(res);
      const tmpPath = wx.env.USER_DATA_PATH + '/tryon_result.jpg';
      fs.writeFileSync(tmpPath, b64, 'base64');
      this.setData({ result: tmpPath, loading: false });
    } catch (e) {
      this.setData({ error: e.message, loading: false });
    }
  },

  onReset() { this.setData({ original: '', result: '', prompt: '', error: '' }); },
});
