// src/services/api.ts
// 本地 dev：Vite 代理 /api → localhost:8000
// Vercel 生产：同域部署，默认 /api 即可；跨域时在 .env 设置 VITE_API_BASE
const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || '/api';

/* ─── Helper：把后端富错误信息拆出来 ─── */
class ApiError extends Error {
  fieldErrors?: { field: string; message: string }[];
  errorCode?: string;
  status?: number;
}
async function readError(r: Response): Promise<ApiError> {
  let d: any = {};
  try { d = await r.json(); } catch {}
  const msg = d.detail || d.message || (r.status === 0 ? '无法连接到后端 API' : `请求失败（HTTP ${r.status}）`);
  const e = new ApiError(msg);
  e.status = r.status;
  e.errorCode = d.error_code;
  // 把后端校验失败的字段错误转成 [{field, message}]
  if (d.details?.fields && Array.isArray(d.details.fields)) {
    e.fieldErrors = d.details.fields.map((x: any) => ({
      field: String(x.field || ''),
      message: String(x.message || x.type || ''),
    }));
  }
  // 401 / Token 过期：自动清掉本地凭据，下一次访问会自动重登（DEV 模式）或回到登录页
  if (r.status === 401 || d.error_code === 'AUTH_TOKEN_EXPIRED' || d.error_code === 'AUTH_ERROR') {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('uid');
    } catch {}
  }
  return e;
}

/* ─── Auth ─────────────────────────────────────────── */
export async function register(username: string, password: string, nickname?: string) {
  const r = await fetch(`${BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password, nickname }) });
  if (!r.ok) throw await readError(r);
  return r.json();
}
export async function login(username: string, password: string) {
  const r = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  if (!r.ok) throw await readError(r);
  return r.json();
}
export function getToken() { return localStorage.getItem('token'); }
export function setAuth(token: string, uid: number) { localStorage.setItem('token', token); localStorage.setItem('uid', String(uid)); }
export function clearAuth() { localStorage.removeItem('token'); localStorage.removeItem('uid'); }
export function isLoggedIn() { return !!getToken(); }
function hdr(): Record<string, string> { const t = getToken(); return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }; }

/* ─── Products ─────────────────────────────────────── */
export interface Product {
  id: number; name: string; brand: string | null; category: string | null;
  price: number | null; image_url: string | null; tags: string[] | null;
  skin_types: string[] | null; skin_tones: string[] | null; face_shapes: string[] | null;
  route_path: string | null; created_at: string;
  subcategory?: string | null; description?: string | null; ingredients?: string | null;
  usage_tips?: string | null; images?: string[] | null; meta_data?: any;
}
export async function fetchProducts(category?: string): Promise<Product[]> {
  const p = new URLSearchParams(); if (category) p.set('category', category); p.set('limit', '200');
  const r = await fetch(`${BASE}/products?${p}`, { headers: hdr() });
  if (!r.ok) throw await readError(r);
  return r.json();
}
export async function fetchProduct(id: number): Promise<Product> {
  const r = await fetch(`${BASE}/products/${id}`, { headers: hdr() });
  if (!r.ok) throw await readError(r);
  return r.json();
}

/* ─── Conversations ────────────────────────────────── */
export async function saveMsg(sessionId: string, role: string, content: string, meta?: any) {
  const r = await fetch(`${BASE}/conversations`, { method: 'POST', headers: hdr(), body: JSON.stringify({ session_id: sessionId, role, content, meta_data: meta }) });
  if (!r.ok) throw await readError(r);
  return r.json();
}
export async function getHistory(sessionId: string) {
  const r = await fetch(`${BASE}/conversations?session_id=${encodeURIComponent(sessionId)}`, { headers: hdr() });
  if (!r.ok) return []; return r.json();
}

/* ─── Makeup AI ────────────────────────────────────── */
export interface MakeupStyle {
  id: string; name: string; name_en: string; description: string;
}
export async function fetchMakeupStyles(): Promise<MakeupStyle[]> {
  const r = await fetch(`${BASE}/makeup/styles`);
  if (!r.ok) throw await readError(r);
  return r.json();
}
export async function tryOnMakeup(
  img: string,
  opts: { style?: string; prompt?: string; strength?: number } = {},
): Promise<string> {
  const r = await fetch(`${BASE}/makeup/try-on`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ original_image: img, ...opts }),
  });
  if (!r.ok) throw await readError(r);
  return URL.createObjectURL(await r.blob());
}

/* ─── AI Agent (美妆顾问) ──────────────────────────── */
export interface AgentChatResponse {
  reply: string;
  products: { id: number; name: string; reason: string }[];
}
export async function agentChat(
  query: string,
  sessionId: string,
  history: { role: string; content: string }[] = [],
): Promise<AgentChatResponse> {
  const r = await fetch(`${BASE}/agent/chat`, {
    method: 'POST',
    headers: hdr(),
    body: JSON.stringify({ query, session_id: sessionId, history }),
  });
  if (!r.ok) throw await readError(r);
  return r.json();
}

/* ─── Image Edit ───────────────────────────────────── */
export async function editImage(img: string, prompt: string, strength = 0.55): Promise<string> {
  const r = await fetch(`${BASE}/image-edit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ original_image: img, edit_prompt: prompt, strength }) });
  if (!r.ok) throw await readError(r);
  return URL.createObjectURL(await r.blob());
}
