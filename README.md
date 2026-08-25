# Masjid Market — سوق المسجد

Full-stack rewards marketplace: React (Vite) + Express + MongoDB.

## Structure
- `backend/` — Express API + Mongoose models (Student, Product, Order)
- `frontend/` — React app with two areas: `/admin` (control panel) and `/store` (student site)
- `SPEC_EN.md` — full English spec (useful as a prompt for Codex/other coding agents)

## Run locally

### 1. MongoDB
Have a MongoDB instance running (local `mongod` or a free MongoDB Atlas cluster).

### 2. Backend
```
cd backend
cp .env.example .env      # then edit MONGO_URI / ADMIN_PASSWORD
npm install
npm run dev                # starts on http://localhost:5000
```

### 3. Frontend
```
cd frontend
npm install
npm run dev                # starts on http://localhost:5173
```

- Admin panel: http://localhost:5173/admin
- Student site: http://localhost:5173/store

## Notes / things you may want to extend
- Admin panel currently has no login gate wired into the UI — `POST /api/auth/admin-login`
  exists in the backend if you want to add a simple password screen in `AdminApp.jsx`.
- Image upload uses local disk storage (`backend/uploads`); swap for S3/Cloudinary for production.
- Points are deducted using a MongoDB transaction on order submission — requires MongoDB
  running as a replica set (Atlas free tier already is; local `mongod` needs
  `mongod --replSet rs0` + `rs.initiate()`, or simplify the code to skip the transaction).
