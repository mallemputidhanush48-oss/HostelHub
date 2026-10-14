const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// On Render, set DB_PATH=/var/data/hostelhub.db and attach a persistent disk
// mounted at /var/data. Locally this defaults to the bundled project database.
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, 'hostelhub.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Convert sqlite3 callbacks to promises
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Initialize database schema
const initDb = async () => {
  try {
    // Users table
    await run(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password TEXT,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'guest', -- 'guest', 'owner', 'admin'
        google_id TEXT,
        profile_pic TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Hostels table
    await run(`
      CREATE TABLE IF NOT EXISTS Hostels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        description TEXT,
        rules TEXT, -- JSON string or comma-separated list
        gender_type TEXT NOT NULL, -- 'boys', 'girls', 'co-living'
        property_type TEXT DEFAULT 'Hostel', -- 'Hostel', 'PG'
        verified INTEGER DEFAULT 0, -- 0 = pending, 1 = approved, -1 = rejected/blocked
        latitude REAL,
        longitude REAL,
        photos TEXT, -- JSON array of image URLs
        facilities TEXT, -- JSON array of amenities (e.g. WiFi, AC, Food)
        rating REAL DEFAULT 0,
        reviews_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);

    // Rooms table
    await run(`
      CREATE TABLE IF NOT EXISTS Rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostel_id INTEGER NOT NULL,
        room_type TEXT NOT NULL, -- 'Single Sharing', 'Double Sharing', 'Triple Sharing', 'Dormitory'
        capacity INTEGER NOT NULL, -- total number of beds
        price_per_month REAL NOT NULL,
        availability INTEGER NOT NULL, -- current available beds
        amenities TEXT, -- JSON array of room amenities
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hostel_id) REFERENCES Hostels(id) ON DELETE CASCADE
      )
    `);

    // Bookings table
    await run(`
      CREATE TABLE IF NOT EXISTS Bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        hostel_id INTEGER NOT NULL,
        room_id INTEGER NOT NULL,
        room_type TEXT NOT NULL,
        check_in_date TEXT NOT NULL,
        duration_months INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'paid', 'cancelled'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (hostel_id) REFERENCES Hostels(id) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES Rooms(id) ON DELETE CASCADE
      )
    `);

    // Payments table
    await run(`
      CREATE TABLE IF NOT EXISTS Payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        transaction_id TEXT NOT NULL,
        payment_method TEXT NOT NULL, -- 'UPI', 'PhonePe', 'Card', 'GPay'
        amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES Bookings(id) ON DELETE CASCADE
      )
    `);

    // Reviews table
    await run(`
      CREATE TABLE IF NOT EXISTS Reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        hostel_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        user_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (hostel_id) REFERENCES Hostels(id) ON DELETE CASCADE
      )
    `);

    // Favorites table
    await run(`
      CREATE TABLE IF NOT EXISTS Favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        hostel_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, hostel_id),
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (hostel_id) REFERENCES Hostels(id) ON DELETE CASCADE
      )
    `);

    // Notifications table
    await run(`
      CREATE TABLE IF NOT EXISTS Notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0, -- 0 = unread, 1 = read
        type TEXT DEFAULT 'info', -- 'booking', 'payment', 'chat', 'info'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);

    // Messages table (Chat)
    await run(`
      CREATE TABLE IF NOT EXISTS Messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        hostel_id INTEGER,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (hostel_id) REFERENCES Hostels(id) ON DELETE SET NULL
      )
    `);

    console.log('Database tables initialized successfully.');
  } catch (err) {
    console.error('Error initializing database tables:', err.message);
  }
};

module.exports = {
  db,
  query,
  get,
  run,
  initDb
};
