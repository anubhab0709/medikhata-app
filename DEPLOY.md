# MediKhata deployment

## Architecture
- **Frontend:** Vite + React → Vercel (or any static host)
- **Backend:** Express + MongoDB → Render (or Railway/Fly)
- **Email:** Resend (`RESEND_API_KEY`)

## Backend (Render)
1. Create a Web Service from `BackEnd/`
2. Start command: `npm start`
3. Set env vars from `BackEnd/.env.example` (never commit real secrets)
4. Required production vars:
   - `NODE_ENV=production`
   - `MONGODB_URI`
   - `JWT_SECRET` (≥ 32 chars; prefer `openssl rand -hex 64`)
   - `CORS_ORIGIN=https://your-frontend.vercel.app`
   - `APP_URL=https://your-frontend.vercel.app`
   - `RESEND_API_KEY`, `RESEND_FROM`
5. Split FE/BE domains: set `COOKIE_SAMESITE=none` (HTTPS required). Same site/proxy: `strict` or `lax`.
6. Health check: `GET /api/health`

## Frontend (Vercel)
1. Root directory: `FrontEnd`
2. Build: `npm run build` · Output: `dist`
3. Env: `VITE_API_URL=https://your-api.onrender.com/api`
4. SPA rewrites are in `FrontEnd/vercel.json`

## Pre-flight checklist
- [ ] Rotate any key that ever lived in `.env.example` or chat logs
- [ ] Production CORS lists only real frontend origins (no tunnels)
- [ ] Resend domain verified (or test with `onboarding@resend.dev` to your own inbox)
- [ ] `npm run build` succeeds in `FrontEnd`
- [ ] Backend starts with production env and email configured
- [ ] Cookie auth works cross-origin (`credentials` + `COOKIE_SAMESITE`)
- [ ] Login, signup OTP, forgot password, CRUD customers/transactions smoke-tested
