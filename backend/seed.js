const bcrypt = require('bcryptjs');
const { initDb, run, query } = require('./db');

const seed = async () => {
  console.log('Starting database seeding...');
  
  try {
    console.log('Dropping old tables...');
    await run('DROP TABLE IF EXISTS Messages');
    await run('DROP TABLE IF EXISTS Notifications');
    await run('DROP TABLE IF EXISTS Favorites');
    await run('DROP TABLE IF EXISTS Reviews');
    await run('DROP TABLE IF EXISTS Payments');
    await run('DROP TABLE IF EXISTS Bookings');
    await run('DROP TABLE IF EXISTS Rooms');
    await run('DROP TABLE IF EXISTS Hostels');
    await run('DROP TABLE IF EXISTS Users');
  } catch (err) {
    console.log('Error dropping tables:', err.message);
  }

  await initDb();

  try {

    // Create Users
    console.log('Seeding users...');
    const adminPass = await bcrypt.hash('admin123', 10);
    const owner1Pass = await bcrypt.hash('owner123', 10);
    const owner2Pass = await bcrypt.hash('owner123', 10);
    const guestPass = await bcrypt.hash('guest123', 10);

    const admin = await run(
      'INSERT INTO Users (email, phone, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      ['admin@hostelhub.com', '9999999999', adminPass, 'System Admin', 'admin']
    );

    const owner1 = await run(
      'INSERT INTO Users (email, phone, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      ['owner1@hostelhub.com', '8888888888', owner1Pass, 'Rajesh Kumar', 'owner']
    );

    const owner2 = await run(
      'INSERT INTO Users (email, phone, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      ['owner2@hostelhub.com', '7777777777', owner2Pass, 'Priyanka Sharma', 'owner']
    );

    const guest = await run(
      'INSERT INTO Users (email, phone, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      ['guest@hostelhub.com', '6666666666', guestPass, 'Amit Patel', 'guest']
    );

    console.log('Seeding hostels...');
    // Seed Hostels
    const hostel1Photos = JSON.stringify([
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=800'
    ]);
    const hostel1Facilities = JSON.stringify(['WiFi', 'AC', 'Food', 'Laundry', 'Gym', 'CCTV', 'Power Backup']);
    const hostel1Rules = JSON.stringify(['Curfew at 10 PM', 'No smoking/drinking', 'No outside guests allowed overnight']);

    const hostel1 = await run(`
      INSERT INTO Hostels (owner_id, name, address, city, description, rules, gender_type, property_type, verified, latitude, longitude, photos, facilities, rating, reviews_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      owner1.id,
      'Starlight Co-Living',
      '12, Outer Ring Rd, HSR Layout Sector 3',
      'Bangalore',
      'Starlight Co-Living offers premium hostel living with modern facilities. Excellent environment for students and working professionals. Fully functional gym and nutritious daily meals included.',
      hostel1Rules,
      'co-living',
      'PG',
      1, // verified
      12.9103,
      77.6409,
      hostel1Photos,
      hostel1Facilities,
      4.5,
      2
    ]);

    const hostel2Photos = JSON.stringify([
      'https://images.unsplash.com/photo-1598908314732-07113901949e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800'
    ]);
    const hostel2Facilities = JSON.stringify(['WiFi', 'Food', 'Security', 'CCTV', 'Power Backup', 'Housekeeping']);
    const hostel2Rules = JSON.stringify(['Curfew at 9:30 PM', 'Strictly girls only', 'Prior permission for night-outs']);

    const hostel2 = await run(`
      INSERT INTO Hostels (owner_id, name, address, city, description, rules, gender_type, property_type, verified, latitude, longitude, photos, facilities, rating, reviews_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      owner2.id,
      'Sunrise Girls Hostel',
      '45, Viman Nagar Phase 2, near Symbiosis',
      'Pune',
      'A safe, homely, and secure stay for female students. Walking distance from university campuses. Healthy home-cooked meals, double/triple sharing rooms, and standard 3-tier security checking.',
      hostel2Rules,
      'girls',
      'Hostel',
      1, // verified
      18.5679,
      73.9143,
      hostel2Photos,
      hostel2Facilities,
      4.2,
      1
    ]);

    const hostel3Photos = JSON.stringify([
      'https://images.unsplash.com/photo-1560185893-a55cbc2c78a9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800'
    ]);
    const hostel3Facilities = JSON.stringify(['WiFi', 'AC', 'Food', 'Parking', 'CCTV', 'Lounge']);
    const hostel3Rules = JSON.stringify(['Curfew at 11:30 PM', 'No loud noise after 10 PM', 'Maintenance fees clear by 5th']);

    const hostel3 = await run(`
      INSERT INTO Hostels (owner_id, name, address, city, description, rules, gender_type, property_type, verified, latitude, longitude, photos, facilities, rating, reviews_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      owner1.id,
      'Elite Boys PG',
      'B-4, Katwaria Sarai, near IIT Delhi',
      'Delhi',
      'Elite Boys PG provides clean, well-furnished rooms with full ventilation. Located in a quiet student neighborhood with multiple food joints nearby. High-speed optical fiber WiFi and parking space.',
      hostel3Rules,
      'boys',
      'PG',
      1, // verified
      28.5398,
      77.1852,
      hostel3Photos,
      hostel3Facilities,
      4.0,
      1
    ]);

    // Unverified/Pending Hostel for admin dashboard testing
    const hostel4Photos = JSON.stringify([
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800'
    ]);
    const hostel4Facilities = JSON.stringify(['WiFi', 'Food', 'CCTV']);
    const hostel4Rules = JSON.stringify(['No curfew', 'Clean up after yourself']);
    const hostel4 = await run(`
      INSERT INTO Hostels (owner_id, name, address, city, description, rules, gender_type, property_type, verified, latitude, longitude, photos, facilities, rating, reviews_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      owner2.id,
      'Greenfield Hostel',
      '78, Linking Road, Santacruz West',
      'Mumbai',
      'A beautiful new co-living space waiting for approval. Equipped with top-tier design furniture, smart lock security, and super-fast internet.',
      hostel4Rules,
      'co-living',
      'Hostel',
      0, // pending approval
      19.0833,
      72.8368,
      hostel4Photos,
      hostel4Facilities,
      0.0,
      0
    ]);

    console.log('Seeding rooms...');
    // Seed Rooms for Hostel 1 (Starlight)
    const room1_1 = await run(`
      INSERT INTO Rooms (hostel_id, room_type, capacity, price_per_month, availability, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [hostel1.id, 'Single Sharing', 5, 12000, 3, JSON.stringify(['AC', 'Attached Washroom', 'Smart TV'])]);

    const room1_2 = await run(`
      INSERT INTO Rooms (hostel_id, room_type, capacity, price_per_month, availability, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [hostel1.id, 'Double Sharing', 10, 8500, 7, JSON.stringify(['AC', 'Balcony', 'Personal Wardrobes'])]);

    const room1_3 = await run(`
      INSERT INTO Rooms (hostel_id, room_type, capacity, price_per_month, availability, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [hostel1.id, 'Triple Sharing', 15, 6500, 12, JSON.stringify(['Attached Washroom', 'Study Table'])]);

    const room1_4 = await run(`
      INSERT INTO Rooms (hostel_id, room_type, capacity, price_per_month, availability, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [hostel1.id, 'Dormitory', 24, 4500, 18, JSON.stringify(['Personal Locker', 'Shared Washroom'])]);

    // Seed Rooms for Hostel 2 (Sunrise)
    const room2_1 = await run(`
      INSERT INTO Rooms (hostel_id, room_type, capacity, price_per_month, availability, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [hostel2.id, 'Double Sharing', 12, 9000, 5, JSON.stringify(['Balcony', 'Geyser', 'Study Table'])]);

    const room2_2 = await run(`
      INSERT INTO Rooms (hostel_id, room_type, capacity, price_per_month, availability, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [hostel2.id, 'Triple Sharing', 18, 7000, 14, JSON.stringify(['Geyser', 'Security Safe'])]);

    // Seed Rooms for Hostel 3 (Elite Boys PG)
    const room3_1 = await run(`
      INSERT INTO Rooms (hostel_id, room_type, capacity, price_per_month, availability, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [hostel3.id, 'Single Sharing', 8, 11000, 6, JSON.stringify(['AC', 'Fridge', 'Study Desk'])]);

    const room3_2 = await run(`
      INSERT INTO Rooms (hostel_id, room_type, capacity, price_per_month, availability, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [hostel3.id, 'Double Sharing', 20, 7500, 15, JSON.stringify(['Study Desk', 'Locker'])]);

    // Seed Rooms for Hostel 4 (Greenfield Hostel - Pending approval)
    const room4_1 = await run(`
      INSERT INTO Rooms (hostel_id, room_type, capacity, price_per_month, availability, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [hostel4.id, 'Double Sharing', 10, 14000, 10, JSON.stringify(['AC', 'Luxury Bedding', 'Keyless Lock'])]);

    console.log('Seeding reviews...');
    // Seed Reviews
    await run(`
      INSERT INTO Reviews (user_id, hostel_id, rating, comment, user_name)
      VALUES (?, ?, ?, ?, ?)
    `, [guest.id, hostel1.id, 5, 'Absolutely loved the place! The food is super clean and tastes homely. Highly recommended!', 'Amit Patel']);

    await run(`
      INSERT INTO Reviews (user_id, hostel_id, rating, comment, user_name)
      VALUES (?, ?, ?, ?, ?)
    `, [admin.id, hostel1.id, 4, 'Very clean and close to prime areas. Professional management and security checks.', 'System Admin']);

    await run(`
      INSERT INTO Reviews (user_id, hostel_id, rating, comment, user_name)
      VALUES (?, ?, ?, ?, ?)
    `, [guest.id, hostel2.id, 4, 'Sunrise provides a very safe space for working girls. Water supply is 24/7.', 'Amit Patel']);

    await run(`
      INSERT INTO Reviews (user_id, hostel_id, rating, comment, user_name)
      VALUES (?, ?, ?, ?, ?)
    `, [guest.id, hostel3.id, 4, 'Great location for IIT aspirants. High-speed net is amazing. A bit crowded during dinners.', 'Amit Patel']);

    console.log('Seeding bookings & payments...');
    // Seed Bookings
    // Booking 1: Past completed booking
    const booking1 = await run(`
      INSERT INTO Bookings (user_id, hostel_id, room_id, room_type, check_in_date, duration_months, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [guest.id, hostel1.id, room1_2.id, 'Double Sharing', '2026-04-01', 3, 25500, 'paid']);

    await run(`
      INSERT INTO Payments (booking_id, transaction_id, payment_method, amount, status)
      VALUES (?, ?, ?, ?, ?)
    `, [booking1.id, 'TXN9847192410', 'UPI', 25500, 'success']);

    // Booking 2: Active pending booking
    const booking2 = await run(`
      INSERT INTO Bookings (user_id, hostel_id, room_id, room_type, check_in_date, duration_months, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [guest.id, hostel1.id, room1_1.id, 'Single Sharing', '2026-07-01', 2, 24000, 'accepted']);

    // Seed Messages (Chats)
    console.log('Seeding chat messages...');
    await run(`
      INSERT INTO Messages (sender_id, receiver_id, hostel_id, message, created_at)
      VALUES (?, ?, ?, ?, datetime('now', '-3 hours'))
    `, [guest.id, owner1.id, hostel1.id, 'Hello, is there a single room available from next month?']);

    await run(`
      INSERT INTO Messages (sender_id, receiver_id, hostel_id, message, created_at)
      VALUES (?, ?, ?, ?, datetime('now', '-2 hours'))
    `, [owner1.id, guest.id, hostel1.id, 'Yes! We have Single Sharing rooms available. You can make a booking request directly from our hostel page.']);

    // Seed Favorites
    console.log('Seeding favorites...');
    await run(`
      INSERT INTO Favorites (user_id, hostel_id)
      VALUES (?, ?)
    `, [guest.id, hostel1.id]);

    await run(`
      INSERT INTO Favorites (user_id, hostel_id)
      VALUES (?, ?)
    `, [guest.id, hostel3.id]);

    // Seed Notifications
    console.log('Seeding notifications...');
    await run(`
      INSERT INTO Notifications (user_id, title, message, read, type)
      VALUES (?, ?, ?, ?, ?)
    `, [guest.id, 'Welcome to HostelHub!', 'Search, book and manage hostels with ease.', 0, 'info']);

    await run(`
      INSERT INTO Notifications (user_id, title, message, read, type)
      VALUES (?, ?, ?, ?, ?)
    `, [guest.id, 'Booking Accepted', 'Your booking request for Starlight Co-Living has been accepted. Please make the payment.', 0, 'booking']);

    console.log('Database seeded successfully.');
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
};

// If run directly, seed the db
if (require.main === module) {
  seed().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;
