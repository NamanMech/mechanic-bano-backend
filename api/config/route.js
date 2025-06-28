// api/config/route.js
const express = require('express');
const router = express.Router();
const Config = require('./model');

// CORS Middleware for Serverless Functions
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// GET Config
router.get('/', async (req, res) => {
  try {
    const config = await Config.findOne();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT Update Site Name
router.put('/update-site-name', async (req, res) => {
  try {
    const { websiteName } = req.body;
    const config = await Config.findOne();

    if (!config) {
      return res.status(404).json({ message: 'Configuration not found' });
    }

    config.websiteName = websiteName;
    await config.save();

    res.json({ message: 'Site name updated successfully' });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
