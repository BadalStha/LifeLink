import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

console.log('Connecting to database:', process.env.DB_NAME);
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const sql = `
-- 9. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    hospital_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    blood_type VARCHAR(10),
    target_units INT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(hospital_id) REFERENCES users(id) ON DELETE CASCADE
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='alerts' AND column_name='related_campaign_id') THEN
        ALTER TABLE alerts ADD COLUMN related_campaign_id INT REFERENCES campaigns(id) ON DELETE SET NULL;
    END IF;
END $$;
`;

async function updateDb() {
  try {
    console.log('Running SQL query...');
    await pool.query(sql);
    console.log('Database updated successfully');
  } catch (err) {
    console.error('Error updating database:', err);
  } finally {
    console.log('Closing pool...');
    await pool.end();
    console.log('Done.');
  }
}

updateDb();
