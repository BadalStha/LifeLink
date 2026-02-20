-- LifeLink Database Schema
-- Blood & Organ Donation Platform

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS donation_requests CASCADE;
DROP TABLE IF EXISTS organ_donations CASCADE;
DROP TABLE IF EXISTS blood_donations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'user', 'patient', 'admin', 'hospital'
    name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    blood_type VARCHAR(10), -- O+, O-, A+, A-, B+, B-, AB+, AB-
    age INT,
    medical_history TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BLOOD DONATIONS TABLE
CREATE TABLE blood_donations (
    id SERIAL PRIMARY KEY,
    donor_id INT NOT NULL,
    blood_type VARCHAR(10) NOT NULL,
    units INT NOT NULL, -- number of units donated
    donation_date DATE NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(donor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. ORGAN DONATIONS TABLE
CREATE TABLE organ_donations (
    id SERIAL PRIMARY KEY,
    donor_id INT NOT NULL,
    organ_type VARCHAR(50) NOT NULL, -- 'kidney', 'liver', 'heart', 'lung', 'cornea', 'pancreas', 'intestine'
    blood_type VARCHAR(10),
    donation_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'completed', 'cancelled'
    recipient_id INT, -- matched patient if completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(donor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. DONATION REQUESTS TABLE
CREATE TABLE donation_requests (
    id SERIAL PRIMARY KEY,
    requester_id INT NOT NULL,
    request_type VARCHAR(20) NOT NULL, -- 'blood' or 'organ'
    blood_type VARCHAR(10), -- for blood requests
    organ_type VARCHAR(50), -- for organ requests
    units_needed INT, -- for blood requests
    urgency VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    reason TEXT,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'fulfilled', 'cancelled'
    fulfillment_date DATE, -- when fulfilled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(requester_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. ALERTS TABLE
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    created_by INT, -- admin/hospital who created it
    alert_type VARCHAR(50) NOT NULL, -- 'blood_needed', 'organ_needed', 'donation_available', 'system_alert'
    message TEXT NOT NULL,
    urgency VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    target_audience VARCHAR(50), -- 'all_users', 'donors', 'patients', 'specific_blood_type', 'specific_organ'
    blood_type_target VARCHAR(10), -- if targeting specific blood type
    organ_type_target VARCHAR(50), -- if targeting specific organ
    is_read BOOLEAN DEFAULT false,
    related_request_id INT, -- link to request if applicable
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(related_request_id) REFERENCES donation_requests(id) ON DELETE SET NULL
);

-- 6. ANNOUNCEMENTS TABLE
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    created_by INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. MESSAGES TABLE
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL,
    recipient_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. HOSPITALS TABLE
CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    admin_id INT NOT NULL,
    location TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indices for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_blood_type ON users(blood_type);
CREATE INDEX idx_blood_donations_donor ON blood_donations(donor_id);
CREATE INDEX idx_blood_donations_status ON blood_donations(status);
CREATE INDEX idx_organ_donations_donor ON organ_donations(donor_id);
CREATE INDEX idx_organ_donations_recipient ON organ_donations(recipient_id);
CREATE INDEX idx_donation_requests_requester ON donation_requests(requester_id);
CREATE INDEX idx_donation_requests_status ON donation_requests(status);
CREATE INDEX idx_donation_requests_urgency ON donation_requests(urgency);
CREATE INDEX idx_alerts_created_by ON alerts(created_by);
CREATE INDEX idx_announcements_created_by ON announcements(created_by);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_hospitals_admin ON hospitals(admin_id);

-- Display confirmation
SELECT 'LifeLink Database Schema Created Successfully!' as status;
