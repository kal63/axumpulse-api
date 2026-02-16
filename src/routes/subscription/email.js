const express = require('express');
const router = express.Router();
const { sequelize } = require('../../../models'); // use the shared sequelize instance
const { DataTypes } = require('sequelize');
const { Subscription } = require('../../models')
// Try to get the registered model from sequelize.models. If it's not present,
// attempt to define it using the model file so route remains resilient.
// let Subscription = sequelize && sequelize.models && sequelize.models.Subscription
// if (!Subscription) {
//   try {
//     // Require model definition and initialize it on the shared sequelize instance
//     const defineSubscription = require('../../../models/Subscription')
//     Subscription = defineSubscription(sequelize, DataTypes)
//     console.warn('Subscription model was not registered; defined on the fly.')
//   } catch (e) {
//     console.error('Failed to acquire Subscription model:', e)
//   }
// }

// POST /subscription/email
router.post('/', async (req, res, next) => {
    console.log('Received subscription request:', req.body);
  try {
    const { email } = req.body;
    // Basic email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    // Check for duplicate
    if (!Subscription) {
      return res.status(500).json({ error: 'Subscription model not available.' })
    }
    const existing = await Subscription.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already subscribed.' });
    }
    // Save to database
    await Subscription.create({ email });
    return res.status(201).json({ message: 'Subscription successful.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
