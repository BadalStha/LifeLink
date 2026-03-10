# Quick Start Guide - LifeLink

## For Teacher/Reviewer

This guide will help you quickly set up and run the LifeLink project for evaluation.

### Prerequisites Check
```bash
# Check Node.js version (should be v18+)
node --version

# Check PostgreSQL (should be v13+)
psql --version

# Check npm
npm --version
```

### Quick Setup (5 minutes)

#### Step 1: Database Setup
```bash
# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
# or
brew services start postgresql   # macOS

# Create database
psql -U postgres
```

In PostgreSQL shell:
```sql
CREATE DATABASE lifelink_db;
\c lifelink_db
\i /path/to/LifeLink/backend/schema.sql
\q
```

#### Step 2: Backend Setup
```bash
cd backend

# Create .env file
cat > .env << EOL
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lifelink_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432
JWT_SECRET=lifelink_secret_key_2026
PORT=5000
EOL

# Install and start
npm install
npm start
```

Leave this terminal running. Backend should show:
```
Server started on http://localhost:5000
```

#### Step 3: Frontend Setup (New Terminal)
```bash
cd frontend

# Install and start
npm install
npm run dev
```

Frontend will open at: **http://localhost:5173**

### Test the Application

#### 1. Register a New User
- Go to http://localhost:5173
- Click "Become a Donor"
- Fill the registration form
- Use any email format: test@example.com
- Password must be 8+ characters

#### 2. Login
- After registration, login with your credentials
- JWT token will be stored automatically

#### 3. View Features
- **Profile**: See your profile with stats
- **Settings**: Update your profile information
- **Request Help**: Submit emergency blood/organ requests
- **Admin** (if you create admin user): View dashboard

#### 4. Test Admin Features (Optional)

Create admin account manually in database:
```bash
psql -U postgres -d lifelink_db
```

```sql
UPDATE users SET role='admin' WHERE email='your@email.com';
```

Then login and access `/admin` route.

### Quick API Tests

Test backend health (while backend is running):
```bash
# Test server
curl http://localhost:5000/

# Test stats endpoint
curl http://localhost:5000/api/dashboard/stats

# Test donors endpoint
curl http://localhost:5000/api/donors/locations?limit=5
```

### Common Issues & Solutions

**Issue**: Database connection error  
**Solution**: Check PostgreSQL is running and credentials in `.env` are correct

**Issue**: Port 5000 already in use  
**Solution**: Change PORT in backend/.env to 5001 and update frontend/.env

**Issue**: npm install fails  
**Solution**: Delete node_modules and package-lock.json, then reinstall

**Issue**: Frontend can't connect to backend  
**Solution**: Ensure backend is running on port 5000 and CORS is enabled

### Features to Demonstrate

1. **Authentication System**
   - Register new users
   - Secure login with JWT
   - Role-based access

2. **Donor Management**
   - Interactive map with real donor locations
   - Search and filter donors
   - Blood type matching

3. **Emergency Requests**
   - Submit urgent blood/organ needs
   - Urgency level classification
   - Location-based matching

4. **Admin Dashboard**
   - Real-time statistics
   - User management
   - Search functionality

5. **User Profile**
   - Donation history
   - User statistics
   - Profile updates

### Project Structure
```
LifeLink/
├── backend/
│   ├── index.js           # Main server
│   ├── schema.sql         # Database schema
│   ├── routes/            # API endpoints
│   │   ├── users.js
│   │   ├── requests.js
│   │   ├── dashboard.js
│   │   ├── alerts.js
│   │   └── donors.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── views/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API services
│   │   ├── context/       # React context
│   │   └── utils/         # Utilities
│   └── package.json
│
└── README.md
```

### Evaluation Checklist

- [x] Backend server starts successfully
- [x] Frontend builds without errors
- [x] User can register and login
- [x] Database stores user data correctly
- [x] Protected routes require authentication
- [x] Admin dashboard shows real statistics
- [x] Donor map displays marker locations
- [x] Forms have proper validation
- [x] Error handling works correctly
- [x] Responsive design on mobile/desktop

### Technical Highlights

- **Full-stack JavaScript** (Node.js + React)
- **PostgreSQL** relational database
- **JWT** authentication
- **RESTful API** design
- **Real-time data** updates
- **Interactive maps** with Leaflet
- **Responsive UI** with TailwindCSS
- **Role-based access** control

### Git Repository

Branch: **badal**  
All commits pushed to: `origin/badal`

To view commit history:
```bash
git log --oneline -10
```

### Support During Evaluation

If you encounter any issues during evaluation, check:
1. Both backend and frontend terminals are running
2. PostgreSQL service is active
3. Database has sample data (or create test users)
4. .env files are properly configured
5. Port 5000 and 5173 are available

---

**Project Ready for Evaluation ✓**  
**Estimated Setup Time: 5-10 minutes**  
**All Features Tested and Working**
