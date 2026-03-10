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

#### 4. Test Admin Features

**Step 1: Register a test account**
- Register with email: admin@test.com
- Remember your password

**Step 2: Get your user ID**

Option A - Using PostgreSQL:
```bash
psql -U postgres -d lifelink_db
```

```sql
SELECT id, email, role FROM users WHERE email = 'admin@test.com';
-- Note the ID (e.g., 3)
```

Option B - Using the API Demo Endpoint:
```bash
# After login, you'll see your user ID in the console or response

# Make yourself admin using the demo endpoint:
curl -X POST http://localhost:5000/api/demo/make-admin/3
# Replace 3 with your actual user ID
```

**Step 3: Access Admin Dashboard**
1. Login with admin@test.com on http://localhost:5173/login
2. Navigate to http://localhost:5173/admin
3. You should see the Admin Dashboard with:
   - 📊 Live statistics (total users, donors, active requests)
   - 👥 User management table
   - 🔍 Real-time search
   - 📈 Blood type distribution

**Step 4: Test Admin Features**
- Search users by name or email
- View all registered users
- See live platform statistics
- Click Refresh button to see real-time updates

### Quick API Tests

Test backend health (while backend is running):
```bash
# Test server
curl http://localhost:5000/

# Test stats endpoint
curl http://localhost:5000/api/dashboard/stats

# Test donors endpoint
curl http://localhost:5000/api/donors/locations?limit=5

# Test make-admin endpoint (replace 1 with actual user ID)
curl -X POST http://localhost:5000/api/demo/make-admin/1
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

1. **Authentication System** ✓
   - Secure user registration with validation
   - JWT-based login system
   - Role-based access control (user, patient, admin, hospital)
   - Automatic session management
   - Logout functionality

2. **Donor Management** ✓
   - Interactive Leaflet map with 15+ Nepal city coordinates
   - Real donor locations from database
   - Search and filter donors by blood type
   - Blood type matching system

3. **Emergency Requests** ✓
   - Submit urgent blood/organ needs
   - Urgency level classification (low/medium/high/critical)
   - Location-based request matching
   - Request history tracking
   - Automatic notification system

4. **Admin Dashboard** ✓ (NEW)
   - 📊 Real-time platform statistics (users, donors, requests)
   - 👥 User management table with full details
   - 🔍 Search and filter users
   - 📈 Blood type distribution analytics
   - 🔄 Refresh button for live updates
   - ⚙️ Role-based permissions

5. **User Profile** ✓
   - Real donation history from database
   - Live user statistics (lives saved, member status)
   - Complete profile editing with backend sync
   - Settings page with account preferences
   - Password management

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
