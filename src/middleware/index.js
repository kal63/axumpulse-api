'use strict';

const { requireAuth } = require('./auth');
const { requireAdmin } = require('./requireAdmin');
const { requireTrainer } = require('./requireTrainer');
const { requireMedical } = require('./requireMedical');
const { actionLogger } = require('./actionLogger');

module.exports = {
    requireAuth,
    requireAdmin,
    requireTrainer,
    requireMedical,
    actionLogger
};
