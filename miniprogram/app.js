// miniprogram/app.js
App({
  globalData: {
    // ⚠️ 部署时改成你后端的真实地址
    apiBase: 'https://your-domain.vercel.app/api',
    token: '',
    userId: 0,
    favorites: [],  // [productId, ...]
    cart: [],       // [{...product, qty: 1}, ...]
  },

  onLaunch() {
    this.globalData.token = wx.getStorageSync('token') || '';
    this.globalData.userId = wx.getStorageSync('userId') || 0;
    this.globalData.favorites = wx.getStorageSync('favorites') || [];
    this.globalData.cart = wx.getStorageSync('cart') || [];
  },

  // ── 通用请求 ─────────────────────────────────────────
  request(opts) {
    const app = this;
    return new Promise((resolve, reject) => {
      wx.request({
        url: app.globalData.apiBase + opts.url,
        method: opts.method || 'GET',
        data: opts.data,
        header: {
          'Content-Type': 'application/json',
          ...(app.globalData.token ? { Authorization: 'Bearer ' + app.globalData.token } : {}),
        },
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
          else reject(new Error(res.data?.detail || '请求失败'));
        },
        fail(err) { reject(new Error(err.errMsg || '网络错误')); },
      });
    });
  },

  // ── 认证 ──────────────────────────────────────────────
  async doLogin(username, password) {
    const d = await this.request({ url: '/auth/login', method: 'POST', data: { username, password } });
    this.globalData.token = d.access_token;
    this.globalData.userId = d.user_id;
    wx.setStorageSync('token', d.access_token);
    wx.setStorageSync('userId', d.user_id);
    return d;
  },
  async doRegister(username, password, nickname) {
    const d = await this.request({ url: '/auth/register', method: 'POST', data: { username, password, nickname } });
    this.globalData.token = d.access_token;
    this.globalData.userId = d.user_id;
    wx.setStorageSync('token', d.access_token);
    wx.setStorageSync('userId', d.user_id);
    return d;
  },
  isLoggedIn() { return !!this.globalData.token; },
  logout() {
    this.globalData.token = '';
    this.globalData.userId = 0;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userId');
  },

  // ── 收藏 ──────────────────────────────────────────────
  toggleFav(id) {
    const f = this.globalData.favorites;
    const i = f.indexOf(id);
    if (i >= 0) f.splice(i, 1); else f.push(id);
    this.globalData.favorites = [...f];
    wx.setStorageSync('favorites', this.globalData.favorites);
  },
  isFav(id) { return this.globalData.favorites.includes(id); },

  // ── 购物车 ────────────────────────────────────────────
  addToCart(product) {
    const c = this.globalData.cart;
    const i = c.findIndex(x => x.id === product.id);
    if (i >= 0) c[i].qty += 1;
    else c.push({ ...product, qty: 1 });
    this.globalData.cart = [...c];
    wx.setStorageSync('cart', this.globalData.cart);
  },
  cartCount() { return this.globalData.cart.reduce((s, c) => s + c.qty, 0); },
});
