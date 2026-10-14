const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/authMiddleware');

// Register a new user
router.post('/register', async (req, res) => {
  const { email, phone, password, full_name, role } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ message: 'Email, password, and full name are required.' });
  }

  const userRole = role || 'guest';
  if (!['guest', 'owner', 'admin'].includes(userRole)) {
    return res.status(400).json({ message: 'Invalid user role.' });
  }

  try {
    // Check if user exists
    const existing = await get('SELECT id FROM Users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    if (phone) {
      const existingPhone = await get('SELECT id FROM Users WHERE phone = ?', [phone]);
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already registered.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO Users (email, phone, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [email, phone || null, hashedPassword, full_name, userRole]
    );

    const token = jwt.sign(
      { id: result.id, email, role: userRole, full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: { id: result.id, email, phone, full_name, role: userRole }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await get('SELECT * FROM Users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
        profile_pic: user.profile_pic
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// Mock Phone OTP login - request OTP
router.post('/phone/otp-request', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }

  try {
    // Check if phone exists (for demo, auto-register as guest if doesn't exist, or just check)
    const user = await get('SELECT * FROM Users WHERE phone = ?', [phone]);
    
    // Send a mock OTP of '123456'
    res.json({
      message: 'Mock OTP sent successfully.',
      otp: '123456', // Mock OTP
      registered: !!user
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during OTP request.' });
  }
});

// Mock Phone OTP login - verify OTP
router.post('/phone/otp-verify', async (req, res) => {
  const { phone, otp, full_name, role } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ message: 'Phone and OTP are required.' });
  }

  if (otp !== '123456') {
    return res.status(400).json({ message: 'Invalid OTP. Use 123456 for testing.' });
  }

  try {
    let user = await get('SELECT * FROM Users WHERE phone = ?', [phone]);

    if (!user) {
      // Create guest user auto
      const mockEmail = `user_${Date.now()}@hostelhub.com`;
      const mockPass = await bcrypt.hash('phone123', 10);
      const name = full_name || 'Guest User';
      const userRole = role || 'guest';

      const result = await run(
        'INSERT INTO Users (email, phone, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
        [mockEmail, phone, mockPass, name, userRole]
      );

      user = { id: result.id, email: mockEmail, phone, full_name: name, role: userRole };
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful via OTP.',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
        profile_pic: user.profile_pic
      }
    });
  } catch (err) {
    console.error('OTP Verification error:', err);
    res.status(500).json({ message: 'Server error during OTP verification.' });
  }
});

// Mock Google Login
router.post('/google', async (req, res) => {
  const { google_id, email, full_name, profile_pic } = req.body;

  if (!google_id || !email || !full_name) {
    return res.status(400).json({ message: 'Missing Google authentication parameters.' });
  }

  try {
    let user = await get('SELECT * FROM Users WHERE google_id = ? OR email = ?', [google_id, email]);

    if (!user) {
      // Register new Google user as guest
      const mockPass = await bcrypt.hash(`google_${google_id}`, 10);
      const result = await run(
        'INSERT INTO Users (email, password, full_name, role, google_id, profile_pic) VALUES (?, ?, ?, ?, ?, ?)',
        [email, mockPass, full_name, 'guest', google_id, profile_pic]
      );

      user = {
        id: result.id,
        email,
        full_name,
        role: 'guest',
        google_id,
        profile_pic
      };
    } else if (!user.google_id) {
      // Link Google ID if email already exists
      await run('UPDATE Users SET google_id = ?, profile_pic = ? WHERE id = ?', [google_id, profile_pic, user.id]);
      user.google_id = google_id;
      user.profile_pic = profile_pic;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
        profile_pic: user.profile_pic
      }
    });
  } catch (err) {
    console.error('Google Auth error:', err);
    res.status(500).json({ message: 'Server error during Google auth.' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await get('SELECT id, email, phone, full_name, role, profile_pic, created_at FROM Users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { full_name, phone, email, password, profile_pic } = req.body;

  try {
    const user = await get('SELECT * FROM Users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let queryParts = [];
    let params = [];

    if (full_name) {
      queryParts.push('full_name = ?');
      params.push(full_name);
    }
    if (phone) {
      queryParts.push('phone = ?');
      params.push(phone);
    }
    if (email) {
      queryParts.push('email = ?');
      params.push(email);
    }
    if (profile_pic) {
      queryParts.push('profile_pic = ?');
      params.push(profile_pic);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      queryParts.push('password = ?');
      params.push(hashedPassword);
    }

    if (queryParts.length === 0) {
      return res.status(400).json({ message: 'No profile details provided to update.' });
    }

    params.push(req.user.id);
    await run(`UPDATE Users SET ${queryParts.join(', ')} WHERE id = ?`, params);

    const updatedUser = await get('SELECT id, email, phone, full_name, role, profile_pic FROM Users WHERE id = ?', [req.user.id]);

    res.json({
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});

module.exports = router;
