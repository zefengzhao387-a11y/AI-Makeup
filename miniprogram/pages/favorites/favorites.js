const app = getApp();

Page({
  data: {
    mode: 'favorites', // 'favorites' | 'category'
    category: '',
    products: [],
    favorites: [],
    loading: true,
  },

  onLoad(opts) {
    if (opts.mode === 'category' && opts.cat) {
      this.setData({ mode: 'category', category: opts.cat });
      wx.setNavigationBarTitle({ title: opts.cat + ' — 全部' });
    } else {
      wx.setNavigationBarTitle({ title: '我的收藏' });
    }
  },

  onShow() {
    if (!app.isLoggedIn()) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const products = await app.request({ url: '/products?limit=200' });
      const favorites = app.globalData.favorites || [];
      let filtered;
      if (this.data.mode === 'category') {
        filtered = products.filter(p => p.category === this.data.category);
      } else {
        filtered = products.filter(p => favorites.includes(p.id));
      }
      this.setData({ products: filtered, favorites, loading: false });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onProductTap(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  onFavTap(e) {
    const id = e.currentTarget.dataset.id;
    app.toggleFav(id);
    // 收藏模式下移除取消收藏的项
    if (this.data.mode === 'favorites') {
      this.setData({ products: this.data.products.filter(p => app.isFav(p.id)) });
    }
  },
});
