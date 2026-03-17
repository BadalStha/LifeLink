# LifeLink

LifeLink is a full-stack blood and organ donation platform for connecting donors, patients, hospitals, and administrators.

## Overview

The project includes:
- User registration and JWT login
- Donation preferences (blood or organ)
- Emergency help requests with urgency levels
- Donor search and donor location map
- Alerts, announcements, and chat
- Admin authentication and admin dashboard tools

## Tech Stack

Backend:
- Node.js
- Express
- PostgreSQL (pg)
- JWT auth + bcrypt
- Nodemailer (password reset email)

Frontend:
- React
- React Router
- Vite
- Tailwind CSS
- React Leaflet

## Repository Structure

```text
LifeLink/
	backend/
		index.js
		db.js
		schema.sql
		routes/
		middleware/
		uploads/
	frontend/
		src/
		public/
	QUICKSTART.md
	README.md
```

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 13+

## Local Development Setup

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE lifelink_db;"
```

Optional clean schema import (drops existing LifeLink tables first):

```bash
psql -U postgres -d lifelink_db -f backend/schema.sql
```

Notes:
- If you skip schema import, the backend still auto-creates required core tables on startup.
- The schema file is useful for a clean, repeatable setup.

### 2. Configure backend environment

Create backend/.env:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lifelink_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432

JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRATION=24h
PORT=5000

# Optional SMTP settings (required for forgot-password email)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_SECURE=false
SMTP_FROM=
```

### 3. Start backend

```bash
cd backend
npm install
npm start
```

Backend runs at http://localhost:5000

### 4. Configure and start frontend

Create frontend/.env (optional):

```env
VITE_API_BASE_URL=http://localhost:5000
```

Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:5173

## Default Admin Account

On backend startup, an admin user is auto-created if missing.

- Email: lifelink.nepal@gmail.com
- Password: lifelink

Admin login page: http://localhost:5173/admin/login

## Main API Areas

Auth and profile:
- POST /api/register
- POST /api/login
- GET /api/profile
- PUT /api/profile
- POST /api/profile/avatar

Password reset:
- POST /api/forgot-password/request-code
- POST /api/forgot-password/verify-code
- POST /api/forgot-password/reset

Requests and donors:
- POST /api/requests
- GET /api/requests
- GET /api/requests/:id
- PUT /api/requests/:id
- DELETE /api/requests/:id
- GET /api/donors/locations

Admin:
- POST /api/admin/login
- GET /api/admin/overview
- GET /api/admin/users

## Useful Commands

Frontend production build:

```bash
cd frontend && npm run build
```

Frontend lint:

```bash
cd frontend && npm run lint
```

Backend syntax check:

```bash
cd backend && node --check index.js
```

## Notes

- This project is maintained as an academic second-year project.
- For a fast evaluator setup, see QUICKSTART.md.
