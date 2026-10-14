const express = require('express');
const router = express.Router();
const { run, query, get } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get bookings (Guest view, Owner view, Admin view)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'admin') {
      bookings = await query(`
        SELECT b.*, h.name as hostel_name, u.full_name as guest_name, u.email as guest_email, r.price_per_month
        FROM Bookings b
        JOIN Hostels h ON b.hostel_id = h.id
        JOIN Users u ON b.user_id = u.id
        JOIN Rooms r ON b.room_id = r.id
        ORDER BY b.created_at DESC
      `);
    } else if (req.user.role === 'owner') {
      bookings = await query(`
        SELECT b.*, h.name as hostel_name, u.full_name as guest_name, u.email as guest_email, u.phone as guest_phone, r.price_per_month
        FROM Bookings b
        JOIN Hostels h ON b.hostel_id = h.id
        JOIN Users u ON b.user_id = u.id
        JOIN Rooms r ON b.room_id = r.id
        WHERE h.owner_id = ?
        ORDER BY b.created_at DESC
      `, [req.user.id]);
    } else {
      // Guest
      bookings = await query(`
        SELECT b.*, h.name as hostel_name, h.address as hostel_address, h.city as hostel_city, h.photos as hostel_photos, r.price_per_month
        FROM Bookings b
        JOIN Hostels h ON b.hostel_id = h.id
        JOIN Rooms r ON b.room_id = r.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `, [req.user.id]);

      bookings = bookings.map(b => {
        try { b.hostel_photos = JSON.parse(b.hostel_photos || '[]'); } catch (e) { b.hostel_photos = []; }
        return b;
      });
    }

    res.json(bookings);
  } catch (err) {
    console.error('Fetch bookings error:', err);
    res.status(500).json({ message: 'Server error fetching bookings.' });
  }
});

