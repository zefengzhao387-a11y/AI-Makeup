# Lumina Beauty AI · 美妆 AI 商城

## 本地开发

### 1. 准备环境

- Python ≥ 3.10（推荐 3.11 / 3.12）
- Node.js ≥ 18

### 2. 配置

```bash
cp .env.example .env
# 编辑 .env，填入 STABILITY_API_KEY（化妆 AI 必需）
```

### 3. 启动后端（终端 1）

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000
```

### 4. 启动前端（终端 2）

```bash
npm install
npm run dev -- --port 3000
```

浏览器打开 http://localhost:3000

API 文档：http://localhost:8000/docs

---

## 线上部署（Vercel）

项目已配置 **前后端同域部署**：静态页面 + Python Serverless API 共用一个域名，`/api/*` 自动路由到后端。

### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "deploy: makeup AI API"
git push origin main
```

### 2. 导入 Vercel

1. 打开 [vercel.com/new](https://vercel.com/new)，导入 `new_ai_mall` 仓库
2. 框架选 **Vite**，构建命令 `npm run build`，输出目录 `dist`（已在 `vercel.json` 配置）

### 3. 配置环境变量（Vercel → Settings → Environment Variables）

| 变量 | 说明 | 必填 |
|------|------|------|
| `STABILITY_API_KEY` | Stability AI 密钥，化妆试妆必需 | ✅ |
| `SECRET_KEY` | JWT 签名密钥，生产请用随机长字符串 | ✅ |
| `APP_ENV` | 设为 `production` | 推荐 |
| `CORS_ORIGINS` | 默认 `*`；小程序需填你的 Web 域名 | 可选 |
| `DATABASE_URL` | 商品/登录需数据库；化妆 AI 本身不依赖 DB | 可选* |

\* Vercel 无持久磁盘，**SQLite 不能用于生产**。若需登录/商品功能，请使用 Postgres，例如：

```
DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname
```

并在 `requirements.txt` 取消注释 `asyncpg`。

### 4. 部署完成后

- 网站：`https://你的项目.vercel.app`
- 化妆 AI 接口：
  - `GET  https://你的项目.vercel.app/api/makeup/styles`
  - `POST https://你的项目.vercel.app/api/makeup/try-on`
- API 文档：`https://你的项目.vercel.app/docs`

### 5. 小程序配置

编辑 `miniprogram/config.js`，把 `apiBase` 改成你的线上地址：

```js
module.exports = {
  apiBase: 'https://你的项目.vercel.app/api',
};
```

并在微信公众平台 → 开发管理 → 开发设置 → **服务器域名** 中添加该域名（request 合法域名）。

---

## 化妆 AI 接口速查

```bash
# 获取预设风格
curl https://你的项目.vercel.app/api/makeup/styles

# 试妆（需 STABILITY_API_KEY）
curl -X POST https://你的项目.vercel.app/api/makeup/try-on \
  -H "Content-Type: application/json" \
  -d '{"original_image":"https://example.com/face.jpg","style":"natural"}' \
  --output result.png
```
