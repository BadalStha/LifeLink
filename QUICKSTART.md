# LifeLink Quickstart

This guide is for fast local setup and demonstration.

Estimated time: 5 to 10 minutes.

## 1. Prerequisites

```bash
node --version
npm --version
psql --version
```

Recommended:
- Node.js 18+
- PostgreSQL 13+

## 2. Database Setup

Start PostgreSQL if needed, then create the database:

```bash
psql -U postgres -c "CREATE DATABASE lifelink_db;"
```

Optional clean schema import (drops existing LifeLink tables first):

```bash
psql -U postgres -d lifelink_db -f backend/schema.sql
```

## 3. Backend Setup

From project root:

```bash
cd backend
cat > .env << 'EOF'
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lifelink_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRATION=24h
PORT=5000
EOF

npm install
npm start
```

Expected output includes:

```text
Server started on http://localhost:5000
```

Keep this terminal running.

## 4. Frontend Setup (new terminal)

```bash
cd frontend
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:5000
EOF

npm install
npm run dev
```

Open: http://localhost:5173

## 5. Quick Smoke Test

1. Open home page and register a new account.
2. Login with the new account.
3. Open profile/settings and save an update.
4. Create a help request from Request Help page.
5. Open Find Donors page and verify results/map render.

## 6. Admin Demo

Admin login page:
- http://localhost:5173/admin/login

Default admin credentials (auto-created on backend startup):
- Email: lifelink.nepal@gmail.com
- Password: lifelink

After login, verify:
- Overview stats load
- Users table loads
- Search/filter works

## 7. API Checks

With backend running:

```bash
curl http://localhost:5000/
curl http://localhost:5000/api/dashboard/stats
curl "http://localhost:5000/api/donors/locations?limit=5"
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lifelink.nepal@gmail.com","password":"lifelink"}'
```

## 8. Troubleshooting

Database connection failed:
- Check backend/.env DB credentials and PostgreSQL status.

Port conflict on 5000:
- Change PORT in backend/.env and VITE_API_BASE_URL in frontend/.env.

Frontend cannot reach backend:
- Confirm backend is running and URL in frontend/.env is correct.

Forgot-password email not sending:
- Configure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in backend/.env.
