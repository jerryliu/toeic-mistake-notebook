# TOEIC 錯題記憶庫

Phase 1 MVP monorepo scaffold（Next.js PWA + NestJS + MySQL + Redis）。

## 快速開始

```bash
cp .env.example .env
docker compose up -d          # MySQL + Redis（會套用 sql/001_init.sql）
pnpm install
pnpm --filter @toeic/api start:dev   # http://localhost:3001  /docs
pnpm --filter @toeic/web dev         # http://localhost:3000
```

測試帳號：`test@toeic.local` / `test1234`

無 Docker 時可用 `SKIP_DB=1` 以記憶體 SQLite 啟動 API 做 smoke（非正式路徑）。
