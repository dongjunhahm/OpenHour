-- Users table to store user information
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_token VARCHAR(2048) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendars table for shared calendars
CREATE TABLE IF NOT EXISTS calendars (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id INTEGER REFERENCES users(id),
  min_slot_duration INTEGER DEFAULT 30, -- Duration in minutes
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  invite_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar participants table for users who are participating in a calendar
CREATE TABLE IF NOT EXISTS calendar_participants (
  id SERIAL PRIMARY KEY,
  calendar_id INTEGER REFERENCES calendars(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_owner BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(calendar_id, user_id)
);

-- Events table for storing user events
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  calendar_id INTEGER REFERENCES calendars(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_google_token ON users(google_token);
CREATE INDEX IF NOT EXISTS idx_calendar_participants_user_id ON calendar_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_participants_calendar_id ON calendar_participants(calendar_id);
