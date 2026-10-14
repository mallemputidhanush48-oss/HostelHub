const express = require('express');
const router = express.Router();
const { run, query, get } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Get all verified hostels with search filters
router.get('/', async (req, res) => {
  const { city, gender, property_type, minPrice, maxPrice, ac, wifi, food, gym, verified, owner_id } = req.query;

  try {
    let sql = 'SELECT h.* FROM Hostels h';
    let params = [];
    let joins = [];
    let conditions = [];

    // Filter by owner or verification status
    if (owner_id) {
      conditions.push('h.owner_id = ?');
      params.push(owner_id);
    } else {
      // By default, guests/public only see verified listings
      const showVerified = verified !== undefined ? parseInt(verified) : 1;
      conditions.push('h.verified = ?');
      params.push(showVerified);
    }

    if (city) {
      conditions.push('(h.city LIKE ? OR h.address LIKE ?)');
      params.push(`%${city}%`, `%${city}%`);
    }

    if (gender && gender !== 'all') {
      conditions.push('h.gender_type = ?');
      params.push(gender);
    }

    if (property_type && property_type !== 'all') {
      conditions.push('h.property_type = ?');
      params.push(property_type);
    }

    // Join rooms if filtering by price or AC
    if (minPrice || maxPrice || ac === 'true') {
      joins.push('JOIN Rooms r ON h.id = r.hostel_id');
      
      if (minPrice) {
        conditions.push('r.price_per_month >= ?');
        params.push(parseFloat(minPrice));
      }
      if (maxPrice) {
        conditions.push('r.price_per_month <= ?');
        params.push(parseFloat(maxPrice));
      }
      if (ac === 'true') {
        conditions.push('r.amenities LIKE ?');
        params.push('%AC%');
      }
    }

    let joinStr = joins.length ? joins.join(' ') : '';
    let conditionStr = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // Group by hostel id to avoid duplicates due to room joins
    let finalSql = `${sql} ${joinStr} ${conditionStr} GROUP BY h.id ORDER BY h.rating DESC`;
    
    let hostels = await query(finalSql, params);

    // Apply client-side filters for JSON array fields (facilities)
    if (wifi === 'true' || food === 'true' || gym === 'true') {
      hostels = hostels.filter(h => {
        let facs = [];
        try {
          facs = JSON.parse(h.facilities || '[]');
        } catch (e) {}

        if (wifi === 'true' && !facs.includes('WiFi')) return false;
        if (food === 'true' && !facs.includes('Food')) return false;
        if (gym === 'true' && !facs.includes('Gym')) return false;
        return true;
      });
    }

    // Format fields (parse JSON)
    hostels = hostels.map(h => {
      try { h.photos = JSON.parse(h.photos || '[]'); } catch (e) { h.photos = []; }
      try { h.facilities = JSON.parse(h.facilities || '[]'); } catch (e) { h.facilities = []; }
      try { h.rules = JSON.parse(h.rules || '[]'); } catch (e) { h.rules = []; }
      return h;
    });

    res.json(hostels);
  } catch (err) {
    console.error('Fetch hostels error:', err);
    res.status(500).json({ message: 'Server error fetching hostels.' });
  }
});

// Get hostel by id, including rooms and reviews
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const hostel = await get('SELECT * FROM Hostels WHERE id = ?', [id]);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found.' });
    }

    // Parse JSON lists
    try { hostel.photos = JSON.parse(hostel.photos || '[]'); } catch (e) { hostel.photos = []; }
    try { hostel.facilities = JSON.parse(hostel.facilities || '[]'); } catch (e) { hostel.facilities = []; }
    try { hostel.rules = JSON.parse(hostel.rules || '[]'); } catch (e) { hostel.rules = []; }

    // Fetch rooms
    const rooms = await query('SELECT * FROM Rooms WHERE hostel_id = ?', [id]);
    hostel.rooms = rooms.map(r => {
      try { r.amenities = JSON.parse(r.amenities || '[]'); } catch (e) { r.amenities = []; }
      return r;
    });

    // Fetch reviews
    const reviews = await query('SELECT * FROM Reviews WHERE hostel_id = ? ORDER BY created_at DESC', [id]);
    hostel.reviews = reviews;

    // Fetch owner details
    const owner = await get('SELECT id, full_name, phone, email, profile_pic FROM Users WHERE id = ?', [hostel.owner_id]);
    hostel.owner = owner;

    res.json(hostel);
  } catch (err) {
    console.error('Fetch hostel detail error:', err);
    res.status(500).json({ message: 'Server error fetching hostel details.' });
  }
});

