import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as api from './services/api';

// ── Types ─────────────────────────────────────────────────
type Page = 'home'|'category'|'detail'|'agent'|'tryOn'|'cart'|'favs'|'profile'|'login'|'register';
interface CartItem extends api.Product { qty: number }

// ── Dev admin (开发者免注册账号) ────────────────────────────
// 仅在 import.meta.env.DEV (开发模式) 下生效；正式部署时不会暴露
const DEV_ADMIN = {
  username: 'admin',
  password: 'Admin@12345',
  nickname: '开发者',
};
const IS_DEV = (import.meta as any).env?.DEV === true;

// ── Placeholder images ────────────────────────────────────
const PH = [
  'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&q=80',
  'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=600&q=80',
  'https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=600&q=80',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&q=80',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
  'https://images.unsplash.com/photo-1583241475880-083f84372725?w=600&q=80',
];
const ph = (id: number) => PH[id % PH.length];
const CATS = ['All','Lips','Face','Eyes','Skincare'];

// ══════════════════════════════════════════════════════════
//  I18N — 内置中英文切换（不引入额外依赖）
// ══════════════════════════════════════════════════════════
type Lang = 'en' | 'zh';

const I18N: Record<Lang, Record<string, string>> = {
  en: {
    // nav
    'nav.home': 'Home',
    'nav.advisor': 'AI Advisor',
    'nav.tryon': 'Try On',
    'nav.favorites': 'Favorites',
    // categories
    'cat.All': 'All',
    'cat.Lips': 'Lips',
    'cat.Face': 'Face',
    'cat.Eyes': 'Eyes',
    'cat.Skincare': 'Skincare',
    // hero
    'hero.title1': 'Discover Your',
    'hero.title2': 'Perfect Beauty',
    'hero.desc': 'AI-powered recommendations tailored to your unique skin tone, face shape, and personal style.',
    'hero.cta': 'Talk to AI Advisor →',
    // home / category
    'home.newArrivals': 'New Arrivals',
    'home.loading': 'Loading…',
    'home.seeAll': 'See All →',
    'home.backHome': '← Back to Home',
    'home.allProducts': '— All Products',
    'home.empty': 'No products here yet',
    // favorites
    'favs.title': 'My Favorites',
    'favs.empty': 'No favorites yet',
    'favs.emptyHint': 'Tap the heart on products to save them here.',
    'favs.browse': 'Browse Products',
    // profile
    'profile.name': 'Beauty Lover',
    'profile.dev': 'Developer · admin',
    'profile.user': 'User #',
    'profile.myFavs': 'My Favorites',
    'profile.myCart': 'My Cart',
    'profile.signOut': 'Sign Out',
    // detail
    'detail.back': '← Back',
    'detail.ingredients': 'Ingredients',
    'detail.howToUse': 'How to Use',
    'detail.recommendedFor': 'Recommended For',
    'detail.skinTag': 'Skin',
    'detail.faceTag': 'Face',
    'detail.addCart': 'Add to Cart',
    'detail.added': '✓ Added to Cart',
    'detail.save': '🤍 Save',
    'detail.saved': '❤️ Saved',
    // agent
    'agent.title': 'AI Beauty Advisor',
    'agent.subtitle': 'Tell me about your features or what look you want',
    'agent.greeting': "Hi! I'm your personal beauty advisor 💄\n\nTell me about your skin tone, face shape, or what you're looking for — I'll find the perfect products for you!",
    'agent.placeholder': 'e.g. I have warm-toned skin and an oval face…',
    'agent.send': 'Send',
    'agent.thinking': 'Thinking',
    'agent.askMore': "I'd love to help! Could you tell me more about:\n• Your skin tone (cool, warm, light, deep)\n• Your face shape (oval, round, square, heart)\n• What product type you want (lipstick, foundation, mascara, skincare)",
    'agent.introDefault': 'Based on your features, here are my recommendations:\n\n',
    'agent.introCool': 'For your cool-toned complexion:\n\n',
    'agent.introWarm': 'For your warm-toned skin, these would look gorgeous:\n\n',
    'agent.introOval': 'With your balanced oval face shape, you have many options:\n\n',
    'agent.suits': 'Suits {tones} tones.',
    'agent.outro': '\n\nClick any product to see details! Want me to narrow it down?',
    'agent.error': 'Sorry, something went wrong: {msg}',
    // try-on
    'tryon.title': 'AI Try-On',
    'tryon.desc': 'Upload a photo, describe the look, and our AI will transform it.',
    'tryon.upload.title': 'Click to upload your photo',
    'tryon.upload.hint': 'JPEG or PNG · max 15 MB',
    'tryon.original': 'Original',
    'tryon.result': 'Result',
    'tryon.resultEmpty': 'Result will appear here',
    'tryon.styles': 'Quick styles',
    'tryon.promptPlaceholder': 'e.g. Apply a coral lipstick, natural makeup',
    'tryon.apply': 'Apply',
    'tryon.processing': 'Processing…',
    'tryon.changePhoto': 'Upload a different photo',
    // cart
    'cart.continue': '← Continue Shopping',
    'cart.title': 'My Cart',
    'cart.empty': 'Your cart is empty',
    'cart.emptyHint': 'Add some products to get started!',
    'cart.browse': 'Browse Products',
    'cart.remove': 'Remove',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout',
    // auth
    'auth.welcome': 'Welcome Back',
    'auth.createAccount': 'Create Account',
    'auth.signinTagline': 'Sign in to your beauty journey',
    'auth.signupTagline': 'Join Lumina Beauty today',
    'auth.nickname': 'Nickname',
    'auth.nicknamePh': 'What should we call you?',
    'auth.username': 'Username',
    'auth.usernamePh': 'Enter username (3-50 chars)',
    'auth.password': 'Password',
    'auth.passwordPh': 'Min 8 characters',
    'auth.pleaseWait': 'Please wait…',
    'auth.signIn': 'Sign In',
    'auth.noAccount': "Don't have an account? ",
    'auth.hasAccount': 'Already have an account? ',
    'auth.signUp': 'Sign up',
    'auth.signInLink': 'Sign in',
    'auth.devQuick': '🚀 Enter as developer (admin / skip signup)',
    'auth.devHint': '💡 DEV mode: admin credentials pre-filled. Will not appear in production build.',
    'auth.fieldErrors': 'Validation details:',
    'auth.devLoginFailed': 'Developer login failed: ',
    'auth.backendDown': 'Backend not running?',
    // language switcher
    'lang.switch': '中文',
    // footer
    'footer.copy': '© 2025 Lumina Beauty AI · Crafted with intelligence',
  },
  zh: {
    // nav
    'nav.home': '首页',
    'nav.advisor': 'AI 顾问',
    'nav.tryon': 'AI 试妆',
    'nav.favorites': '收藏',
    // categories
    'cat.All': '全部',
    'cat.Lips': '唇部',
    'cat.Face': '面部',
    'cat.Eyes': '眼部',
    'cat.Skincare': '护肤',
    // hero
    'hero.title1': '发现你的',
    'hero.title2': '完美之美',
    'hero.desc': '基于 AI 的个性化推荐，量身定制你独特的肤色、脸型与个人风格。',
    'hero.cta': '与 AI 顾问对话 →',
    // home / category
    'home.newArrivals': '新品上架',
    'home.loading': '加载中…',
    'home.seeAll': '查看全部 →',
    'home.backHome': '← 返回首页',
    'home.allProducts': ' — 全部商品',
    'home.empty': '此分类暂无商品',
    // favorites
    'favs.title': '我的收藏',
    'favs.empty': '还没有收藏',
    'favs.emptyHint': '点击商品卡片上的爱心来收藏喜欢的商品。',
    'favs.browse': '去逛逛',
    // profile
    'profile.name': '美妆爱好者',
    'profile.dev': '开发者 · admin',
    'profile.user': '用户 #',
    'profile.myFavs': '我的收藏',
    'profile.myCart': '我的购物车',
    'profile.signOut': '退出登录',
    // detail
    'detail.back': '← 返回',
    'detail.ingredients': '成分',
    'detail.howToUse': '使用方法',
    'detail.recommendedFor': '适合人群',
    'detail.skinTag': '肤色',
    'detail.faceTag': '脸型',
    'detail.addCart': '加入购物车',
    'detail.added': '✓ 已加入购物车',
    'detail.save': '🤍 收藏',
    'detail.saved': '❤️ 已收藏',
    // agent
    'agent.title': 'AI 美妆顾问',
    'agent.subtitle': '告诉我你的特征或想要的妆容',
    'agent.greeting': '你好！我是你的专属美妆顾问 💄\n\n告诉我你的肤色、脸型或想找什么样的产品 —— 我会帮你找到最合适的！',
    'agent.placeholder': '例如：我是暖色调皮肤、椭圆脸…',
    'agent.send': '发送',
    'agent.thinking': '思考中',
    'agent.askMore': '我很乐意帮忙！请告诉我更多：\n• 你的肤色（冷调 / 暖调 / 浅 / 深）\n• 你的脸型（椭圆 / 圆 / 方 / 心形）\n• 想要的产品类型（口红 / 粉底 / 睫毛膏 / 护肤品）',
    'agent.introDefault': '根据你的特征，为你推荐：\n\n',
    'agent.introCool': '为冷调肤色推荐：\n\n',
    'agent.introWarm': '为暖调肤色推荐这些精选：\n\n',
    'agent.introOval': '你的椭圆脸非常百搭，有多种选择：\n\n',
    'agent.suits': '适合 {tones} 肤色。',
    'agent.outro': '\n\n点击任意商品查看详情！需要我帮你进一步筛选吗？',
    'agent.error': '抱歉，出错了：{msg}',
    // try-on
    'tryon.title': 'AI 试妆',
    'tryon.desc': '上传一张照片，描述想要的妆容，AI 将为你呈现效果。',
    'tryon.upload.title': '点击上传你的照片',
    'tryon.upload.hint': 'JPEG 或 PNG · 最大 15 MB',
    'tryon.original': '原图',
    'tryon.result': '效果',
    'tryon.resultEmpty': '效果图将在此显示',
    'tryon.styles': '快速风格',
    'tryon.promptPlaceholder': '例如：涂上珊瑚色口红，淡妆',
    'tryon.apply': '生成',
    'tryon.processing': '处理中…',
    'tryon.changePhoto': '更换一张照片',
    // cart
    'cart.continue': '← 继续购物',
    'cart.title': '我的购物车',
    'cart.empty': '购物车空空如也',
    'cart.emptyHint': '加点喜欢的商品吧！',
    'cart.browse': '去逛逛',
    'cart.remove': '移除',
    'cart.total': '合计',
    'cart.checkout': '去结算',
    // auth
    'auth.welcome': '欢迎回来',
    'auth.createAccount': '创建账号',
    'auth.signinTagline': '登录开启你的美妆之旅',
    'auth.signupTagline': '今天加入 Lumina Beauty',
    'auth.nickname': '昵称',
    'auth.nicknamePh': '希望我们如何称呼你？',
    'auth.username': '用户名',
    'auth.usernamePh': '请输入用户名（3-50 字符）',
    'auth.password': '密码',
    'auth.passwordPh': '至少 8 个字符',
    'auth.pleaseWait': '请稍候…',
    'auth.signIn': '登录',
    'auth.noAccount': '还没有账号？',
    'auth.hasAccount': '已有账号？',
    'auth.signUp': '去注册',
    'auth.signInLink': '去登录',
    'auth.devQuick': '🚀 以开发者身份进入（admin / 免注册）',
    'auth.devHint': '💡 开发模式：已预填 admin 账号。生产环境构建（npm run build）后此功能不出现。',
    'auth.fieldErrors': '具体校验失败原因：',
    'auth.devLoginFailed': '开发者登录失败：',
    'auth.backendDown': '后端未启动？',
    // language switcher
    'lang.switch': 'EN',
    // footer
    'footer.copy': '© 2025 Lumina Beauty AI · 智能驱动美',
  },
};

