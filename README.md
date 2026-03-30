# Quang Birthday App (React + Vite + Express + MongoDB)

Trang sinh nhat co firework + album media.

## 1) Tao bien moi truong

Copy file `.env.example` thanh `.env` va sua lai gia tri neu can:

- `MONGODB_URI` URL ket noi MongoDB
- `PORT` cong backend API (mac dinh 5000)
- `CLIENT_ORIGIN` origin frontend khi dev (mac dinh http://localhost:5173)
- `MAX_FILE_SIZE` gioi han dung luong 1 file (bytes)
- `VITE_API_BASE_URL` base URL backend cho frontend

## 2) Chay project

Chay ca frontend + backend:

```bash
npm run dev:all
```

Hoac chay rieng:

```bash
npm run server
npm run dev
```

## 3) API media

- `GET /api/health`
- `GET /api/media`
- `POST /api/media` (form-data key: `files`, cho phep nhieu file)
- `GET /api/file?id=<mediaId>` (tra file binary luu trong Mongo)

Endpoint cu van giu de tuong thich nguoc:

- `POST /api/media/upload`
- `GET /api/media/file/:id`

Che do luu file:

- Local runtime (`npm run server`): file luu vao thu muc `uploads/` cua du an, metadata luu MongoDB.
- Vercel runtime: file luu binary vao MongoDB (khong luu duoc ben trong thu muc project tren Vercel).

## 4) Build frontend

```bash
npm run build
```

## 5) Deploy Vercel

Project da co `api/[...route].js` de Vercel tu dong tao Serverless Function cho backend API.

Can khai bao Environment Variables tren Vercel:

- `MONGODB_URI` = chuoi ket noi MongoDB
- `MAX_FILE_SIZE` = gioi han upload (nen <= 4194304 tren Vercel)
- `CLIENT_ORIGIN` = domain frontend cua ban (co the de rong de allow all)

Cho frontend, khong can set `VITE_API_BASE_URL` tren Vercel (de mac dinh rong) de frontend goi cung domain `/api/...`.

Luu y quan trong: Vercel co gioi han body upload cho serverless request, vi vay video lon se khong upload duoc bang cach nay.
# quangvaigay
