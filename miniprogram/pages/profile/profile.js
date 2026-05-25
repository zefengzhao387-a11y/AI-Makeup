const app = getApp();

Page({
  data: { userId: 0, favCount: 0, cartCount: 0, loggedIn: false },

  onShow() {
    this.setData({
      loggedIn: app.isLoggedIn(),
      userId: app.globalData.userId,
      favCount: (app.globalData.favorites || []).length,
      cartCount: app.cartCount(),
    });
  },

  onFavorites() { wx.navigateTo({ url: '/pages/favorites/favorites' }); },
  onTryOn() { wx.navigateTo({ url: '/pages/tryOn/tryOn' }); },

  onLogout() {
    wx.showModal({
      title: '确认退出', content: '确定要退出登录吗？',
      success(res) {
        if (res.confirm) {
          app.logout();
          wx.navigateTo({ url: '/pages/login/login' });
        }
      }
    });
  },

  onLogin() { wx.navigateTo({ url: '/pages/login/login' }); },
});
