const app = getApp();

Page({
  data: {
    messages: [],
    input: '',
    sending: false,
    products: [],
    sessionId: '',
    historyLoading: true,
  },

  onLoad() {
    // 持久化 sessionId
    let sid = wx.getStorageSync('lumina_agent_sid');
    if (!sid) { sid = 'wx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8); wx.setStorageSync('lumina_agent_sid', sid); }
    this.sessionId = sid;
    this.loadProducts();
    this.loadHistory();
  },

  async loadProducts() {
    try {
      if (!app.isLoggedIn()) { wx.navigateTo({ url: '/pages/login/login' }); return; }
      const products = await app.request({ url: '/products?limit=200' });
      this.setData({ products });
    } catch (e) { console.warn('加载商品失败', e); }
  },

  async loadHistory() {
    try {
      const history = await app.request({ url: '/conversations?session_id=' + encodeURIComponent(this.sessionId) });
      if (history && history.length > 0) {
        const mapped = history.map(m => ({
          role: m.role,
          text: m.content,
          recs: (m.meta_data?.recommended_products || []).map(p => ({
            id: p.id, name: p.name,
            route_path: p.route_path || '/products/' + p.id
          }))
        }));
        this.setData({ messages: mapped, historyLoading: false });
        return;
      }
    } catch (e) { /* 无历史记录时保持默认欢迎语 */ }
    this.setData({
      messages: [{ role: 'assistant', text: '你好！我是你的专属美妆顾问 💄\n\n告诉我你的肤色、脸型，或者你想要什么效果，我来为你推荐最合适的产品！' }],
      historyLoading: false
    });
  },

  onInput(e) { this.setData({ input: e.detail.value }); },

  async onSend() {
    const text = this.data.input.trim();
    if (!text || this.data.sending) return;

    const msgs = [...this.data.messages, { role: 'user', text }];
    this.setData({ messages: msgs, input: '', sending: true });

    try {
      // 保存用户消息
      const analysis = this.extractAnalysis(text);
      await app.request({
        url: '/conversations', method: 'POST',
        data: { session_id: this.sessionId, role: 'user', content: text, meta_data: { face_analysis: analysis } }
      });

      // 调用后端 AI 美妆顾问 API
      let reply; let recMeta;
      try {
        const history = this.data.messages.slice(-10).map(m => ({ role: m.role, content: m.text }));
        const res = await app.request({
          url: '/agent/chat', method: 'POST',
          data: { query: text, session_id: this.sessionId, history }
        });
        reply = res.reply;
        recMeta = (res.products || []).map(p => ({
          id: p.id, name: p.name,
          route_path: '/products/' + p.id
        }));
      } catch (apiErr) {
        // API 失败时 fallback 到客户端关键词匹配
        console.warn('Agent API 失败，使用客户端 fallback:', apiErr);
        const recs = this.matchProducts(text);
        reply = this.generateReply(text, recs);
        recMeta = recs.slice(0, 5).map(p => ({
          id: p.id, name: p.name,
          route_path: p.route_path || '/products/' + p.id
        }));
      }

      // 保存 AI 回复
      await app.request({
        url: '/conversations', method: 'POST',
        data: { session_id: this.sessionId, role: 'assistant', content: reply, meta_data: { recommended_products: recMeta, face_analysis: analysis } }
      });

      this.setData({
        messages: [...msgs, { role: 'assistant', text: reply, recs: recMeta }],
        sending: false
      });
    } catch (e) {
      this.setData({
        messages: [...msgs, { role: 'assistant', text: '抱歉，出了点问题：' + e.message }],
        sending: false
      });
    }

    // 滚动到底部
    setTimeout(() => {
      wx.pageScrollTo({ scrollTop: 99999, duration: 300 });
    }, 100);
  },

  onRecTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  // 简单关键词匹配（占位，模块二开发者替换为真正的 LLM + 向量检索）
  matchProducts(query) {
    const q = query.toLowerCase();
    const scored = this.data.products.map(p => {
      let s = 0;
      const t = [p.name, p.brand, p.category, (p.tags || []).join(' '), (p.skin_tones || []).join(' '), (p.face_shapes || []).join(' ')].join(' ').toLowerCase();
      q.split(/\s+/).forEach(w => { if (w.length >= 2 && t.includes(w)) s += 3; });
      ['cool', 'warm', 'deep', 'light', '冷', '暖', '深', '浅'].forEach(x => { if (q.includes(x) && (p.skin_tones || []).join(' ').toLowerCase().includes(x)) s += 5; });
      ['oval', 'round', 'square', 'heart', '圆', '方', '长', '心形'].forEach(x => { if (q.includes(x) && (p.face_shapes || []).join(' ').toLowerCase().includes(x)) s += 5; });
      if ((q.includes('lip') || q.includes('唇')) && p.category === 'Lips') s += 4;
      if ((q.includes('eye') || q.includes('眼')) && p.category === 'Eyes') s += 4;
      if ((q.includes('face') || q.includes('粉底') || q.includes('脸')) && p.category === 'Face') s += 4;
      if ((q.includes('skin') || q.includes('护肤') || q.includes('精华')) && p.category === 'Skincare') s += 4;
      return { p, s };
    });
    return scored.filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 5).map(x => x.p);
  },

  generateReply(query, recs) {
    if (!recs.length) return '我很想帮你找到完美的产品！你能告诉我更多吗？\n\n• 你的肤色（冷/暖/浅/深）\n• 你的脸型（圆/方/心形/椭圆）\n• 想要什么类型的产品（口红/粉底/眼影/护肤）';
    const q = query.toLowerCase();
    let intro = '根据你的特征，以下是我的推荐：\n\n';
    if (q.includes('冷') || q.includes('cool')) intro = '适合冷色调肤色的推荐：\n\n';
    if (q.includes('暖') || q.includes('warm')) intro = '适合暖色调肤色的推荐：\n\n';
    const list = recs.map((p, i) => (i + 1) + '. ' + p.name + (p.brand ? '（' + p.brand + '）' : '') + ' — ¥' + (p.price || '—')).join('\n');
    return intro + list + '\n\n点击下方产品卡片查看详情！需要我进一步缩小范围吗？';
  },

  extractAnalysis(text) {
    const q = text.toLowerCase();
    const r = {};
    ['cool', 'warm', 'deep', 'light', '冷', '暖', '深', '浅'].forEach(x => { if (q.includes(x)) r.skin_tone = x; });
    ['oval', 'round', 'square', 'heart', '圆', '方', '心形', '椭圆'].forEach(x => { if (q.includes(x)) r.face_shape = x; });
    return Object.keys(r).length ? r : undefined;
  },
});
