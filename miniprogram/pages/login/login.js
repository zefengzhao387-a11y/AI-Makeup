const app = getApp();

Page({
  data: { mode: 'login', username: '', password: '', nickname: '', error: '', loading: false },

  onUsernameInput(e) { this.setData({ username: e.detail.value, error: '' }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value, error: '' }); },
  onNicknameInput(e) { this.setData({ nickname: e.detail.value, error: '' }); },

  toggleMode() {
    this.setData({ mode: this.data.mode === 'login' ? 'register' : 'login', error: '' });
  },

  async onSubmit() {
    const { mode, username, password, nickname } = this.data;
    if (!username || !password) { this.setData({ error: '请填写所有字段' }); return; }
    if (password.length < 8) { this.setData({ error: '密码至少 8 位' }); return; }
    this.setData({ loading: true, error: '' });

    try {
      if (mode === 'register') {
        await app.doRegister(username, password, nickname || undefined);
      } else {
        await app.doLogin(username, password);
      }
      // 登录成功，返回首页
      wx.switchTab({ url: '/pages/index/index' });
    } catch (e) {
      this.setData({ error: e.message, loading: false });
    }
  },
});
