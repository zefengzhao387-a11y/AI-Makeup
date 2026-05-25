const app = getApp();

Page({
  data: { cart: [], total: 0 },

  onShow() {
    this.refreshCart();
  },

  refreshCart() {
    const cart = app.globalData.cart || [];
    const total = cart.reduce((s, c) => s + (c.price || 0) * c.qty, 0);
    this.setData({ cart, total });
  },

  onPlus(e) {
    const id = e.currentTarget.dataset.id;
    const cart = app.globalData.cart;
    const item = cart.find(c => c.id === id);
    if (item) item.qty += 1;
    app.globalData.cart = [...cart];
    wx.setStorageSync('cart', app.globalData.cart);
    this.refreshCart();
  },

  onMinus(e) {
    const id = e.currentTarget.dataset.id;
    let cart = app.globalData.cart;
    const item = cart.find(c => c.id === id);
    if (item) {
      item.qty -= 1;
      if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
    }
    app.globalData.cart = [...cart];
    wx.setStorageSync('cart', app.globalData.cart);
    this.refreshCart();
  },

  onRemove(e) {
    const id = e.currentTarget.dataset.id;
    app.globalData.cart = app.globalData.cart.filter(c => c.id !== id);
    wx.setStorageSync('cart', app.globalData.cart);
    this.refreshCart();
  },

  onItemTap(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  onCheckout() {
    wx.showToast({ title: '结算功能开发中', icon: 'none' });
  },
});
