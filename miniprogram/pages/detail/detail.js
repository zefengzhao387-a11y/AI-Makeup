const app = getApp();
Page({
  data: { product: null, isFav: false, loading: true },
  onLoad(opts) {
    this.productId = parseInt(opts.id);
    this.loadDetail();
  },
  async loadDetail() {
    try {
      const product = await app.request({ url: '/products/' + this.productId });
      this.setData({ product, isFav: app.isFav(this.productId), loading: false });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
      this.setData({ loading: false });
    }
  },
  onToggleFav() {
    app.toggleFav(this.productId);
    this.setData({ isFav: app.isFav(this.productId) });
  },
  onAddCart() {
    if (!this.data.product) return;
    app.addToCart(this.data.product);
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  },
  onTryOn() {
    wx.navigateTo({ url: '/pages/tryOn/tryOn' });
  },
});