// Create a booking request (Guest only)
router.post('/', authenticateToken, async (req, res) => {
  const { hostel_id, room_id, check_in_date, duration_months } = req.body;

  if (!hostel_id || !room_id || !check_in_date || !duration_months) {
    return res.status(400).json({ message: 'Missing required booking details.' });
  }

  try {
    // Verify room availability
    const room = await get('SELECT * FROM Rooms WHERE id = ? AND hostel_id = ?', [room_id, hostel_id]);
    if (!room) {
      return res.status(404).json({ message: 'Room not found in this hostel.' });
    }

    if (room.availability <= 0) {
      return res.status(400).json({ message: 'No slots available in this room.' });
    }

    // Get hostel info
    const hostel = await get('SELECT name, owner_id FROM Hostels WHERE id = ?', [hostel_id]);

    const total_amount = room.price_per_month * parseInt(duration_months);

    const result = await run(`
      INSERT INTO Bookings (user_id, hostel_id, room_id, room_type, check_in_date, duration_months, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      req.user.id,
      hostel_id,
      room_id,
      room.room_type,
      check_in_date,
      duration_months,
      total_amount
    ]);

    // Notify owner
    await run(`
      INSERT INTO Notifications (user_id, title, message, type)
      VALUES (?, ?, ?, 'booking')
    `, [
      hostel.owner_id,
      'New Booking Request',
      `You have a new booking request for "${hostel.name}" (${room.room_type}) from ${req.user.full_name}.`
    ]);

    res.status(201).json({
      message: 'Booking request submitted successfully. Waiting for owner approval.',
      bookingId: result.id,
      total_amount
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Server error processing booking.' });
  }
});

// Update booking status (Accept / Reject) - Owner only
router.put('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'accepted', 'rejected'

  if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status update.' });
  }

  try {
    const booking = await get(`
      SELECT b.*, h.owner_id, h.name as hostel_name, u.full_name as guest_name
      FROM Bookings b
      JOIN Hostels h ON b.hostel_id = h.id
      JOIN Users u ON b.user_id = u.id
      WHERE b.id = ?
    `, [id]);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Owner checks
    if (booking.owner_id !== req.user.id && req.user.role !== 'admin' && status !== 'cancelled') {
      return res.status(403).json({ message: 'Unauthorized status modification.' });
    }

    // Guest checks (only guest can cancel their own booking)
    if (status === 'cancelled' && booking.user_id !== req.user.id && booking.owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized cancellation.' });
    }

    // If cancellation was paid, restore room availability
    if (status === 'cancelled' && booking.status === 'paid') {
      await run('UPDATE Rooms SET availability = availability + 1 WHERE id = ?', [booking.room_id]);
    }

    await run('UPDATE Bookings SET status = ? WHERE id = ?', [status, id]);

    // Send notifications
    if (status === 'accepted') {
      await run(`
        INSERT INTO Notifications (user_id, title, message, type)
        VALUES (?, 'Booking Approved!', ?, 'booking')
      `, [booking.user_id, `Your request for "${booking.hostel_name}" was approved! Please complete the payment to secure your bed.`]);
    } else if (status === 'rejected') {
      await run(`
        INSERT INTO Notifications (user_id, title, message, type)
        VALUES (?, 'Booking Rejected', ?, 'booking')
      `, [booking.user_id, `Your booking request for "${booking.hostel_name}" was declined by the owner.`]);
    } else if (status === 'cancelled') {
      const notifyTarget = req.user.id === booking.user_id ? booking.owner_id : booking.user_id;
      const actorName = req.user.id === booking.user_id ? 'Guest' : 'Owner';
      await run(`
        INSERT INTO Notifications (user_id, title, message, type)
        VALUES (?, 'Booking Cancelled', ?, 'booking')
      `, [notifyTarget, `The booking for "${booking.hostel_name}" has been cancelled by the ${actorName}.`]);
    }

    res.json({ message: `Booking status updated to ${status}.` });
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ message: 'Server error updating booking.' });
  }
});

// Process simulated payment
router.post('/:id/pay', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { payment_method, transaction_id, amount } = req.body;

  if (!payment_method || !transaction_id || !amount) {
    return res.status(400).json({ message: 'Missing transaction details.' });
  }

  try {
    const booking = await get('SELECT * FROM Bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized payment.' });
    }

    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: 'Booking is not in payable state (needs approval first).' });
    }

    // Verify room availability again
    const room = await get('SELECT availability FROM Rooms WHERE id = ?', [booking.room_id]);
    if (room.availability <= 0) {
      return res.status(400).json({ message: 'Sorry, the room is fully booked now.' });
    }

    // Record Payment
    await run(`
      INSERT INTO Payments (booking_id, transaction_id, payment_method, amount, status)
      VALUES (?, ?, ?, ?, 'success')
    `, [id, transaction_id, payment_method, amount]);

    // Update Booking status to 'paid'
    await run("UPDATE Bookings SET status = 'paid' WHERE id = ?", [id]);

    // Decrement Room availability by 1
    await run('UPDATE Rooms SET availability = availability - 1 WHERE id = ?', [booking.room_id]);

    // Notify Guest & Owner
    const hostel = await get('SELECT name, owner_id FROM Hostels WHERE id = ?', [booking.hostel_id]);
    await run(`
      INSERT INTO Notifications (user_id, title, message, type)
      VALUES (?, 'Payment Confirmed', ?, 'payment')
    `, [booking.user_id, `Payment of ₹${amount} was successful for "${hostel.name}". Your room is booked!`]);

    await run(`
      INSERT INTO Notifications (user_id, title, message, type)
      VALUES (?, 'Booking Completed', ?, 'booking')
    `, [hostel.owner_id, `Room "${booking.room_type}" payment received from ${req.user.full_name}. Booking is confirmed.`]);

    res.json({ message: 'Payment recorded successfully. Booking confirmed!' });
  } catch (err) {
    console.error('Payment processing error:', err);
    res.status(500).json({ message: 'Server error processing payment.' });
  }
});

// Get payment history (Receipts view)
router.get('/:id/receipt', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await get(`
      SELECT b.*, h.name as hostel_name, h.address as hostel_address, h.city as hostel_city,
             u.full_name as guest_name, u.email as guest_email, u.phone as guest_phone,
             p.transaction_id, p.payment_method, p.created_at as payment_date
      FROM Bookings b
      JOIN Hostels h ON b.hostel_id = h.id
      JOIN Users u ON b.user_id = u.id
      LEFT JOIN Payments p ON b.id = p.booking_id AND p.status = 'success'
      WHERE b.id = ?
    `, [id]);

    if (!booking) {
      return res.status(404).json({ message: 'Booking details not found.' });
    }

    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      // Check if user is owner of this hostel
      const ownerCheck = await get('SELECT owner_id FROM Hostels WHERE id = ?', [booking.hostel_id]);
      if (!ownerCheck || ownerCheck.owner_id !== req.user.id) {
        return res.status(403).json({ message: 'Access denied to this receipt.' });
      }
    }

    res.json(booking);
  } catch (err) {
    console.error('Fetch receipt error:', err);
    res.status(500).json({ message: 'Server error fetching receipt.' });
  }
});

// Notifications API endpoints
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const list = await query('SELECT * FROM Notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching notifications.' });
  }
});

router.put('/notifications/:notifyId/read', authenticateToken, async (req, res) => {
  const { notifyId } = req.params;
  try {
    await run('UPDATE Notifications SET read = 1 WHERE id = ? AND user_id = ?', [notifyId, req.user.id]);
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating notification.' });
  }
});

router.put('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await run('UPDATE Notifications SET read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
