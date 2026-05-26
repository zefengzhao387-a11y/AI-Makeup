const app = getApp();
Page({
  data: {
    products: [], categories: ['All','Lips','Face','Eyes','Skincare'],
    activeCat: 'All', loading: true, loadError: ''
  },
  onShow() {
    if (!app.isLoggedIn()) { wx.navigateTo({ url: '/pages/login/login' }); return; }
    this.loadProducts();
  },
  async loadProducts() {
    this.setData({ loading: true, loadError: '' });
    try {
      const products = await app.request({ url: '/products?limit=200' });
      this.setData({ products, loading: false });
    } catch (e) {
      this.setData({ loading: false, loadError: '加载失败：' + (e.message || '网络错误') });
    }
  },
  onCatTap(e) { this.setData({ activeCat: e.currentTarget.dataset.cat }); },
  onProductTap(e) { wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id }); },
  onFavTap(e) {
    const id = e.currentTarget.dataset.id;
    app.toggleFav(id);
    this.setData({});
  },
  onSeeAll(e) {
    wx.navigateTo({ url: '/pages/favorites/favorites?mode=category&cat=' + e.currentTarget.dataset.cat });
  },
  onPullDownRefresh() { this.loadProducts().then(() => wx.stopPullDownRefresh()); },
});
