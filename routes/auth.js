const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// For now, we will hardcode the user log in details
const users = {
  user1: 'password1',
  user2: 'password2'
};

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username] === password) {
    const token = jwt.sign({ username }, 'your-secret-key', { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid credentials' });
});

// Logout route
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