// Add a new hostel (Owner only)
router.post('/', authenticateToken, authorizeRoles('owner', 'admin'), async (req, res) => {
  const { name, address, city, description, rules, gender_type, property_type, latitude, longitude, photos, facilities } = req.body;

  if (!name || !address || !city || !gender_type) {
    return res.status(400).json({ message: 'Hostel name, address, city, and gender type are required.' });
  }

  try {
    const photosStr = JSON.stringify(photos || []);
    const facilitiesStr = JSON.stringify(facilities || []);
    const rulesStr = JSON.stringify(rules || []);

    const result = await run(`
      INSERT INTO Hostels (owner_id, name, address, city, description, rules, gender_type, property_type, verified, latitude, longitude, photos, facilities, rating, reviews_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id,
      name,
      address,
      city,
      description || '',
      rulesStr,
      gender_type,
      property_type || 'Hostel',
      0, // Starts as pending/unverified
      latitude || null,
      longitude || null,
      photosStr,
      facilitiesStr,
      0.0,
      0
    ]);

    res.status(201).json({
      message: 'Hostel listing submitted for verification successfully.',
      hostelId: result.id
    });
  } catch (err) {
    console.error('Add hostel error:', err);
    res.status(500).json({ message: 'Server error submitting hostel.' });
  }
});

// Add a new room (Owner only)
router.post('/:id/rooms', authenticateToken, authorizeRoles('owner', 'admin'), async (req, res) => {
  const { id } = req.params;
  const { room_type, capacity, price_per_month, availability, amenities } = req.body;

  if (!room_type || !capacity || !price_per_month || availability === undefined) {
    return res.status(400).json({ message: 'Room type, capacity, price, and initial availability are required.' });
  }

  try {
    // Check ownership
    const hostel = await get('SELECT owner_id FROM Hostels WHERE id = ?', [id]);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found.' });
    }

    if (hostel.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: You do not own this hostel.' });
    }

    const amenitiesStr = JSON.stringify(amenities || []);

    const result = await run(`
      INSERT INTO Rooms (hostel_id, room_type, capacity, price_per_month, availability, amenities)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, room_type, capacity, price_per_month, availability, amenitiesStr]);

    res.status(201).json({
      message: 'Room type added successfully.',
      roomId: result.id
    });
  } catch (err) {
    console.error('Add room error:', err);
    res.status(500).json({ message: 'Server error creating room.' });
  }
});

// Update room details (Owner only)
router.put('/rooms/:roomId', authenticateToken, authorizeRoles('owner', 'admin'), async (req, res) => {
  const { roomId } = req.params;
  const { price_per_month, availability, amenities, room_type, capacity } = req.body;

  try {
    const room = await get('SELECT r.*, h.owner_id FROM Rooms r JOIN Hostels h ON r.hostel_id = h.id WHERE r.id = ?', [roomId]);
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    if (room.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    let fields = [];
    let params = [];

    if (price_per_month !== undefined) {
      fields.push('price_per_month = ?');
      params.push(price_per_month);
    }
    if (availability !== undefined) {
      fields.push('availability = ?');
      params.push(availability);
    }
    if (amenities !== undefined) {
      fields.push('amenities = ?');
      params.push(JSON.stringify(amenities));
    }
    if (room_type !== undefined) {
      fields.push('room_type = ?');
      params.push(room_type);
    }
    if (capacity !== undefined) {
      fields.push('capacity = ?');
      params.push(capacity);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No fields to update.' });
    }

    params.push(roomId);
    await run(`UPDATE Rooms SET ${fields.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Room updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating room.' });
  }
});

// Submit hostel review (Guest only)
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating is required and must be between 1 and 5.' });
  }

  try {
    // Add review
    await run(`
      INSERT INTO Reviews (user_id, hostel_id, rating, comment, user_name)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.id, id, rating, comment || '', req.user.full_name]);

    // Recalculate hostel overall rating
    const stats = await get(`
      SELECT AVG(rating) as avg_rating, COUNT(id) as cnt
      FROM Reviews WHERE hostel_id = ?
    `, [id]);

    await run(`
      UPDATE Hostels
      SET rating = ?, reviews_count = ?
      WHERE id = ?
    `, [stats.avg_rating.toFixed(1), stats.cnt, id]);

    res.status(201).json({ message: 'Review submitted successfully.' });
  } catch (err) {
    console.error('Review submission error:', err);
    res.status(500).json({ message: 'Server error submitting review.' });
  }
});

// Admin approves/blocks hostel
router.put('/:id/verify', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { verified } = req.body; // 1 = approved, -1 = rejected/blocked, 0 = pending

  try {
    const hostel = await get('SELECT id FROM Hostels WHERE id = ?', [id]);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found.' });
    }

    await run('UPDATE Hostels SET verified = ? WHERE id = ?', [verified, id]);

    // Notify owner
    const details = await get('SELECT owner_id, name FROM Hostels WHERE id = ?', [id]);
    const statusWord = verified === 1 ? 'approved' : verified === -1 ? 'rejected/blocked' : 'pending review';
    await run(`
      INSERT INTO Notifications (user_id, title, message, type)
      VALUES (?, ?, ?, 'info')
    `, [
      details.owner_id,
      `Hostel ${statusWord.toUpperCase()}`,
      `Your hostel listing for "${details.name}" has been ${statusWord} by the administrator.`
    ]);

    res.json({ message: `Hostel status updated to ${statusWord}.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating verification status.' });
  }
});

// Favorites: Add favorite
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await run('INSERT INTO Favorites (user_id, hostel_id) VALUES (?, ?)', [req.user.id, id]);
    res.json({ message: 'Added to favorites.' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ message: 'Hostel is already in favorites.' });
    }
    res.status(500).json({ message: 'Server error adding favorite.' });
  }
});

// Favorites: Remove favorite
router.delete('/:id/favorite', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await run('DELETE FROM Favorites WHERE user_id = ? AND hostel_id = ?', [req.user.id, id]);
    res.json({ message: 'Removed from favorites.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error removing favorite.' });
  }
});

// Favorites: List all user favorites
router.get('/user/favorites', authenticateToken, async (req, res) => {
  try {
    let favorites = await query(`
      SELECT h.* FROM Favorites f
      JOIN Hostels h ON f.hostel_id = h.id
      WHERE f.user_id = ?
    `, [req.user.id]);

    favorites = favorites.map(h => {
      try { h.photos = JSON.parse(h.photos || '[]'); } catch (e) { h.photos = []; }
      try { h.facilities = JSON.parse(h.facilities || '[]'); } catch (e) { h.facilities = []; }
      return h;
    });

    res.json(favorites);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching favorites.' });
  }
});

module.exports = router;