// 简单的全局语言状态，配合 useSyncExternalStore 让所有组件订阅
const _langListeners = new Set<() => void>();
let _currentLang: Lang = (() => {
  try {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'en' || saved === 'zh') return saved;
  } catch {}
  // 浏览器语言为中文时默认中文
  return (typeof navigator !== 'undefined' && navigator.language?.startsWith('zh')) ? 'zh' : 'en';
})();

function getLang(): Lang { return _currentLang; }
function setLang(l: Lang) {
  _currentLang = l;
  try { localStorage.setItem('lang', l); } catch {}
  _langListeners.forEach(fn => fn());
}
function useLang(): [Lang, (l: Lang) => void] {
  const subscribe = (cb: () => void) => { _langListeners.add(cb); return () => _langListeners.delete(cb); };
  const lang = React.useSyncExternalStore(subscribe, getLang, getLang);
  return [lang, setLang];
}
// 翻译函数：t('key', {tones: 'cool, warm'}) → '适合 cool, warm 肤色。'
function useT() {
  const [lang] = useLang();
  return (key: string, vars?: Record<string, string|number>): string => {
    let s = I18N[lang][key] ?? I18N.en[key] ?? key;
    if (vars) for (const [k,v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };
}
// 分类名翻译（CATS 数组保留英文 key，渲染时翻译）
function tCat(t: (k:string)=>string, c: string): string { return t(`cat.${c}`) || c; }


// ══════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap');
:root{
  --bg:#FAF9F6;--card:#fff;--text:#18181B;--sub:#9CA3AF;--accent:#C8956C;--accent2:#E8C4A8;
  --border:#F0EDE8;--ok:#4A7C59;--err:#C45B5B;
  --serif:'Cormorant Garamond',Georgia,serif;
  --sans:'Outfit',-apple-system,sans-serif;
  --r:14px;--sh:0 2px 24px rgba(0,0,0,.06);--sh2:0 12px 48px rgba(0,0,0,.10);
}
*{margin:0;padding:0;box-sizing:border-box}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
button{cursor:pointer;border:none;background:none;font-family:inherit}
input,textarea{font-family:inherit}
img{display:block;max-width:100%}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}

/* layout */
.wrap{min-height:100vh;display:flex;flex-direction:column}
.main{flex:1;max-width:1360px;margin:0 auto;width:100%;padding:0 48px}
@media(max-width:768px){.main{padding:0 16px}}

/* top */
.top{position:sticky;top:0;z-index:100;background:rgba(250,249,246,.88);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);padding:0 48px}
@media(max-width:768px){.top{padding:0 16px}}
.top-in{max-width:1360px;margin:0 auto;height:68px;display:flex;align-items:center;justify-content:space-between}
.logo{font-family:var(--serif);font-size:1.6rem;font-weight:700;letter-spacing:-.02em;cursor:pointer}
.logo em{font-style:normal;color:var(--accent)}
.nav{display:flex;gap:28px;align-items:center}
.nav-i{font-size:.8rem;font-weight:500;letter-spacing:.07em;text-transform:uppercase;color:var(--sub);transition:color .2s;position:relative}
.nav-i:hover,.nav-i.on{color:var(--text)}
.nav-i.on::after{content:'';position:absolute;bottom:-4px;left:0;right:0;height:2px;background:var(--accent);border-radius:1px}
.nav-badge{position:absolute;top:-7px;right:-10px;background:var(--accent);color:#fff;font-size:.6rem;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700}
.lang-btn{display:inline-flex;align-items:center;gap:5px;font-size:.72rem;font-weight:600;letter-spacing:.06em;color:var(--sub);padding:6px 10px;border:1px solid var(--border);border-radius:14px;transition:all .2s;margin-left:6px}
.lang-btn:hover{color:var(--accent);border-color:var(--accent)}

/* hero */
.hero{margin:36px 0;padding:72px 64px;background:linear-gradient(135deg,#F5EDE4 0%,#FDF6EE 50%,#EDE6DA 100%);border-radius:24px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-40%;right:-15%;width:55%;height:180%;background:radial-gradient(circle,rgba(200,149,108,.12) 0%,transparent 70%)}
.hero h1{font-family:var(--serif);font-size:clamp(2.2rem,5vw,3.6rem);font-weight:700;line-height:1.12;max-width:560px;position:relative}
.hero p{font-size:1.05rem;color:var(--sub);max-width:440px;margin-top:14px;line-height:1.65;position:relative}
.hero-btn{display:inline-flex;align-items:center;gap:8px;margin-top:28px;padding:14px 36px;background:var(--text);color:#fff;font-size:.82rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;border-radius:40px;transition:all .3s;position:relative}
.hero-btn:hover{background:var(--accent);transform:translateY(-2px);box-shadow:var(--sh2)}
@media(max-width:768px){.hero{padding:48px 28px}.hero h1{font-size:1.8rem}}

/* section */
.sec-h{display:flex;justify-content:space-between;align-items:baseline;margin:44px 0 20px}
.sec-t{font-family:var(--serif);font-size:1.6rem;font-weight:600}
.sec-a{font-size:.78rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--accent);cursor:pointer}
.sec-a:hover{text-decoration:underline}

/* tabs */
.tabs{display:flex;gap:10px;margin-bottom:28px;overflow-x:auto;padding-bottom:2px}
.tab{padding:9px 22px;border:1.5px solid var(--border);border-radius:30px;font-size:.8rem;font-weight:500;white-space:nowrap;transition:all .2s}
.tab:hover{border-color:var(--accent);color:var(--accent)}
.tab.on{background:var(--text);color:#fff;border-color:var(--text)}

/* grid */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;margin-bottom:48px}
@media(max-width:640px){.grid{grid-template-columns:repeat(2,1fr);gap:12px}}
.card{background:var(--card);border-radius:var(--r);overflow:hidden;cursor:pointer;transition:all .35s cubic-bezier(.4,0,.2,1);border:1px solid var(--border);position:relative}
.card:hover{transform:translateY(-6px);box-shadow:var(--sh2);border-color:transparent}
.card img{width:100%;aspect-ratio:3/4;object-fit:cover}
.card-body{padding:16px 18px}
.card-brand{font-size:.68rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--sub);margin-bottom:3px}
.card-name{font-family:var(--serif);font-size:1rem;font-weight:600;line-height:1.3;margin-bottom:6px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.card-price{font-size:.95rem;font-weight:600;color:var(--accent)}
.card-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}
.tag{font-size:.65rem;padding:3px 9px;background:var(--bg);border-radius:20px;color:var(--sub)}
.fav{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.92);position:absolute;top:12px;right:12px;z-index:2;transition:transform .2s;font-size:.95rem;box-shadow:0 1px 6px rgba(0,0,0,.08)}
.fav:hover{transform:scale(1.15)}

/* detail */
.det{display:grid;grid-template-columns:1fr 1fr;gap:56px;margin:40px 0 80px}
@media(max-width:768px){.det{grid-template-columns:1fr;gap:24px}}
.det-img{border-radius:var(--r);overflow:hidden}
.det-img img{width:100%;aspect-ratio:3/4;object-fit:cover}
.det-meta{display:flex;flex-direction:column;justify-content:center}
.back{font-size:.82rem;color:var(--sub);margin-bottom:20px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.back:hover{color:var(--text)}
.det-brand{font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:6px}
.det-name{font-family:var(--serif);font-size:2.1rem;font-weight:700;line-height:1.18;margin-bottom:16px}
.det-price{font-size:1.5rem;font-weight:600;color:var(--accent);margin-bottom:20px}
.det-desc{line-height:1.8;color:var(--sub);margin-bottom:20px;font-size:.95rem}
.det-sec{margin-bottom:16px}
.det-sec h4{font-size:.72rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--sub);margin-bottom:6px}
.det-sec p{line-height:1.7;font-size:.88rem}

/* btn */
.btn{padding:14px 28px;border-radius:40px;font-size:.84rem;font-weight:600;letter-spacing:.04em;transition:all .3s;display:inline-flex;align-items:center;justify-content:center;gap:8px}
.btn-p{background:var(--text);color:#fff}.btn-p:hover{background:var(--accent);transform:translateY(-1px)}
.btn-o{border:1.5px solid var(--border);color:var(--text)}.btn-o:hover{border-color:var(--text)}
.btn-a{background:var(--accent);color:#fff}.btn-a:hover{background:#B07E5A}
.btn-w{width:100%}

/* agent */
.ag{max-width:800px;margin:36px auto;display:flex;flex-direction:column;height:calc(100vh - 180px)}
.ag-head{text-align:center;margin-bottom:20px}
.ag-head h2{font-family:var(--serif);font-size:1.8rem;font-weight:700}
.ag-head p{color:var(--sub);font-size:.9rem;margin-top:4px}
.msgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding:16px 0}
.msg{max-width:82%;padding:14px 20px;border-radius:18px;font-size:.9rem;line-height:1.65;animation:fu .3s ease}
@keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.msg.u{align-self:flex-end;background:var(--text);color:#fff;border-bottom-right-radius:4px}
.msg.a{align-self:flex-start;background:var(--card);border:1px solid var(--border);border-bottom-left-radius:4px}
.rec{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;margin:6px 4px 0 0;background:var(--bg);border-radius:8px;cursor:pointer;border:1px solid var(--border);transition:all .2s;font-size:.8rem}
.rec:hover{border-color:var(--accent);background:#fff}
.ag-bar{display:flex;gap:12px;padding:14px 0;border-top:1px solid var(--border)}
.ag-bar input{flex:1;padding:13px 20px;border:1.5px solid var(--border);border-radius:40px;font-size:.88rem;outline:none;transition:border .2s}
.ag-bar input:focus{border-color:var(--accent)}
.ag-bar button{padding:13px 28px;background:var(--text);color:#fff;border-radius:40px;font-weight:600;font-size:.82rem;transition:background .2s}
.ag-bar button:hover{background:var(--accent)}
.ag-bar button:disabled{opacity:.45;cursor:not-allowed}

/* try-on */
.to{max-width:720px;margin:36px auto;text-align:center}
.to h2{font-family:var(--serif);font-size:1.8rem;font-weight:700;margin-bottom:6px}
.to>p{color:var(--sub);margin-bottom:28px}
.to-pre{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0}
.to-pre img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--r);border:1px solid var(--border)}
.to-styles{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 4px}
.to-style{padding:8px 16px;border:1.5px solid var(--border);border-radius:40px;font-size:.82rem;cursor:pointer;background:var(--card);transition:.2s}
.to-style:hover,.to-style.on{border-color:var(--accent);background:var(--accent2);color:var(--text)}

/* Upload card —— 取消虚线，改用柔和渐变 + 投影 + hover 抬升 */
.to-up{
  display:block;cursor:pointer;
  padding:60px 32px;border-radius:20px;
  background:linear-gradient(140deg,#FFFFFF 0%,#FAF6F0 100%);
  border:1px solid #EBE5DC;
  box-shadow:0 1px 3px rgba(0,0,0,.04),0 8px 24px rgba(200,149,108,.06);
  transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease;
  position:relative;overflow:hidden;
}
.to-up::before{
  /* 顶部渐变腰带，作为装饰 */
  content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,var(--accent2),var(--accent),var(--accent2));
  opacity:.5;transition:opacity .25s ease;
}
.to-up:hover{
  transform:translateY(-3px);
  border-color:var(--accent2);
  box-shadow:0 4px 12px rgba(0,0,0,.06),0 16px 40px rgba(200,149,108,.16);
}
.to-up:hover::before{opacity:1}
.to-up-icon{
  width:64px;height:64px;margin:0 auto 14px;
  display:flex;align-items:center;justify-content:center;
  border-radius:50%;
  background:linear-gradient(135deg,var(--accent) 0%,#B07A50 100%);
  box-shadow:0 6px 18px rgba(200,149,108,.32);
  color:#fff;font-size:1.55rem;
  transition:transform .3s ease;
}
.to-up:hover .to-up-icon{transform:scale(1.08) rotate(-5deg)}
.to-up-title{font-family:var(--serif);font-size:1.25rem;font-weight:600;color:var(--text);margin-bottom:4px}
.to-up-hint{color:var(--sub);font-size:.83rem;letter-spacing:.02em}

/* cart */
.ci{display:flex;gap:20px;padding:20px 0;border-bottom:1px solid var(--border)}
.ci img{width:96px;height:116px;object-fit:cover;border-radius:8px;cursor:pointer}
.ci-info{flex:1;display:flex;flex-direction:column;justify-content:space-between}
.ci-name{font-family:var(--serif);font-weight:600}
.ci-price{color:var(--accent);font-weight:600;font-size:.95rem}
.qty{display:flex;align-items:center;gap:12px}
.qty button{width:28px;height:28px;border:1px solid var(--border);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;transition:border-color .2s}
.qty button:hover{border-color:var(--text)}
.cs{padding:24px 0;border-top:2px solid var(--text);margin-top:20px}

/* auth */
.auth{max-width:400px;margin:80px auto;text-align:center}
.auth h2{font-family:var(--serif);font-size:2rem;margin-bottom:6px}
.auth>p{color:var(--sub);margin-bottom:28px}
.fg{margin-bottom:14px;text-align:left}
.fg label{font-size:.76rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--sub);margin-bottom:5px;display:block}
.fg input{width:100%;padding:12px 16px;border:1.5px solid var(--border);border-radius:8px;font-size:.9rem;outline:none;transition:border .2s}
.fg input:focus{border-color:var(--accent)}
.ferr{color:var(--err);font-size:.82rem;margin:6px 0}

/* profile */
.pf{background:var(--card);border-radius:var(--r);padding:40px;text-align:center;max-width:460px;margin:60px auto;border:1px solid var(--border)}
.pf-av{width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.7rem;color:#fff;font-family:var(--serif)}
.pf-name{font-family:var(--serif);font-size:1.35rem;font-weight:600}
.pf-id{color:var(--sub);font-size:.85rem;margin-top:3px}

/* empty */
.empty{text-align:center;padding:80px 0}
.empty h3{font-family:var(--serif);font-size:1.35rem;margin-bottom:6px}
.empty p{color:var(--sub)}

.foot{margin-top:auto;padding:36px;text-align:center;border-top:1px solid var(--border);color:var(--sub);font-size:.78rem}
.dots::after{content:'';animation:d 1.4s steps(4) infinite}@keyframes d{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}}

/* ── 动画与渲染增强 ───────────────────────────────────── */
@keyframes shimmer{0%{background-position:-1000px 0}100%{background-position:1000px 0}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(200,149,108,.4)}50%{box-shadow:0 0 0 12px rgba(200,149,108,0)}}
@keyframes gradientFlow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes rotateIn{from{opacity:0;transform:rotate(-8deg) scale(.95)}to{opacity:1;transform:rotate(0) scale(1)}}

.hero{background:linear-gradient(135deg,#F5EDE4 0%,#FDF6EE 25%,#EDE6DA 50%,#FDF6EE 75%,#F5EDE4 100%);background-size:300% 300%;animation:gradientFlow 18s ease infinite}
.hero h1{animation:fadeUp .9s cubic-bezier(.2,.7,.2,1) both}
.hero p{animation:fadeUp .9s .15s cubic-bezier(.2,.7,.2,1) both}
.hero-btn{animation:fadeUp .9s .3s cubic-bezier(.2,.7,.2,1) both,pulseGlow 2.4s ease-in-out 1.5s infinite}
.hero::after{content:'✨';position:absolute;top:24%;right:14%;font-size:2.2rem;animation:floatY 4s ease-in-out infinite;opacity:.7}

.card{will-change:transform}
.card:hover img{transform:scale(1.05)}
.card img{transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.card-name,.card-price{transition:color .25s ease}
.card:hover .card-name{color:var(--accent)}

/* 按钮微动效 */
.btn,.hero-btn,.ag-bar button{position:relative;overflow:hidden}
.btn::before,.hero-btn::before{content:'';position:absolute;top:50%;left:50%;width:0;height:0;border-radius:50%;background:rgba(255,255,255,.25);transform:translate(-50%,-50%);transition:width .5s,height .5s}
.btn:active::before,.hero-btn:active::before{width:300px;height:300px}

/* 滚动渐入 */
.reveal{animation:fadeUp .7s cubic-bezier(.2,.7,.2,1) both}

/* 登录页背景动画 */
.auth-bg{position:fixed;inset:0;z-index:-1;background:linear-gradient(135deg,#FDF6EE 0%,#F5EDE4 50%,#EDE6DA 100%);background-size:200% 200%;animation:gradientFlow 14s ease infinite;overflow:hidden}
.auth-bg::before,.auth-bg::after{content:'';position:absolute;width:480px;height:480px;border-radius:50%;filter:blur(80px);opacity:.4}
.auth-bg::before{top:-10%;left:-10%;background:radial-gradient(circle,#E8C4A8 0%,transparent 70%);animation:floatY 12s ease-in-out infinite}
.auth-bg::after{bottom:-10%;right:-10%;background:radial-gradient(circle,#C8956C 0%,transparent 70%);animation:floatY 14s ease-in-out -3s infinite}

.auth{animation:rotateIn .8s cubic-bezier(.2,.7,.2,1) both;background:rgba(255,255,255,.7);backdrop-filter:blur(20px);padding:44px 36px;border-radius:20px;border:1px solid rgba(255,255,255,.6);box-shadow:0 20px 60px rgba(0,0,0,.08);position:relative}
.fg input:focus{box-shadow:0 0 0 4px rgba(200,149,108,.12)}

/* 开发者快速登录按钮 */
.dev-quick{margin-top:14px;padding:10px 14px;width:100%;background:linear-gradient(135deg,#FAF3EA,#F5EDE4);border:1.5px dashed var(--accent);border-radius:10px;color:var(--accent);font-weight:600;font-size:.82rem;transition:all .25s;display:flex;align-items:center;justify-content:center;gap:8px}
.dev-quick:hover{background:linear-gradient(135deg,#F5EDE4,#EFE5D4);transform:translateY(-1px)}

/* 字段错误高亮 */
.fg.has-error input{border-color:var(--err);box-shadow:0 0 0 4px rgba(196,91,91,.1)}
.field-errors{background:rgba(196,91,91,.06);border:1px solid rgba(196,91,91,.2);border-radius:8px;padding:10px 12px;margin:8px 0;font-size:.78rem;color:var(--err);text-align:left}
.field-errors ul{margin:0;padding-left:18px}
.field-errors li{margin:2px 0}

/* AI 消息打字光标 */
.msg.a .typing{display:inline-block;width:2px;height:1em;background:var(--accent);vertical-align:text-bottom;margin-left:2px;animation:blink 1s steps(2) infinite}
@keyframes blink{50%{opacity:0}}

/* Sparkle */
.sparkle{display:inline-block;animation:floatY 2.5s ease-in-out infinite}
`;

// ══════════════════════════════════════════════════════════
//  APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const t = useT();
  const [lang, setLangState] = useLang();
  const [page, setPage] = useState<Page>(api.isLoggedIn()?'home':'login');
  const [products, setProducts] = useState<api.Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState<api.Product|null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('cart')||'[]'); } catch { return []; }
  });
  const [favs, setFavs] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('favs')||'[]')); } catch { return new Set(); }
  });
  const [catF, setCatF] = useState('All');
  const [catPage, setCatPage] = useState<string|null>(null);
  const [devMode, setDevMode] = useState(false); // 是否以开发者身份登录

  // ── 开发者免注册：自动登录 admin（仅 DEV 模式）─────────
  useEffect(() => {
    if (!IS_DEV) return;
    if (api.isLoggedIn()) { setDevMode(true); return; }
    (async () => {
      try {
        // 先尝试登录；如果账号不存在则注册一次
        let data;
        try {
          data = await api.login(DEV_ADMIN.username, DEV_ADMIN.password);
        } catch (e) {
          data = await api.register(DEV_ADMIN.username, DEV_ADMIN.password, DEV_ADMIN.nickname);
        }
        api.setAuth(data.access_token, data.user_id);
        localStorage.setItem('dev_mode', '1');
        setDevMode(true);
        setPage('home');
      } catch (err) {
        // 后端没起来就静默失败，不打断手动登录
        console.warn('[Dev auto-login] 失败：', err);
      }
    })();
  }, []);

  // Persist cart & favs
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('favs', JSON.stringify([...favs])); }, [favs]);

  // Load products
  useEffect(() => {
    if (!api.isLoggedIn()) return;
    setLoading(true);
    api.fetchProducts().then(setProducts).catch(()=>{}).finally(()=>setLoading(false));
  }, [page === 'login' ? 'x' : 'y']); // reload after login

  const go = (p: Page) => { setSel(null); setCatPage(null); setPage(p); window.scrollTo(0,0); };
  const viewDet = (p: api.Product) => { setSel(p); setPage('detail'); window.scrollTo(0,0); };
  const viewCat = (c: string) => { setCatPage(c); setPage('category'); window.scrollTo(0,0); };

  const toggleFav = (id: number) => setFavs(s => { const n = new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const addCart = (p: api.Product) => setCart(prev => {
    const i = prev.findIndex(c=>c.id===p.id);
    if (i>=0) { const n=[...prev]; n[i]={...n[i],qty:n[i].qty+1}; return n; }
    return [...prev,{...p,qty:1}];
  });
  const onAuth = (token: string, uid: number) => { api.setAuth(token,uid); go('home'); };
  const cartN = cart.reduce((s,c)=>s+c.qty,0);
  const filtered = catF==='All' ? products : products.filter(p=>p.category===catF);

  return (<>
    <style>{CSS}</style>
    {(page==='login'||page==='register')&&<div className="auth-bg"/>}
    <div className="wrap">

      {/* ── Topbar ── */}
      {page!=='login'&&page!=='register'&&(
        <motion.header
          className="top"
          initial={{ y: -68, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: .5, ease: [.2,.7,.2,1] }}
        ><div className="top-in">
          <div className="logo" onClick={()=>go('home')}>Lumina <em>Beauty</em></div>
          <nav className="nav">
            <button className={`nav-i ${page==='home'?'on':''}`} onClick={()=>go('home')}>{t('nav.home')}</button>
            <button className={`nav-i ${page==='agent'?'on':''}`} onClick={()=>go('agent')}>{t('nav.advisor')}</button>
            <button className={`nav-i ${page==='tryOn'?'on':''}`} onClick={()=>go('tryOn')}>{t('nav.tryon')}</button>
            <button className={`nav-i ${page==='favs'?'on':''}`} onClick={()=>go('favs')}>
              {t('nav.favorites')}{favs.size>0&&<span style={{color:'var(--accent)',marginLeft:3}}>({favs.size})</span>}
            </button>
            <button className="nav-i" style={{position:'relative'}} onClick={()=>go('cart')}>
              🛒{cartN>0&&<span className="nav-badge">{cartN}</span>}
            </button>
            <button className="nav-i" onClick={()=>go('profile')}>👤</button>
            <button className="lang-btn" onClick={()=>setLangState(lang==='zh'?'en':'zh')} title="Switch language / 切换语言">
              🌐 {t('lang.switch')}
            </button>
          </nav>
        </div></motion.header>
      )}

      <div className="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={page+(catPage||'')+(sel?.id||'')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: .35, ease: [.2,.7,.2,1] }}
          >
        {/* ── Login / Register ── */}
        {page==='login'&&<Auth mode="login" onAuth={onAuth} flip={()=>setPage('register')}/>}
        {page==='register'&&<Auth mode="register" onAuth={onAuth} flip={()=>setPage('login')}/>}

        {/* ── Home ── */}
        {page==='home'&&(<>
          <div className="hero">
            <h1>{t('hero.title1')}<br/>{t('hero.title2')}</h1>
            <p>{t('hero.desc')}</p>
            <button className="hero-btn" onClick={()=>go('agent')}>{t('hero.cta')}</button>
          </div>

          <div className="tabs">
            {CATS.map(c=>(<button key={c} className={`tab ${catF===c?'on':''}`} onClick={()=>setCatF(c)}>{tCat(t,c)}</button>))}
          </div>

          <div className="sec-h">
            <h2 className="sec-t">{catF==='All'?t('home.newArrivals'):tCat(t,catF)}</h2>
            {catF!=='All'&&<button className="sec-a" onClick={()=>viewCat(catF)}>{t('home.seeAll')}</button>}
          </div>
          {loading?<p style={{color:'var(--sub)',padding:'40px 0'}}>{t('home.loading')}</p>:(
            <div className="grid">
              {(catF==='All'?filtered.slice(0,8):filtered).map(p=>(
                <Card key={p.id} p={p} fav={favs.has(p.id)} onFav={()=>toggleFav(p.id)} onClick={()=>viewDet(p)}/>
              ))}
            </div>
          )}

          {catF==='All'&&['Lips','Eyes','Face','Skincare'].map(cat=>{
            const items=products.filter(p=>p.category===cat).slice(0,4);
            if(!items.length) return null;
            return (<React.Fragment key={cat}>
              <div className="sec-h"><h2 className="sec-t">{tCat(t,cat)}</h2><button className="sec-a" onClick={()=>viewCat(cat)}>{t('home.seeAll')}</button></div>
              <div className="grid">{items.map(p=>(<Card key={p.id} p={p} fav={favs.has(p.id)} onFav={()=>toggleFav(p.id)} onClick={()=>viewDet(p)}/>))}</div>
            </React.Fragment>);
          })}
        </>)}

        {/* ── Category (See All) ── */}
        {page==='category'&&catPage&&(<>
          <div style={{margin:'36px 0 20px'}}>
            <button className="back" onClick={()=>go('home')}>{t('home.backHome')}</button>
            <h2 className="sec-t">{tCat(t,catPage)}{t('home.allProducts')}</h2>
          </div>
          <div className="grid">
            {products.filter(p=>p.category===catPage).map(p=>(
              <Card key={p.id} p={p} fav={favs.has(p.id)} onFav={()=>toggleFav(p.id)} onClick={()=>viewDet(p)}/>
            ))}
          </div>
          {!products.filter(p=>p.category===catPage).length&&<div className="empty"><h3>{t('home.empty')}</h3></div>}
        </>)}

        {/* ── Detail ── */}
        {page==='detail'&&sel&&<Detail p={sel} fav={favs.has(sel.id)} onBack={()=>go('home')} onFav={()=>toggleFav(sel.id)} onCart={()=>addCart(sel)}/>}

        {/* ── Agent ── */}
        {page==='agent'&&<Agent products={products} onView={viewDet}/>}

        {/* ── Try On ── */}
        {page==='tryOn'&&<TryOn/>}

        {/* ── Cart ── */}
        {page==='cart'&&<CartPg cart={cart} setCart={setCart} onView={viewDet} onBack={()=>go('home')}/>}

        {/* ── Favorites ── */}
        {page==='favs'&&(<>
          <div style={{margin:'36px 0 20px'}}><h2 className="sec-t">{t('favs.title')}</h2></div>
          {favs.size===0?(
            <div className="empty"><h3>{t('favs.empty')}</h3><p>{t('favs.emptyHint')}</p>
              <button className="btn btn-p" style={{marginTop:18}} onClick={()=>go('home')}>{t('favs.browse')}</button></div>
          ):(
            <div className="grid">{products.filter(p=>favs.has(p.id)).map(p=>(
              <Card key={p.id} p={p} fav={true} onFav={()=>toggleFav(p.id)} onClick={()=>viewDet(p)}/>
            ))}</div>
          )}
        </>)}

        {/* ── Profile ── */}
        {page==='profile'&&(
          <div className="pf">
            <div className="pf-av">{(localStorage.getItem('uid')||'U')[0].toUpperCase()}</div>
            <div className="pf-name">{devMode?t('profile.dev'):t('profile.name')}</div>
            <div className="pf-id">{t('profile.user')}{localStorage.getItem('uid')||'—'}</div>
            <div style={{marginTop:24,display:'flex',flexDirection:'column',gap:12}}>
              <button className="btn btn-o btn-w" onClick={()=>go('favs')}>{t('profile.myFavs')} ({favs.size})</button>
              <button className="btn btn-o btn-w" onClick={()=>go('cart')}>{t('profile.myCart')} ({cartN})</button>
              <button className="btn btn-o btn-w" style={{color:'var(--err)',borderColor:'var(--err)'}} onClick={()=>{api.clearAuth();localStorage.removeItem('dev_mode');setDevMode(false);setPage('login');}}>{t('profile.signOut')}</button>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>

      {page!=='login'&&page!=='register'&&<footer className="foot">{t('footer.copy')}</footer>}
    </div>
  </>);
}

// ── Card ──────────────────────────────────────────────────
interface CardProps { p: api.Product; fav: boolean; onFav: () => void; onClick: () => void; }
function Card({p,fav,onFav,onClick}: CardProps) {
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: .45, ease: [.2,.7,.2,1] }}
      whileHover={{ y: -6 }}
    >
      <button className="fav" onClick={e=>{e.stopPropagation();onFav();}}>{fav?'❤️':'🤍'}</button>
      <div onClick={onClick}>
        <img src={p.image_url||ph(p.id)} alt={p.name} loading="lazy"/>
        <div className="card-body">
          {p.brand&&<div className="card-brand">{p.brand}</div>}
          <div className="card-name">{p.name}</div>
          <div className="card-price">¥{p.price?.toFixed(0)||'—'}</div>
          <div className="card-tags">{p.tags?.slice(0,3).map(t=><span key={t} className="tag">{t}</span>)}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Detail ────────────────────────────────────────────────
function Detail({p,fav,onBack,onFav,onCart}:{p:api.Product;fav:boolean;onBack:()=>void;onFav:()=>void;onCart:()=>void}) {
  const t = useT();
  const [d,setD]=useState<api.Product|null>(null);
  const [added,setAdded]=useState(false);
  useEffect(()=>{api.fetchProduct(p.id).then(setD).catch(()=>setD(p))},[p.id]);
  const v=d||p;
  return (
    <div className="det">
      <div className="det-img"><img src={v.image_url||ph(v.id)} alt={v.name}/></div>
      <div className="det-meta">
        <button className="back" onClick={onBack}>{t('detail.back')}</button>
        {v.brand&&<div className="det-brand">{v.brand}</div>}
        <h1 className="det-name">{v.name}</h1>
        <div className="det-price">¥{v.price?.toFixed(0)||'—'}</div>
        {v.description&&<p className="det-desc">{v.description}</p>}
        {v.ingredients&&<div className="det-sec"><h4>{t('detail.ingredients')}</h4><p>{v.ingredients}</p></div>}
        {v.usage_tips&&<div className="det-sec"><h4>{t('detail.howToUse')}</h4><p>{v.usage_tips}</p></div>}
        {(v.skin_tones?.length||v.face_shapes?.length)?
          <div className="det-sec"><h4>{t('detail.recommendedFor')}</h4>
            <div className="card-tags">
              {v.skin_tones?.map(tone=><span key={tone} className="tag">{t('detail.skinTag')}: {tone}</span>)}
              {v.face_shapes?.map(fs=><span key={fs} className="tag">{t('detail.faceTag')}: {fs}</span>)}
            </div>
          </div>:null}
        <div style={{display:'flex',gap:12,marginTop:24}}>
          <button className="btn btn-p" style={{flex:1}} onClick={()=>{onCart();setAdded(true);setTimeout(()=>setAdded(false),2000);}}>
            {added?t('detail.added'):t('detail.addCart')}
          </button>
          <button className="btn btn-o" onClick={onFav}>{fav?t('detail.saved'):t('detail.save')}</button>
        </div>
      </div>
    </div>
  );
}

// ── Agent ─────────────────────────────────────────────────
interface AMsg{role:'user'|'assistant';text:string;recs?:{id:number;name:string;route_path:string}[]}

function Agent({products,onView}:{products:api.Product[];onView:(p:api.Product)=>void}) {
  const t = useT();
  const [lang] = useLang();
  const [msgs,setMsgs]=useState<AMsg[]>([
    {role:'assistant',text:t('agent.greeting')},
  ]);
  const [inp,setInp]=useState('');
  const [busy,setBusy]=useState(false);
  const [sid]=useState(()=>crypto.randomUUID());
  const end=useRef<HTMLDivElement>(null);
  useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth'})},[msgs]);
  // 语言切换时刷新欢迎语（如果用户还没发过消息）
  useEffect(()=>{
    setMsgs(prev=> prev.length===1 && prev[0].role==='assistant' ? [{role:'assistant',text:t('agent.greeting')}] : prev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[lang]);

  const send=async()=>{
    if(!inp.trim()||busy) return;
    const txt=inp.trim(); setInp('');
    setMsgs(p=>[...p,{role:'user',text:txt}]);
    setBusy(true);
    try{
      const analysis=extractA(txt);
      await api.saveMsg(sid,'user',txt,{face_analysis:analysis});
      const recs=matchP(txt,products);
      const reply=genReply(txt,recs,t);
      const recMeta=recs.slice(0,5).map(p=>({id:p.id,name:p.name,route_path:p.route_path||`/products/${p.id}`}));
      await api.saveMsg(sid,'assistant',reply,{recommended_products:recMeta,face_analysis:analysis});
      setMsgs(p=>[...p,{role:'assistant',text:reply,recs:recMeta}]);
    }catch(e:any){
      setMsgs(p=>[...p,{role:'assistant',text:t('agent.error',{msg:e.message})}]);
    }finally{setBusy(false)}
  };

  return (
    <div className="ag">
      <div className="ag-head"><h2>{t('agent.title')}</h2><p>{t('agent.subtitle')}</p></div>
      <div className="msgs">
        {msgs.map((m,i)=>(
          <div key={i} className={`msg ${m.role==='user'?'u':'a'}`}>
            <div style={{whiteSpace:'pre-wrap'}}>{m.text}</div>
            {m.recs&&m.recs.length>0&&<div style={{marginTop:8}}>
              {m.recs.map(r=>{const f=products.find(x=>x.id===r.id);return(
                <span key={r.id} className="rec" onClick={()=>f&&onView(f)}>🛍 {r.name}</span>
              );})}
            </div>}
          </div>
        ))}
        {busy&&<div className="msg a"><span className="dots">{t('agent.thinking')}</span></div>}
        <div ref={end}/>
      </div>
      <div className="ag-bar">
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={t('agent.placeholder')} disabled={busy}/>
        <button onClick={send} disabled={busy||!inp.trim()}>{t('agent.send')}</button>
      </div>
    </div>
  );
}

// Client-side RAG matching (placeholder — 模块二 Agent 开发者替换为真正的 LLM + 向量检索)
function matchP(q:string, ps:api.Product[]):api.Product[] {
  const ql=q.toLowerCase();
  return ps.map(p=>{
    let s=0;
    const haystack=`${p.name} ${p.brand} ${p.category} ${p.tags?.join(' ')} ${p.skin_tones?.join(' ')} ${p.face_shapes?.join(' ')}`.toLowerCase();
    for(const w of ql.split(/\s+/)){if(w.length>=2&&haystack.includes(w))s+=3;}
    for(const x of['cool','warm','deep','light']){if(ql.includes(x)&&p.skin_tones?.includes(x))s+=5;}
    for(const x of['oval','round','square','heart','long']){if(ql.includes(x)&&p.face_shapes?.includes(x))s+=5;}
    // 同时支持中文关键词
    if((ql.includes('lip')||ql.includes('唇')||ql.includes('口红'))&&p.category==='Lips')s+=4;
    if((ql.includes('eye')||ql.includes('眼'))&&p.category==='Eyes')s+=4;
    if((ql.includes('face')||ql.includes('foundation')||ql.includes('脸')||ql.includes('粉底'))&&p.category==='Face')s+=4;
    if((ql.includes('skin')||ql.includes('care')||ql.includes('serum')||ql.includes('护肤')||ql.includes('精华'))&&p.category==='Skincare')s+=4;
    return{p,s};
  }).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,5).map(x=>x.p);
}
function genReply(q:string,recs:api.Product[],t:(k:string,v?:any)=>string):string{
  if(!recs.length) return t('agent.askMore');
  const ql=q.toLowerCase();
  let intro=t('agent.introDefault');
  if(ql.includes('cool')||ql.includes('冷调')) intro=t('agent.introCool');
  if(ql.includes('warm')||ql.includes('暖调')) intro=t('agent.introWarm');
  if(ql.includes('oval')||ql.includes('椭圆')) intro=t('agent.introOval');
  const list=recs.map((p,i)=>`${i+1}. **${p.name}**${p.brand?` · ${p.brand}`:''} — ¥${p.price?.toFixed(0)||'—'}\n   ${p.skin_tones?.length?t('agent.suits',{tones:p.skin_tones.join(', ')}):''}`).join('\n');
  return intro+list+t('agent.outro');
}
function extractA(t:string){const q=t.toLowerCase();const r:any={};
  for(const x of['cool','warm','deep','light'])if(q.includes(x)){r.skin_tone=x;break;}
  for(const x of['oval','round','square','heart','long'])if(q.includes(x)){r.face_shape=x;break;}
  return Object.keys(r).length?r:undefined;
}

// ── Try On ────────────────────────────────────────────────
function TryOn() {
  const t = useT();
  const [lang] = useLang();
  const [orig,setOrig]=useState<string|null>(null);
  const [res,setRes]=useState<string|null>(null);
  const [prm,setPrm]=useState('');
  const [style,setStyle]=useState('');
  const [styles,setStyles]=useState<api.MakeupStyle[]>([]);
  const [ld,setLd]=useState(false);
  const [err,setErr]=useState('');
  React.useEffect(()=>{api.fetchMakeupStyles().then(setStyles).catch(()=>{});},[]);
  const canGo=!!(style||prm.trim());
  const up=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>setOrig(r.result as string);r.readAsDataURL(f);};
  const go=async()=>{if(!orig||!canGo)return;setLd(true);setErr('');try{setRes(await api.tryOnMakeup(orig,{style:style||undefined,prompt:prm.trim()||undefined}))}catch(e:any){setErr(e.message)}finally{setLd(false)}};
  return (
    <div className="to">
      <h2>{t('tryon.title')}</h2>
      <p>{t('tryon.desc')}</p>
      {!orig?(
        <label className="to-up">
          <div className="to-up-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div className="to-up-title">{t('tryon.upload.title')}</div>
          <div className="to-up-hint">{t('tryon.upload.hint')}</div>
          <input type="file" accept="image/*" onChange={up} style={{display:'none'}}/>
        </label>
      ):(<>
        <div className="to-pre">
          <div><div style={{fontSize:'.72rem',fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase' as any,color:'var(--sub)',marginBottom:6}}>{t('tryon.original')}</div><img src={orig} alt="original"/></div>
          <div><div style={{fontSize:'.72rem',fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase' as any,color:'var(--sub)',marginBottom:6}}>{t('tryon.result')}</div>
            {res?<img src={res} alt="result"/>:<div style={{aspectRatio:'1',background:'var(--bg)',borderRadius:'var(--r)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--sub)',border:'1px solid var(--border)'}}>{t('tryon.resultEmpty')}</div>}
          </div>
        </div>
        {styles.length>0&&(
          <div>
            <div style={{fontSize:'.72rem',fontWeight:600,letterSpacing:'.08em',textTransform:'uppercase' as any,color:'var(--sub)',marginBottom:6}}>{t('tryon.styles')}</div>
            <div className="to-styles">
              {styles.map(s=>(
                <button key={s.id} type="button" className={`to-style ${style===s.id?'on':''}`} onClick={()=>setStyle(style===s.id?'':s.id)}>
                  {lang==='zh'?s.name:s.name_en}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{display:'flex',gap:12,marginTop:14}}>
          <input value={prm} onChange={e=>setPrm(e.target.value)} placeholder={t('tryon.promptPlaceholder')} style={{flex:1,padding:'13px 20px',border:'1.5px solid var(--border)',borderRadius:40,fontSize:'.88rem',outline:'none'}} onKeyDown={e=>e.key==='Enter'&&go()}/>
          <button className="btn btn-p" onClick={go} disabled={ld||!canGo}>{ld?t('tryon.processing'):t('tryon.apply')}</button>
        </div>
        {err&&<p className="ferr" style={{marginTop:10}}>{err}</p>}
        <button style={{marginTop:14,color:'var(--sub)',fontSize:'.85rem'}} onClick={()=>{setOrig(null);setRes(null);setPrm('');setStyle('')}}>{t('tryon.changePhoto')}</button>
      </>)}
    </div>
  );
}

// ── Cart ──────────────────────────────────────────────────
function CartPg({cart,setCart,onView,onBack}:{cart:CartItem[];setCart:React.Dispatch<React.SetStateAction<CartItem[]>>;onView:(p:api.Product)=>void;onBack:()=>void}) {
  const t = useT();
  const upd=(id:number,d:number)=>setCart(p=>p.map(c=>c.id===id?{...c,qty:Math.max(0,c.qty+d)}:c).filter(c=>c.qty>0));
  const tot=cart.reduce((s,c)=>s+(c.price||0)*c.qty,0);
  return (
    <div style={{maxWidth:700,margin:'36px auto'}}>
      <button className="back" onClick={onBack}>{t('cart.continue')}</button>
      <h2 className="sec-t" style={{marginBottom:20}}>{t('cart.title')}</h2>
      {!cart.length?(
        <div className="empty"><h3>{t('cart.empty')}</h3><p>{t('cart.emptyHint')}</p>
          <button className="btn btn-p" style={{marginTop:18}} onClick={onBack}>{t('cart.browse')}</button></div>
      ):(<>
        {cart.map(c=>(
          <div key={c.id} className="ci">
            <img src={c.image_url||ph(c.id)} alt={c.name} onClick={()=>onView(c)}/>
            <div className="ci-info">
              <div><div className="ci-name">{c.name}</div><div className="ci-price">¥{c.price?.toFixed(0)}</div></div>
              <div className="qty">
                <button onClick={()=>upd(c.id,-1)}>−</button>
                <span style={{fontWeight:600,minWidth:20,textAlign:'center'}}>{c.qty}</span>
                <button onClick={()=>upd(c.id,1)}>+</button>
                <button style={{marginLeft:12,color:'var(--err)',fontSize:'.8rem'}} onClick={()=>setCart(p=>p.filter(x=>x.id!==c.id))}>{t('cart.remove')}</button>
              </div>
            </div>
          </div>
        ))}
        <div className="cs">
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'1.1rem',fontWeight:600}}>
            <span>{t('cart.total')}</span><span style={{color:'var(--accent)'}}>¥{tot.toFixed(0)}</span>
          </div>
          <button className="btn btn-a btn-w" style={{marginTop:18}}>{t('cart.checkout')}</button>
        </div>
      </>)}
    </div>
  );
}

// ── Auth ──────────────────────────────────────────────────
function Auth({mode,onAuth,flip}:{mode:'login'|'register';onAuth:(t:string,u:number)=>void;flip:()=>void}) {
  const t = useT();
  const [lang, setLangState] = useLang();
  // 🔑 关键改动：开发模式下默认填好 admin 账号密码，无需手动输入
  const [u,setU]=useState(IS_DEV?DEV_ADMIN.username:'');
  const [pw,setPw]=useState(IS_DEV?DEV_ADMIN.password:'');
  const [nick,setNick]=useState(IS_DEV?DEV_ADMIN.nickname:'');
  const [err,setErr]=useState('');
  const [fieldErrors,setFieldErrors]=useState<{field:string;message:string}[]>([]);
  const [ld,setLd]=useState(false);

  const submit=async(username:string,password:string,nickname?:string)=>{
    setErr('');setFieldErrors([]);
    // 前端预校验：与后端 RegisterSchema 严格对齐，避免无谓的 422
    if(!username||!password){setErr(lang==='zh'?'请填写用户名和密码':'Please fill in username and password');return;}
    if(mode==='register'){
      if(username.length<3||username.length>50){setErr(lang==='zh'?'用户名长度应为 3 - 50':'Username must be 3-50 chars');return;}
      if(password.length<8||password.length>100){setErr(lang==='zh'?'密码长度应为 8 - 100':'Password must be 8-100 chars');return;}
    }
    setLd(true);
    try{
      const d=mode==='register'
        ? await api.register(username,password,nickname||undefined)
        : await api.login(username,password);
      onAuth(d.access_token,d.user_id);
    }catch(e:any){
      // 把后端富错误信息（field_errors）拆出来显示
      if(e.fieldErrors?.length){
        setFieldErrors(e.fieldErrors);
        setErr(e.message||(lang==='zh'?'请求参数不合法':'Invalid request'));
      } else {
        setErr(e.message||(lang==='zh'?'请求失败':'Request failed'));
      }
    }finally{setLd(false)}
  };
  const go=()=>submit(u,pw,nick);

  // 开发者一键登录：直接用 admin 账号尝试登录，没账号则注册
  const devLogin=async()=>{
    setErr('');setFieldErrors([]);setLd(true);
    try{
      let d;
      try{ d=await api.login(DEV_ADMIN.username,DEV_ADMIN.password); }
      catch{ d=await api.register(DEV_ADMIN.username,DEV_ADMIN.password,DEV_ADMIN.nickname); }
      localStorage.setItem('dev_mode','1');
      onAuth(d.access_token,d.user_id);
    }catch(e:any){
      setErr(t('auth.devLoginFailed')+(e.message||t('auth.backendDown')));
    }finally{setLd(false)}
  };

  const usernameErr=fieldErrors.find(f=>f.field.includes('username'));
  const passwordErr=fieldErrors.find(f=>f.field.includes('password'));
  const nicknameErr=fieldErrors.find(f=>f.field.includes('nickname'));

  return (
    <div className="auth">
      <button className="lang-btn" style={{position:'absolute',top:14,right:14}} onClick={()=>setLangState(lang==='zh'?'en':'zh')} title="Switch language / 切换语言">
        🌐 {t('lang.switch')}
      </button>
      <h2>{mode==='login'?t('auth.welcome'):t('auth.createAccount')} <span className="sparkle">✨</span></h2>
      <p>{mode==='login'?t('auth.signinTagline'):t('auth.signupTagline')}</p>

      {mode==='register'&&(
        <div className={`fg ${nicknameErr?'has-error':''}`}>
          <label>{t('auth.nickname')}</label>
          <input value={nick} onChange={e=>setNick(e.target.value)} placeholder={t('auth.nicknamePh')}/>
        </div>
      )}
      <div className={`fg ${usernameErr?'has-error':''}`}>
        <label>{t('auth.username')}</label>
        <input value={u} onChange={e=>setU(e.target.value)} placeholder={t('auth.usernamePh')}/>
      </div>
      <div className={`fg ${passwordErr?'has-error':''}`}>
        <label>{t('auth.password')}</label>
        <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder={t('auth.passwordPh')} onKeyDown={e=>e.key==='Enter'&&go()}/>
      </div>

      {err&&<p className="ferr">{err}</p>}
      {fieldErrors.length>0&&(
        <div className="field-errors">
          <strong>{t('auth.fieldErrors')}</strong>
          <ul>{fieldErrors.map((f,i)=>(<li key={i}><code>{f.field||'body'}</code>: {f.message}</li>))}</ul>
        </div>
      )}

      <button className="btn btn-p btn-w" style={{marginTop:6}} onClick={go} disabled={ld}>
        {ld?t('auth.pleaseWait'):mode==='login'?t('auth.signIn'):t('auth.createAccount')}
      </button>

      {IS_DEV&&(
        <button className="dev-quick" onClick={devLogin} disabled={ld}>
          {t('auth.devQuick')}
        </button>
      )}

      <p style={{marginTop:18,color:'var(--sub)',fontSize:'.85rem'}}>
        {mode==='login'?t('auth.noAccount'):t('auth.hasAccount')}
        <button style={{color:'var(--accent)',fontWeight:600}} onClick={flip}>{mode==='login'?t('auth.signUp'):t('auth.signInLink')}</button>
      </p>

      {IS_DEV&&(
        <p style={{marginTop:10,color:'var(--sub)',fontSize:'.72rem',opacity:.7}}>
          {t('auth.devHint')}
        </p>
      )}
    </div>
  );
}
