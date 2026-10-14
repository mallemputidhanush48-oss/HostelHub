const express = require('express');
const router = express.Router();
const { query, get } = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Owner Analytics
router.get('/owner', authenticateToken, authorizeRoles('owner', 'admin'), async (req, res) => {
  const ownerId = req.user.role === 'admin' && req.query.owner_id ? req.query.owner_id : req.user.id;

  try {
    // 1. Total bookings count
    const bookingCountRes = await get(`
      SELECT COUNT(b.id) as count
      FROM Bookings b
      JOIN Hostels h ON b.hostel_id = h.id
      WHERE h.owner_id = ?
    `, [ownerId]);
    const totalBookings = bookingCountRes ? bookingCountRes.count : 0;

    // 2. Monthly earnings (Total revenue)
    const earningsRes = await get(`
      SELECT SUM(p.amount) as revenue
      FROM Payments p
      JOIN Bookings b ON p.booking_id = b.id
      JOIN Hostels h ON b.hostel_id = h.id
      WHERE h.owner_id = ? AND p.status = 'success'
    `, [ownerId]);
    const totalRevenue = earningsRes && earningsRes.revenue ? earningsRes.revenue : 0;

    // 3. Occupancy rate calculation
    // Capacity vs current occupancy. Occupied beds are active paid bookings where stay is ongoing
    const capacityRes = await get(`
      SELECT SUM(r.capacity) as total_capacity, SUM(r.availability) as total_avail
      FROM Rooms r
      JOIN Hostels h ON r.hostel_id = h.id
      WHERE h.owner_id = ?
    `, [ownerId]);
    
    const capacity = capacityRes && capacityRes.total_capacity ? capacityRes.total_capacity : 0;
    const availability = capacityRes && capacityRes.total_avail !== null ? capacityRes.total_avail : 0;
    const occupied = Math.max(0, capacity - availability);
    const occupancyRate = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

    // 4. Monthly Revenue Graph (past 6 months)
    // For SQLite, we can extract month from created_at
    const monthlyData = await query(`
      SELECT strftime('%Y-%m', p.created_at) as month, SUM(p.amount) as amount
      FROM Payments p
      JOIN Bookings b ON p.booking_id = b.id
      JOIN Hostels h ON b.hostel_id = h.id
      WHERE h.owner_id = ? AND p.status = 'success'
      GROUP BY month
      ORDER BY month ASC
      LIMIT 6
    `, [ownerId]);

    // 5. Hostels details with specific occupancy and bookings
    const hostelsSummary = await query(`
      SELECT h.id, h.name, h.gender_type, h.verified, h.rating,
             (SELECT SUM(r.capacity) FROM Rooms r WHERE r.hostel_id = h.id) as capacity,
             (SELECT SUM(r.availability) FROM Rooms r WHERE r.hostel_id = h.id) as availability
      FROM Hostels h
      WHERE h.owner_id = ?
    `, [ownerId]);

    res.json({
      totalBookings,
      totalRevenue,
      occupancyRate,
      monthlyRevenue: monthlyData,
      hostelsSummary: hostelsSummary.map(h => {
        const cap = h.capacity || 0;
        const avail = h.availability !== null ? h.availability : 0;
        const occ = Math.max(0, cap - avail);
        h.occupancyPercent = cap > 0 ? Math.round((occ / cap) * 100) : 0;
        return h;
      })
    });
  } catch (err) {
    console.error('Owner analytics fetch error:', err);
    res.status(500).json({ message: 'Server error fetching owner analytics.' });
  }
});

// Admin Analytics & User/Listing Management
router.get('/admin', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // 1. Total users by role
    const usersCount = await query(`
      SELECT role, COUNT(id) as count FROM Users GROUP BY role
    `);
    const userStats = { guest: 0, owner: 0, admin: 0 };
    usersCount.forEach(u => {
      userStats[u.role] = u.count;
    });

    // 2. Total bookings count
    const bookingsCountRes = await get('SELECT COUNT(id) as count FROM Bookings');
    const totalBookings = bookingsCountRes ? bookingsCountRes.count : 0;

    // 3. Total revenue
    const revenueRes = await get("SELECT SUM(amount) as revenue FROM Payments WHERE status = 'success'");
    const totalRevenue = revenueRes && revenueRes.revenue ? revenueRes.revenue : 0;

    // 4. Hostels verification counts
    const hostelsCount = await query(`
      SELECT verified, COUNT(id) as count FROM Hostels GROUP BY verified
    `);
    const hostelStats = { pending: 0, approved: 0, blocked: 0 };
    hostelsCount.forEach(h => {
      if (h.verified === 0) hostelStats.pending = h.count;
      else if (h.verified === 1) hostelStats.approved = h.count;
      else if (h.verified === -1) hostelStats.blocked = h.count;
    });

    // 5. Hostels list for admin verification queues
    const hostels = await query(`
      SELECT h.id, h.name, h.address, h.city, h.verified, h.created_at, u.full_name as owner_name, u.email as owner_email
      FROM Hostels h
      JOIN Users u ON h.owner_id = u.id
      ORDER BY h.verified ASC, h.created_at DESC
    `);

    // 6. Users list for management
    const users = await query(`
      SELECT id, full_name, email, phone, role, created_at FROM Users ORDER BY created_at DESC
    `);

    res.json({
      userStats,
      totalBookings,
      totalRevenue,
      hostelStats,
      hostels,
      users
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ message: 'Server error fetching admin analytics.' });
  }
});

// Admin deletes or blocks a user
router.delete('/admin/users/:userId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { userId } = req.params;
  try {
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete yourself!' });
    }
    await run('DELETE FROM Users WHERE id = ?', [userId]);
    res.json({ message: 'User account deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting user.' });
  }
});

module.exports = router;
