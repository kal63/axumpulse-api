const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { ok } = require('./utils/errors');
const path = require('path');

const { router: authRoutes } = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const trainerRouter = require('./routes/trainer/index');
const trainerApplyRoutes = require('./routes/trainer/apply');
const adminTrainerApplicationsRoutes = require('./routes/admin/trainer-applications');
const publicRoutes = require('./routes/public');
const userRoutes = require('./routes/user');
const medicalRoutes = require('./routes/medical');
const medicalApplyRoutes = require('./routes/medical/apply');
const subscriptionRoutes = require('./routes/subscription');
const paymentRoutes = require('./routes/payment/paymentRoutes');
const { verifyEthiotellWebhookSignature } = require('./middleware/ethiotellWebhookAuth');
const { postWebhook: ethiotellPostWebhook } = require('./routes/integrations/ethiotell');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*' }));
app.use(morgan('dev'));

// Ethiotell: raw body required for HMAC — must run before express.json()
app.post(
    '/api/v1/integrations/ethiotell/webhook',
    express.raw({ type: 'application/json', limit: '256kb' }),
    verifyEthiotellWebhookSignature,
    ethiotellPostWebhook
);

// Increase payload limits for file uploads
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Static uploads
app.use('/api/v1/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/healthz', (req, res) => {
    ok(res, { message: 'API is healthy' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin/trainer-applications', adminTrainerApplicationsRoutes);
// Public trainer application routes (must come before protected trainer routes)
app.use('/api/v1/trainer/apply', trainerApplyRoutes);
// Backward compat if previous default file existed
app.use('/api/v1/trainer', trainerRouter);
// Public medical application routes (must come before protected medical routes)
app.use('/api/v1/medical/apply', medicalApplyRoutes);
app.use('/api/v1/medical', medicalRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/subscription', subscriptionRoutes);
app.use('/api/v1/payments', paymentRoutes);

module.exports = app;



