const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { testConnection } = require('./config/db');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/professionals', require('./routes/professionalRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
// Add these with your other routes
app.use('/api/requests', require('./routes/serviceRequestRoutes'));
app.use('/api/ratings', require('./routes/ratingRoutes'));
// Test route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to FundiPluss API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            professionals: '/api/professionals',
            requests: '/api/requests',
            ratings: '/api/ratings',
            admin: '/api/admin'
        }
    });
});

// Test database connection on startup
testConnection().then(connected => {
    if (connected) {
        console.log('✅ Database is ready');
    } else {
        console.log('⚠️  Database connection failed - check MySQL is running');
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});