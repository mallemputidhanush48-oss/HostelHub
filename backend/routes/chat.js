const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get list of active chats
router.get('/list', authenticateToken, async (req, res) => {
  const myId = req.user.id;

  try {
    const chatList = await query(`
      SELECT 
        u.id as user_id,
        u.full_name,
        u.role,
        u.profile_pic,
        m.message,
        m.created_at,
        m.hostel_id,
        h.name as hostel_name
      FROM Messages m
      JOIN Users u ON (u.id = m.sender_id OR u.id = m.receiver_id) AND u.id != ?
      LEFT JOIN Hostels h ON m.hostel_id = h.id
      WHERE m.id IN (
        SELECT MAX(id) FROM Messages 
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
      )
      ORDER BY m.created_at DESC
    `, [myId, myId, myId, myId]);

    res.json(chatList);
  } catch (err) {
    console.error('Fetch chats list error:', err);
    res.status(500).json({ message: 'Server error fetching chat list.' });
  }
});

// Get chat history with a specific user
router.get('/history/:otherUserId', authenticateToken, async (req, res) => {
  const myId = req.user.id;
  const { otherUserId } = req.params;
  const { hostel_id } = req.query;

  try {
    let sql = `
      SELECT m.*, 
             s.full_name as sender_name, s.profile_pic as sender_pic,
             r.full_name as receiver_name, r.profile_pic as receiver_pic
      FROM Messages m
      JOIN Users s ON m.sender_id = s.id
      JOIN Users r ON m.receiver_id = r.id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
    `;
    let params = [myId, otherUserId, otherUserId, myId];

    if (hostel_id) {
      sql += ' AND m.hostel_id = ?';
      params.push(hostel_id);
    }

    sql += ' ORDER BY m.created_at ASC';

    const messages = await query(sql, params);
    res.json(messages);
  } catch (err) {
    console.error('Fetch chat history error:', err);
    res.status(500).json({ message: 'Server error fetching chat history.' });
  }
});

// Send a chat message
router.post('/send', authenticateToken, async (req, res) => {
  const senderId = req.user.id;
  const { receiver_id, hostel_id, message } = req.body;

  if (!receiver_id || !message) {
    return res.status(400).json({ message: 'Receiver ID and message content are required.' });
  }

  try {
    const result = await run(`
      INSERT INTO Messages (sender_id, receiver_id, hostel_id, message)
      VALUES (?, ?, ?, ?)
    `, [senderId, receiver_id, hostel_id || null, message]);

    // Notify receiver
    const sender = await get('SELECT full_name FROM Users WHERE id = ?', [senderId]);
    await run(`
      INSERT INTO Notifications (user_id, title, message, type)
      VALUES (?, ?, ?, 'chat')
    `, [
      receiver_id,
      `New message from ${sender.full_name}`,
      message.length > 50 ? message.substring(0, 47) + '...' : message
    ]);

    const sentMessage = await get(`
      SELECT m.*, 
             s.full_name as sender_name, s.profile_pic as sender_pic,
             r.full_name as receiver_name, r.profile_pic as receiver_pic
      FROM Messages m
      JOIN Users s ON m.sender_id = s.id
      JOIN Users r ON m.receiver_id = r.id
      WHERE m.id = ?
    `, [result.id]);

    res.status(201).json(sentMessage);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Server error sending message.' });
  }
});

module.exports = router;
