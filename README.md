# LifeLink - Blood & Organ Donation Platform

**A full-stack web application connecting blood and organ donors with people in urgent medical need across Nepal.**

## 🚀 Project Overview

LifeLink is a comprehensive donation management system built to:
- Connect verified donors with patients in emergency situations
- Provide real-time donor matching based on location and blood type
- Enable rapid response for critical medical needs
- Support both blood and organ donation coordination
- Offer admin dashboard for monitoring and management

## �� Tech Stack

### Backend
- **Node.js** with **Express 5.2.1**
- **PostgreSQL** database with **pg 8.18.0**
- **JWT** authentication with **bcrypt 6.0.0** password hashing
- **dotenv** for environment configuration
- **nodemon** for development

### Frontend
- **React 19.2.0** with **React Router 7.13.0**
- **Vite 8.0.0-beta.13** as build tool
- **TailwindCSS 4.1.18** for styling
- **Lucide React** icons
- **Leaflet** for interactive donor maps

## 📋 Features

### User Features
- ✅ User registration with role-based access (donor, patient, admin, hospital)
- ✅ Secure login with JWT tokens
- ✅ Complete user profiles with medical information
- ✅ Blood type and location-based donor search
- ✅ Emergency request submission with urgency levels
- ✅ Interactive map showing nearby donors
- ✅ Donation history tracking
- ✅ Multi-language support (English/Nepali)

### Admin Features
- ✅ Dashboard with real-time statistics
- ✅ User management and search
- ✅ Request monitoring and status updates
- ✅ Alert creation and broadcasting
- ✅ Blood type distribution analytics

## 🏗️ Database Schema

The system uses 8 main tables:
- **users** - User accounts with authentication
- **blood_donations** - Blood donation records
- **organ_donations** - Organ donation records  
- **donation_requests** - Emergency requests
- **alerts** - System notifications
- **announcements** - Admin announcements
- **messages** - User communication
- **hospitals** - Medical facility records

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with:
```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lifelink_db
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key_change_this
PORT=5000
```

4. Initialize database:
```bash
psql -U postgres
CREATE DATABASE lifelink_db;
\c lifelink_db
\i schema.sql
\q
```

5. Start backend server:
```bash
npm start
```

Backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```env
VITE_API_BASE_URL=http://localhost:5000
```

4. Start development server:
```bash
npm run dev
```

Frontend will run on http://localhost:5173

## 📡 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile (protected)
- `PUT /api/profile` - Update profile (protected)

### Requests
- `POST /api/requests` - Create donation request (protected)
- `GET /api/requests` - Get all requests with filters
- `GET /api/requests/:id` - Get specific request
- `PUT /api/requests/:id` - Update request (protected)
- `DELETE /api/requests/:id` - Delete request (protected)
- `GET /api/user/my-requests` - Get user's requests (protected)

### Dashboard
- `GET /api/dashboard/stats` - Get platform statistics
- `GET /api/dashboard/users` - Get users with search/pagination

### Donors
- `GET /api/donors/locations` - Get donors with coordinates

### Alerts
- `POST /api/alerts` - Create alert (admin only)
- `GET /api/alerts` - Get all alerts
- `DELETE /api/alerts/:id` - Delete alert (admin only)

### User Stats
- `GET /api/user/stats` - Get user donation statistics (protected)
- `GET /api/user/donation-history` - Get donation history (protected)

## 🔐 Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token authentication (24h expiration)
- Role-based access control
- Input validation and sanitization
- Protected routes with authentication middleware
- Email normalization

## 🧪 Testing

Run frontend build:
```bash
cd frontend && npm run build
```

Check backend syntax:
```bash
cd backend && node --check index.js
```

Test API endpoints:
```bash
curl http://localhost:5000/api/dashboard/stats
```

## 📦 Production Build

Frontend:
```bash
cd frontend
npm run build
# Build files will be in dist/
```

Backend:
```bash
cd backend
# Set NODE_ENV=production in .env
npm start
```

## 🌍 Nepal-Specific Features

- Province and district selection based on Nepal's administrative divisions
- Blood group matching for Nepal's population
- Nepali language support
- Major Nepal city coordinates for donor mapping
- 24/7 emergency coordination system

## 👥 User Roles

1. **User/Donor** - Register as donor, view requests, update profile
2. **Patient** - Submit requests, search donors, track status
3. **Admin** - Manage users, view analytics, create alerts
4. **Hospital** - Coordinate donations, manage hospital-specific requests

## 📱 Pages

- `/` - Homepage with statistics and information
- `/login` - User authentication
- `/register` - New user registration
- `/profile` - User profile and donation history
- `/settings` - Account settings
- `/request-help` - Emergency request form
- `/admin` - Admin dashboard
- `/privacy` - Privacy policy

## 🎨 Design Features

- Modern, clean UI with TailwindCSS
- Responsive design for mobile and desktop
- Loading states and error handling
- Interactive donor map with Leaflet
- Real-time data updates
- Bilingual interface (English/Nepali)

## 📊 Project Statistics

- **Files**: 100+
- **Lines of Code**: 5000+
- **Database Tables**: 8
- **API Endpoints**: 20+
- **React Components**: 15+

## 👨‍💻 Developer

**Badal Shrestha**  
Second Year Project  
March 2026

## 📄 License

This project is developed as educational software for academic purposes.

## 🆘 Support

For issues or questions:
- Email: privacy@lifelink.org
- GitHub: Check repository issues

---

**Made with ❤️ for saving lives across Nepal**
