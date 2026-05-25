# Lumina Beauty AI · 美妆 AI 商城

### 1. 准备环境

- Python ≥ 3.10（推荐 3.11 / 3.12）
- Node.js ≥ 18

### 2. 配置

```bash
cp .env.example .env
```

### 3. 启动后端（终端 1）

````bash
python3 -m venv .venv
source .venv/bin/activate         # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.index:app --reload --port 8000

### 4. 启动前端（终端 2）
```bash
npm install
npm run dev
````

浏览器打开 http://localhost:5173
