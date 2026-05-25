const app = getApp();
Page({
  data: { product: null, isFav: false, loading: true, reviews: [], myRating: 5, myText: '', submitting: false },
  onLoad(opts) {
    this.productId = parseInt(opts.id);
    this.loadDetail();
    this.loadReviews();
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
  async loadReviews() {
    try {
      const reviews = await app.request({ url: '/products/' + this.productId + '/reviews' });
      this.setData({ reviews: reviews || [] });
    } catch (e) { /* 无评论 */ }
  },
  onRateTap(e) {
    this.setData({ myRating: parseInt(e.currentTarget.dataset.r) });
  },
  onRevInput(e) {
    this.setData({ myText: e.detail.value });
  },
  async onSubmitReview() {
    if (!this.data.myText.trim() || this.data.submitting) return;
    this.setData({ submitting: true });
    try {
      const r = await app.request({
        url: '/products/' + this.productId + '/reviews', method: 'POST',
        data: { rating: this.data.myRating, content: this.data.myText.trim() }
      });
      this.setData({
        reviews: [r, ...this.data.reviews],
        myText: '', myRating: 5, submitting: false
      });
      wx.showToast({ title: '评价成功', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: e.message, icon: 'none' });
      this.setData({ submitting: false });
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
  onBack() {
    wx.navigateBack({ delta: 1 });
  },
  onTryOn() {
    wx.navigateTo({ url: '/pages/tryOn/tryOn' });
  },
});
